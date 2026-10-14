// denim-wc: the app shell for typiql web-component apps (Lit 3 + Web
// Awesome 3). Importing it defines <denim-shell>, <denim-settings>,
// <denim-splash> and <denim-photo>. It builds on typical-admin-wc, cloned
// side by side (../typical-admin-wc); load Web Awesome's components with
// '../typical-admin-wc/wa.js'.
export { DenimShell } from './src/denim-shell.js';
export { DenimSettings } from './src/denim-settings.js';
export { DenimSplash } from './src/denim-splash.js';
export { DenimPhoto } from './src/denim-photo.js';
export { isLinkActive, linkHref, resolveShellRoute } from './src/nav.js';
export { DEFAULT_SETTINGS, SETTINGS_KEY, readLocalSettings, writeLocalSettings, effectiveSettings, withoutNulls } from './src/settings.js';
export {
  COLOR_KEYS,
  COLOR_LABELS,
  MODE_KEYS,
  MODE_LABELS,
  FONT_SIZES,
  themeKey,
  parseThemeKey,
  themeClasses,
  applyTheme,
  setFaviconColor,
} from './src/themes.js';
export { buildMyQuery, UPDATE_SETTINGS, APPLICATION_FIELDS, DENIM_SETTINGS_FIELDS } from './src/queries.js';
export { DENIM_CSS, ensureDenimStyles } from './src/styles.js';
// The ONE confirm dialog, shared with typical-admin-wc (not a copy).
export { confirmAsync, setConfirmHandler, toast } from '../typical-admin-wc/index.js';
