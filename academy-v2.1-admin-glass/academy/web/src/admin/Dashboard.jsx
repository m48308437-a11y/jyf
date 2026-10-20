import React, { useMemo, useState } from 'react';
import { TrendingUp, Users, BookOpen, MessagesSquare, Receipt, Percent } from 'lucide-react';
import { useFetch } from '../store.jsx';
import { Link } from '../router.jsx';
import { PageTitle, Group, Row, ErrorBox, Skeleton, IconTile, Segmented } from '../ui/kit.jsx';
import { num, toFa, faDate, cls } from '../lib.js';
import { money, Pill } from './ui.jsx';

function Chart({ daily, metric }) {
  const vals = daily.map((d) => d[metric]);
  const max = Math.max(1, ...vals);
  const [hover, setHover] = useState(null);
  const h = hover ?? daily.length - 1;
  const fmt = (v) => (metric === 'revenue' ? money(v) : num(v));
  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <span className="text-[13px] text-ink-mute">{faDate(daily[h].date)}</span>
        <span className="text-[15px] font-bold">{fmt(vals[h])}</span>
      </div>
      <div className="flex h-36 items-end gap-[3px] sm:gap-1" onMouseLeave={() => setHover(null)}>
        {vals.map((v, i) => (
          <button key={i} type="button" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} aria-label={`${faDate(daily[i].date)}: ${fmt(v)}`}
            className="group relative flex h-full flex-1 items-end">
            <span className={cls('w-full rounded-t-[4px] rounded-b-[2px] transition-all duration-300', i === h ? 'bg-gradient-to-t from-[#0A6CFF] to-[#64D2FF]' : 'bg-white/[0.16] group-hover:bg-white/30')} style={{ height: `${Math.max(3, (v / max) * 100)}%` }} />
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-ink-mute"><span>۳۰ روز پیش</span><span>امروز</span></div>
    </div>
  );
}

export default function Dashboard() {
  const { data: s, error, reload, loading } = useFetch('/api/admin/stats');
  const [metric, setMetric] = useState('revenue');
  const sum30 = useMemo(() => s ? s.daily.reduce((a, d) => a + d.revenue, 0) : 0, [s]);
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  return (
    <>
      <PageTitle eyebrow="پنل مدیریت" title="داشبورد" />
      {loading || !s ? <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-72 md:col-span-2" /><Skeleton className="h-40" /><Skeleton className="h-40" /></div> : (
        <>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <section className="ios-group p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[13px] font-semibold text-ink-mute">فروش خالص تأییدشده (کل)</p>
                  <p className="mt-1 text-[2rem] font-extrabold tracking-tight sm:text-[2.4rem]">{money(s.revenue.net)}</p>
                  <p className="mt-1 text-[13px] text-[#4FE07B]">{money(sum30)} در ۳۰ روز اخیر</p>
                </div>
                <Segmented value={metric} onChange={setMetric} options={[['revenue', 'فروش'], ['orders', 'سفارش'], ['signups', 'ثبت‌نام']]} label="شاخص نمودار" />
              </div>
              <Chart daily={s.daily} metric={metric} />
            </section>
            <div className="grid grid-cols-2 gap-4">
              {[
                [Receipt, 'green', 'سفارش موفق', num(s.orders.paid), `${num(s.orders.pending)} در انتظار`],
                [Users, 'indigo', 'دانش‌آموز', num(s.students), `${num(s.newUsers30)} جدید در ۳۰ روز`],
                [BookOpen, 'orange', 'دوره منتشرشده', num(s.courses.published), `از ${num(s.courses.total)} دوره`],
                [MessagesSquare, 'purple', 'تیکت باز', num(s.openTickets), 'منتظر پاسخ'],
              ].map(([Icon, tone, label, v, sub]) => (
                <div key={label} className="ios-group flex flex-col justify-between gap-4 p-4">
                  <div className="flex items-center gap-2"><IconTile icon={Icon} tone={tone} /><span className="text-[13px] font-semibold text-ink-mute">{label}</span></div>
                  <div><p className="text-[1.75rem] font-extrabold leading-none tracking-tight">{v}</p><p className="mt-1.5 text-xs text-ink-mute">{sub}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 grid gap-x-6 lg:grid-cols-2">
            <Group title="پرفروش‌ترین دوره‌ها" footer={`مجموع تخفیف‌های اعمال‌شده: ${money(s.revenue.discounts)}`}>
              {s.topCourses.length ? s.topCourses.map((c, i) => <Row key={c.course_id} lead={<span className="w-6 text-center text-[15px] font-bold text-ink-mute">{toFa(i + 1)}</span>} title={c.title} subtitle={money(c.revenue)} detail={`${num(c.sales)} فروش`} />)
                : <Row icon={TrendingUp} tone="gray" title="هنوز فروشی ثبت نشده" />}
            </Group>
            <Group title="آخرین سفارش‌ها" action={<Link to="/admin/orders" className="text-[13px] font-semibold text-[#4DA3FF]">همه</Link>}>
              {s.recentOrders.length ? s.recentOrders.map((o) => <Row key={o.number} title={o.userName} subtitle={<span className="ltr">#{o.number}</span>} detail={money(o.finalAmount)}><Pill kind="order" value={o.status} /></Row>)
                : <Row icon={Percent} tone="gray" title="سفارشی ثبت نشده" />}
            </Group>
          </div>
        </>
      )}
    </>
  );
}
