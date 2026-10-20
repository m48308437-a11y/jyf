// کاربران: جست‌وجو، نقش و وضعیت، دسترسی دستی به دوره، سوابق سفارش
import React, { useEffect, useState } from 'react';
import { Users as UsersIcon, BookOpen, ShieldCheck, Ban, BadgeCheck, Plus } from 'lucide-react';
import { useFetch, useStore } from '../store.jsx';
import { patch, post, del } from '../api.js';
import { PageTitle, Group, Row, Button, Modal, ErrorBox, Empty, SearchField, Segmented, Toggle, Select, Badge, Spinner, Alert } from '../ui/kit.jsx';
import { num, toFa, faDate, faDateTime, cls } from '../lib.js';
import { money, useAction, Pill, ListSkeleton, Field, Input } from './ui.jsx';

export default function Users() {
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [page, setPage] = useState(0);
  useEffect(() => { const t = setTimeout(() => { setDq(q.trim()); setPage(0); }, 300); return () => clearTimeout(t); }, [q]);
  const { data, loading, error, reload } = useFetch(`/api/admin/users?q=${encodeURIComponent(dq)}&page=${page}`);
  const [open, setOpen] = useState(null);
  const pages = Math.ceil((data?.total || 0) / 50);
  return (
    <>
      <PageTitle eyebrow="فروش" title="کاربران" />
      <SearchField value={q} onChange={setQ} placeholder="نام، موبایل یا ایمیل" className="mb-4 md:w-80" />
      {error ? <ErrorBox error={error} onRetry={reload} /> : loading && !data ? <ListSkeleton /> : !data.users.length ? <Empty icon={UsersIcon} title="کاربری پیدا نشد" /> : (
        <>
          <Group footer={`${num(data.total)} کاربر${pages > 1 ? ` · صفحه ${toFa(page + 1)} از ${toFa(pages)}` : ''}`}>
            {data.users.map((u) => (
              <Row key={u.id} onClick={() => setOpen(u.id)} chevron
                lead={<span className={cls('grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full text-[13px] font-bold text-white', u.role === 'admin' ? 'bg-gradient-to-b from-[#FFB340] to-[#FF8A00]' : 'bg-gradient-to-b from-[#A1A1A8] to-[#6E6E76]')}>{u.name.slice(0, 1)}</span>}
                title={<span className="flex items-center gap-1.5"><span className="truncate">{u.name}</span>{u.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-[#4DA3FF]" />}</span>}
                subtitle={<><span className="ltr">{u.phone}</span> · {u.grade || 'بدون پایه'} · عضویت {faDate(u.created_at)}</>}>
                {u.role === 'admin' && <Badge tone="amber">مدیر</Badge>}
                {u.status === 'blocked' && <Badge tone="red">مسدود</Badge>}
                <span className="hidden text-[13px] text-ink-mute sm:block">{toFa(u.enrollments)} دوره</span>
              </Row>
            ))}
          </Group>
          {pages > 1 && <div className="flex justify-center gap-2"><Button size="sm" variant="gray" disabled={page === 0} onClick={() => setPage(page - 1)}>قبلی</Button><Button size="sm" variant="gray" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>بعدی</Button></div>}
        </>
      )}
      {open && <UserSheet id={open} onClose={() => setOpen(null)} onChanged={reload} />}
    </>
  );
}

function UserSheet({ id, onClose, onChanged }) {
  const { user: me } = useStore();
  const { data, loading, error, reload } = useFetch(`/api/admin/users/${id}`);
  const courses = useFetch('/api/admin/courses');
  const [busy, run] = useAction();
  const [grant, setGrant] = useState({ courseId: '', note: '' });
  const u = data?.user;
  const self = u && me?.id === u.id;
  const update = async (body, msg) => { if (await run('upd', () => patch(`/api/admin/users/${id}`, body), msg)) { reload(); onChanged(); } };
  const doGrant = async () => { if (await run('grant', () => post(`/api/admin/users/${id}/enrollments`, grant), 'دسترسی دوره فعال شد.')) { setGrant({ courseId: '', note: '' }); reload(); onChanged(); } };
  const revoke = async (courseId) => { if (await run('rv-' + courseId, () => del(`/api/admin/users/${id}/enrollments/${courseId}`), 'دسترسی لغو شد.')) { reload(); onChanged(); } };
  const active = (data?.enrollments || []).filter((e) => !e.revoked_at);
  const available = (courses.data?.courses || []).filter((c) => !active.some((e) => e.course_id === c.id));
  return (
    <Modal open onClose={onClose} title="اطلاعات کاربر" wide>
      {error ? <ErrorBox error={error} onRetry={reload} /> : loading || !u ? <Spinner /> : (
        <div className="grid gap-x-6 md:grid-cols-2">
          <div>
            <div className="mb-6 flex flex-col items-center text-center">
              <span className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-b from-[#7D7BFF] to-[#4B48DB] text-3xl font-bold">{u.name.slice(0, 1)}</span>
              <p className="mt-3 text-[1.35rem] font-bold">{u.name}</p>
              <p className="text-[13px] text-ink-mute"><span className="ltr">{u.phone}</span>{u.email && <> · <span className="ltr">{u.email}</span></>}</p>
            </div>
            <Group title="حساب" footer={self ? 'نقش و وضعیت حساب خودتان قابل تغییر نیست.' : 'با تغییر نقش یا مسدودسازی، کاربر از همه دستگاه‌ها خارج می‌شود.'}>
              <Row title="نقش"><Segmented value={u.role} onChange={(v) => !self && update({ role: v }, 'نقش کاربر تغییر کرد.')} options={[['student', 'دانش‌آموز'], ['admin', 'مدیر']]} className={cls(self && 'pointer-events-none opacity-50')} /></Row>
              <Row icon={Ban} tone="red" title="مسدود کردن حساب"><Toggle checked={u.status === 'blocked'} disabled={self || busy === 'upd'} onChange={(v) => update({ status: v ? 'blocked' : 'active' }, v ? 'حساب مسدود شد.' : 'حساب فعال شد.')} /></Row>
              <Row icon={BadgeCheck} tone="blue" title="تأیید موبایل" detail={u.phone_verified_at ? faDate(u.phone_verified_at) : 'تأیید نشده'} />
              <Row icon={ShieldCheck} tone="gray" title="عضویت" detail={faDate(u.created_at)} />
            </Group>
          </div>
          <div>
            <Group title="دوره‌های فعال">
              {active.length ? active.map((e) => (
                <Row key={e.id} icon={BookOpen} tone="orange" title={e.title} subtitle={`${e.source === 'manual' ? 'دسترسی دستی' : 'خرید'} · ${faDate(e.created_at)}`}>
                  <Button size="xs" variant="danger-tinted" loading={busy === 'rv-' + e.course_id} onClick={() => revoke(e.course_id)}>لغو</Button>
                </Row>
              )) : <Row title="دوره‌ای ندارد" />}
            </Group>
            <Group title="دسترسی دستی به دوره" footer="برای دانش‌آموزان بورسیه یا پرداخت خارج از سایت. در گزارش رخدادها ثبت می‌شود.">
              <div className="grid gap-3 p-4">
                <Select value={grant.courseId} onChange={(e) => setGrant({ ...grant, courseId: e.target.value })}><option value="">— انتخاب دوره —</option>{available.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</Select>
                <Input value={grant.note} onChange={(e) => setGrant({ ...grant, note: e.target.value })} placeholder="توضیح (اختیاری)" />
                <Button size="sm" disabled={!grant.courseId} loading={busy === 'grant'} onClick={doGrant}><Plus className="h-4 w-4" />فعال‌سازی دسترسی</Button>
              </div>
            </Group>
            <Group title="سفارش‌ها">
              {data.orders.length ? data.orders.map((o) => <Row key={o.order_number} title={<span className="ltr">#{o.order_number}</span>} subtitle={faDateTime(o.created_at)} detail={money(o.final_amount)}><Pill kind="order" value={o.status} /></Row>) : <Row title="سفارشی ندارد" />}
            </Group>
          </div>
        </div>
      )}
    </Modal>
  );
}
