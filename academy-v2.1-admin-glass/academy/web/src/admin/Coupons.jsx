// کدهای تخفیف: ساخت، ویرایش، فعال/غیرفعال، سقف استفاده و انقضا
import React, { useMemo, useState } from 'react';
import { Plus, TicketPercent, Trash2 } from 'lucide-react';
import { useFetch } from '../store.jsx';
import { post, put, del } from '../api.js';
import { PageTitle, Group, Row, Button, Modal, ErrorBox, Empty, Segmented, Toggle, ProgressBar } from '../ui/kit.jsx';
import { num, toFa, faDate, cls } from '../lib.js';
import { money, toInt, useAction, Confirm, JalaliInput, ListSkeleton, Field, Input } from './ui.jsx';

const state = (c) => (!c.active ? ['غیرفعال', 'text-ink-mute'] : c.expires_at && c.expires_at < new Date().toISOString() ? ['منقضی', 'text-[#FF6961]'] : c.used_count >= c.max_usage ? ['ظرفیت تمام', 'text-[#FFB547]'] : ['فعال', 'text-[#4FE07B]']);
const payload = (f) => ({ code: f.code, type: f.type, value: toInt(f.value), maxUsage: toInt(f.maxUsage), expiresAt: f.expiresAt, active: f.active, description: f.description });

export default function Coupons() {
  const { data, loading, error, reload } = useFetch('/api/admin/coupons');
  const [busy, run] = useAction();
  const [sheet, setSheet] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [filter, setFilter] = useState('all');
  const list = (data?.coupons || []).filter((c) => filter === 'all' || (filter === 'active' ? state(c)[0] === 'فعال' : state(c)[0] !== 'فعال'));
  const toggle = async (c, active) => { if (await run('t' + c.id, () => put(`/api/admin/coupons/${c.id}`, payload({ ...c, value: c.value, maxUsage: c.max_usage, expiresAt: c.expires_at, active })), active ? 'کد فعال شد.' : 'کد غیرفعال شد.')) reload(); };
  const save = async () => {
    const r = await run('save', () => (sheet.id ? put(`/api/admin/coupons/${sheet.id}`, payload(sheet)) : post('/api/admin/coupons', payload(sheet))), 'کد تخفیف ذخیره شد.');
    if (r) { setSheet(null); reload(); }
  };
  const remove = async () => { if (await run('del', () => del(`/api/admin/coupons/${confirm.id}`), (r) => (r.deactivated ? 'این کد در سفارش‌ها استفاده شده؛ به‌جای حذف غیرفعال شد.' : 'کد حذف شد.'))) { setConfirm(null); setSheet(null); reload(); } };
  const open = (c) => setSheet(c ? { id: c.id, code: c.code, type: c.type, value: toFa(c.value), maxUsage: toFa(c.max_usage), expiresAt: c.expires_at, active: c.active, description: c.description || '', used: c.used_count } : { code: '', type: 'percent', value: '', maxUsage: '۱۰۰', expiresAt: null, active: true, description: '' });
  return (
    <>
      <PageTitle eyebrow="فروش" title="کدهای تخفیف" actions={<Button size="sm" onClick={() => open(null)}><Plus className="h-4 w-4" />کد جدید</Button>} />
      <Segmented value={filter} onChange={setFilter} className="mb-4 sm:w-fit" options={[['all', 'همه'], ['active', 'فعال'], ['off', 'غیرفعال/منقضی']]} />
      {error ? <ErrorBox error={error} onRetry={reload} /> : loading && !data ? <ListSkeleton /> : !list.length ? <Empty icon={TicketPercent} title="کد تخفیفی نیست" action={<Button size="sm" onClick={() => open(null)}><Plus className="h-4 w-4" />ساخت کد</Button>} /> : (
        <Group footer="محاسبه و اعتبارسنجی کد (انقضا، سقف، وضعیت) فقط در سرور انجام می‌شود.">
          {list.map((c) => {
            const [label, tone] = state(c);
            return (
              <Row key={c.id} onClick={() => open(c)} icon={TicketPercent} tone={label === 'فعال' ? 'yellow' : 'gray'}
                title={<span className="flex items-center gap-2"><span className="ltr font-mono font-bold tracking-wide">{c.code}</span><span className="text-[13px] font-semibold text-ink-soft">{c.type === 'percent' ? `٪${toFa(c.value)}` : money(c.value)}</span></span>}
                subtitle={<span className="flex items-center gap-2"><span className={tone}>{label}</span><span>· {c.expires_at ? `تا ${faDate(c.expires_at)}` : 'بدون انقضا'}</span>{c.description && <span className="hidden truncate sm:inline">· {c.description}</span>}</span>}>
                <span className="hidden w-28 sm:block"><span className="mb-1 block text-left text-[12px] text-ink-mute">{num(c.used_count)} / {num(c.max_usage)}</span><ProgressBar value={c.used_count / c.max_usage} tone="bg-ios-yellow" /></span>
                <span onClick={(e) => e.stopPropagation()}><Toggle checked={c.active} disabled={busy === 't' + c.id} onChange={(v) => toggle(c, v)} /></span>
              </Row>
            );
          })}
        </Group>
      )}
      <Modal open={!!sheet} onClose={() => setSheet(null)} title={sheet?.id ? 'ویرایش کد تخفیف' : 'کد تخفیف جدید'}
        footer={<>{sheet?.id && <Button size="sm" variant="danger-tinted" className="ml-auto" onClick={() => setConfirm(sheet)}><Trash2 className="h-4 w-4" />حذف</Button>}<Button size="sm" variant="gray" onClick={() => setSheet(null)}>انصراف</Button><Button size="sm" loading={busy === 'save'} onClick={save}>ذخیره</Button></>}>
        {sheet && (
          <div className="grid gap-4">
            <Field label="کد" hint="حروف انگلیسی بزرگ، عدد، - و _ (۳ تا ۳۲)"><Input value={sheet.code} disabled={!!sheet.id} onChange={(e) => setSheet({ ...sheet, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })} className="ltr text-left font-mono tracking-wider" placeholder="NOWRUZ1405" /></Field>
            <Field as="div" label="نوع تخفیف"><Segmented value={sheet.type} onChange={(v) => setSheet({ ...sheet, type: v })} options={[['percent', 'درصدی'], ['fixed', 'مبلغ ثابت (تومان)']]} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={sheet.type === 'percent' ? 'درصد (۱ تا ۱۰۰)' : 'مبلغ (تومان)'}><Input value={sheet.value} inputMode="numeric" className="ltr text-right" onChange={(e) => setSheet({ ...sheet, value: e.target.value })} /></Field>
              <Field label="سقف استفاده" hint={sheet.used ? `تاکنون ${toFa(sheet.used)} بار استفاده شده` : undefined}><Input value={sheet.maxUsage} inputMode="numeric" className="ltr text-right" onChange={(e) => setSheet({ ...sheet, maxUsage: e.target.value })} /></Field>
            </div>
            <Field label="تاریخ انقضا (شمسی)" hint="خالی = بدون انقضا"><JalaliInput value={sheet.expiresAt} onChange={(v) => setSheet({ ...sheet, expiresAt: v })} /></Field>
            <Field label="توضیح داخلی"><Input value={sheet.description} onChange={(e) => setSheet({ ...sheet, description: e.target.value })} placeholder="مثلاً کمپین نوروز" /></Field>
            <div className="ios-group"><Row title="فعال"><Toggle checked={sheet.active} onChange={(v) => setSheet({ ...sheet, active: v })} /></Row></div>
          </div>
        )}
      </Modal>
      <Confirm open={!!confirm} onClose={() => setConfirm(null)} onConfirm={remove} busy={busy === 'del'} danger confirmLabel="حذف" title="حذف کد تخفیف؟">کد «{confirm?.code}» حذف می‌شود. اگر در سفارشی استفاده شده باشد، فقط غیرفعال می‌شود.</Confirm>
    </>
  );
}
