import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readLocalSettings, writeLocalSettings, effectiveSettings, DEFAULT_SETTINGS, withoutNulls } from '../src/settings.js';
import { parseThemeKey, themeKey, themeClasses } from '../src/themes.js';
import { buildMyQuery, UPDATE_SETTINGS } from '../src/queries.js';
import { print, variableNames } from '../../typical-admin-wc/src/graphql/language.js';

function fakeStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}
beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: fakeStorage() });
});

test('local settings: defaults, then props, then stored; nulls never override', () => {
  assert.deepEqual(readLocalSettings(), DEFAULT_SETTINGS);
  assert.deepEqual(readLocalSettings({ theme: 'dark-green', launchPage: null }), { ...DEFAULT_SETTINGS, theme: 'dark-green' });
  writeLocalSettings({ theme: 'light-pink', fontSize: 1.25, deviceName: 'Kiosk 1' });
  assert.deepEqual(readLocalSettings({ theme: 'dark-green' }), { launchPage: '', theme: 'light-pink', fontSize: 1.25, deviceName: 'Kiosk 1' });
});

test('server settings win where set; null server fields fall back', () => {
  writeLocalSettings({ theme: 'light-pink' });
  const s = effectiveSettings({ defaults: {}, server: { theme: 'dark-blue', fontSize: null }, source: 'server' });
  assert.equal(s.theme, 'dark-blue');
  assert.equal(s.fontSize, 1);
  assert.deepEqual(withoutNulls({ a: null, b: 0, c: undefined, d: '' }), { b: 0, d: '' });
});

test('broken storage never breaks the shell', () => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem() { throw new Error('denied'); }, setItem() { throw new Error('quota'); } },
  });
  assert.deepEqual(readLocalSettings(), DEFAULT_SETTINGS);
  assert.equal(writeLocalSettings({ theme: 'x' }), false);
});

test('theme keys and Web Awesome classes', () => {
  assert.deepEqual(parseThemeKey('dark-purple'), { mode: 'dark', color: 'purple' });
  assert.deepEqual(parseThemeKey('default'), { mode: 'light', color: 'blue' });
  assert.deepEqual(parseThemeKey('hc-teal'), { mode: 'light', color: 'blue' });
  assert.equal(themeKey('auto', 'green'), 'auto-green');
  assert.deepEqual(themeClasses('dark-green').add, ['wa-dark', 'wa-brand-green']);
  assert.deepEqual(themeClasses('auto-red', true).add, ['wa-dark', 'wa-brand-red']);
  assert.deepEqual(themeClasses('auto-red', false).add, ['wa-light', 'wa-brand-red']);
  assert.ok(themeClasses('light-blue').remove.includes('wa-brand-pink'));
});

test('the server contract documents', () => {
  assert.equal(buildMyQuery({ applications: false, settings: false }), null);
  assert.match(print(buildMyQuery()), /applications \{\s+name\s+path\s+defaultRoute\s+frontEnd\s+links \{/);
  const both = print(buildMyQuery({ applications: true, settings: true, settingsFields: 'deviceName' }));
  assert.match(both, /settings \{\s+launchPage\s+theme\s+fontSize\s+deviceName/);
  assert.deepEqual(variableNames(UPDATE_SETTINGS), ['settings']);
  assert.match(print(UPDATE_SETTINGS), /\$settings: AppSettingsInput!/);
});
