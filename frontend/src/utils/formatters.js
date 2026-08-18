/**
 * Format cryptocurrency prices to prevent JS floating-point artifacts ($0.0006168689999999999)
 */
export function formatPrice(price) {
  if (price === undefined || price === null || isNaN(price)) return '0.00';
  const num = Number(price);
  if (num === 0) return '0.00';
  if (num < 0.00001) return num.toFixed(8);
  if (num < 0.01) return num.toFixed(6);
  if (num < 1) return num.toFixed(4);
  if (num < 1000) return num.toFixed(2);
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatSOL(sol, digits = 3) {
  if (sol === undefined || sol === null || isNaN(sol)) return '0.000';
  const num = Number(sol);
  return num.toFixed(digits);
}

export function formatPct(pct, digits = 1) {
  if (pct === undefined || pct === null || isNaN(pct)) return '0.0%';
  const num = Number(pct);
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(digits)}%`;
}
