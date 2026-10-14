// <denim-settings>: the Settings dialog. The General tab (colour, mode, text
// size, start page, plus `settingsGeneralFields`) and the app's own
// `settingsTabs`. Save merges General's values and every tab's latest patch
// into ONE save (localStorage or updateSettings), then runs each tab's
// registered save callback in order. A thrown error is shown next to Save
// and keeps the dialog open.
//
// A tab: { key, label, render: (ctx) => TemplateResult | Node } or a custom
// element tag in `render`; ctx/props = { settings, isOpen, onChange(patch,
// isValid = true, message), registerSave(fn) }.
import { html, nothing } from 'lit';
import { TaElement, define, renderOverride } from '../../typical-admin-wc/index.js';
import { COLOR_KEYS, COLOR_LABELS, MODE_KEYS, MODE_LABELS, FONT_SIZES, parseThemeKey, themeKey } from './themes.js';

export class DenimSettings extends TaElement {
  static properties = {
    open: { type: Boolean, reflect: true },
    settings: { attribute: false },
    applications: { attribute: false },
    tabs: { attribute: false },
    generalFields: { attribute: false },
    colors: { attribute: false },
    modes: { attribute: false },
    save: { attribute: false },
    error: { state: true },
    saving: { state: true },
  };

  constructor() {
    super();
    this.open = false;
    this.settings = {};
    this.applications = [];
    this.tabs = [];
    this.generalFields = undefined;
    this.colors = undefined;
    this.modes = undefined;
    this.save = async () => {};
    this.error = '';
    this.saving = false;
    this.patches = {};
    this.validity = {};
    this.saveFns = {};
    this.initial = {};
    this.callbacks = {};
  }

  willUpdate(changed) {
    if (changed.has('open') && this.open) {
      // Every opening starts from the saved settings.
      const { mode, color } = parseThemeKey(this.settings.theme);
      this.initial = { ...this.settings, themeMode: mode, themeColor: color };
      this.patches = {};
      this.validity = {};
      this.saveFns = {};
      this.error = '';
    }
  }

  get schema() {
    const colors = this.colors ?? COLOR_KEYS;
    const modes = this.modes ?? MODE_KEYS;
    return {
      themeColor: { type: 'select', label: 'Colour', required: true, options: colors.map((c) => ({ value: c, label: COLOR_LABELS[c] ?? c })) },
      themeMode: { type: 'radio', label: 'Mode', horizontal: true, options: modes.map((m) => ({ value: m, label: MODE_LABELS[m] ?? m })) },
      fontSize: { type: 'radio', label: 'Text size', horizontal: true, options: FONT_SIZES },
      launchPage: {
        type: 'select',
        label: 'Start page',
        hint: 'Opened when you visit the home address.',
        placeholder: 'Home',
        options: (this.applications ?? []).map((a) => ({ value: a.path, label: a.name })),
      },
      ...(this.generalFields ?? {}),
    };
  }

  tabCallbacks(key) {
    this.callbacks[key] ??= {
      onChange: (patch, isValid = true, message) => {
        this.patches = { ...this.patches, [key]: patch };
        this.validity = { ...this.validity, [key]: { valid: isValid, message } };
      },
      registerSave: (fn) => {
        this.saveFns[key] = fn;
      },
    };
    return this.callbacks[key];
  }

  get form() {
    return this.querySelector('ta-form[data-general]');
  }

  async onSave() {
    const result = this.form?.submit() ?? { valid: true, values: {} };
    if (!result.valid) {
      this.error = 'Please fix the highlighted fields on the General tab.';
      return;
    }
    const invalid = (this.tabs ?? []).find((t) => this.validity[t.key] && !this.validity[t.key].valid);
    if (invalid) {
      this.error = this.validity[invalid.key].message ?? `Please fix the ${invalid.label ?? invalid.headerText} tab.`;
      return;
    }
    const { themeColor, themeMode, ...general } = result.values;
    const values = Object.assign(
      { ...general, launchPage: general.launchPage ?? '', theme: themeKey(themeMode ?? 'light', themeColor ?? 'blue') },
      ...(this.tabs ?? []).map((t) => this.patches[t.key] ?? {}),
    );
    this.saving = true;
    this.error = '';
    try {
      await this.save(values);
      for (const t of this.tabs ?? []) await this.saveFns[t.key]?.();
      this.close();
    } catch (e) {
      this.error = e?.errors?.[0]?.message ?? e?.message ?? 'Save failed.';
    } finally {
      this.saving = false;
    }
  }

  close() {
    this.open = false;
    this.dispatchEvent(new CustomEvent('denim-settings-close', { bubbles: true, composed: true }));
  }

  renderGeneral() {
    return html`<ta-form data-general .schema=${this.schema} .values=${this.initial} submit-on-enter @ta-submit=${() => this.onSave()}></ta-form>`;
  }

  renderTab(tab) {
    const props = { settings: this.settings, isOpen: this.open, ...this.tabCallbacks(tab.key) };
    return renderOverride(this, `tab:${tab.key}`, tab.render ?? tab.Component, props);
  }

  render() {
    const tabs = this.tabs ?? [];
    return html`<wa-dialog
      class="ta-dialog denim-settings"
      label="Settings"
      ?open=${this.open}
      @wa-hide=${(e) => {
        if (e.target === e.currentTarget) this.close();
      }}
    >
      ${!this.open
        ? nothing
        : tabs.length === 0
          ? this.renderGeneral()
          : html`<wa-tab-group class="denim-settings-tabs">
              <wa-tab slot="nav" panel="general">General</wa-tab>
              ${tabs.map((t) => html`<wa-tab slot="nav" panel=${t.key} data-tab=${t.key}>${t.label ?? t.headerText}</wa-tab>`)}
              <wa-tab-panel name="general">${this.renderGeneral()}</wa-tab-panel>
              ${tabs.map((t) => html`<wa-tab-panel name=${t.key}>${this.renderTab(t)}</wa-tab-panel>`)}
            </wa-tab-group>`}
      ${this.error ? html`<span slot="footer" class="denim-settings-error" role="alert" data-error>${this.error}</span>` : nothing}
      <wa-button slot="footer" appearance="outlined" data-cancel @click=${() => this.close()}>Cancel</wa-button>
      <wa-button slot="footer" variant="brand" data-save ?loading=${this.saving} @click=${() => this.onSave()}>Save</wa-button>
    </wa-dialog>`;
  }
}

define('denim-settings', DenimSettings);
