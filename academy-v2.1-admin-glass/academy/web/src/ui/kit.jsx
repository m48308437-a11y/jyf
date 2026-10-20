import React, { useEffect, useRef } from 'react';
import { Loader2, X, AlertCircle, CheckCircle2, Info, TriangleAlert, ChevronLeft, Search } from 'lucide-react';
import { cls, toman } from '../lib.js';
import { Link } from '../router.jsx';

const VARIANTS = {
  primary: 'bg-brand text-white hover:bg-brand-hover shadow-glow',
  secondary: 'liquid text-ink hover:bg-white/[0.08]',
  tinted: 'bg-brand/20 text-[#4DA3FF] hover:bg-brand/30',
  gray: 'bg-[rgba(118,118,128,.24)] text-ink hover:bg-[rgba(118,118,128,.34)]',
  ghost: 'text-ink-soft hover:bg-white/[0.07] hover:text-ink',
  danger: 'bg-ios-red/90 text-white hover:bg-ios-red',
  'danger-tinted': 'bg-ios-red/15 text-[#FF6961] hover:bg-ios-red/25',
  success: 'bg-ios-green/90 text-white hover:bg-ios-green',
};
const SIZES = { xs: 'h-8 px-3 text-[13px]', sm: 'h-9 px-3.5 text-sm', md: 'h-11 px-5 text-[15px]', lg: 'h-13 px-7 text-base' };

export function Button({ variant = 'primary', size = 'md', loading, className, children, to, ...rest }) {
  const c = cls('inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold transition duration-200 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent', VARIANTS[variant], SIZES[size], className);
  if (to) return <Link to={to} className={c} {...rest}>{children}</Link>;
  return <button type="button" className={c} disabled={loading || rest.disabled} {...rest}>{loading && <Loader2 className="h-4 w-4 animate-spin" />}{children}</button>;
}

export const Card = ({ className, children, as: As = 'div', ...rest }) => <As className={cls('glass rounded-3xl', className)} {...rest}>{children}</As>;

export function Field({ label, hint, error, children, className, as }) {
  const Tag = as || 'label';
  return (
    <Tag className={cls('block', className)}>
      {label && <span className="mb-1.5 block px-1 text-[13px] font-semibold text-ink-mute">{label}</span>}
      {children}
      {error ? <span className="mt-1 block px-1 text-xs text-[#FF6961]">{error}</span> : hint ? <span className="mt-1 block px-1 text-xs text-ink-mute">{hint}</span> : null}
    </Tag>
  );
}
const inputCls = 'w-full rounded-[14px] border border-transparent bg-[rgba(118,118,128,.2)] px-4 py-3 text-[15px] text-ink placeholder:text-ink-mute/80 outline-none transition focus:border-brand/60 focus:bg-[rgba(118,118,128,.26)] focus:ring-4 focus:ring-brand/20 disabled:opacity-60';
export const Input = React.forwardRef(({ className, ...p }, ref) => <input ref={ref} className={cls(inputCls, className)} {...p} />);
export const Textarea = ({ className, ...p }) => <textarea className={cls(inputCls, 'min-h-[110px] leading-7', className)} {...p} />;
export const Select = ({ className, children, ...p }) => <select className={cls(inputCls, 'appearance-none bg-[length:0]', className)} {...p}>{children}</select>;
export const Toggle = ({ checked, onChange, label, disabled }) => (
  <label className={cls('inline-flex cursor-pointer items-center gap-3 text-[15px] text-ink', disabled && 'pointer-events-none opacity-50')}>
    <button type="button" role="switch" aria-checked={!!checked} aria-label={typeof label === 'string' ? label : undefined} onClick={() => onChange(!checked)}
      className={cls('relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-300', checked ? 'bg-ios-green' : 'bg-[rgba(120,120,128,.36)]')}>
      <span className={cls('absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,.25),0_1px_1px_rgba(0,0,0,.16)] transition-all duration-300 ease-[cubic-bezier(.3,1.3,.5,1)]', checked ? 'left-[2px]' : 'left-[22px]')} />
    </button>{label}
  </label>
);

export const Badge = ({ tone = 'default', children, className }) => {
  const t = { default: 'bg-white/10 text-ink-soft', blue: 'bg-ios-blue/20 text-[#5AB0FF]', green: 'bg-ios-green/15 text-[#4FE07B]', amber: 'bg-ios-orange/15 text-[#FFB547]', red: 'bg-ios-red/15 text-[#FF6E66]', violet: 'bg-ios-purple/15 text-[#D58CFF]', gray: 'bg-white/[0.08] text-ink-mute', teal: 'bg-ios-teal/15 text-ios-teal' }[tone] || 'bg-white/10 text-ink-soft';
  return <span className={cls('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', t, className)}>{children}</span>;
};

export const Spinner = ({ label = 'در حال بارگذاری…', className }) => (
  <div className={cls('flex items-center justify-center gap-3 py-16 text-ink-mute', className)} role="status"><Loader2 className="h-5 w-5 animate-spin text-accent" />{label}</div>
);
export const Skeleton = ({ className }) => <div className={cls('animate-pulse rounded-2xl bg-white/[0.06]', className)} />;

export function ErrorBox({ error, onRetry }) {
  return (
    <div className="mx-auto my-10 max-w-md rounded-3xl border border-rose-400/25 bg-rose-500/10 p-6 text-center">
      <AlertCircle className="mx-auto mb-3 h-8 w-8 text-rose-300" />
      <p className="text-rose-100">{error?.message || String(error)}</p>
      {onRetry && <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>تلاش دوباره</Button>}
    </div>
  );
}
export const Empty = ({ icon: Icon = Info, title, children, action }) => (
  <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/12 px-6 py-14 text-center">
    <Icon className="mb-4 h-10 w-10 text-accent/70" />
    <h3 className="text-lg font-bold">{title}</h3>
    {children && <p className="mt-2 max-w-md text-sm leading-7 text-ink-mute">{children}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
export const Alert = ({ tone = 'info', children, className }) => {
  const m = { info: ['border-accent/25 bg-accent/10 text-sky-100', Info], warning: ['border-amber-300/25 bg-amber-400/10 text-amber-100', TriangleAlert], error: ['border-rose-400/25 bg-rose-500/10 text-rose-100', AlertCircle], success: ['border-emerald-400/25 bg-emerald-500/10 text-emerald-100', CheckCircle2] }[tone];
  const Icon = m[1];
  return <div className={cls('flex gap-3 rounded-2xl border p-4 text-sm leading-7', m[0], className)} role={tone === 'error' ? 'alert' : undefined}><Icon className="mt-1 h-4 w-4 shrink-0" /><div>{children}</div></div>;
};

export function Modal({ open, onClose, title, children, wide, footer }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === 'Escape' && onClose();
    addEventListener('keydown', k); document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => { removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 backdrop-blur-[3px] sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={cls('glass-strong sheet-in flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-sheet outline-none sm:rounded-sheet', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}>
        <div className="mx-auto mt-2 h-[5px] w-9 shrink-0 rounded-full bg-white/25 sm:hidden" aria-hidden="true" />
        <div className="flex shrink-0 items-center justify-between gap-4 px-5 pb-3 pt-3 sm:px-6 sm:pt-5">
          <h2 className="text-[17px] font-bold">{title}</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-ink-soft transition hover:bg-white/15 hover:text-ink" aria-label="بستن"><X className="h-4 w-4" strokeWidth={2.6} /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 sm:px-6">{children}</div>
        {footer && <div className="safe-bottom flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-white/10 bg-black/10 px-5 pt-3 sm:px-6 sm:pb-4">{footer}</div>}
      </div>
    </div>
  );
}

export function Price({ course, size = 'md' }) {
  const lg = size === 'lg';
  if (!course.finalPrice) return <span className={cls('font-black text-emerald-300', lg ? 'text-2xl' : 'text-lg')}>رایگان</span>;
  const off = course.discountActive ? Math.round(((course.price - course.finalPrice) / course.price) * 100) : 0;
  return (
    <div className="flex flex-col items-start">
      {off > 0 && <div className="flex items-center gap-2 text-sm"><span className="text-ink-mute line-through decoration-ink-mute/60">{toman(course.price)}</span><Badge tone="red">٪{String(off).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d])} تخفیف</Badge></div>}
      <span className={cls('font-black text-ink', lg ? 'text-2xl sm:text-3xl' : 'text-lg')}>{toman(course.finalPrice)}</span>
    </div>
  );
}

// اعلان‌ها به شکل Dynamic Island از بالای صفحه باز می‌شوند
export function Toasts({ toasts }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-2.5 z-[90] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {toasts.map((t) => {
        const tone = t.type === 'error' ? 'bg-ios-red' : t.type === 'warning' ? 'bg-ios-orange' : 'bg-ios-green';
        const Icon = t.type === 'error' ? AlertCircle : t.type === 'warning' ? TriangleAlert : CheckCircle2;
        return (
          <div key={t.id} className="island-in pointer-events-auto flex min-h-[44px] max-w-md items-center gap-3 rounded-full bg-black py-2 pl-5 pr-2 text-sm font-semibold text-white shadow-[0_18px_40px_-12px_rgba(0,0,0,.9)] ring-1 ring-white/10">
            <span className={cls('grid h-7 w-7 shrink-0 place-items-center rounded-full text-white', tone)}><Icon className="h-4 w-4" strokeWidth={2.6} /></span>
            <span className="leading-6">{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}

export function Monogram({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs><radialGradient id="mg" cx="50%" cy="45%" r="60%"><stop offset="0" stopColor="#1B3A8A" /><stop offset="1" stopColor="#0A1638" /></radialGradient></defs>
      <circle cx="24" cy="24" r="23" fill="url(#mg)" stroke="#8FD0FF" strokeOpacity=".35" />
      {Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * Math.PI * 2, r = i % 6 === 0 ? 17.5 : 19.5; return <line key={i} x1={24 + Math.cos(a) * r} y1={24 + Math.sin(a) * r} x2={24 + Math.cos(a) * 21.5} y2={24 + Math.sin(a) * 21.5} stroke={i % 6 === 0 ? '#DCE6FF' : '#8FD0FF'} strokeOpacity={i % 6 === 0 ? 0.95 : 0.45} strokeWidth=".9" />; })}
      <polygon points="24,10.5 35.7,30.75 12.3,30.75" fill="none" stroke="#C4E6FF" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="24" cy="24" r="6.2" fill="none" stroke="#A99BFF" />
      <circle cx="24" cy="24" r="1.6" fill="#FFFFFF" />
    </svg>
  );
}

export const PageShell = ({ children, className }) => <main className={cls('relative mx-auto w-full max-w-7xl px-4 pb-32 pt-24 sm:px-6 lg:px-8 lg:pb-20 lg:pt-28', className)}>{children}</main>;
// عنوان بزرگ به سبک iOS (Large Title)
export const PageTitle = ({ eyebrow, title, children, actions }) => (
  <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
    <div className="min-w-0">
      {eyebrow && <div className="mb-1.5 text-[13px] font-semibold text-ink-mute">{eyebrow}</div>}
      <h1 className="text-[2.125rem] font-extrabold leading-[1.15] tracking-tight sm:text-[2.6rem]">{title}</h1>
      {children && <p className="mt-3 max-w-2xl leading-8 text-ink-soft">{children}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </header>
);

// ───── اجزای بومی iOS ─────
export const IconTile = ({ icon: Icon, tone = 'blue', className }) => <span className={cls('ios-tile', `tile-${tone}`, className)}><Icon className="h-[18px] w-[18px]" strokeWidth={2.2} /></span>;

/** گروه فهرست به سبک اپ «تنظیمات» */
export const Group = ({ title, footer, children, className, action }) => (
  <section className={cls('mb-6', className)}>
    {(title || action) && <div className="mb-2 flex items-end justify-between gap-3 px-4"><h3 className="text-[13px] font-semibold text-ink-mute">{title}</h3>{action}</div>}
    <div className="ios-group">{children}</div>
    {footer && <p className="mt-2 px-4 text-[13px] leading-6 text-ink-mute">{footer}</p>}
  </section>
);

export function Row({ icon, tone, title, subtitle, detail, chevron, onClick, to, children, className, danger, lead }) {
  const body = (<>
    {icon && <IconTile icon={icon} tone={tone} />}
    {lead}
    <span className="min-w-0 flex-1">
      <span className={cls('block truncate text-[15px] font-medium', danger && 'text-[#FF6961]')}>{title}</span>
      {subtitle && <span className="mt-0.5 block truncate text-[13px] text-ink-mute">{subtitle}</span>}
    </span>
    {children}
    {detail != null && <span className="shrink-0 text-[15px] text-ink-mute">{detail}</span>}
    {chevron && <ChevronLeft className="h-[18px] w-[18px] shrink-0 text-ink-mute/60" strokeWidth={2.4} />}
  </>);
  const c = cls('ios-row', (onClick || to) && 'ios-row-tap', icon && 'ios-row-icon', className);
  if (to) return <Link to={to} className={c}>{body}</Link>;
  if (onClick) return <div role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); onClick(e); } }} className={cls(c, 'w-full text-right outline-none focus-visible:bg-white/[0.08]')}>{body}</div>;
  return <div className={c}>{body}</div>;
}

export function Segmented({ value, onChange, options, className, label }) {
  return (
    <div role="tablist" aria-label={label} className={cls('segmented', className)}>
      {options.map(([v, l]) => <button key={v} type="button" role="tab" aria-selected={value === v} onClick={() => onChange(v)} className={cls('segmented-item', value === v && 'segmented-on')}>{l}</button>)}
    </div>
  );
}

export function SearchField({ value, onChange, placeholder = 'جست‌وجو', className }) {
  return (
    <label className={cls('relative flex h-10 items-center rounded-[12px] bg-[rgba(118,118,128,.24)] px-3 text-ink-mute focus-within:ring-2 focus-within:ring-brand/40', className)}>
      <Search className="h-4 w-4 shrink-0" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-full min-w-0 flex-1 bg-transparent px-2 text-[15px] text-ink outline-none placeholder:text-ink-mute" type="search" />
      {value && <button type="button" onClick={() => onChange('')} className="grid h-5 w-5 place-items-center rounded-full bg-ink-mute/60 text-night-900" aria-label="پاک کردن"><X className="h-3 w-3" strokeWidth={3} /></button>}
    </label>
  );
}

/** نوار پیشرفت کپسولی */
export const ProgressBar = ({ value, tone = 'bg-brand', active, className }) => (
  <div className={cls('h-1.5 w-full overflow-hidden rounded-full bg-white/10', className)} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
    <div className={cls('relative h-full overflow-hidden rounded-full transition-[width] duration-300 ease-out', tone, active && 'bar-shimmer')} style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
  </div>
);
