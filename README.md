# denim-wc

The Denim app shell as **web components** (Lit 3 + Web Awesome 3), for apps
on a [typiql](https://github.com/MrDavid5465/typiql-rs) backend. It renders
the frame of an app so the app only writes its pages:

- a **header** with the current application's name and its page links (a
  menu drawer on narrow screens), with the active link matched by whole path
  segments;
- an **app switcher** ("waffle") drawer listing every application and its links;
- a **Settings** dialog (colour, light/dark/auto, text size, start page) with
  extension points for the app's own settings (`settingsGeneralFields`,
  `settingsTabs`);
- **theming** through Web Awesome's own classes and tokens (10 brand colours
  x light / dark / match-device), with the favicon following the colour;
- **routing**: one route per application at `/<path>/*`, a header-less
  `/kiosk/<path>/*` variant, default-route redirects that never touch deep
  links, a homepage, a not-found page;
- a **splash screen** that waits for the backend and recovers by itself
  (health check);
- settings in **localStorage** by default, or on the server;
- `<denim-photo>` (image picker + cropper) and the shared `confirmAsync()`.

It is the non-React counterpart of denim, built on
[typical-admin-wc](https://github.com/MrDavid5465/typical-admin-wc), whose
CRUD screens (`createAdmin`) are what normally goes inside an application.

## Using with an AI coding agent

Before writing any code with denim-wc, read its skill,
[`.claude/skills/denim-app-shell/SKILL.md`](./.claude/skills/denim-app-shell/SKILL.md):
registering applications and nav links, routes and deep links, theming, the
Settings dialog and its extension points, local vs server settings, Photo,
quick entry, plain-http LAN pitfalls, and when to hand-roll instead.

Then typical-admin-wc's skills (`typical-admin-wc/.claude/skills/`):
`admin-pattern`, `form-schema`, `list-schema`, `hand-rolled-components`,
`playwright-verify`; and typiql-rs's `.claude/skills/typiql-api` for the
backend. Skills in a cloned repository are not loaded automatically unless
the agent was started inside that repository, so open the `SKILL.md` files
directly.

## Layout: clone side by side

denim-wc imports typical-admin-wc as `../typical-admin-wc`:

```sh
cd your-app/src/lib
git clone https://github.com/MrDavid5465/typical-admin-wc
git clone https://github.com/MrDavid5465/denim-wc
```

```
your-app/src/lib/typical-admin-wc/
your-app/src/lib/denim-wc/
```

## npm packages

```sh
npm i lit@^3.3.3 @awesome.me/webawesome@^3.14.0
npm i -D vite@^8           # only for the Vite setup
```

Nothing else (no router, no GraphQL client: typical-admin-wc has both).
`index.d.ts` types the public API. Tests: `node --test test/` (no install
needed).

## Minimal app

A typiql backend, this shell, one CRUD screen and live updates over one
merged subscription connection. The backend (`Cargo.toml`, `src/main.rs`),
`vite.config.js` and `index.html` are exactly those in
[typical-admin-wc's README](https://github.com/MrDavid5465/typical-admin-wc#minimal-app);
the two app files:

**`src/main.js`**

```js
import '@awesome.me/webawesome/dist/styles/webawesome.css';
import './lib/typical-admin-wc/wa.js'; // the Web Awesome components the libraries use
import { setup } from './lib/typical-admin-wc/index.js';
import './lib/denim-wc/index.js';
import { projects } from './projects.js';

// One GraphQL client, ONE merged subscription connection for every live
// screen, and the router. Call it before the shell renders.
setup({ url: '/typiql/graphql' });

const shell = document.createElement('denim-shell');
shell.appTitle = 'Projects demo';
shell.applications = [
  {
    name: 'Projects',
    path: 'projects',
    defaultRoute: '',
    frontEnd: 'projects',
    links: [
      { path: '', text: 'All projects' },
      { path: 'new', text: 'New project' },
    ],
  },
];
shell.components = { projects };
document.body.append(shell);
```

**`src/projects.js`**

```js
import { createAdmin, typiqlDispatcher } from './lib/typical-admin-wc/index.js';

// list/show/new/edit/delete + live updates, with typiql's generated names
// (getProjects, getProject, addProject(values:), updateProject(id:, update:),
// removeProject(id:), projectChanged).
const dispatcher = typiqlDispatcher({
  type: 'Project',
  fields: 'id name description priority archived',
});

const columns = {
  name: { label: 'Name' },
  priority: { label: 'Priority', options: { format: 'number' } },
  archived: { label: 'Archived', options: { format: 'boolean' } },
};

const form = {
  name: { type: 'text', label: 'Name', required: true },
  description: { type: 'textarea', label: 'Description' },
  priority: { type: 'number', label: 'Priority', integer: true, hint: '1 is the most important' },
  archived: { type: 'checkbox', label: 'Archived' },
};

// Mounted by the shell at /projects; it owns /projects/new, /projects/:id/show
// and /projects/:id/edit below that.
export const projects = createAdmin({
  dispatcher,
  name: { singular: 'Project', plural: 'Projects' }, // display names only
  schemaDefinition: {
    list: { columns },
    show: { ...columns, description: { label: 'Description' } },
    new: form,
    edit: form,
  },
});
```

This needs nothing from the backend beyond the `Project` type: the app list
is static and settings stay in the browser. The no-build variant (import map
+ CDN, served by the backend) is in typical-admin-wc's README; the shell
code is the same.

## `<denim-shell>` properties

| Property | Default | What it does |
|---|---|---|
| `components` | `{}` | `frontEnd` -> what renders at `/<path>/*`: a `createAdmin()` result, a render function `(ctx) => html\`...\``, an element class or a tag name. Gets `{ app, base, kiosk, settings, shell }`. |
| `applications` | from `my.applications` | static app list; when set, `my.applications` is not queried |
| `settingsSource` (`settings-source`) | `'local'` | `'local'`: localStorage. `'server'`: `my.settings` + `updateSettings` |
| `defaultSettings` | `{ theme: 'light-blue', fontSize: 1, launchPage: '' }` | values before anything is saved |
| `settingsFields` | `''` | extra `AppSettings` fields to select (server mode), for your tabs/fields |
| `settingsGeneralFields` | none | extra fields on the General tab (a typical-admin-wc form schema) |
| `settingsTabs` | `[]` | extra tabs: `{ key, label, render(ctx) }` |
| `appTitle` (`app-title`) | `''` | splash/home heading, document title suffix |
| `root` | none | the `/` page (no header); also shown instead of the splash while the backend loads |
| `brand` | none | header brand: text, render function or tag |
| `controls` | none | extra header controls (right side) |
| `externalApps` | none | extra content at the top of the app switcher |
| `logo` | built-in | splash logo |
| `colors`, `modes` | all | restrict the Settings choices (`COLOR_KEYS`, `MODE_KEYS`) |
| `favicon` | `true` | favicon follows the brand colour |
| `requireBackend` (`require-backend`) | `false` | splash until the backend answers even with nothing to query |
| `healthInterval` | `1500` | ms between health checks while waiting |
| `client` | `setup()`'s | a different GraphQL client |

Methods: `openSettings()`, `saveSettings(values)`; property `settings`
(effective values); event `denim-settings-change`.

## Server contract

Every part is optional. What the shell asks for depends on its properties:

| The shell needs | When | GraphQL |
|---|---|---|
| nothing | `applications` given and `settingsSource = 'local'` | none |
| the app list | `applications` not given | `my { applications { name path defaultRoute frontEnd links { path text } } }` |
| settings | `settingsSource = 'server'` | `my { settings { launchPage theme fontSize <settingsFields> } }` and `updateSettings(settings: AppSettingsInput!)` |

```graphql
type Query { my: My! }
type My {
  applications: [Application!]!  # only if the shell queries the app list
  settings: AppSettings          # only for settingsSource="server"; null = defaults
}
type Application {
  name: String!
  path: String!          # URL segment, /<path>/*
  defaultRoute: String!  # "" for none
  frontEnd: String!      # key into <denim-shell>.components
  links: [AppLink!]!
}
type AppLink { path: String!  text: String! }
type AppSettings {       # nullable fields fall back to defaultSettings
  launchPage: String
  theme: String          # "<mode>-<color>", e.g. "dark-green"
  fontSize: Float
  # ...plus anything your settings tabs/fields read (settingsFields)
}
type Mutation {
  # Patch semantics. The input type MUST be named AppSettingsInput; the
  # argument may be nullable or not. Any object return type: the shell
  # selects only __typename and then refetches `my`.
  updateSettings(settings: AppSettingsInput!): My!
}
```

The same contract as React denim, so one backend serves both.

### Implementing it on typiql-rs

`Application` and `AppSettings` are ordinary typiql types (so they also get
the CRUD API: an admin screen for the app list is just a `createAdmin` over
`Application`). Only `my` and `updateSettings` are hand-written. Add to the
minimal backend:

```rust
use async_graphql::{Context, Object, Result, SimpleObject};
use typiql::{resolve_list, resolve_upsert, TypiQLBroker, TypiQLType};

#[derive(
    async_graphql::SimpleObject, async_graphql::InputObject,
    serde::Serialize, serde::Deserialize, Clone, Debug, Default,
)]
#[graphql(input_name = "AppLinkInput")]
pub struct AppLink {
    pub path: String,
    pub text: String,
}

#[typiql_type]
pub struct Application {
    #[typiql(key)]
    pub id: String,
    pub name: String,
    pub path: String,
    pub default_route: String,
    pub front_end: String,
    pub links: Vec<AppLink>,
    pub position: i64, // menu order (not part of the contract)
}

#[typiql_type]
pub struct AppSettings {
    #[typiql(key)]
    pub id: String,
    pub launch_page: Option<String>,
    pub theme: Option<String>,
    pub font_size: Option<f64>,
    pub device_name: Option<String>, // an app's own setting (settingsFields="deviceName")
}

#[derive(SimpleObject)]
pub struct My {
    pub applications: Vec<Application>,
    pub settings: Option<AppSettings>,
}

async fn load_my(ctx: &Context<'_>) -> Result<My> {
    let mut applications = resolve_list::<Application>(ctx, vec![]).await?;
    applications.sort_by_key(|a| a.position);
    // One settings record; filter by a user_id field once you have users.
    let settings = resolve_list::<AppSettings>(ctx, vec![]).await?.into_iter().next();
    Ok(My { applications, settings })
}

#[derive(Default)]
pub struct DenimQuery;

#[Object]
impl DenimQuery {
    async fn my(&self, ctx: &Context<'_>) -> Result<My> {
        load_my(ctx).await
    }
}

#[derive(Default)]
pub struct DenimMutation;

#[Object]
impl DenimMutation {
    /// Patch the single settings record, creating it on first save.
    async fn update_settings(&self, ctx: &Context<'_>, settings: AppSettingsInput) -> Result<My> {
        if let Some(row) = resolve_upsert::<AppSettings>(ctx, vec![], settings, vec![], vec![], true).await? {
            // Hand-written writes don't publish on their own.
            TypiQLBroker::publish(AppSettingsChanged { operation_name: "update".into(), value: row });
        }
        load_my(ctx).await
    }
}

typiql_schema!(Project, Application, AppSettings; DenimQuery; DenimMutation);
```

and seed the app list once (or insert rows through the generated
`addApplication`):

```rust
async fn seed_applications(adapter: &Arc<dyn TypiQLAdapter>) {
    let loc = || Application::collection_name().into();
    if !adapter.get_many(loc(), vec![]).await.is_empty() {
        return;
    }
    let app = serde_json::json!({ "name": "Projects", "path": "projects", "default_route": "",
        "front_end": "projects", "position": 1,
        "links": [ { "path": "", "text": "All projects" }, { "path": "new", "text": "New project" } ] });
    adapter.add(loc(), Application::key_field(), app).await.expect("seed");
}
// in main(): build the JsonAdapter as an Arc first, seed, then insert it into the AdapterMap.
```

Then on the frontend drop `shell.applications` and set
`shell.settingsSource = 'server'` (plus `settingsFields` for your extra
settings). This exact contract served the verification below.

## What's in here

| Path | What it is |
|---|---|
| `index.js`, `index.d.ts` | public API (defines the elements on import) |
| `src/denim-shell.js` | the shell: data, routing, header, drawers |
| `src/denim-settings.js` | the Settings dialog and its extension points |
| `src/denim-splash.js` | splash screen |
| `src/denim-photo.js` | image picker + cropper |
| `src/nav.js` | `isLinkActive`, `resolveShellRoute`, `linkHref` (pure) |
| `src/settings.js` | local settings, defaults, merging (pure) |
| `src/themes.js` | `COLOR_KEYS`, `MODE_KEYS`, `themeKey`, `parseThemeKey`, `applyTheme` |
| `src/queries.js` | the contract's documents: `buildMyQuery`, `UPDATE_SETTINGS` |
| `src/styles.js` | the shell stylesheet (includes the html/body reset) |
| `test/` | Node tests |

## License

MIT, see `LICENSE`.
