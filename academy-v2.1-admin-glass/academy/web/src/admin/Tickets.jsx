// تیکت‌های پشتیبانی
import React, { useState } from 'react';
import { MessagesSquare, Send, Lock } from 'lucide-react';
import { useFetch } from '../store.jsx';
import { post } from '../api.js';
import { PageTitle, Group, Row, Button, Modal, ErrorBox, Empty, Segmented } from '../ui/kit.jsx';
import { num, faDateTime } from '../lib.js';
import { useAction, Pill, ListSkeleton, Field, Textarea } from './ui.jsx';

export default function Tickets() {
  const { data, loading, error, reload } = useFetch('/api/admin/tickets');
  const [filter, setFilter] = useState('open');
  const [open, setOpen] = useState(null);
  const [reply, setReply] = useState('');
  const [busy, run] = useAction();
  const list = (data?.tickets || []).filter((t) => filter === 'all' || t.status === filter);
  const t = open && data?.tickets.find((x) => x.id === open);
  const send = async () => { if (await run('r', () => post(`/api/admin/tickets/${t.id}/reply`, { reply }), 'پاسخ ارسال شد.')) { setReply(''); setOpen(null); reload(); } };
  const close = async () => { if (await run('c', () => post(`/api/admin/tickets/${t.id}/close`), 'تیکت بسته شد.')) { setOpen(null); reload(); } };
  return (
    <>
      <PageTitle eyebrow="سایت" title="تیکت‌ها" />
      <Segmented value={filter} onChange={setFilter} className="mb-4 sm:w-fit" options={[['open', 'باز'], ['answered', 'پاسخ داده شد'], ['closed', 'بسته'], ['all', 'همه']]} />
      {error ? <ErrorBox error={error} onRetry={reload} /> : loading && !data ? <ListSkeleton /> : !list.length ? <Empty icon={MessagesSquare} title="تیکتی در این بخش نیست" /> : (
        <Group footer={`${num(list.length)} تیکت`}>
          {list.map((x) => <Row key={x.id} chevron onClick={() => { setOpen(x.id); setReply(x.reply || ''); }} icon={MessagesSquare} tone={x.status === 'open' ? 'purple' : 'gray'} title={x.subject} subtitle={`${x.user_name} · ${x.course_title || 'عمومی'} · ${faDateTime(x.created_at)}`}><Pill kind="ticket" value={x.status} /></Row>)}
        </Group>
      )}
      <Modal open={!!t} onClose={() => setOpen(null)} title={t?.subject || ''}
        footer={t && <>{t.status !== 'closed' && <Button size="sm" variant="gray" className="ml-auto" loading={busy === 'c'} onClick={close}><Lock className="h-4 w-4" />بستن تیکت</Button>}<Button size="sm" loading={busy === 'r'} disabled={reply.trim().length < 2} onClick={send}><Send className="h-4 w-4" />ارسال پاسخ</Button></>}>
        {t && (
          <div className="grid gap-4">
            <p className="text-[13px] text-ink-mute">{t.user_name} · <span className="ltr">{t.user_phone}</span> · {faDateTime(t.created_at)}</p>
            <div className="max-w-[85%] whitespace-pre-wrap rounded-[20px] rounded-br-md bg-[rgba(118,118,128,.28)] px-4 py-3 text-[15px] leading-7">{t.message}</div>
            {t.reply && <div className="mr-auto max-w-[85%] whitespace-pre-wrap rounded-[20px] rounded-bl-md bg-brand px-4 py-3 text-[15px] leading-7 text-white">{t.reply}</div>}
            <Field label={t.reply ? 'ویرایش پاسخ' : 'پاسخ شما'}><Textarea value={reply} onChange={(e) => setReply(e.target.value)} /></Field>
          </div>
        )}
      </Modal>
    </>
  );
}
