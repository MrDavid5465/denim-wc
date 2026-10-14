// <denim-shell>: the frame of an app. A header with the current
// application's name and its page links (a drawer on narrow screens), an app
// switcher ("waffle") drawer, a Settings dialog with extension points,
// Web Awesome theming (light/dark/auto x brand color, font size), a splash
// screen that waits for the backend, and one route per application:
//
//   /<app.path>/*          header + components[app.frontEnd]
//   /<app.path> exactly    -> /<app.path>/<app.defaultRoute> (deep links untouched)
//   /kiosk/<app.path>/*    the same, without the header
//   /                      `root`, else the launchPage setting, else app tiles
//
// Applications come from the static `applications` property or, when it is
// not set, from the backend's `my.applications` (see the README's server
// contract). Settings live in localStorage unless settingsSource="server".
import { html, nothing } from 'lit';
import {
  TaElement,
  define,
  renderOverride,
  RouteController,
  router,
  icon,
  getClient,
} from '../../typical-admin-wc/index.js';
import { isLinkActive, linkHref, resolveShellRoute } from './nav.js';
import { effectiveSettings, writeLocalSettings, readLocalSettings, withoutNulls } from './settings.js';
import { applyTheme } from './themes.js';
import { buildMyQuery, UPDATE_SETTINGS } from './queries.js';
import { ensureDenimStyles } from './styles.js';
import './denim-settings.js';
import './denim-splash.js';

export class DenimShell extends TaElement {
  static properties = {
    applications: { attribute: false },
    components: { attribute: false },
    settingsSource: { attribute: 'settings-source' },
    defaultSettings: { attribute: false },
    settingsFields: { attribute: 'settings-fields' },
    settingsTabs: { attribute: false },
    settingsGeneralFields: { attribute: false },
    root: { attribute: false },
    brand: { attribute: false },
    appTitle: { attribute: 'app-title' },
    logo: { attribute: false },
    controls: { attribute: false },
    externalApps: { attribute: false },
    colors: { attribute: false },
    modes: { attribute: false },
    favicon: { type: Boolean },
    requireBackend: { type: Boolean, attribute: 'require-backend' },
    healthInterval: { type: Number, attribute: 'health-interval' },
    client: { attribute: false },
    my: { state: true },
    status: { state: true },
    settingsOpen: { state: true },
    appsOpen: { state: true },
    menuOpen: { state: true },
    localSettings: { state: true },
  };

  constructor() {
    super();
    this.applications = undefined;
    this.components = {};
    this.settingsSource = 'local';
    this.defaultSettings = {};
    this.settingsFields = '';
    this.settingsTabs = [];
    this.settingsGeneralFields = undefined;
    this.root = undefined;
    this.brand = undefined;
    this.appTitle = '';
    this.logo = undefined;
    this.controls = undefined;
    this.externalApps = undefined;
    this.colors = undefined;
    this.modes = undefined;
    this.favicon = true;
    this.requireBackend = false;
    this.healthInterval = 1500;
    this.client = undefined;
    this.my = null;
    this.status = 'idle'; // idle | loading | waiting | ready
    this.settingsOpen = false;
    this.appsOpen = false;
    this.menuOpen = false;
    this.localSettings = null;
    this.route = new RouteController(this);
    this.pollTimer = null;
    this.appliedTheme = '';
  }

  createRenderRoot() {
    ensureDenimStyles();
    return super.createRenderRoot();
  }

  // ── Data ──────────────────────────────────────────────────────────────────

  get needsMy() {
    return !this.applications || this.settingsSource === 'server';
  }

  get gqlClient() {
    return this.client ?? getClient();
  }

  /** The effective settings (defaults < local < server). */
  get settings() {
    if (this.settingsSource === 'server' && this.my?.settings) {
      return { ...readLocalSettings(this.defaultSettings), ...withoutNulls(this.my.settings) };
    }
    return this.localSettings ?? effectiveSettings({ defaults: this.defaultSettings, source: 'local' });
  }

  get apps() {
    return this.applications ?? this.my?.applications ?? [];
  }

  get ready() {
    return this.status === 'ready';
  }

  connectedCallback() {
    super.connectedCallback();
    router.start();
    this.localSettings = effectiveSettings({ defaults: this.defaultSettings, source: 'local' });
    this.load();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.pollTimer);
  }

  async load() {
    clearTimeout(this.pollTimer);
    if (!this.needsMy && !this.requireBackend) {
      this.status = 'ready';
      return;
    }
    if (this.status !== 'waiting') this.status = 'loading';
    try {
      if (this.needsMy) {
        const query = buildMyQuery({
          applications: !this.applications,
          settings: this.settingsSource === 'server',
          settingsFields: this.settingsFields,
        });
        const data = await this.gqlClient.request(query, {});
        this.my = data.my ?? {};
        if (this.settingsSource === 'server' && this.my.settings) {
          // Cache the theme so the next first paint is already themed.
          const { launchPage, theme, fontSize } = this.settings;
          writeLocalSettings({ ...readLocalSettings(), launchPage, theme, fontSize });
        }
      } else if (!(await this.gqlClient.ping())) {
        throw new Error('backend not answering');
      }
      this.status = 'ready';
    } catch (e) {
      // The backend may still be starting: show the splash and poll.
      this.status = 'waiting';
      this.lastError = e;
      this.pollTimer = setTimeout(() => this.poll(), this.healthInterval);
    }
  }

  async poll() {
    if (!this.isConnected) return;
    if (await this.gqlClient.ping()) this.load();
    else this.pollTimer = setTimeout(() => this.poll(), this.healthInterval);
  }

  /** Saves settings (local: localStorage, server: updateSettings + refetch). */
  async saveSettings(values) {
    if (this.settingsSource === 'server') {
      await this.gqlClient.request(UPDATE_SETTINGS, { settings: values });
      await this.load();
    } else {
      const next = { ...this.settings, ...values };
      writeLocalSettings(next);
      this.localSettings = next;
    }
    this.dispatchEvent(new CustomEvent('denim-settings-change', { detail: { settings: this.settings }, bubbles: true, composed: true }));
  }

  /** Opens the Settings dialog. */
  openSettings() {
    this.appsOpen = false;
    this.menuOpen = false;
    this.settingsOpen = true;
  }

  // ── Routing ───────────────────────────────────────────────────────────────

  willUpdate() {
    const s = this.settings;
    const themeId = `${s.theme}|${s.fontSize}`;
    if (themeId !== this.appliedTheme) {
      this.appliedTheme = themeId;
      applyTheme(s, { favicon: this.favicon });
    }
    this.current = this.ready ? resolveShellRoute(router.path, this.apps) : null;
    if (this.current?.redirect) {
      router.navigate(this.current.redirect, { replace: true });
      this.current = resolveShellRoute(router.path, this.apps);
    } else if (this.current?.kind === 'root' && !this.root && s.launchPage && this.apps.some((a) => a.path === s.launchPage.split('/')[0])) {
      router.navigate(`/${s.launchPage}`, { replace: true });
      this.current = resolveShellRoute(router.path, this.apps);
    }
    if (this.appTitle && this.current) {
      document.title = this.current.app ? `${this.current.app.name} · ${this.appTitle}` : this.appTitle;
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  /** A render function, element class or custom-element tag name (`brand` also takes plain text). */
  renderPiece(piece, ctx, key) {
    if (!piece) return nothing;
    if (typeof piece === 'string' && key === 'brand') return piece;
    return renderOverride(this, key, piece, ctx);
  }

  render() {
    if (!this.ready) {
      if (this.root && this.status !== 'waiting' && !this.requireBackend) {
        // A public homepage renders without waiting for the backend.
        return html`<main class="denim-content">${this.renderPiece(this.root, { shell: this, settings: this.settings }, 'root')}</main>`;
      }
      return html`<denim-splash
        .logo=${this.logo}
        heading=${this.appTitle || ''}
        status=${this.status === 'waiting' ? 'Waiting for the server…' : ''}
      ></denim-splash>`;
    }
    const route = this.current;
    const showHeader = !(route.kind === 'app' && route.kiosk) && !(route.kind === 'root' && this.root);
    return html`
      ${showHeader ? this.renderHeader(route) : nothing}
      <main class="denim-content" id="denim-main">${this.renderContent(route)}</main>
      ${this.renderAppsDrawer(route)} ${showHeader ? this.renderMenuDrawer(route) : nothing}
      <denim-settings
        ?open=${this.settingsOpen}
        .settings=${this.settings}
        .applications=${this.apps}
        .tabs=${this.settingsTabs ?? []}
        .generalFields=${this.settingsGeneralFields}
        .colors=${this.colors}
        .modes=${this.modes}
        .save=${(values) => this.saveSettings(values)}
        @denim-settings-close=${() => (this.settingsOpen = false)}
      ></denim-settings>
    `;
  }

  renderHeader(route) {
    const app = route.kind === 'app' ? route.app : null;
    const links = app?.links ?? [];
    return html`<header class="denim-header" part="header">
      <button class="denim-icon-button denim-waffle" type="button" aria-label="Apps" title="Apps" data-apps @click=${() => (this.appsOpen = true)}>
        ${icon('grid', { size: '1.35em' })}
      </button>
      ${this.brand ? html`<a class="denim-brand" href=${router.href('/')}>${this.renderPiece(this.brand, { shell: this }, 'brand')}</a>` : nothing}
      ${app
        ? html`<a class="denim-app-name" href=${router.href(`/${app.path}`)}>${app.name}</a>`
        : html`<a class="denim-app-name" href=${router.href('/')}>${this.appTitle || 'Home'}</a>`}
      ${links.length
        ? html`<nav class="denim-nav" aria-label=${`${app.name} pages`}>
            ${links.map((l) => {
              const active = isLinkActive(router.path, app.path, l.path);
              return html`<a href=${router.href(linkHref(app, l))} aria-current=${active ? 'page' : nothing} data-nav=${l.path}>${l.text}</a>`;
            })}
          </nav>`
        : nothing}
      <div class="denim-controls">
        ${this.renderPiece(this.controls, { shell: this, settings: this.settings, app }, 'controls')}
        ${links.length
          ? html`<button class="denim-icon-button denim-menu-button" type="button" aria-label="Menu" title="Menu" data-menu @click=${() => (this.menuOpen = true)}>
              ${icon('menu', { size: '1.35em' })}
            </button>`
          : nothing}
        <button class="denim-icon-button" type="button" aria-label="Settings" title="Settings" data-settings @click=${() => this.openSettings()}>
          ${icon('settings', { size: '1.25em' })}
        </button>
      </div>
    </header>`;
  }

  renderContent(route) {
    if (route.kind === 'app') {
      const { app, base, kiosk } = route;
      const component = this.components?.[app.frontEnd];
      if (!component) {
        return html`<div class="denim-welcome"><wa-callout variant="warning"
            >No component is registered for <code>${app.frontEnd}</code>. Add it to
            <code>components</code> on &lt;denim-shell&gt;.</wa-callout
          ></div>`;
      }
      return renderOverride(this, `app:${base}`, component, { app, base, kiosk, settings: this.settings, shell: this });
    }
    if (route.kind === 'root') {
      if (this.root) return this.renderPiece(this.root, { shell: this, settings: this.settings }, 'root');
      return html`<div class="denim-welcome">
        <h1>${this.appTitle || 'Welcome'}</h1>
        ${this.apps.length
          ? html`<ul class="denim-tiles">
              ${this.apps.map((a) => html`<li><a href=${router.href(`/${a.path}`)}>${a.name}</a></li>`)}
            </ul>`
          : html`<p>No applications are registered yet.</p>`}
      </div>`;
    }
    return html`<div class="denim-welcome" data-not-found>
      <h1>Page not found</h1>
      <p>There is nothing at <code>${router.path}</code>.</p>
      <wa-button href=${router.href('/')}>${icon('home', { slot: 'start' })}Home</wa-button>
    </div>`;
  }

  renderAppsDrawer(route) {
    return html`<wa-drawer
      class="denim-drawer denim-apps"
      placement="start"
      label=${this.appTitle || 'Apps'}
      light-dismiss
      ?open=${this.appsOpen}
      @wa-after-hide=${(e) => {
        if (e.target === e.currentTarget) this.appsOpen = false;
      }}
      @click=${(e) => {
        if (e.target.closest?.('a')) this.appsOpen = false;
      }}
    >
      ${this.renderPiece(this.externalApps, { shell: this }, 'externalApps')}
      <ul class="denim-applist">
        ${this.apps.map(
          (app) => html`<li data-app=${app.path}>
            <a class="denim-app-title" href=${router.href(`/${app.path}`)} aria-current=${route.kind === 'app' && route.app === app && route.sub === '' ? 'page' : nothing}
              >${app.name}</a
            >
            ${app.links?.length
              ? html`<ul>
                  ${app.links.map(
                    (l) => html`<li>
                      <a href=${router.href(linkHref(app, l))} aria-current=${isLinkActive(router.path, app.path, l.path) ? 'page' : nothing}>${l.text}</a>
                    </li>`,
                  )}
                </ul>`
              : nothing}
          </li>`,
        )}
      </ul>
      <wa-button slot="footer" appearance="outlined" data-open-settings @click=${() => this.openSettings()}
        >${icon('settings', { slot: 'start' })}Settings</wa-button
      >
    </wa-drawer>`;
  }

  renderMenuDrawer(route) {
    const app = route.kind === 'app' ? route.app : null;
    if (!app?.links?.length) return nothing;
    return html`<wa-drawer
      class="denim-drawer denim-menu"
      placement="end"
      label=${app.name}
      light-dismiss
      ?open=${this.menuOpen}
      @wa-after-hide=${(e) => {
        if (e.target === e.currentTarget) this.menuOpen = false;
      }}
      @click=${(e) => {
        if (e.target.closest?.('a')) this.menuOpen = false;
      }}
    >
      <ul class="denim-menu-links">
        ${app.links.map(
          (l) => html`<li><a href=${router.href(linkHref(app, l))} aria-current=${isLinkActive(router.path, app.path, l.path) ? 'page' : nothing}>${l.text}</a></li>`,
        )}
      </ul>
    </wa-drawer>`;
  }
}

define('denim-shell', DenimShell);
