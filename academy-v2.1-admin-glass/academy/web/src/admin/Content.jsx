// محتوای سایت: برند و تماس، پرسش‌های متداول، مقالات، دسته‌بندی‌ها (پایه‌ها)، دستیار
import React, { useMemo, useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, FileText, FolderOpen, Sparkles } from 'lucide-react';
import { useFetch, useStore } from '../store.jsx';
import { post, put, del } from '../api.js';
import { PageTitle, Group, Row, Button, Modal, ErrorBox, Empty, Segmented, Toggle, Alert, Badge } from '../ui/kit.jsx';
import { toFa, num, faDate, cls } from '../lib.js';
import { useAction, useForm, Confirm, ListSkeleton, Field, Input, Textarea, toInt } from './ui.jsx';

export default function Content() {
  const [tab, setTab] = useState('brand');
  return (
    <>
      <PageTitle eyebrow="سایت" title="محتوای سایت" />
      <Segmented value={tab} onChange={setTab} className="mb-6 lg:w-fit" options={[['brand', 'برند و تماس'], ['faq', 'پرسش‌های متداول'], ['articles', 'مقالات'], ['categories', 'پایه‌ها'], ['ai', 'دستیار']]} />
      {tab === 'brand' && <Brand />}
      {tab === 'faq' && <Faq />}
      {tab === 'articles' && <Articles />}
      {tab === 'categories' && <Categories />}
      {tab === 'ai' && <Ai />}
    </>
  );
}

function useSetting(key) {
  const r = useFetch(`/api/admin/settings/${key}`);
  const { loadSite } = useStore();
  const [busy, run] = useAction();
  const save = async (value) => { if (await run('save', () => put(`/api/admin/settings/${key}`, { value }), 'ذخیره شد و روی سایت اعمال شد.')) { r.reload(); loadSite(); } };
  return { ...r, busy, save };
}

const BRAND = [
  ['academyName', 'نام آکادمی'], ['instructorName', 'نام مدرس'], ['slogan', 'شعار'], ['heroSubtitle', 'متن زیر عنوان صفحه اصلی', true],
  ['supportPhone', 'تلفن پشتیبانی'], ['supportHours', 'ساعات پاسخ‌گویی'], ['supportEmail', 'ایمیل', false, true], ['telegramId', 'آیدی تلگرام', false, true],
  ['teacherWelcome', 'خوش‌آمد استاد', true], ['teacherBio', 'معرفی استاد', true], ['teacherMethod', 'روش تدریس', true], ['refundPolicy', 'قوانین بازگشت وجه', true],
];
function Brand() {
  const s = useSetting('brand');
  if (s.error) return <ErrorBox error={s.error} onRetry={s.reload} />;
  if (s.loading || !s.data) return <ListSkeleton />;
  return <BrandForm key={JSON.stringify(s.data.value)} value={s.data.value} busy={s.busy} save={s.save} />;
}
function BrandForm({ value, busy, save }) {
  const [f, , bind] = useForm(value);
  const short = BRAND.filter((b) => !b[2]), long = BRAND.filter((b) => b[2]);
  return (
    <form onSubmit={(e) => { e.preventDefault(); save(f); }}>
      <div className="grid gap-x-6 xl:grid-cols-2">
        <Group title="هویت و تماس"><div className="grid gap-4 p-4 sm:grid-cols-2">{short.map(([k, l, , ltr]) => <Field key={k} label={l}><Input {...bind(k)} className={cls(ltr && 'ltr text-left')} /></Field>)}</div></Group>
        <Group title="متن‌های صفحه اصلی و قوانین"><div className="grid gap-4 p-4">{long.map(([k, l]) => <Field key={k} label={l}><Textarea {...bind(k)} /></Field>)}</div></Group>
      </div>
      <Button type="submit" loading={busy === 'save'}>ذخیره تغییرات</Button>
    </form>
  );
}

function Faq() {
  const s = useSetting('faq');
  if (s.error) return <ErrorBox error={s.error} onRetry={s.reload} />;
  if (s.loading || !s.data) return <ListSkeleton />;
  return <FaqForm key={JSON.stringify(s.data.value)} value={s.data.value} busy={s.busy} save={s.save} />;
}
function FaqForm({ value, busy, save }) {
  const [items, setItems] = useState(value);
  const upd = (i, k, v) => setItems((x) => x.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  const mv = (i, d) => setItems((x) => { const y = [...x]; const j = i + d; if (j < 0 || j >= y.length) return x; [y[i], y[j]] = [y[j], y[i]]; return y; });
  return (
    <>
      {items.map((it, i) => (
        <Group key={i} title={`پرسش ${toFa(i + 1)}`} action={<div className="flex gap-0.5 text-ink-soft">
          <button type="button" aria-label="بالا" disabled={!i} onClick={() => mv(i, -1)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10 disabled:opacity-25"><ChevronUp className="h-4 w-4" /></button>
          <button type="button" aria-label="پایین" disabled={i === items.length - 1} onClick={() => mv(i, 1)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10 disabled:opacity-25"><ChevronDown className="h-4 w-4" /></button>
          <button type="button" aria-label="حذف" onClick={() => setItems((x) => x.filter((_, j) => j !== i))} className="grid h-8 w-8 place-items-center rounded-full text-[#FF6961] hover:bg-white/10"><Trash2 className="h-4 w-4" /></button></div>}>
          <div className="grid gap-3 p-4"><Input value={it.q} onChange={(e) => upd(i, 'q', e.target.value)} placeholder="پرسش" className="font-semibold" /><Textarea value={it.a} onChange={(e) => upd(i, 'a', e.target.value)} placeholder="پاسخ" /></div>
        </Group>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button variant="tinted" onClick={() => setItems((x) => [...x, { q: '', a: '' }])}><Plus className="h-4 w-4" />افزودن پرسش</Button>
        <Button loading={busy === 'save'} onClick={() => save(items)}>ذخیره {toFa(items.length)} پرسش</Button>
      </div>
    </>
  );
}

function Ai() {
  const s = useSetting('ai');
  if (s.error) return <ErrorBox error={s.error} onRetry={s.reload} />;
  if (s.loading || !s.data) return <ListSkeleton />;
  return <AiForm key={JSON.stringify(s.data.value)} value={s.data.value} configured={s.data.aiServerConfigured} busy={s.busy} save={s.save} />;
}
function AiForm({ value, configured, busy, save }) {
  const [f, set, bind] = useForm(value);
  return (
    <form onSubmit={(e) => { e.preventDefault(); save(f); }} className="max-w-2xl">
      {!configured && <Alert tone="info" className="mb-5">کلید API هوش مصنوعی روی سرور تنظیم نشده؛ دستیار با موتور محلی محاسبات ریاضی پاسخ می‌دهد.</Alert>}
      <Group><Row icon={Sparkles} tone="purple" title="دستیار فعال باشد"><Toggle checked={f.enabled} onChange={(v) => set('enabled', v)} /></Row></Group>
      <Group title="شخصیت دستیار"><div className="grid gap-4 p-4">
        <Field label="نام دستیار"><Input {...bind('name')} /></Field>
        <Field label="پیام خوشامد"><Textarea {...bind('welcome')} /></Field>
        <Field label="دستور سیستمی" hint="لحن، محدوده پاسخ‌ها و قوانین دستیار"><Textarea {...bind('systemPrompt')} className="min-h-[180px]" /></Field>
      </div></Group>
      <Button type="submit" loading={busy === 'save'}>ذخیره</Button>
    </form>
  );
}

function Articles() {
  const { data, loading, error, reload } = useFetch('/api/admin/articles');
  const [busy, run] = useAction();
  const [sheet, setSheet] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const save = async () => {
    const body = { ...sheet };
    const r = await run('save', () => (sheet.id ? put(`/api/admin/articles/${sheet.id}`, body) : post('/api/admin/articles', body)), 'مقاله ذخیره شد.');
    if (r) { setSheet(null); reload(); }
  };
  const remove = async () => { if (await run('del', () => del(`/api/admin/articles/${confirm.id}`), 'مقاله حذف شد.')) { setConfirm(null); setSheet(null); reload(); } };
  const blank = { slug: '', title: '', category: '', grade: '', readTime: '', excerpt: '', content: '', published: true };
  const edit = (a) => setSheet({ id: a.id, slug: a.slug, title: a.title, category: a.category || '', grade: a.grade || '', readTime: a.read_time || '', excerpt: a.excerpt || '', content: a.content || '', published: a.published });
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  return (
    <>
      <div className="mb-4 flex justify-end"><Button size="sm" onClick={() => setSheet(blank)}><Plus className="h-4 w-4" />مقاله جدید</Button></div>
      {loading && !data ? <ListSkeleton /> : !data.articles.length ? <Empty icon={FileText} title="مقاله‌ای منتشر نشده" /> : (
        <Group footer={`${num(data.articles.length)} مقاله`}>
          {data.articles.map((a) => <Row key={a.id} chevron onClick={() => edit(a)} icon={FileText} tone={a.published ? 'teal' : 'gray'} title={a.title} subtitle={`${a.category || 'بدون دسته'} · ${a.grade || 'همه پایه‌ها'} · ${faDate(a.published_at)}`}>{!a.published && <Badge tone="gray">پیش‌نویس</Badge>}</Row>)}
        </Group>
      )}
      <Modal open={!!sheet} onClose={() => setSheet(null)} wide title={sheet?.id ? 'ویرایش مقاله' : 'مقاله جدید'}
        footer={<>{sheet?.id && <Button size="sm" variant="danger-tinted" className="ml-auto" onClick={() => setConfirm(sheet)}><Trash2 className="h-4 w-4" />حذف</Button>}<Button size="sm" variant="gray" onClick={() => setSheet(null)}>انصراف</Button><Button size="sm" loading={busy === 'save'} onClick={save}>ذخیره</Button></>}>
        {sheet && (
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="عنوان" className="sm:col-span-2"><Input value={sheet.title} onChange={(e) => setSheet({ ...sheet, title: e.target.value })} /></Field>
              <Field label="نامک (slug)"><Input value={sheet.slug} onChange={(e) => setSheet({ ...sheet, slug: e.target.value.toLowerCase() })} className="ltr text-left" placeholder="pythagoras-tips" /></Field>
              <Field label="زمان مطالعه"><Input value={sheet.readTime} onChange={(e) => setSheet({ ...sheet, readTime: e.target.value })} placeholder="۵ دقیقه" /></Field>
              <Field label="دسته"><Input value={sheet.category} onChange={(e) => setSheet({ ...sheet, category: e.target.value })} placeholder="نکته‌های امتحانی" /></Field>
              <Field label="پایه"><Input value={sheet.grade} onChange={(e) => setSheet({ ...sheet, grade: e.target.value })} placeholder="هشتم" /></Field>
            </div>
            <Field label="خلاصه"><Textarea value={sheet.excerpt} onChange={(e) => setSheet({ ...sheet, excerpt: e.target.value })} className="min-h-[80px]" /></Field>
            <Field label="متن مقاله" hint="پاراگراف‌ها را با یک خط خالی جدا کنید"><Textarea value={sheet.content} onChange={(e) => setSheet({ ...sheet, content: e.target.value })} className="min-h-[260px]" /></Field>
            <div className="ios-group"><Row title="منتشر شود"><Toggle checked={sheet.published} onChange={(v) => setSheet({ ...sheet, published: v })} /></Row></div>
          </div>
        )}
      </Modal>
      <Confirm open={!!confirm} onClose={() => setConfirm(null)} onConfirm={remove} busy={busy === 'del'} danger confirmLabel="حذف" title="حذف مقاله؟">«{confirm?.title}» برای همیشه حذف می‌شود.</Confirm>
    </>
  );
}

function Categories() {
  const { data, loading, error, reload } = useFetch('/api/admin/categories');
  const { loadSite } = useStore();
  const [busy, run] = useAction();
  const [sheet, setSheet] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const save = async () => {
    const body = { title: sheet.title, slug: sheet.slug, sortOrder: toInt(sheet.sortOrder) ?? 0 };
    if (await run('save', () => (sheet.id ? put(`/api/admin/categories/${sheet.id}`, body) : post('/api/admin/categories', body)), 'ذخیره شد.')) { setSheet(null); reload(); loadSite(); }
  };
  const remove = async () => { if (await run('del', () => del(`/api/admin/categories/${confirm.id}`), 'حذف شد.')) { setConfirm(null); setSheet(null); reload(); loadSite(); } };
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  return (
    <>
      <div className="mb-4 flex justify-end"><Button size="sm" onClick={() => setSheet({ title: '', slug: '', sortOrder: '' })}><Plus className="h-4 w-4" />پایه جدید</Button></div>
      {loading && !data ? <ListSkeleton /> : !data.categories.length ? <Empty icon={FolderOpen} title="دسته‌ای تعریف نشده" /> : (
        <Group footer="پایه‌ها در منوی سایت و فیلتر فروشگاه نمایش داده می‌شوند.">
          {data.categories.map((c) => <Row key={c.id} chevron onClick={() => setSheet({ id: c.id, title: c.title, slug: c.slug, sortOrder: toFa(c.sort_order) })} icon={FolderOpen} tone="blue" title={c.title} subtitle={<span className="ltr">/{c.slug}</span>} detail={`${toFa(c.courses)} دوره`} />)}
        </Group>
      )}
      <Modal open={!!sheet} onClose={() => setSheet(null)} title={sheet?.id ? 'ویرایش پایه' : 'پایه جدید'}
        footer={<>{sheet?.id && <Button size="sm" variant="danger-tinted" className="ml-auto" onClick={() => setConfirm(sheet)}><Trash2 className="h-4 w-4" />حذف</Button>}<Button size="sm" variant="gray" onClick={() => setSheet(null)}>انصراف</Button><Button size="sm" loading={busy === 'save'} onClick={save}>ذخیره</Button></>}>
        {sheet && <div className="grid gap-4">
          <Field label="عنوان"><Input value={sheet.title} onChange={(e) => setSheet({ ...sheet, title: e.target.value })} placeholder="پایه هفتم" /></Field>
          <Field label="نامک (slug)"><Input value={sheet.slug} onChange={(e) => setSheet({ ...sheet, slug: e.target.value.toLowerCase() })} className="ltr text-left" placeholder="grade-7" /></Field>
          <Field label="ترتیب"><Input value={sheet.sortOrder} inputMode="numeric" onChange={(e) => setSheet({ ...sheet, sortOrder: e.target.value })} className="ltr text-right" /></Field>
        </div>}
      </Modal>
      <Confirm open={!!confirm} onClose={() => setConfirm(null)} onConfirm={remove} busy={busy === 'del'} danger confirmLabel="حذف" title="حذف پایه؟">دوره‌های این پایه حذف نمی‌شوند و «بدون دسته» خواهند شد.</Confirm>
    </>
  );
}
