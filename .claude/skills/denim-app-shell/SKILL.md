---
name: denim-app-shell
description: How to build a web-component app's shell with denim-wc (<denim-shell>, on typical-admin-wc, Lit 3 + Web Awesome 3 and a typiql backend) - registering applications and their nav links, routes, deep links and kiosk routes, theming (brand colour x light/dark/auto, text size) through Web Awesome classes and tokens, the Settings dialog and its extension points (settingsGeneralFields, settingsTabs, settingsFields), local vs server settings and the optional my/updateSettings server contract, splash + health check, <denim-photo>, quick-entry UX for data-entry apps, plain-http LAN pitfalls, and when to hand-roll instead. Use before creating an app on this stack, adding an app/page to the nav, adding a setting, or touching the header, app switcher, theme or Settings dialog.
license: MIT
---

# Building an app shell with denim-wc

`<denim-shell>` renders the whole frame: a header with the current
application's name and page links, an app switcher drawer, a Settings dialog,
Web Awesome theming on `<html>`, a splash screen while the backend answers,
and one route per application. Your code supplies each application's
content; CRUD screens inside are `createAdmin()` (read typical-admin-wc's
`admin-pattern` skill).

Clone `typical-admin-wc` and `denim-wc` side by side (e.g. `src/lib/`); the
README has the packages and the full minimal app.

## 1. Mount it

```js
import '@awesome.me/webawesome/dist/styles/webawesome.css';
import './lib/typical-admin-wc/wa.js';
import { setup } from './lib/typical-admin-wc/index.js';
import './lib/denim-wc/index.js';
import { projects } from './projects.js';
import { tasks } from './tasks.js';

setup({ url: '/typiql/graphql' });     // client, ONE subscription connection, router

const shell = document.createElement('denim-shell');
shell.appTitle = 'Acme';
shell.applications = [...];            // section 2
shell.components = { projects, tasks };
document.body.append(shell);
```

- `setup()` must run before the shell renders (the shell uses its client).
- The shell resets html/body margins and fills the page itself; don't add
  your own reset or wrapper.
- No theme provider to wrap: the shell puts Web Awesome's classes on `<html>`.
- No confirm host to mount: `confirmAsync()` (from either library, it is the
  same one) creates its dialog on first use.
- Links are plain `<a href="/tasks/new">`: the router (started by `setup()`)
  turns internal clicks into navigation. To navigate in code:
  `router.navigate('/tasks/new')` (typical-admin-wc).

## 2. Register applications (nav + routes)

An **application** is one entry in the app switcher and one top-level route:

```js
{
  name: 'Tasks',           // header + app switcher label
  path: 'tasks',           // the app owns /tasks/*
  defaultRoute: '',        // /tasks exactly redirects to /tasks/<defaultRoute>; '' for none
  frontEnd: 'tasks',       // key into shell.components
  links: [                 // header links: /tasks/<link.path>
    { path: '', text: 'All tasks' },
    { path: 'board', text: 'Board' },
  ],
}
```

Two sources, pick one: **static** (`shell.applications = [...]`, no backend
contract) or **backend** (leave it unset: the shell queries
`my { applications {...} }`, for lists that differ per user or are edited at
runtime; see the README's server contract).

| URL | Renders |
|---|---|
| `/<path>/*` | header + `components[frontEnd]` |
| `/<path>` exactly, with `defaultRoute` | replace-redirect to `/<path>/<defaultRoute>` (deep links below are never redirected) |
| `/kiosk/<path>/*` | the same component, no header (wall displays, embeds) |
| `/` | `root` if set (no header); else a redirect to the `launchPage` setting; else app tiles |
| anything else | "Page not found" with the header |

A component gets `{ app, base, kiosk, settings, shell }` (`base` is
`/tasks` or `/kiosk/tasks`); `createAdmin()` results use `base` as their
mount path automatically. An application with several pages routes below
`base` itself:

```js
import { html, router, subPath, RouteController, TaElement, define } from './lib/typical-admin-wc/index.js';
const admin = createAdmin({ ... });

// A render function: re-run on every route change by the shell.
shell.components.tasks = ({ base }) =>
  subPath(base, router.path)?.startsWith('board') ? html`<task-board></task-board>` : admin({ base });
```

(or a custom element with `new RouteController(this)` that matches
`subPath(this.base, router.path)` in `render()`).

Adding a page takes **both** a link entry and the code that renders it; one
without the other is a dead link or an unreachable page.

**Active link**: whole path segments (`/tasks/check` is not active on
`/tasks/checks`), and the app-root link (`path: ''`) is active only on the
root itself, not on every page of the app.

Other properties: `brand` (text or render function, left of the app name),
`controls` (right side of the header), `externalApps` (top of the app
switcher), `logo` (splash), `root` (homepage).

## 3. Settings: where they live

The shell's settings are `theme` (`'<mode>-<color>'`, e.g. `'dark-green'`),
`fontSize` (1, 1.125, 1.25) and `launchPage`, plus your own.

| | `settingsSource = 'local'` (default) | `'server'` |
|---|---|---|
| Stored in | this browser's localStorage (`denim-settings`) | `my.settings`, saved with `updateSettings` |
| Backend needs | nothing | the settings half of the README's contract |
| Right for | public sites, single-user tools, prototypes | settings shared by every device of an installation |

`shell.defaultSettings = { theme: 'dark-cyan', launchPage: 'tasks' }` sets
values before anything is saved. Read them with `shell.settings`; react with
the `denim-settings-change` event.

Settings are for **global** preferences (theme, units, this device's name).
A feature's own configuration gets its own page instead.

## 4. Theming

- The theme is Web Awesome's: `wa-light`/`wa-dark` and `wa-brand-<color>` on
  `<html>` (`COLOR_KEYS`: red, orange, yellow, green, cyan, blue, indigo,
  purple, pink, gray; `MODE_KEYS`: light, dark, auto = follow the device).
  Text size scales the root font size, so rem-based sizes and spacing scale
  with it. The favicon follows the brand colour (`favicon = false` to keep yours).
- Every library element and every Web Awesome component follows. In your own
  components use tokens, never literal colours: `var(--wa-color-text-normal)`,
  `--wa-color-surface-default`, `--wa-color-brand-fill-loud`, ... (see
  typical-admin-wc's `hand-rolled-components`).
- Restrict the choices: `shell.colors = ['blue', 'green']`, `shell.modes = ['light', 'dark']`.
- A different look entirely: load another Web Awesome theme stylesheet
  (`themes/awesome.css` + `wa-theme-awesome` class) or override the brand
  tokens in your CSS.

## 5. Extending the Settings dialog

The General tab (colour, mode, text size, start page) is the shell's. Add to
it in three ways:

```js
// (a) Extra fields on the General tab: a typical-admin-wc form schema.
shell.settingsGeneralFields = {
  units: { type: 'select', label: 'Units', options: [{ value: 'metric', label: 'Metric' }, { value: 'imperial', label: 'Imperial' }] },
};

// (b) Whole tabs. `render` gets { settings, isOpen, onChange, registerSave }.
shell.settingsTabs = [{
  key: 'device',
  label: 'Device',
  render: ({ settings, onChange, registerSave }) => html`<ta-form
    .schema=${{ deviceName: { type: 'text', label: 'Device name', maxLength: 40 } }}
    .values=${{ deviceName: settings.deviceName }}
    @ta-change=${(e) => {
      // Merged into the one save; isValid=false blocks Save and shows the message.
      onChange({ deviceName: e.detail.values.deviceName }, e.detail.isValid, e.detail.errors.deviceName?.[0]);
      // Optional: side effects after the settings are saved.
      registerSave(async () => { /* e.g. await client.mutate(RENAME_DEVICE, { name: ... }) */ });
    }}
  ></ta-form>`,
}];

// (c) Server mode: the extra AppSettings fields the tabs/fields read.
shell.settingsSource = 'server';
shell.settingsFields = 'units deviceName';
```

How saving works: Save validates General and every tab's latest
`onChange(patch, isValid, message)`, merges General's values and every tab's
patch into ONE object, writes it (localStorage, or one
`updateSettings(settings: {...})` followed by a refetch of `my`, so every key
must exist on `AppSettingsInput`), then runs each `registerSave` callback in
tab order. A thrown error is shown next to Save and keeps the dialog open.
Each opening starts from the saved settings. `render` may return a new
object literal for `.values` each time: `<ta-form>` re-seeds only when the
content changes.

## 6. Photo (image picker + cropper)

```js
html`<denim-photo name="cover" .image=${project.cover ?? ''}
  .submit=${(base64) => client.mutate(UPDATE, { id: project.id, update: { cover: base64 || null } })}></denim-photo>`
```

- Pick or drop a PNG/JPEG/WebP (`max-bytes`, default 10 MB), crop (drag the
  box, drag the corner to resize; `aspect`, default 1), save: `submit` gets
  the cropped PNG as base64 without the `data:` prefix (at most `max-size`
  px, default 512); Remove (after a confirm) sends `''`. Download is offered
  for an existing image.
- Browsers apply EXIF orientation themselves, so phone photos come out upright.
- It never talks to the server: store the base64 in a typiql `String` field
  (or a per-record file type for large images).

## 7. Quick entry in data-entry apps

When users enter many records in a row, don't send each one through the
full-page `/new` route and back (testing showed that is slow). Give the list
a quick-entry dialog or inline panel:

```js
list: { columns, quickEntry: { mode: 'dialog', remember: ['projectId'] } }
```

It focuses the first meaningful field (`focus: true`, else the first empty
one), saves on Enter from any field, stays open, clears and refocuses for the
next entry, remembers chosen fields' last values, and says "To save: ..."
while invalid. Pre-fill with `defaultValue` (`() => today()` for dates) and
`values` (fixed values such as the project the page is filtered to). Details
in typical-admin-wc's `admin-pattern` skill.

## 8. Plain http on the LAN is not a secure context

`http://192.168.x.x:5173` (a phone, another PC) is not a secure context; only
https and `http://localhost` are. There `crypto.randomUUID`, `crypto.subtle`,
`navigator.clipboard`, service workers and some device APIs are missing, and
code that calls them fails only on other devices.

- Record keys come from typiql; never generate them client-side.
- For a client-side id use `uuid()` from typical-admin-wc (falls back to
  `crypto.getRandomValues`). The libraries already do.
- Guard clipboard buttons with `window.isSecureContext`, or serve https.
- Use a same-origin GraphQL URL (`/typiql/graphql`, proxied in dev), never
  `http://localhost:4000`, so other devices reach the backend.
- Test by LAN IP (`playwright-verify`).

## 9. Splash and health

When the shell needs the backend (`my` for the app list or server settings,
or `requireBackend`), it shows a splash until the first answer. If the
backend isn't up yet it says "Waiting for the server…" and polls every
`healthInterval` ms (a `query { __typename }`), then loads and renders: no
reload needed. A `root` page renders immediately instead of the splash.

## 10. When to hand-roll instead

- **A CRUD screen**: never hand-roll; `createAdmin` (override one slot if you must).
- **A one-off visual component** (dashboard tile, status strip): typical-admin-wc's
  `hand-rolled-components`, mounted inside an application's component.
- **A page with no app chrome** (landing page, wall display): `root` or the
  `/kiosk/<path>` route, not a second router.
- **A different header or Settings layout**: change denim-wc itself (it is
  cloned source, shared by your apps) after trying the properties and
  extension points above.
- **Not the shell's job**: auth, your pages' data, per-feature configuration.

## Exports at a glance

`DenimShell`, `DenimSettings`, `DenimSplash`, `DenimPhoto`; `isLinkActive`,
`resolveShellRoute`, `linkHref`; `DEFAULT_SETTINGS`, `readLocalSettings`,
`writeLocalSettings`, `effectiveSettings`; `COLOR_KEYS`, `MODE_KEYS`,
`FONT_SIZES`, `themeKey`, `parseThemeKey`, `themeClasses`, `applyTheme`;
`buildMyQuery`, `UPDATE_SETTINGS`; `confirmAsync`, `toast` (re-exported from
typical-admin-wc: the same single implementation).
