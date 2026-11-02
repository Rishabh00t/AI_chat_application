/** Server timestamps are UTC "YYYY-MM-DD HH:MM:SS". */
export function parseServerDate(value) {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  return new Date(value.includes('T') ? value : value.replace(' ', 'T') + 'Z');
}

export function formatTime(value) {
  return parseServerDate(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** "Just now", "5m ago", "Yesterday", "Mon", "12 Oct" */
export function formatRelative(value) {
  const date = parseServerDate(value);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return formatTime(date);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  if (diff < 6 * 86400) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

/** Local calendar date as YYYY-MM-DD. */
export function localDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse YYYY-MM-DD as a local date (not UTC). */
export function parseLocalDate(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function timeOfDayGreeting(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return 'Hello, night owl';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}
