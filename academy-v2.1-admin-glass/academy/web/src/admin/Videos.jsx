// کتابخانه ویدیو + آپلودر با نوار پیشرفت، سرعت، زمان باقی‌مانده، توقف/ادامه/لغو
import React, { useEffect, useRef, useState } from 'react';
import { UploadCloud, Film, Pause, Play, X, RotateCw, Check, Pencil, Trash2, Eye, Loader2, CircleAlert } from 'lucide-react';
import { useFetch } from '../store.jsx';
import { get, patch, del } from '../api.js';
import { PageTitle, Group, Row, Button, Modal, ErrorBox, Empty, Alert, ProgressBar, SearchField, Segmented } from '../ui/kit.jsx';
import { toFa, num, duration, faDateTime, cls } from '../lib.js';
import { mb, eta, useAction, Confirm, Pill, ListSkeleton, Field, Input, toInt } from './ui.jsx';
import { startUpload, useUploads, dismissUpload, ACCEPT, guessMime } from './uploader.js';

const OK_MIME = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];

function Ring({ value, state }) {
  const r = 17, c = 2 * Math.PI * r;
  const color = state === 'error' ? '#FF453A' : state === 'done' ? '#30D158' : state === 'paused' ? '#FF9F0A' : '#0A84FF';
  return (
    <span className="relative grid h-11 w-11 shrink-0 place-items-center">
      <svg viewBox="0 0 40 40" className="absolute inset-0 -rotate-90"><circle cx="20" cy="20" r={r} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="3.5" /><circle cx="20" cy="20" r={r} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value)} style={{ transition: 'stroke-dashoffset .3s ease' }} /></svg>
      {state === 'done' ? <Check className="h-5 w-5 text-ios-green" strokeWidth={3} /> : state === 'error' ? <CircleAlert className="h-5 w-5 text-ios-red" /> : state === 'preparing' || state === 'finishing' ? <Loader2 className="h-4 w-4 animate-spin text-ink-soft" /> : <span className="text-[11px] font-bold">{toFa(Math.floor(value * 100))}</span>}
    </span>
  );
}

function UploadRow({ u }) {
  const p = u.total ? u.loaded / u.total : 0;
  const label = { preparing: 'در حال آماده‌سازی…', uploading: `${mb(u.loaded)} از ${mb(u.total)} · ${u.speed ? `${mb(u.speed)}/ثانیه` : '…'} · ${eta(u.eta)} مانده`, finishing: 'در حال ادغام و بررسی فایل…', paused: `متوقف شد · ${mb(u.loaded)} از ${mb(u.total)}`, error: u.error, done: `آپلود کامل شد · ${mb(u.total)}`, cancelled: 'لغو شد' }[u.state];
  return (
    <div className="ios-row items-start py-3">
      <Ring value={p} state={u.state} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium">{u.name}</p>
        <p className={cls('mt-0.5 text-[13px]', u.state === 'error' ? 'text-[#FF6961]' : 'text-ink-mute')}>{u.resumed && u.state === 'uploading' ? 'ادامه از آپلود قبلی · ' : ''}{label}</p>
        {u.state !== 'done' && <ProgressBar value={p} active={u.state === 'uploading'} tone={u.state === 'error' ? 'bg-ios-red' : u.state === 'paused' ? 'bg-ios-orange' : 'bg-brand'} className="mt-2.5" />}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {u.state === 'uploading' && <Circle label="توقف" onClick={() => u.pause()}><Pause /></Circle>}
        {u.state === 'paused' && <Circle label="ادامه" onClick={() => u.resume()}><Play /></Circle>}
        {u.state === 'error' && <Circle label="تلاش دوباره" onClick={() => u.resume()}><RotateCw /></Circle>}
        {u.state !== 'done' && u.state !== 'finishing' && <Circle label="لغو آپلود" danger onClick={() => u.cancel()}><X /></Circle>}
        {u.state === 'done' && <Circle label="بستن" onClick={() => dismissUpload(u.key)}><X /></Circle>}
      </div>
    </div>
  );
}
const Circle = ({ children, label, onClick, danger }) => (
  <button type="button" onClick={onClick} aria-label={label} title={label} className={cls('grid h-8 w-8 place-items-center rounded-full bg-white/10 transition hover:bg-white/20 [&>svg]:h-4 [&>svg]:w-4', danger ? 'text-[#FF6961]' : 'text-ink')}>{children}</button>
);

export default function Videos() {
  const { data, loading, error, reload } = useFetch('/api/admin/videos');
  const ups = useUploads();
  const [drag, setDrag] = useState(false);
  const [rejected, setRejected] = useState([]);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [preview, setPreview] = useState(null);
  const [edit, setEdit] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, run] = useAction();
  const inputRef = useRef(null);
  const doneCount = ups.filter((u) => u.state === 'done').length;
  useEffect(() => { if (doneCount) reload(); }, [doneCount]);

  const add = (files) => {
    const bad = [];
    for (const f of files) { if (!OK_MIME.includes(guessMime(f))) bad.push(f.name); else startUpload(f); }
    setRejected(bad);
  };
  const openPreview = async (v) => {
    const r = await run('pv', () => get(`/api/admin/videos/${v.id}/preview`));
    if (r) setPreview({ ...v, url: r.url });
  };
  const saveEdit = async () => {
    const r = await run('ed', () => patch(`/api/admin/videos/${edit.id}`, { name: edit.name, duration: toInt(edit.duration) }), 'ذخیره شد.');
    if (r) { setEdit(null); reload(); }
  };
  const remove = async () => {
    const r = await run('del', () => del(`/api/admin/videos/${confirm.id}`), 'ویدیو حذف شد.');
    if (r) { setConfirm(null); reload(); }
  };
  const vids = (data?.videos || []).filter((v) => (filter === 'all' || (filter === 'unused' ? !v.usedIn : v.status === filter)) && (!q.trim() || v.name.includes(q.trim())));
  const activeIds = new Set(ups.filter((u) => ['preparing', 'uploading', 'finishing', 'paused'].includes(u.state)).map((u) => u.videoId));
  const totalSize = (data?.videos || []).reduce((s, v) => s + (v.status === 'ready' ? v.size : 0), 0);

  return (
    <>
      <PageTitle eyebrow="آموزش" title="کتابخانه ویدیو" />
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); add([...e.dataTransfer.files]); }}
        onClick={() => inputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        className={cls('ios-group mb-6 flex cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed px-6 py-10 text-center transition', drag ? 'border-brand bg-brand/10 scale-[1.01]' : 'border-white/15 hover:border-white/30')}>
        <span className="ios-tile tile-blue !h-14 !w-14 !rounded-[16px]"><UploadCloud className="h-7 w-7" /></span>
        <div><p className="text-[17px] font-bold">ویدیوها را اینجا رها کنید</p><p className="mt-1 text-[13px] text-ink-mute">یا برای انتخاب بزنید · MP4 (H.264) پیشنهادی · چند فایل همزمان · قابل ادامه پس از قطعی</p></div>
        <input ref={inputRef} type="file" accept={ACCEPT} multiple className="sr-only" onChange={(e) => { add([...(e.target.files || [])]); e.target.value = ''; }} />
      </div>
      {rejected.length > 0 && <Alert tone="error" className="mb-5">فرمت این فایل‌ها پشتیبانی نمی‌شود: {rejected.join('، ')}</Alert>}
      {ups.length > 0 && <Group title="صف آپلود" footer="تا پایان آپلود این صفحه را نبندید؛ اگر بسته شد، همان فایل را دوباره انتخاب کنید تا از همان نقطه ادامه یابد.">{ups.map((u) => <UploadRow key={u.key} u={u} />)}</Group>}

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <Segmented value={filter} onChange={setFilter} options={[['all', 'همه'], ['ready', 'آماده'], ['uploading', 'نیمه‌کاره'], ['unused', 'استفاده‌نشده']]} />
        <SearchField value={q} onChange={setQ} placeholder="نام فایل" className="md:mr-auto md:w-64" />
      </div>
      {error ? <ErrorBox error={error} onRetry={reload} /> : loading && !data ? <ListSkeleton /> : !vids.length ? <Empty icon={Film} title="ویدیویی پیدا نشد">ویدیوهای آپلودشده اینجا جمع می‌شوند و در ویرایش هر جلسه قابل انتخاب‌اند.</Empty> : (
        <Group footer={`${num(vids.length)} ویدیو · ${mb(totalSize)} فضای استفاده‌شده`}>
          {vids.map((v) => (
            <Row key={v.id} icon={Film} tone={v.status === 'ready' ? 'pink' : 'gray'} title={v.name}
              subtitle={`${mb(v.size)} · ${v.duration ? duration(v.duration) : 'مدت نامشخص'} · ${v.usedIn ? `در ${toFa(v.usedIn)} جلسه` : 'استفاده‌نشده'} · ${faDateTime(v.createdAt)}`}>
              <span className="hidden sm:inline-flex"><Pill kind="video" value={v.status} /></span>
              <div className="flex shrink-0 items-center gap-1">
                {v.status === 'ready' && <Circle label="پیش‌نمایش" onClick={() => openPreview(v)}><Eye /></Circle>}
                <Circle label="ویرایش" onClick={() => setEdit({ id: v.id, name: v.name, duration: v.duration ? toFa(v.duration) : '' })}><Pencil /></Circle>
                {!activeIds.has(v.id) && <Circle label="حذف" danger onClick={() => setConfirm(v)}><Trash2 /></Circle>}
              </div>
            </Row>
          ))}
        </Group>
      )}

      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.name || ''} wide>
        {preview && <video src={preview.url} controls autoPlay playsInline controlsList="nodownload" className="aspect-video w-full rounded-[18px] bg-black" />}
      </Modal>
      <Modal open={!!edit} onClose={() => setEdit(null)} title="ویرایش ویدیو"
        footer={<><Button variant="gray" size="sm" onClick={() => setEdit(null)}>انصراف</Button><Button size="sm" loading={busy === 'ed'} onClick={saveEdit}>ذخیره</Button></>}>
        {edit && <div className="grid gap-4"><Field label="نام نمایشی"><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field><Field label="مدت (ثانیه)"><Input value={edit.duration} inputMode="numeric" className="ltr text-right" onChange={(e) => setEdit({ ...edit, duration: e.target.value })} /></Field></div>}
      </Modal>
      <Confirm open={!!confirm} onClose={() => setConfirm(null)} onConfirm={remove} busy={busy === 'del'} danger confirmLabel="حذف ویدیو" title="حذف ویدیو؟">
        فایل «{confirm?.name}» برای همیشه پاک می‌شود{confirm?.usedIn ? ` و از ${toFa(confirm.usedIn)} جلسه جدا خواهد شد` : ''}.
      </Confirm>
    </>
  );
}
