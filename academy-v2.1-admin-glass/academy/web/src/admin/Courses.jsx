// مدیریت دوره‌ها ← فصل‌ها ← جلسات (+ اتصال/آپلود ویدیو برای هر جلسه)
import React, { useMemo, useState, useEffect } from 'react';
import { Plus, BookOpen, Package, ChevronUp, ChevronDown, Pencil, Trash2, Film, FilmIcon, Lock, Eye, Gift, UploadCloud, Layers, Star } from 'lucide-react';
import { useFetch } from '../store.jsx';
import { get, post, put, patch, del } from '../api.js';
import { PageTitle, Group, Row, Button, Segmented, SearchField, Modal, Toggle, Select, Badge, ErrorBox, Empty, Alert, ProgressBar } from '../ui/kit.jsx';
import { num, toFa, duration, cls, toEn } from '../lib.js';
import { money, toInt, lines, unlines, useAction, useForm, BackLink, Confirm, JalaliInput, Pill, ListSkeleton, Field, Input, Textarea } from './ui.jsx';
import { startUpload, useUploads, ACCEPT } from './uploader.js';

export default function Courses({ id, navigate }) {
  if (id) return <CourseEditor key={id} id={id} navigate={navigate} />;
  return <CourseList navigate={navigate} />;
}

function CourseList({ navigate }) {
  const { data, loading, error, reload } = useFetch('/api/admin/courses');
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const list = useMemo(() => (data?.courses || []).filter((c) => (status === 'all' || c.status === status) && (!q.trim() || c.title.includes(q.trim()) || c.slug.includes(q.trim().toLowerCase()))), [data, status, q]);
  return (
    <>
      <PageTitle eyebrow="آموزش" title="دوره‌ها" actions={<Button size="sm" onClick={() => navigate('/admin/courses/new')}><Plus className="h-4 w-4" />دوره جدید</Button>} />
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
        <Segmented value={status} onChange={setStatus} className="md:w-auto" options={[['all', 'همه'], ['published', 'منتشرشده'], ['draft', 'پیش‌نویس'], ['inactive', 'غیرفعال'], ['archived', 'بایگانی']]} label="وضعیت" />
        <SearchField value={q} onChange={setQ} placeholder="جست‌وجوی عنوان یا نامک" className="md:mr-auto md:w-72" />
      </div>
      {error ? <ErrorBox error={error} onRetry={reload} /> : loading ? <ListSkeleton /> : !list.length ? (
        <Empty icon={BookOpen} title={data?.courses?.length ? 'دوره‌ای با این فیلتر نیست' : 'هنوز دوره‌ای نساخته‌اید'} action={<Button size="sm" onClick={() => navigate('/admin/courses/new')}><Plus className="h-4 w-4" />ساخت اولین دوره</Button>} />
      ) : (
        <Group footer={`${num(list.length)} دوره`}>
          {list.map((c) => (
            <Row key={c.id} to={`/admin/courses/${c.id}`} chevron icon={c.kind === 'package' ? Package : BookOpen} tone={c.kind === 'package' ? 'purple' : 'orange'}
              title={<span className="flex items-center gap-1.5">{c.featured && <Star className="h-3.5 w-3.5 shrink-0 fill-ios-yellow text-ios-yellow" />}<span className="truncate">{c.title}</span></span>}
              subtitle={`${c.categoryTitle || 'بدون دسته'} · ${toFa(c.chapterCount)} فصل · ${toFa(c.lessonCount)} جلسه · ${num(c.sales)} فروش`}>
              <span className="hidden text-left text-[13px] sm:block">{c.discountActive && <span className="block text-ink-mute line-through">{money(c.price)}</span>}<span className="font-semibold">{c.finalPrice ? money(c.finalPrice) : 'رایگان'}</span></span>
              <Pill kind="course" value={c.status} />
            </Row>
          ))}
        </Group>
      )}
    </>
  );
}

const EMPTY = { title: '', slug: '', kind: 'course', shortDesc: '', fullDesc: '', coverUrl: '', instructor: '', categoryId: '', level: 'all', badge: '', price: '0', discountPrice: '', discountExpiresAt: null, status: 'draft', featured: false, durationText: '', prerequisites: '', benefits: '', formulaAccent: '', sortOrder: '0' };
const fromCourse = (c) => ({ ...EMPTY, ...c, categoryId: c.categoryId || '', coverUrl: c.coverUrl || '', badge: c.badge || '', durationText: c.durationText || '', formulaAccent: c.formulaAccent || '', price: String(c.price ?? 0), discountPrice: c.discountPrice == null ? '' : String(c.discountPrice), discountExpiresAt: c.rawDiscountExpiresAt || null, prerequisites: lines(c.prerequisites), benefits: lines(c.benefits), sortOrder: String(c.sortOrder ?? 0) });
const toPayload = (f) => ({ ...f, slug: f.slug.trim().toLowerCase(), price: toInt(f.price) ?? 0, discountPrice: toInt(f.discountPrice), categoryId: f.categoryId || null, prerequisites: unlines(f.prerequisites), benefits: unlines(f.benefits), sortOrder: toInt(f.sortOrder) ?? 0 });

function CourseEditor({ id, navigate }) {
  const isNew = id === 'new';
  const { data, loading, error, reload } = useFetch(isNew ? null : `/api/admin/courses/${id}`);
  const cats = useFetch('/api/admin/categories');
  const [tab, setTab] = useState('curriculum');
  if (!isNew && error) return <><BackLink to="/admin/courses" label="دوره‌ها" /><ErrorBox error={error} onRetry={reload} /></>;
  if (!isNew && (loading || !data)) return <><BackLink to="/admin/courses" label="دوره‌ها" /><ListSkeleton rows={8} /></>;
  const course = data?.course;
  return (
    <>
      <BackLink to="/admin/courses" label="دوره‌ها" className="!flex" />
      <PageTitle eyebrow={isNew ? 'دوره جدید' : 'ویرایش دوره'} title={course?.title || 'دوره جدید'} actions={!isNew && <Pill kind="course" value={course.status} />} />
      {!isNew && <Segmented value={tab} onChange={setTab} className="mb-6 sm:w-fit" options={[['curriculum', 'سرفصل‌ها و جلسات'], ['info', 'اطلاعات و قیمت']]} />}
      {isNew || tab === 'info'
        ? <CourseForm key={course?.id || 'new'} course={course} isNew={isNew} categories={cats.data?.categories || []} navigate={navigate} onSaved={reload} />
        : <Curriculum course={course} reload={reload} />}
    </>
  );
}

function CourseForm({ course, isNew, categories, navigate, onSaved }) {
  const initial = useMemo(() => (course ? fromCourse(course) : EMPTY), [course]);
  const [f, set, bind] = useForm(initial);
  const [busy, run] = useAction();
  const [confirm, setConfirm] = useState(false);
  const save = async () => {
    const r = await run('save', () => (isNew ? post('/api/admin/courses', toPayload(f)) : put(`/api/admin/courses/${course.id}`, toPayload(f))), isNew ? 'دوره ساخته شد؛ حالا فصل و جلسه اضافه کنید.' : 'تغییرات ذخیره شد.');
    if (r && isNew) navigate(`/admin/courses/${r.id}`, { replace: true }); else if (r) onSaved();
  };
  const remove = async () => {
    const r = await run('del', () => del(`/api/admin/courses/${course.id}`), (x) => x.message || 'دوره حذف شد.');
    if (r) navigate('/admin/courses');
  };
  const off = toInt(f.price) && toInt(f.discountPrice) != null ? Math.round((1 - toInt(f.discountPrice) / toInt(f.price)) * 100) : 0;
  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }} className="grid gap-x-6 xl:grid-cols-2">
      <div>
        <Group title="معرفی">
          <div className="grid gap-4 p-4">
            <Field label="عنوان دوره"><Input {...bind('title')} required placeholder="مثلاً ریاضی هفتم — جامع" /></Field>
            <Field label="نامک آدرس (slug)" hint={`آدرس: /courses/${f.slug || '…'}`}><Input {...bind('slug')} className="ltr text-left" placeholder="math-7-complete" required /></Field>
            <Field label="توضیح کوتاه"><Textarea {...bind('shortDesc')} className="min-h-[80px]" /></Field>
            <Field label="توضیحات کامل"><Textarea {...bind('fullDesc')} className="min-h-[160px]" /></Field>
            <Field label="آدرس تصویر کاور" hint="https یا مسیر داخلی"><Input {...bind('coverUrl')} className="ltr text-left" placeholder="https://…" /></Field>
          </div>
        </Group>
        <Group title="جزئیات آموزشی">
          <div className="grid gap-4 p-4 sm:grid-cols-2">
            <Field as="div" label="نوع"><Segmented value={f.kind} onChange={(v) => set('kind', v)} options={[['course', 'دوره'], ['package', 'پکیج']]} /></Field>
            <Field label="سطح"><Select {...bind('level')}><option value="all">همه سطوح</option><option value="beginner">مقدماتی</option><option value="intermediate">متوسط</option><option value="advanced">پیشرفته</option></Select></Field>
            <Field label="دسته‌بندی (پایه)"><Select {...bind('categoryId')}><option value="">بدون دسته</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</Select></Field>
            <Field label="مدرس"><Input {...bind('instructor')} /></Field>
            <Field label="مدت دوره (متن)"><Input {...bind('durationText')} placeholder="۱۲ ساعت" /></Field>
            <Field label="فرمول شاخص"><Input {...bind('formulaAccent')} className="ltr text-left" placeholder="a² + b² = c²" /></Field>
            <Field label="پیش‌نیازها" hint="هر مورد در یک خط" className="sm:col-span-2"><Textarea {...bind('prerequisites')} className="min-h-[80px]" /></Field>
            <Field label="مزایا / خروجی دوره" hint="هر مورد در یک خط" className="sm:col-span-2"><Textarea {...bind('benefits')} className="min-h-[100px]" /></Field>
          </div>
        </Group>
      </div>
      <div>
        <Group title="قیمت و تخفیف" footer="قیمت‌ها به تومان. قیمت نهایی فقط در سرور محاسبه می‌شود.">
          <div className="grid gap-4 p-4 sm:grid-cols-2">
            <Field label="قیمت اصلی"><Input {...bind('price')} inputMode="numeric" className="ltr text-right" /></Field>
            <Field label="قیمت با تخفیف" hint={off > 0 ? `٪${toFa(off)} تخفیف` : 'خالی = بدون تخفیف'}><Input {...bind('discountPrice')} inputMode="numeric" className="ltr text-right" /></Field>
            <Field label="پایان تخفیف (شمسی)" hint="خالی = بدون انقضا" className="sm:col-span-2"><JalaliInput value={f.discountExpiresAt} onChange={(v) => set('discountExpiresAt', v)} /></Field>
          </div>
        </Group>
        <Group title="انتشار">
          <div className="grid gap-4 p-4">
            <Field as="div" label="وضعیت"><Segmented value={f.status} onChange={(v) => set('status', v)} options={[['draft', 'پیش‌نویس'], ['published', 'منتشر'], ['inactive', 'غیرفعال'], ['archived', 'بایگانی']]} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="برچسب روی کارت"><Input {...bind('badge')} placeholder="پرفروش" /></Field>
              <Field label="ترتیب نمایش"><Input {...bind('sortOrder')} inputMode="numeric" className="ltr text-right" /></Field>
            </div>
          </div>
          <Row title="نمایش در صفحه اصلی (ویژه)"><Toggle checked={f.featured} onChange={(v) => set('featured', v)} /></Row>
        </Group>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" loading={busy === 'save'} className="flex-1 sm:flex-none" onClick={(e) => { e.preventDefault(); save(); }}>{isNew ? 'ساخت دوره' : 'ذخیره تغییرات'}</Button>
          {!isNew && <Button variant="danger-tinted" onClick={() => setConfirm(true)}><Trash2 className="h-4 w-4" />حذف</Button>}
        </div>
      </div>
      <Confirm open={confirm} onClose={() => setConfirm(false)} onConfirm={remove} busy={busy === 'del'} danger confirmLabel="حذف دوره" title="حذف دوره؟">
        اگر این دوره سفارش یا دانش‌آموز داشته باشد، برای حفظ سوابق مالی حذف نمی‌شود و به «بایگانی» می‌رود.
      </Confirm>
    </form>
  );
}

// ───── سرفصل‌ها ─────
function Curriculum({ course, reload }) {
  const [busy, run] = useAction();
  const [chapterSheet, setChapterSheet] = useState(null); // {id?, title}
  const [lessonSheet, setLessonSheet] = useState(null); // {chapterId, lesson?}
  const [confirm, setConfirm] = useState(null);
  const chapters = course.chapters || [];
  const move = async (arr, i, d, url) => {
    const ids = arr.map((x) => x.id); const j = i + d; if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    if (await run(`mv-${arr[i].id}`, () => post(url, { ids }))) reload();
  };
  const saveChapter = async () => {
    const t = chapterSheet.title;
    const r = await run('ch', () => (chapterSheet.id ? patch(`/api/admin/chapters/${chapterSheet.id}`, { title: t }) : post(`/api/admin/courses/${course.id}/chapters`, { title: t })), chapterSheet.id ? 'فصل ویرایش شد.' : 'فصل اضافه شد.');
    if (r) { setChapterSheet(null); reload(); }
  };
  const doDelete = async () => {
    const r = await run('del', () => del(confirm.type === 'chapter' ? `/api/admin/chapters/${confirm.id}` : `/api/admin/lessons/${confirm.id}`), 'حذف شد.');
    if (r) { setConfirm(null); reload(); }
  };
  const totalLessons = chapters.reduce((s, c) => s + c.lessons.length, 0);
  const noVideo = chapters.reduce((s, c) => s + c.lessons.filter((l) => !l.hasVideo).length, 0);
  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px] text-ink-soft">{toFa(chapters.length)} فصل · {toFa(totalLessons)} جلسه{noVideo ? <span className="text-[#FFB547]"> · {toFa(noVideo)} جلسه بدون ویدیو</span> : null}</p>
        <Button size="sm" variant="tinted" onClick={() => setChapterSheet({ title: '' })}><Plus className="h-4 w-4" />فصل جدید</Button>
      </div>
      {!chapters.length && <Empty icon={Layers} title="این دوره هنوز فصلی ندارد" action={<Button size="sm" onClick={() => setChapterSheet({ title: '' })}><Plus className="h-4 w-4" />ساخت فصل اول</Button>}>جلسات داخل فصل‌ها قرار می‌گیرند؛ تعداد فصل و جلسه محدودیتی ندارد.</Empty>}
      {chapters.map((ch, ci) => (
        <Group key={ch.id} title={`فصل ${toFa(ci + 1)}`} action={
          <div className="flex items-center gap-0.5">
            <IconBtn label="بالا" disabled={ci === 0 || !!busy} onClick={() => move(chapters, ci, -1, `/api/admin/courses/${course.id}/chapters/reorder`)}><ChevronUp /></IconBtn>
            <IconBtn label="پایین" disabled={ci === chapters.length - 1 || !!busy} onClick={() => move(chapters, ci, 1, `/api/admin/courses/${course.id}/chapters/reorder`)}><ChevronDown /></IconBtn>
            <IconBtn label="ویرایش فصل" onClick={() => setChapterSheet({ id: ch.id, title: ch.title })}><Pencil /></IconBtn>
            <IconBtn label="حذف فصل" danger onClick={() => setConfirm({ type: 'chapter', id: ch.id, title: ch.title, n: ch.lessons.length })}><Trash2 /></IconBtn>
          </div>}>
          <Row title={<span className="text-[17px] font-bold">{ch.title}</span>} subtitle={`${toFa(ch.lessons.length)} جلسه · ${duration(ch.lessons.reduce((s, l) => s + (l.durationSeconds || 0), 0))}`} />
          {ch.lessons.map((l, li) => (
            <Row key={l.id} onClick={() => setLessonSheet({ chapterId: ch.id, lesson: l })}
              lead={<span className={cls('grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full text-[13px] font-bold', l.hasVideo ? 'bg-brand/20 text-[#5AB0FF]' : 'bg-ios-orange/15 text-[#FFB547]')}>{toFa(li + 1)}</span>}
              title={<span className={cls(!l.published && 'text-ink-mute')}>{l.title}</span>}
              subtitle={`${l.hasVideo ? '' : l.videoId ? 'ویدیو در حال آماده‌سازی · ' : 'بدون ویدیو · '}${duration(l.durationSeconds)}${l.published ? '' : ' · منتشر نشده'}`}>
              <span className="hidden sm:inline-flex"><Pill kind="access" value={l.access} /></span>
              <span className="flex items-center" onClick={(e) => e.stopPropagation()}>
                <IconBtn label="بالا" disabled={li === 0 || !!busy} onClick={() => move(ch.lessons, li, -1, `/api/admin/chapters/${ch.id}/lessons/reorder`)}><ChevronUp /></IconBtn>
                <IconBtn label="پایین" disabled={li === ch.lessons.length - 1 || !!busy} onClick={() => move(ch.lessons, li, 1, `/api/admin/chapters/${ch.id}/lessons/reorder`)}><ChevronDown /></IconBtn>
              </span>
            </Row>
          ))}
          <Row onClick={() => setLessonSheet({ chapterId: ch.id })} lead={<span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-ios-green text-white"><Plus className="h-4 w-4" strokeWidth={3} /></span>} title={<span className="text-[#4DA3FF]">افزودن جلسه</span>} />
        </Group>
      ))}

      <Modal open={!!chapterSheet} onClose={() => setChapterSheet(null)} title={chapterSheet?.id ? 'ویرایش فصل' : 'فصل جدید'}
        footer={<><Button variant="gray" size="sm" onClick={() => setChapterSheet(null)}>انصراف</Button><Button size="sm" loading={busy === 'ch'} onClick={saveChapter}>ذخیره</Button></>}>
        <form onSubmit={(e) => { e.preventDefault(); saveChapter(); }}>
          <Field label="عنوان فصل"><Input autoFocus value={chapterSheet?.title || ''} onChange={(e) => setChapterSheet((x) => ({ ...x, title: e.target.value }))} placeholder="مثلاً فصل ۱ — عددهای صحیح" /></Field>
        </form>
      </Modal>
      {lessonSheet && <LessonSheet key={lessonSheet.lesson?.id || 'new-' + lessonSheet.chapterId} {...lessonSheet} chapters={chapters} onClose={() => setLessonSheet(null)} onSaved={() => { setLessonSheet(null); reload(); }} onDelete={(l) => { setLessonSheet(null); setConfirm({ type: 'lesson', id: l.id, title: l.title }); }} />}
      <Confirm open={!!confirm} onClose={() => setConfirm(null)} onConfirm={doDelete} busy={busy === 'del'} danger confirmLabel="حذف" title={confirm?.type === 'chapter' ? 'حذف فصل؟' : 'حذف جلسه؟'}>
        «{confirm?.title}» حذف می‌شود.{confirm?.type === 'chapter' && confirm.n > 0 && <> {toFa(confirm.n)} جلسه‌ی این فصل هم حذف خواهند شد.</>} فایل ویدیو در کتابخانه باقی می‌ماند.
      </Confirm>
    </>
  );
}

const IconBtn = ({ children, label, onClick, disabled, danger }) => (
  <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick}
    className={cls('grid h-8 w-8 place-items-center rounded-full transition hover:bg-white/10 disabled:opacity-25 [&>svg]:h-[18px] [&>svg]:w-[18px]', danger ? 'text-[#FF6961]' : 'text-ink-soft')}>{children}</button>
);

const TOPICS = [['', 'بدون شبیه‌ساز'], ['linear', 'خط و شیب'], ['integer', 'محور اعداد صحیح'], ['geometry', 'هندسه'], ['pythagoras', 'فیثاغورس'], ['parabola', 'سهمی'], ['sets', 'مجموعه‌ها']];

function LessonSheet({ chapterId, lesson, chapters, onClose, onSaved, onDelete }) {
  const videos = useFetch('/api/admin/videos');
  const [busy, run] = useAction();
  const initial = useMemo(() => ({
    title: lesson?.title || '', description: lesson?.description || '', access: lesson?.access || 'paid', published: lesson ? lesson.published : true,
    videoId: lesson?.videoId || '', chapterId, mathTopic: lesson?.mathTopic || '', formula: lesson?.formula || '', keyPoints: lines(lesson?.keyPoints),
    minutes: lesson?.durationSeconds ? toFa(Math.floor(lesson.durationSeconds / 60)) : '', seconds: lesson?.durationSeconds ? toFa(lesson.durationSeconds % 60) : '',
  }), [lesson, chapterId]);
  const [f, set, bind] = useForm(initial);
  const ups = useUploads();
  const [uploadKey, setUploadKey] = useState(null);
  const up = ups.find((u) => u.key === uploadKey);
  useEffect(() => { if (up?.state === 'done' && up.videoId && f.videoId !== up.videoId) { set('videoId', up.videoId); videos.reload(); } }, [up?.state]);
  const ready = (videos.data?.videos || []).filter((v) => v.status === 'ready' || v.id === f.videoId);
  const chosen = ready.find((v) => v.id === f.videoId);
  const pickFile = (file) => { if (!file) return; const u = startUpload(file); setUploadKey(u.key); };
  const save = async () => {
    let secs = (toInt(f.minutes) || 0) * 60 + (toInt(f.seconds) || 0);
    if (!secs && chosen?.duration) secs = chosen.duration;
    const body = { title: f.title, description: f.description, access: f.access, published: f.published, videoId: f.videoId || null, mathTopic: f.mathTopic || null, formula: f.formula, keyPoints: unlines(f.keyPoints), durationSeconds: secs, chapterId: f.chapterId };
    const r = await run('save', () => (lesson ? put(`/api/admin/lessons/${lesson.id}`, body) : post(`/api/admin/chapters/${chapterId}/lessons`, body)), lesson ? 'جلسه ذخیره شد.' : 'جلسه اضافه شد.');
    if (r) onSaved();
  };
  const uploading = up && ['preparing', 'uploading', 'finishing'].includes(up.state);
  return (
    <Modal open onClose={onClose} wide title={lesson ? 'ویرایش جلسه' : 'جلسه جدید'}
      footer={<>
        {lesson && <Button variant="danger-tinted" size="sm" className="ml-auto" onClick={() => onDelete(lesson)}><Trash2 className="h-4 w-4" />حذف جلسه</Button>}
        <Button variant="gray" size="sm" onClick={onClose}>انصراف</Button>
        <Button size="sm" loading={busy === 'save'} disabled={uploading} onClick={save}>{uploading ? 'صبر تا پایان آپلود…' : 'ذخیره'}</Button>
      </>}>
      <form onSubmit={(e) => { e.preventDefault(); save(); }} className="grid gap-5 md:grid-cols-2">
        <div className="grid content-start gap-4">
          <Field label="عنوان جلسه"><Input {...bind('title')} autoFocus={!lesson} placeholder="مثلاً جلسه ۳ — ضرب اعداد صحیح" /></Field>
          <Field label="توضیحات"><Textarea {...bind('description')} /></Field>
          <Field as="div" label="نوع دسترسی"><Segmented value={f.access} onChange={(v) => set('access', v)} options={[['paid', 'ویژه خریداران'], ['preview', 'پیش‌نمایش'], ['free', 'رایگان']]} /></Field>
          <div className="ios-group">
            <Row title="منتشر شود"><Toggle checked={f.published} onChange={(v) => set('published', v)} /></Row>
          </div>
          {lesson && chapters.length > 1 && <Field label="انتقال به فصل"><Select {...bind('chapterId')}>{chapters.map((c, i) => <option key={c.id} value={c.id}>فصل {toFa(i + 1)} — {c.title}</option>)}</Select></Field>}
        </div>
        <div className="grid content-start gap-4">
          <Field as="div" label="ویدیوی جلسه">
            <div className="ios-group p-3">
              {chosen ? (
                <div className="flex items-center gap-3"><span className="ios-tile tile-pink"><Film className="h-[18px] w-[18px]" /></span><span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-medium">{chosen.name}</span><span className="text-[13px] text-ink-mute">{duration(chosen.duration)} · <Pill kind="video" value={chosen.status} /></span></span><Button size="xs" variant="gray" onClick={() => set('videoId', '')}>جدا کردن</Button></div>
              ) : up && up.state !== 'done' ? (
                <div><div className="mb-2 flex justify-between gap-2 text-[13px]"><span className="truncate">{up.name}</span><span className="shrink-0 text-ink-mute">{up.state === 'error' ? 'خطا' : up.state === 'paused' ? 'متوقف' : `٪${toFa(Math.floor((up.loaded / up.total) * 100))}`}</span></div><ProgressBar value={up.loaded / up.total} active={uploading} tone={up.state === 'error' ? 'bg-ios-red' : 'bg-brand'} />{up.error && <p className="mt-2 text-xs text-[#FF6961]">{up.error}</p>}{['paused', 'error'].includes(up.state) && <Button size="xs" variant="tinted" className="mt-2" onClick={() => up.resume()}>ادامه آپلود</Button>}</div>
              ) : (
                <div className="grid gap-2">
                  <Select value={f.videoId} onChange={(e) => set('videoId', e.target.value)}><option value="">— انتخاب از کتابخانه ({toFa(ready.length)} ویدیو) —</option>{ready.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</Select>
                  <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[14px] border border-dashed border-white/20 text-sm font-semibold text-[#4DA3FF] transition hover:bg-white/[0.05]">
                    <UploadCloud className="h-4 w-4" />آپلود ویدیوی جدید<input type="file" accept={ACCEPT} className="sr-only" onChange={(e) => pickFile(e.target.files?.[0])} />
                  </label>
                </div>
              )}
            </div>
          </Field>
          <Field as="div" label="مدت جلسه" hint={chosen?.duration ? `خالی = ${duration(chosen.duration)} از روی فایل` : 'دقیقه : ثانیه'}>
            <div className="flex items-center gap-2 ltr"><Input {...bind('minutes')} inputMode="numeric" placeholder="دقیقه" className="text-center" /><span className="text-ink-mute">:</span><Input {...bind('seconds')} inputMode="numeric" placeholder="ثانیه" className="text-center" /></div>
          </Field>
          <Field label="شبیه‌ساز تعاملی"><Select {...bind('mathTopic')}>{TOPICS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
          <Field label="فرمول جلسه"><Input {...bind('formula')} className="ltr text-left" placeholder="y = mx + b" /></Field>
          <Field label="نکات کلیدی" hint="هر نکته در یک خط"><Textarea {...bind('keyPoints')} className="min-h-[90px]" /></Field>
        </div>
      </form>
    </Modal>
  );
}
