// سفارش‌ها، پرداخت‌ها، بررسی مجدد تراکنش، بازگشت وجه و گزارش فروش
import React, { useEffect, useMemo, useState } from 'react';
import { Receipt, Download, RefreshCw, Undo2, CreditCard } from 'lucide-react';
import { useFetch } from '../store.jsx';
import { post } from '../api.js';
import { PageTitle, Group, Row, Button, Modal, ErrorBox, Empty, Segmented, SearchField, Alert } from '../ui/kit.jsx';
import { num, toFa, faDateTime } from '../lib.js';
import { money, useAction, Pill, ListSkeleton, Field, Textarea } from './ui.jsx';

const useDebounced = (v, ms = 300) => { const [d, setD] = useState(v); useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]); return d; };

function SalesReport() {
  const [days, setDays] = useState('30');
  const range = useMemo(() => ({ from: new Date(Date.now() - Number(days) * 86400_000).toISOString(), to: new Date().toISOString() }), [days]);
  const qs = `from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`;
  const { data } = useFetch(`/api/admin/reports/sales?${qs}`);
  return (
    <Group title="گزارش فروش">
      <div className="flex flex-wrap items-center gap-4 p-4">
        <Segmented value={days} onChange={setDays} options={[['7', '۷ روز'], ['30', '۳۰ روز'], ['90', '۹۰ روز'], ['365', 'یک سال']]} />
        <div className="flex-1"><p className="text-[1.5rem] font-extrabold leading-tight">{data ? money(data.total) : '…'}</p><p className="text-[13px] text-ink-mute">{data ? `${num(data.count)} سفارش پرداخت‌شده` : ''}</p></div>
        <Button size="sm" variant="tinted" onClick={() => { location.href = `/api/admin/reports/sales?${qs}&format=csv`; }}><Download className="h-4 w-4" />خروجی اکسل (CSV)</Button>
      </div>
    </Group>
  );
}

export default function Orders() {
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const dq = useDebounced(q);
  const { data, loading, error, reload } = useFetch(`/api/admin/orders?status=${status}&q=${encodeURIComponent(dq.trim())}`);
  const [open, setOpen] = useState(null);
  const orders = data?.orders || [];
  const current = open && orders.find((o) => o.number === open);
  return (
    <>
      <PageTitle eyebrow="فروش" title="سفارش‌ها" />
      <SalesReport />
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <Segmented value={status} onChange={setStatus} options={[['', 'همه'], ['paid', 'پرداخت‌شده'], ['pending', 'در انتظار'], ['failed', 'ناموفق'], ['refunded', 'بازگشت وجه'], ['cancelled', 'لغوشده']]} />
        <SearchField value={q} onChange={setQ} placeholder="شماره سفارش، نام یا موبایل" className="md:mr-auto md:w-72" />
      </div>
      {error ? <ErrorBox error={error} onRetry={reload} /> : loading && !data ? <ListSkeleton /> : !orders.length ? <Empty icon={Receipt} title="سفارشی پیدا نشد" /> : (
        <Group footer={orders.length >= 200 ? 'فقط ۲۰۰ سفارش آخر نمایش داده می‌شود؛ برای یافتن موارد قدیمی‌تر جست‌وجو کنید.' : `${num(orders.length)} سفارش`}>
          {orders.map((o) => (
            <Row key={o.number} onClick={() => setOpen(o.number)} chevron title={o.userName}
              subtitle={<><span className="ltr">#{o.number}</span> · {faDateTime(o.createdAt)} · {o.items.map((i) => i.title).join('، ')}</>}>
              <span className="hidden text-[15px] font-semibold sm:block">{money(o.finalAmount)}</span>
              <Pill kind="order" value={o.status} />
            </Row>
          ))}
        </Group>
      )}
      {current && <OrderSheet o={current} onClose={() => setOpen(null)} onChanged={reload} />}
    </>
  );
}

function OrderSheet({ o, onClose, onChanged }) {
  const [busy, run] = useAction();
  const [refund, setRefund] = useState(false);
  const [note, setNote] = useState('');
  const [results, setResults] = useState(null);
  const reconcile = async () => {
    const r = await run('rec', () => post(`/api/admin/orders/${o.number}/reconcile`));
    if (r) { setResults(r.results); onChanged(); }
  };
  const doRefund = async () => {
    const r = await run('ref', () => post(`/api/admin/orders/${o.number}/refund`, { note }), 'بازگشت وجه ثبت شد و دسترسی دوره‌ها لغو شد.');
    if (r) { setRefund(false); onChanged(); onClose(); }
  };
  return (
    <Modal open onClose={onClose} title={`سفارش ${o.number}`}
      footer={<>
        {o.status === 'pending' && <Button size="sm" variant="tinted" loading={busy === 'rec'} onClick={reconcile}><RefreshCw className="h-4 w-4" />بررسی مجدد با درگاه</Button>}
        {o.status === 'paid' && !refund && <Button size="sm" variant="danger-tinted" onClick={() => setRefund(true)}><Undo2 className="h-4 w-4" />بازگشت وجه</Button>}
        <Button size="sm" variant="gray" onClick={onClose}>بستن</Button>
      </>}>
      <div className="mb-5 text-center">
        <Pill kind="order" value={o.status} />
        <p className="mt-3 text-[2rem] font-extrabold tracking-tight">{money(o.finalAmount)}</p>
        <p className="text-[13px] text-ink-mute">{o.userName} · <span className="ltr">{o.userPhone}</span></p>
      </div>
      <Group title="اقلام">
        {o.items.map((i) => <Row key={i.courseId} title={i.title} detail={i.unitPrice < i.listPrice ? <span><span className="ml-2 text-[13px] line-through">{money(i.listPrice)}</span>{money(i.unitPrice)}</span> : money(i.unitPrice)} />)}
        <Row title="جمع" detail={money(o.subtotal)} />
        {o.discountAmount > 0 && <Row title={`تخفیف${o.couponCode ? ` (کد ${o.couponCode})` : ''}`} detail={<span className="text-[#4FE07B]">−{money(o.discountAmount)}</span>} />}
        <Row title={<b>مبلغ نهایی</b>} detail={<b className="text-ink">{money(o.finalAmount)}</b>} />
      </Group>
      <Group title="زمان‌ها">
        <Row title="ثبت سفارش" detail={faDateTime(o.createdAt)} />
        {o.paidAt && <Row title="پرداخت" detail={faDateTime(o.paidAt)} />}
      </Group>
      <Group title="تراکنش‌ها">
        {o.payments.length ? o.payments.map((p, i) => (
          <Row key={i} icon={CreditCard} tone={p.status === 'verified' ? 'green' : p.status === 'failed' ? 'red' : 'gray'} title={`${p.gateway === 'zarinpal' ? 'زرین‌پال' : p.gateway} · ${{ initiated: 'شروع‌شده', verified: 'تأییدشده', failed: 'ناموفق', refunded: 'بازگشت وجه' }[p.status] || p.status}`}
            subtitle={[p.refId && `کد پیگیری ${toFa(p.refId)}`, p.cardPan && <span key="c" className="ltr">{p.cardPan}</span>, p.message, faDateTime(p.createdAt)].filter(Boolean).reduce((a, x, k) => (k ? [...a, ' · ', x] : [x]), [])} />
        )) : <Row title="تراکنشی ثبت نشده" />}
      </Group>
      {results && <Alert tone="info" className="mb-4">نتیجه بررسی: {results.length ? results.map((r) => `${r.result}${r.code != null ? ` (کد ${toFa(r.code)})` : ''}`).join('، ') : 'تراکنش در انتظاری برای بررسی نبود.'}</Alert>}
      {refund && (
        <div className="ios-group grid gap-3 p-4">
          <Alert tone="warning">ابتدا مبلغ را در پنل زرین‌پال بازگردانید؛ با ثبت اینجا سفارش «بازگشت وجه» می‌شود و دسترسی دانش‌آموز به دوره‌ها لغو می‌شود.</Alert>
          <Field label="دلیل / توضیح (الزامی)"><Textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[80px]" /></Field>
          <div className="flex justify-end gap-2"><Button size="sm" variant="gray" onClick={() => setRefund(false)}>انصراف</Button><Button size="sm" variant="danger" loading={busy === 'ref'} disabled={note.trim().length < 3} onClick={doRefund}>ثبت بازگشت وجه</Button></div>
        </div>
      )}
    </Modal>
  );
}
