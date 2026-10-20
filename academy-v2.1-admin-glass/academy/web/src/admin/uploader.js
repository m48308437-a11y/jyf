// موتور آپلود ویدیو: چندبخشی، موازی، قابل توقف/ادامه (حتی پس از بستن مرورگر)، با تلاش مجدد خودکار.
// جریان: POST /api/admin/videos ← part-urls ← PUT هر بخش (مستقیم به S3 یا مسیر امضاشده سرور) ← complete
import { useSyncExternalStore } from 'react';
import { get, post, del } from '../api.js';

const KEY = 'academy_uploads_v1';
const fingerprint = (f) => `${f.name}|${f.size}|${f.lastModified}`;
const loadMap = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; } };
const saveMap = (m) => { try { localStorage.setItem(KEY, JSON.stringify(m)); } catch {} };
const forget = (f) => { const m = loadMap(); delete m[fingerprint(f)]; saveMap(m); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const abortError = () => Object.assign(new Error('aborted'), { name: 'AbortError' });

export const ACCEPT = 'video/mp4,video/webm,video/quicktime,video/x-matroska,.mp4,.m4v,.mov,.webm,.mkv';
export function guessMime(f) {
  const ext = (f.name.split('.').pop() || '').toLowerCase();
  const byExt = { mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', mkv: 'video/x-matroska' }[ext];
  if (f.type && ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'].includes(f.type)) return f.type;
  return byExt || f.type || '';
}

/** مدت ویدیو از متادیتای فایل (بدون آپلود) */
export function readDuration(file) {
  return new Promise((resolve) => {
    let settled = false;
    const v = document.createElement('video');
    const url = URL.createObjectURL(file);
    const done = (d) => { if (settled) return; settled = true; URL.revokeObjectURL(url); resolve(d); };
    v.preload = 'metadata'; v.muted = true;
    v.onloadedmetadata = () => done(Number.isFinite(v.duration) ? Math.round(v.duration) : 0);
    v.onerror = () => done(0);
    setTimeout(() => done(0), 8000);
    v.src = url;
  });
}

function putPart(url, blob, onProgress, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(abortError());
    const x = new XMLHttpRequest();
    x.open('PUT', url);
    x.upload.onprogress = (e) => onProgress(e.loaded);
    x.onload = () => {
      if (x.status >= 200 && x.status < 300) {
        let etag = x.getResponseHeader('ETag');
        if (!etag) { try { etag = JSON.parse(x.responseText).etag; } catch {} }
        return etag ? resolve(etag) : reject(new Error('شناسه بخش (ETag) دریافت نشد؛ در CORS باکت، ExposeHeaders: ETag را فعال کنید.'));
      }
      let msg; try { msg = JSON.parse(x.responseText).error; } catch {}
      reject(Object.assign(new Error(msg || `خطای آپلود (کد ${x.status})`), { status: x.status }));
    };
    x.onerror = () => reject(Object.assign(new Error('ارتباط هنگام آپلود قطع شد.'), { network: true }));
    x.onabort = () => reject(abortError());
    signal.addEventListener('abort', () => x.abort(), { once: true });
    x.send(blob);
  });
}

// ───── مخزن سراسری آپلودها (بین صفحات پنل حفظ می‌شود) ─────
let uploads = [];
const subs = new Set();
const notify = () => { uploads = [...uploads]; subs.forEach((f) => f()); };
export const useUploads = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => uploads);
export const activeUploads = () => uploads.filter((u) => ['preparing', 'uploading', 'finishing'].includes(u.state));
export function dismissUpload(id) { uploads = uploads.filter((u) => u.key !== id); notify(); }

if (typeof window !== 'undefined') {
  addEventListener('beforeunload', (e) => { if (activeUploads().length) { e.preventDefault(); e.returnValue = ''; } });
}

class Upload {
  constructor(file, { concurrency = 3, onDone } = {}) {
    this.key = Math.random().toString(36).slice(2);
    this.file = file; this.name = file.name; this.total = file.size;
    this.concurrency = concurrency; this.onDone = onDone;
    this.state = 'idle'; this.loaded = 0; this.speed = 0; this.eta = null; this.error = null; this.videoId = null; this.resumed = false;
    this.samples = []; this.raf = 0;
  }
  sizeOf(n) { return n < this.partCount ? this.partSize : this.total - this.partSize * (this.partCount - 1); }
  tick() {
    if (this.raf) return;
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      let inflight = 0; for (const v of this.partLoaded.values()) inflight += v;
      this.loaded = Math.min(this.total, this.base + inflight);
      const t = performance.now();
      this.samples.push([t, this.loaded]);
      while (this.samples.length > 2 && t - this.samples[0][0] > 4000) this.samples.shift();
      const [t0, l0] = this.samples[0];
      if (t - t0 > 600) { this.speed = ((this.loaded - l0) / (t - t0)) * 1000; this.eta = this.speed > 0 ? (this.total - this.loaded) / this.speed : null; }
      notify();
    });
  }
  set(state, extra = {}) { Object.assign(this, { state }, extra); notify(); }

  async start() {
    this.ac = new AbortController(); this.firstError = null; this.cancelled = false;
    this.done = new Map(); this.partLoaded = new Map(); this.samples = []; this.speed = 0; this.eta = null;
    this.set('preparing', { error: null });
    const file = this.file, fp = fingerprint(file);
    try {
      const map = loadMap();
      let id = map[fp]?.id;
      if (id) {
        const info = await get(`/api/admin/videos/${id}/parts`).catch(() => null);
        if (info?.status === 'uploading') {
          this.partSize = info.partSize; this.partCount = Math.ceil(info.size / info.partSize); this.resumed = true;
          for (const p of info.parts || []) if (p.etag && (!p.size || p.size === this.sizeOf(p.n))) this.done.set(p.n, p.etag);
        } else if (info?.status === 'ready') { forget(file); this.videoId = id; this.loaded = this.total; this.set('done'); this.onDone?.(this); return; }
        else id = null;
      }
      if (!id) {
        const mime = guessMime(file);
        const duration = await readDuration(file);
        const r = await post('/api/admin/videos', { fileName: file.name, size: file.size, mime, duration });
        id = r.id; this.partSize = r.partSize; this.partCount = r.partCount;
        const m = loadMap(); m[fp] = { id, at: Date.now() }; saveMap(m);
      }
      this.videoId = id;
      if (this.ac.signal.aborted) throw abortError();
      const todo = []; for (let n = 1; n <= this.partCount; n++) if (!this.done.has(n)) todo.push(n);
      this.base = [...this.done.keys()].reduce((s, n) => s + this.sizeOf(n), 0);
      this.set('uploading'); this.tick();

      const urls = new Map();
      const fetchUrls = async (nums) => { if (!nums.length) return; const r = await post(`/api/admin/videos/${id}/part-urls`, { parts: nums }); for (const u of r.urls) urls.set(u.n, u.url); };
      let idx = 0;
      const worker = async () => {
        try {
          while (idx < todo.length) {
            if (this.ac.signal.aborted) throw abortError();
            const i = idx++; const n = todo[i];
            if (!urls.has(n)) await fetchUrls(todo.slice(i, i + 100).filter((x) => !urls.has(x)));
            const start = (n - 1) * this.partSize;
            const blob = file.slice(start, start + this.sizeOf(n));
            for (let attempt = 1; ; attempt++) {
              try {
                const etag = await putPart(urls.get(n), blob, (l) => { this.partLoaded.set(n, l); this.tick(); }, this.ac.signal);
                this.partLoaded.delete(n); this.done.set(n, etag); this.base += blob.size; this.tick();
                break;
              } catch (e) {
                this.partLoaded.delete(n); this.tick();
                if (e.name === 'AbortError' || attempt >= 5) throw e;
                if (e.status === 403) { urls.delete(n); await fetchUrls([n]); }
                await sleep(Math.min(15000, 800 * 2 ** attempt));
              }
            }
          }
        } catch (e) {
          if (e.name !== 'AbortError' && !this.firstError) this.firstError = e;
          this.ac.abort(); throw e;
        }
      };
      await Promise.all(Array.from({ length: Math.min(this.concurrency, todo.length) }, worker));
      this.set('finishing', { loaded: this.total, speed: 0, eta: null });
      await post(`/api/admin/videos/${id}/complete`, { parts: [...this.done].map(([n, etag]) => ({ n, etag })) });
      forget(file);
      this.set('done');
      this.onDone?.(this);
    } catch (e) {
      if (this.cancelled) return;
      const err = this.firstError || e;
      if (err.name === 'AbortError') this.set('paused', { speed: 0, eta: null });
      else this.set('error', { error: err.message, speed: 0, eta: null });
    }
  }
  pause() { this.ac?.abort(); }
  resume() { this.start(); }
  async cancel() {
    this.cancelled = true; this.ac?.abort();
    if (this.videoId) await del(`/api/admin/videos/${this.videoId}`).catch(() => {});
    forget(this.file);
    this.set('cancelled');
    dismissUpload(this.key);
  }
}

/** شروع آپلود؛ اگر همین فایل قبلاً نیمه‌کاره مانده باشد از همان‌جا ادامه می‌یابد. */
export function startUpload(file, opts) {
  const u = new Upload(file, opts);
  uploads = [u, ...uploads]; notify();
  u.start();
  return u;
}
export const hasPendingResume = (file) => !!loadMap()[fingerprint(file)];
