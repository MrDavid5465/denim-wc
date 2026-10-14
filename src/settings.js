// The shell's settings: theme ('<mode>-<color>'), fontSize and launchPage,
// plus any keys an app's settings tabs/fields add.
//
// settingsSource "local" (default): this browser's localStorage. "server":
// my.settings / updateSettings (see the README's server contract);
// localStorage then only caches the last-seen theme for a themed first paint.
import { readJSON, writeJSON } from '../../typical-admin-wc/src/util/storage.js';

export const SETTINGS_KEY = 'denim-settings';

export const DEFAULT_SETTINGS = Object.freeze({ launchPage: '', theme: 'light-blue', fontSize: 1 });

/** Drops null/undefined so an unset server field falls back to the default. */
export function withoutNulls(obj) {
  return Object.fromEntries(Object.entries(obj ?? {}).filter(([, v]) => v !== null && v !== undefined));
}

export function readLocalSettings(defaults = {}) {
  const stored = readJSON(SETTINGS_KEY, {});
  return { ...DEFAULT_SETTINGS, ...withoutNulls(defaults), ...(stored && typeof stored === 'object' ? withoutNulls(stored) : {}) };
}

export function writeLocalSettings(settings) {
  return writeJSON(SETTINGS_KEY, settings);
}

/** Effective settings: defaults, then local, then the server's (non-null) values. */
export function effectiveSettings({ defaults, server, source }) {
  const local = readLocalSettings(defaults);
  return source === 'server' && server ? { ...local, ...withoutNulls(server) } : local;
}
