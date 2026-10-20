// ابزارهای مشترک پنل مدیریت
import React, { useState, useCallback, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { useStore } from '../store.jsx';
import { Link } from '../router.jsx';
import { Modal, Button, Input, Textarea, Field, Badge, Skeleton } from '../ui/kit.jsx';
import { num, toFa, toEn, isoToJalali, jalaliToIso, cls } from '../lib.js';

export const money = (n) => `${num(n)} تومان`;
export const toInt = (v) => { const s = toEn(v).replace(/[^\d]/g, ''); return s === '' ? null : Number(s); };
export const lines = (arr) => (arr || []).join('\n');
export const unlines = (s) => String(s || '').split('\n').map((x) => x.trim()).filter(Boolean);
export const mb = (b) => (b >= 1073741824 ? `${toFa((b / 1073741824).toFixed(2))} گیگ` : `${toFa((b / 1048576).toFixed(b < 10485760 ? 1 : 0))} مگ`);
export function eta(sec) {
  if (sec == null || !Number.isFinite(sec)) return '—';
  sec = Math.ceil(sec);
  if (sec < 60) return `${toFa(sec)} ثانیه`;
  const m = Math.floor(sec / 60); if (m < 60) return `${toFa(m)} دقیقه`;
  return `${toFa(Math.floor(m / 60))} ساعت و ${toFa(m % 60)} دقیقه`;
}

/** اجرای یک عملیات با وضعیت «در حال انجام» و اعلان موفقیت/خطا. در خطا null برمی‌گرداند. */
export function useAction() {
  const { toast } = useStore();
  const [busy, setBusy] = useState(null);
  const run = useCallback(async (key, fn, ok) => {
    setBusy(key);
    try { const r = await fn(); if (ok) toast(typeof ok === 'function' ? ok(r) : ok); return r ?? true; }
    catch (e) { toast(e.message || 'خطا', 'error'); return null; }
    finally { setBusy(null); }
  }, [toast]);
  return [busy, run];
}

/** فرم ساده: state + setter فیلدی */
export function useForm(initial) {
  const [f, setF] = useState(initial); // برای بارگذاری مجدد، کامپوننت را با key جدید بسازید
  const bind = (k) => ({ value: f?.[k] ?? '', onChange: (e) => setF((x) => ({ ...x, [k]: e.target.value })) });
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  return [f, set, bind, setF];
}

/** دکمه بازگشت iOS (فقط موبایل/تبلت یا هر جا که لازم باشد) */
export const BackLink = ({ to = '/admin', label = 'مدیریت', className }) => (
  <Link to={to} className={cls('-mr-1.5 mb-3 inline-flex items-center gap-0.5 text-[17px] font-medium text-[#4DA3FF] hover:opacity-80', className)}>
    <ChevronRight className="h-6 w-6" strokeWidth={2.4} />{label}
  </Link>
);

export function Confirm({ open, onClose, onConfirm, title, children, confirmLabel = 'تأیید', danger, busy }) {
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={<><Button variant="gray" size="sm" onClick={onClose}>انصراف</Button><Button variant={danger ? 'danger' : 'primary'} size="sm" loading={busy} onClick={onConfirm}>{confirmLabel}</Button></>}>
      <div className="text-[15px] leading-7 text-ink-soft">{children}</div>
    </Modal>
  );
}

/** ورودی تاریخ شمسی (۱۴۰۵/۰۸/۳۰) ← ISO */
export function JalaliInput({ value, onChange, placeholder = '۱۴۰۵/۰۸/۳۰' }) {
  const [text, setText] = useState(value ? toFa(isoToJalali(value)) : '');
  useEffect(() => { setText(value ? toFa(isoToJalali(value)) : ''); }, [value]);
  const bad = text && !jalaliToIso(text);
  return (
    <div>
      <Input value={text} placeholder={placeholder} inputMode="numeric" className={cls('ltr text-right', bad && 'border-ios-red/70')}
        onChange={(e) => { setText(e.target.value); const iso = jalaliToIso(e.target.value); if (iso) onChange(iso); else if (!e.target.value.trim()) onChange(null); }} />
      {bad && <span className="mt-1 block px-1 text-xs text-[#FF6961]">قالب تاریخ: سال/ماه/روز</span>}
    </div>
  );
}

export const STATUS = {
  course: { published: ['منتشرشده', 'green'], draft: ['پیش‌نویس', 'gray'], inactive: ['غیرفعال', 'amber'], archived: ['بایگانی', 'red'] },
  order: { paid: ['پرداخت‌شده', 'green'], pending: ['در انتظار', 'amber'], failed: ['ناموفق', 'red'], cancelled: ['لغوشده', 'gray'], refunded: ['بازگشت وجه', 'violet'] },
  video: { ready: ['آماده', 'green'], uploading: ['نیمه‌کاره', 'amber'], failed: ['خطا', 'red'] },
  ticket: { open: ['باز', 'amber'], answered: ['پاسخ داده شد', 'green'], closed: ['بسته', 'gray'] },
  access: { free: ['رایگان', 'green'], preview: ['پیش‌نمایش', 'blue'], paid: ['ویژه خریداران', 'gray'] },
};
export const Pill = ({ kind, value }) => { const [l, t] = STATUS[kind]?.[value] || [value, 'default']; return <Badge tone={t}>{l}</Badge>; };

export const ListSkeleton = ({ rows = 6 }) => (
  <div className="ios-group">{Array.from({ length: rows }, (_, i) => <div key={i} className="ios-row"><Skeleton className="h-[30px] w-[30px] rounded-[8px]" /><div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-2/5" /><Skeleton className="h-3 w-1/4" /></div></div>)}</div>
);

export { Field, Input, Textarea };
