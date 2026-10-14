// Themes are Web Awesome's own: a light/dark scheme class (wa-light /
// wa-dark) and a brand hue class (wa-brand-<color>) on <html>, so every
// Web Awesome component and every --wa-* token follows. A theme key is
// '<mode>-<color>', e.g. 'dark-purple'; unknown parts fall back to light / blue.

/** Web Awesome's brand hues (free palette). */
export const COLOR_KEYS = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'indigo', 'purple', 'pink', 'gray'];
export const COLOR_LABELS = {
  red: 'Red', orange: 'Orange', yellow: 'Yellow', green: 'Green', cyan: 'Cyan',
  blue: 'Blue', indigo: 'Indigo', purple: 'Purple', pink: 'Pink', gray: 'Gray',
};
/** 'auto' follows the device's light/dark preference. */
export const MODE_KEYS = ['light', 'dark', 'auto'];
export const MODE_LABELS = { light: 'Light', dark: 'Dark', auto: 'Match device' };
export const FONT_SIZES = [
  { value: 1, label: 'Normal' },
  { value: 1.125, label: 'Large' },
  { value: 1.25, label: 'Larger' },
];

export const themeKey = (mode, color) => `${mode}-${color}`;

/** 'dark-purple' -> { mode: 'dark', color: 'purple' }; unknown parts fall back to light / blue. */
export function parseThemeKey(key) {
  const s = String(key ?? '');
  const dash = s.indexOf('-');
  const mode = dash > 0 ? s.slice(0, dash) : '';
  const color = dash > 0 ? s.slice(dash + 1) : '';
  return {
    mode: MODE_KEYS.includes(mode) ? mode : 'light',
    color: COLOR_KEYS.includes(color) ? color : 'blue',
  };
}

/** The <html> classes for a theme: { add: [...], remove: [...] }. */
export function themeClasses(key, prefersDark = false) {
  const { mode, color } = parseThemeKey(key);
  const dark = mode === 'dark' || (mode === 'auto' && prefersDark);
  const remove = ['wa-light', 'wa-dark', ...COLOR_KEYS.map((c) => `wa-brand-${c}`)];
  return { add: [dark ? 'wa-dark' : 'wa-light', `wa-brand-${color}`], remove, dark };
}

let mediaListener = null;

/**
 * Applies a theme and font size to the document: Web Awesome classes on
 * <html>, the root font size (rem-based sizes and spacing scale with it),
 * and optionally a favicon in the brand color.
 */
export function applyTheme({ theme, fontSize = 1 } = {}, { favicon = true, root = document.documentElement } = {}) {
  const media = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;
  const { add, remove } = themeClasses(theme, !!media?.matches);
  root.classList.remove(...remove);
  root.classList.add(...add);
  root.style.fontSize = Number(fontSize) && Number(fontSize) !== 1 ? `${Number(fontSize) * 100}%` : '';
  // Follow the device when the mode is 'auto'.
  if (media) {
    if (mediaListener) media.removeEventListener('change', mediaListener);
    mediaListener = parseThemeKey(theme).mode === 'auto' ? () => applyTheme({ theme, fontSize }, { favicon, root }) : null;
    if (mediaListener) media.addEventListener('change', mediaListener);
  }
  if (favicon) setFaviconColor(getComputedStyle(root).getPropertyValue('--wa-color-brand-fill-loud').trim() || '#2563eb');
}

const FAVICON_SVG = (color) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">` +
  `<path d="M 24 73 A 32 32 0 1 1 56 73 L 50 62 A 20 20 0 1 0 30 62 Z" fill="${color}"/>` +
  `<path d="M 42 44 L 41 48 L 38 46 L 32 22 Z" fill="${color}"/>` +
  `<circle cx="40" cy="45" r="3" fill="${color}"/></svg>`;

/** Points the page's favicon at a small SVG in `color`. */
export function setFaviconColor(color) {
  let link = document.querySelector('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.type = 'image/svg+xml';
  link.href = `data:image/svg+xml,${encodeURIComponent(FAVICON_SVG(color))}`;
}
