// توکن‌های طراحی: پالت سیستمی iOS (حالت تیره) + متریال شیشه‌ای
module.exports = {
  content: ['./web/src/**/*.{js,jsx}', './web/index.html'],
  theme: {
    extend: {
      colors: {
        night: { 950: '#020309', 900: '#05060E', 800: '#0D0F1C', 700: '#1A1C2E' },
        brand: { DEFAULT: '#0A84FF', hover: '#409CFF' },
        accent: '#64D2FF', violet: '#BF5AF2',
        ink: { DEFAULT: '#F5F5F7', soft: '#D1D1D8', mute: '#9A9AA3' },
        ios: { blue: '#0A84FF', green: '#30D158', red: '#FF453A', orange: '#FF9F0A', yellow: '#FFD60A', indigo: '#5E5CE6', purple: '#BF5AF2', pink: '#FF375F', teal: '#40C8E0', gray: '#8E8E93' },
      },
      fontFamily: {
        // روی آیفون/مک فونت سیستمی اپل (SF Arabic) و در بقیه دستگاه‌ها وزیرمتن
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'Vazirmatn', 'Tahoma', 'system-ui', 'sans-serif'],
        math: ['"STIX Two Text"', 'Georgia', 'serif'],
      },
      spacing: { 13: '3.25rem' },
      borderRadius: { ios: '22px', sheet: '28px' },
      boxShadow: { glow: '0 8px 24px -10px rgba(10,132,255,.9), inset 0 1px 0 rgba(255,255,255,.3)' },
    },
  },
  plugins: [],
};
