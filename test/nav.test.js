import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isLinkActive, resolveShellRoute, linkHref } from '../src/nav.js';

test('nav active state matches whole path segments', () => {
  assert.equal(isLinkActive('/tasks/check', 'tasks', 'check'), true);
  assert.equal(isLinkActive('/tasks/check/42/show', 'tasks', 'check'), true);
  assert.equal(isLinkActive('/tasks/checks', 'tasks', 'check'), false, '"check" must not light up on "checks"');
  assert.equal(isLinkActive('/tasks/check/', 'tasks', 'check'), true);
});

test('the app-root link is active only on the root', () => {
  assert.equal(isLinkActive('/tasks', 'tasks', ''), true);
  assert.equal(isLinkActive('/tasks/', 'tasks', ''), true);
  assert.equal(isLinkActive('/tasks/new', 'tasks', ''), false);
  assert.equal(isLinkActive('/tasks/42/show', 'tasks', ''), false);
  assert.equal(isLinkActive('/taskset', 'tasks', ''), false);
});

const apps = [
  { name: 'Projects', path: 'projects', defaultRoute: '', frontEnd: 'projects', links: [] },
  { name: 'Tasks', path: 'tasks', defaultRoute: 'board', frontEnd: 'tasks', links: [{ path: '', text: 'All' }] },
];

test('routes resolve to apps, kiosk apps, root and not-found', () => {
  assert.deepEqual(resolveShellRoute('/', apps), { kind: 'root' });
  const r = resolveShellRoute('/projects/42/show', apps);
  assert.equal(r.kind, 'app');
  assert.equal(r.app.path, 'projects');
  assert.equal(r.base, '/projects');
  assert.equal(r.sub, '42/show');
  assert.equal(r.kiosk, false);
  const k = resolveShellRoute('/kiosk/projects/42/show', apps);
  assert.equal(k.kiosk, true);
  assert.equal(k.base, '/kiosk/projects');
  assert.equal(k.sub, '42/show');
  assert.equal(resolveShellRoute('/nope', apps).kind, 'notFound');
  assert.equal(resolveShellRoute('/projectsx', apps).kind, 'notFound');
});

test('default-route redirect fires only on the exact app root, never on deep links', () => {
  assert.equal(resolveShellRoute('/tasks', apps).redirect, '/tasks/board');
  assert.equal(resolveShellRoute('/tasks/', apps).redirect, '/tasks/board');
  assert.equal(resolveShellRoute('/tasks/42/show', apps).redirect, undefined);
  assert.equal(resolveShellRoute('/kiosk/tasks', apps).redirect, '/kiosk/tasks/board');
  assert.equal(resolveShellRoute('/projects', apps).redirect, undefined, 'no defaultRoute, no redirect');
});

test('link hrefs', () => {
  assert.equal(linkHref(apps[1], { path: '' }), '/tasks');
  assert.equal(linkHref(apps[1], { path: 'new' }), '/tasks/new');
});
