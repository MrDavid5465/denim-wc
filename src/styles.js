// denim-wc's stylesheet, injected once into <head>. The shell fills the page
// itself: browsers give <body> an 8px margin by default, so it resets
// html/body here instead of making every app do it.
import { ensureStyles } from '../../typical-admin-wc/src/ui/styles.js';

export const DENIM_CSS = /* css */ `
html, body { margin: 0; padding: 0; min-height: 100%; }
body { background: var(--wa-color-surface-default); color: var(--wa-color-text-normal); }
denim-shell { display: flex; flex-direction: column; min-height: 100vh; min-height: 100dvh; box-sizing: border-box; }
denim-shell *, denim-shell *::before, denim-shell *::after { box-sizing: border-box; }
.denim-header { position: sticky; top: 0; z-index: 100; display: flex; align-items: center; gap: var(--wa-space-xs); min-height: 3.5rem; padding: 0 var(--wa-space-s); background: var(--wa-color-brand-fill-loud); color: var(--wa-color-brand-on-loud); box-shadow: var(--wa-shadow-s); }
.denim-icon-button { all: unset; box-sizing: border-box; display: inline-grid; place-items: center; width: 2.5rem; height: 2.5rem; flex: none; padding: 0; border: 0; border-radius: var(--wa-border-radius-m); background: transparent; color: inherit; font: inherit; cursor: pointer; }
.denim-icon-button:hover { background: color-mix(in oklab, currentColor 14%, transparent); }
.denim-icon-button:focus-visible, .denim-nav a:focus-visible, .denim-brand:focus-visible, .denim-app-name:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
.denim-brand { display: flex; align-items: center; gap: var(--wa-space-xs); color: inherit; text-decoration: none; font-weight: var(--wa-font-weight-semibold, 600); white-space: nowrap; }
.denim-app-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: inherit; text-decoration: none; font-size: var(--wa-font-size-l); font-weight: var(--wa-font-weight-semibold, 600); }
.denim-nav { display: flex; align-items: center; gap: var(--wa-space-3xs); margin-left: auto; min-width: 0; overflow-x: auto; scrollbar-width: none; }
.denim-nav a { color: inherit; text-decoration: none; padding: var(--wa-space-xs) var(--wa-space-s); border-radius: var(--wa-border-radius-m); white-space: nowrap; }
.denim-nav a:hover { background: color-mix(in oklab, currentColor 14%, transparent); }
.denim-nav a[aria-current='page'] { background: color-mix(in oklab, currentColor 22%, transparent); font-weight: var(--wa-font-weight-semibold, 600); }
.denim-controls { display: flex; align-items: center; gap: var(--wa-space-3xs); margin-left: auto; flex: none; }
.denim-nav + .denim-controls { margin-left: var(--wa-space-xs); }
.denim-menu-button { display: none; }
@media (max-width: 48rem) {
  .denim-header .denim-nav { display: none; }
  .denim-menu-button { display: inline-grid; }
}
.denim-content { flex: 1; min-width: 0; }
.denim-drawer { --size: min(22rem, 88vw); }
.denim-applist { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--wa-space-m); }
.denim-applist a { color: var(--wa-color-text-normal); text-decoration: none; display: block; padding: var(--wa-space-2xs) var(--wa-space-s); border-radius: var(--wa-border-radius-m); }
.denim-applist a:hover { background: var(--wa-color-neutral-fill-quiet); }
.denim-applist a[aria-current='page'] { background: var(--wa-color-brand-fill-quiet); color: var(--wa-color-brand-on-quiet); font-weight: var(--wa-font-weight-semibold, 600); }
.denim-applist .denim-app-title { font-weight: var(--wa-font-weight-semibold, 600); font-size: var(--wa-font-size-l); }
.denim-applist ul { list-style: none; margin: var(--wa-space-2xs) 0 0; padding: 0 0 0 var(--wa-space-s); display: grid; gap: var(--wa-space-3xs); }
.denim-menu-links { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--wa-space-3xs); }
.denim-menu-links a { display: block; padding: var(--wa-space-s); border-radius: var(--wa-border-radius-m); color: var(--wa-color-text-normal); text-decoration: none; }
.denim-menu-links a[aria-current='page'] { background: var(--wa-color-brand-fill-quiet); color: var(--wa-color-brand-on-quiet); font-weight: var(--wa-font-weight-semibold, 600); }
.denim-welcome { max-width: 48rem; margin: 0 auto; padding: var(--wa-space-xl) var(--wa-space-l); }
.denim-welcome h1 { margin-top: 0; }
.denim-tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr)); gap: var(--wa-space-m); padding: 0; list-style: none; }
.denim-tiles a { display: block; padding: var(--wa-space-l); border: var(--wa-border-width-s, 1px) solid var(--wa-color-surface-border); border-radius: var(--wa-border-radius-l); background: var(--wa-color-surface-raised); color: var(--wa-color-text-normal); text-decoration: none; font-weight: var(--wa-font-weight-semibold, 600); font-size: var(--wa-font-size-l); box-shadow: var(--wa-shadow-s); }
.denim-tiles a:hover { border-color: var(--wa-color-brand-border-loud, var(--wa-color-brand-60)); }
denim-splash { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; background: var(--wa-color-surface-default); color: var(--wa-color-text-normal); }
.denim-splash-body { display: grid; justify-items: center; gap: var(--wa-space-m); text-align: center; padding: var(--wa-space-l); }
.denim-splash-logo { color: var(--wa-color-brand-fill-loud); }
.denim-splash-status { color: var(--wa-color-text-quiet); min-height: 1.5em; }
.denim-settings-tabs { margin-top: calc(-1 * var(--wa-space-s)); }
.denim-settings-error { color: var(--wa-color-danger-on-quiet, var(--wa-color-danger-50)); font-size: var(--wa-font-size-s); margin-right: auto; }
denim-photo { display: block; }
.denim-photo { display: grid; gap: var(--wa-space-s); justify-items: start; }
.denim-photo-frame { position: relative; width: var(--denim-photo-size, 12rem); max-width: 100%; aspect-ratio: var(--denim-photo-aspect, 1); border-radius: var(--wa-border-radius-l); overflow: hidden; background: var(--wa-color-surface-lowered); border: var(--wa-border-width-s, 1px) dashed var(--wa-color-surface-border); display: grid; place-items: center; color: var(--wa-color-text-quiet); }
.denim-photo-frame img { width: 100%; height: 100%; object-fit: cover; display: block; }
.denim-photo-frame.denim-drop { border-color: var(--wa-color-brand-fill-loud); background: var(--wa-color-brand-fill-quiet); }
.denim-photo-actions { display: flex; flex-wrap: wrap; gap: var(--wa-space-xs); }
.denim-crop { position: relative; touch-action: none; user-select: none; max-width: 100%; display: inline-block; line-height: 0; }
.denim-crop img { max-width: min(100%, 28rem); max-height: 60vh; display: block; }
.denim-crop-box { position: absolute; border: 2px solid #fff; outline: 1px solid rgba(0,0,0,0.6); box-shadow: 0 0 0 100vmax rgba(0,0,0,0.45); cursor: move; }
.denim-crop-handle { position: absolute; right: -0.6rem; bottom: -0.6rem; width: 1.2rem; height: 1.2rem; border-radius: 50%; background: #fff; border: 2px solid rgba(0,0,0,0.6); cursor: nwse-resize; }
`;

export function ensureDenimStyles() {
  ensureStyles(DENIM_CSS, 'denim-wc-styles');
}
