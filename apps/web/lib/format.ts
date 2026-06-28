export function compactNumber(value: number): string {
  return new Intl.NumberFormat('tr', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function relativeTime(value: string | null): string {
  if (!value) return 'taslak';
  const date = new Date(value);
  const diff = Math.round((date.getTime() - Date.now()) / 1000);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  const formatter = new Intl.RelativeTimeFormat('tr', { numeric: 'auto' });
  for (const [unit, seconds] of units) {
    if (Math.abs(diff) >= seconds) return formatter.format(Math.round(diff / seconds), unit);
  }
  return 'az önce';
}

export function duration(seconds?: number | null): string {
  if (!seconds) return '0:00';
  const rounded = Math.round(seconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const secs = rounded % 60;
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}` : `${minutes}:${String(secs).padStart(2, '0')}`;
}
