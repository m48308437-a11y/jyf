// رخدادهای مدیریتی، خطاها و وضعیت سرویس‌ها
import React, { useState } from 'react';
import { Database, HardDrive, MessageSquare, CreditCard, Sparkles, Server } from 'lucide-react';
import { useFetch } from '../store.jsx';
import { PageTitle, Group, Row, ErrorBox, Segmented } from '../ui/kit.jsx';
import { faDateTime } from '../lib.js';
import { ListSkeleton } from './ui.jsx';

const ACTIONS = { 'course.create': 'ساخت دوره', 'course.update': 'ویرایش دوره', 'course.archive': 'بایگانی دوره', 'course.delete': 'حذف دوره', 'chapter.delete': 'حذف فصل', 'lesson.create': 'ساخت جلسه', 'lesson.delete': 'حذف جلسه', 'video.upload_start': 'شروع آپلود ویدیو', 'video.upload_complete': 'پایان آپلود ویدیو', 'video.delete': 'حذف ویدیو', 'coupon.create': 'ساخت کد تخفیف', 'coupon.update': 'ویرایش کد تخفیف', 'order.reconcile': 'بررسی مجدد سفارش', 'order.refund': 'بازگشت وجه', 'user.update': 'تغییر کاربر', 'enrollment.grant_manual': 'دسترسی دستی', 'enrollment.revoke': 'لغو دسترسی', 'settings.update': 'تغییر تنظیمات' };

export default function Logs() {
  const { data, loading, error, reload } = useFetch('/api/admin/logs');
  const [tab, setTab] = useState('audit');
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const s = data?.system;
  return (
    <>
      <PageTitle eyebrow="سایت" title="وضعیت سیستم" />
      {loading || !data ? <ListSkeleton /> : (
        <>
          <Group title="سرویس‌ها">
            <Row icon={Database} tone="blue" title="پایگاه داده" detail={s.database} />
            <Row icon={HardDrive} tone="orange" title="ذخیره‌سازی ویدیو" detail={s.storage === 's3' ? 'فضای ابری S3' : 'سرور محلی'} />
            <Row icon={MessageSquare} tone="green" title="پیامک" detail={s.sms} />
            <Row icon={CreditCard} tone="indigo" title="درگاه پرداخت" detail={s.payment} />
            <Row icon={Sparkles} tone="purple" title="دستیار هوش مصنوعی" detail={s.ai} />
            <Row icon={Server} tone="gray" title="محیط اجرا" detail={s.env} />
          </Group>
          <Segmented value={tab} onChange={setTab} className="mb-4 sm:w-fit" options={[['audit', `رخدادها`], ['errors', `خطاها`]]} />
          <Group>
            {tab === 'audit' ? (data.audit.length ? data.audit.map((a) => <Row key={a.id} title={ACTIONS[a.action] || a.action} subtitle={`${a.actor_name || 'سیستم'} · ${faDateTime(a.created_at)}`} detail={a.entity_id ? <span className="ltr text-[12px]">{String(a.entity_id).slice(0, 12)}</span> : null} />) : <Row title="رخدادی ثبت نشده" />)
              : (data.errors.length ? data.errors.map((e) => <Row key={e.id} title={<span className="ltr">{e.source || e.kind || 'error'}</span>} subtitle={`${e.message} · ${faDateTime(e.created_at)}`} />) : <Row title="خطایی ثبت نشده 🎉" />)}
          </Group>
        </>
      )}
    </>
  );
}
