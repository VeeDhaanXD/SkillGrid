export const feedTone = (tone) =>
  (
    {
      emerald: 'text-emerald-400',
      sky: 'text-sky-400',
      rose: 'text-rose-400',
      amber: 'text-amber-400',
      violet: 'text-violet-400',
      neutral: 'text-neutral-500',
    }[tone] || 'text-neutral-500'
  );

export const money = (n) => `$${Number(n || 0).toLocaleString('en-US')}`;

export const fmtDateLite = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';


export const monthLabels = (n = 12) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (n - 1 - i));
    return d.toLocaleDateString('en-US', { month: 'short' });
  });

export const pctChange = (series) => {
  if (!Array.isArray(series) || series.length < 2) return null;
  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  if (!prev) return null;
  const pct = Math.round(((last - prev) / prev) * 100);
  return Number.isFinite(pct) ? pct : null;
};

export const parseHours = (v) => {
  const n = parseFloat(String(v ?? '0').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};
