// پنل مدیریت: ساختار اپ «تنظیمات» آیفون/آیپد
//  دسکتاپ: نوار کناری شیشه‌ای + محتوا (Split View) — موبایل: فهرست بخش‌ها ← صفحه بخش با دکمه بازگشت
import React, { Suspense, lazy } from 'react';
import { LayoutDashboard, BookOpen, Clapperboard, Receipt, Users, TicketPercent, Newspaper, MessagesSquare, Activity, UploadCloud } from 'lucide-react';
import { useStore } from '../store.jsx';
import { useRouter } from '../router.jsx';
import { Group, Row, Spinner, IconTile, ProgressBar } from '../ui/kit.jsx';
import { useUploads } from './uploader.js';
import { cls, toFa } from '../lib.js';
import { BackLink } from './ui.jsx';
import Dashboard from './Dashboard.jsx';

const Courses = lazy(() => import('./Courses.jsx'));
const Videos = lazy(() => import('./Videos.jsx'));
const Orders = lazy(() => import('./Orders.jsx'));
const UsersPage = lazy(() => import('./Users.jsx'));
const Coupons = lazy(() => import('./Coupons.jsx'));
const Content = lazy(() => import('./Content.jsx'));
const Tickets = lazy(() => import('./Tickets.jsx'));
const Logs = lazy(() => import('./Logs.jsx'));

export const SECTIONS = [
  { group: 'نمای کلی', items: [['dashboard', 'داشبورد', LayoutDashboard, 'blue', Dashboard]] },
  { group: 'آموزش', items: [['courses', 'دوره‌ها، فصل‌ها و جلسات', BookOpen, 'orange', Courses], ['videos', 'کتابخانه ویدیو', Clapperboard, 'pink', Videos]] },
  { group: 'فروش', items: [['orders', 'سفارش‌ها و پرداخت‌ها', Receipt, 'green', Orders], ['coupons', 'کدهای تخفیف', TicketPercent, 'yellow', Coupons], ['users', 'کاربران و دسترسی‌ها', Users, 'indigo', UsersPage]] },
  { group: 'سایت', items: [['content', 'محتوای سایت', Newspaper, 'teal', Content], ['tickets', 'تیکت‌های پشتیبانی', MessagesSquare, 'purple', Tickets], ['logs', 'رخدادها و وضعیت سیستم', Activity, 'gray', Logs]] },
];
const ALL = SECTIONS.flatMap((g) => g.items);

function UploadBadge() {
  const ups = useUploads().filter((u) => ['preparing', 'uploading', 'finishing'].includes(u.state));
  if (!ups.length) return null;
  const total = ups.reduce((s, u) => s + u.total, 0), loaded = ups.reduce((s, u) => s + u.loaded, 0);
  return (
    <Group>
      <Row icon={UploadCloud} tone="blue" to="/admin/videos" title={`در حال آپلود ${toFa(ups.length)} ویدیو`} subtitle={<ProgressBar value={total ? loaded / total : 0} active className="mt-1.5" />} detail={`٪${toFa(Math.floor((loaded / (total || 1)) * 100))}`} />
    </Group>
  );
}

function Menu({ current }) {
  const { user } = useStore();
  return (
    <nav aria-label="بخش‌های مدیریت">
      <Group>
        <Row lead={<span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-b from-[#7D7BFF] to-[#4B48DB] text-xl font-bold">{user?.name?.slice(0, 1)}</span>}
          title={<span className="text-[17px] font-semibold">{user?.name}</span>} subtitle="مدیر سیستم · پنل مدیریت آکادمی" className="py-3" />
      </Group>
      <UploadBadge />
      {SECTIONS.map((g) => (
        <Group key={g.group} title={g.group}>
          {g.items.map(([key, label, Icon, tone]) => (
            <Row key={key} icon={Icon} tone={tone} title={label} to={`/admin/${key}`} chevron className={cls(current === key && 'lg:bg-brand/25')} aria-current={current === key ? 'page' : undefined} />
          ))}
        </Group>
      ))}
    </nav>
  );
}

export default function Admin({ section, id }) {
  const { navigate } = useRouter();
  const found = ALL.find((x) => x[0] === section);
  const key = found ? section : null; // null = ریشه‌ی /admin
  const Page = (found || ALL[0])[4];
  return (
    <main className="relative mx-auto w-full max-w-[1400px] px-4 pb-32 pt-[88px] sm:px-6 lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-8 lg:px-8 lg:pb-16 lg:pt-24">
      <aside className={cls('lg:sticky lg:top-24 lg:block lg:max-h-[calc(100dvh-112px)] lg:overflow-y-auto lg:pb-6 no-scrollbar', key && 'hidden')}>
        <h1 className="mb-5 px-1 text-[2.125rem] font-extrabold tracking-tight lg:hidden">مدیریت</h1>
        <Menu current={key || 'dashboard'} />
      </aside>
      <section className={cls('min-w-0', !key && 'hidden lg:block')}>
        {key && <BackLink className="lg:hidden" />}
        <Suspense fallback={<Spinner />}>
          <Page id={id} navigate={navigate} />
        </Suspense>
      </section>
    </main>
  );
}
