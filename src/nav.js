// Pure routing logic of the shell: which application a path belongs to,
// default-route redirects that never touch deep links, and nav-link active
// state by whole path segments.
import { normalizePath } from '../../typical-admin-wc/src/router.js';

/**
 * Is a header link active? On its own page and the pages under it, matched by
 * whole path segments ("check" is not active on "checks"). A link to the app
 * root (linkPath '') is active only on the root itself, or it would match
 * every page of the app.
 */
export function isLinkActive(pathname, appPath, linkPath) {
  const base = normalizePath(`/${appPath}${linkPath ? `/${linkPath}` : ''}`);
  const path = normalizePath(pathname);
  return linkPath ? path === base || path.startsWith(`${base}/`) : path === base;
}

/** The href of an application's link. */
export function linkHref(app, link) {
  return normalizePath(`/${app.path}${link.path ? `/${link.path}` : ''}`);
}

/**
 * Resolves a path against the registered applications:
 *   { kind: 'app', app, base, sub, kiosk: false }   /<path>/*
 *   { kind: 'app', app, base, sub, kiosk: true }    /kiosk/<path>/*
 *   { kind: 'root' }                                /
 *   { kind: 'notFound' }                            anything else
 * plus `redirect` when the path is exactly an app root with a defaultRoute
 * (only the root: deep links below it are left alone).
 */
export function resolveShellRoute(pathname, applications = []) {
  const path = normalizePath(pathname);
  if (path === '/') return { kind: 'root' };
  const segs = path.split('/').filter(Boolean);
  const kiosk = segs[0] === 'kiosk';
  const appSeg = kiosk ? segs[1] : segs[0];
  const app = applications.find((a) => a.path === appSeg);
  if (!app) return { kind: kiosk && !appSeg ? 'root' : 'notFound', kiosk };
  const base = kiosk ? `/kiosk/${app.path}` : `/${app.path}`;
  const sub = segs.slice(kiosk ? 2 : 1).join('/');
  const route = { kind: 'app', app, base, sub, kiosk };
  if (sub === '' && app.defaultRoute) route.redirect = normalizePath(`${base}/${app.defaultRoute}`);
  return route;
}
