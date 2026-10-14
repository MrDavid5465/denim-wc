// <denim-splash>: full-page splash shown while the shell waits for the
// backend (`status` explains a wait; the shell polls and recovers by itself).
import { html, nothing, svg } from 'lit';
import { TaElement, define, renderOverride } from '../../typical-admin-wc/index.js';

const DEFAULT_LOGO = html`<svg viewBox="0 0 80 80" width="72" height="72" fill="currentColor" aria-hidden="true">
  ${svg`<path d="M 24 73 A 32 32 0 1 1 56 73 L 50 62 A 20 20 0 1 0 30 62 Z"/><path d="M 42 44 L 41 48 L 38 46 L 32 22 Z"/><circle cx="40" cy="45" r="3"/>`}
</svg>`;

export class DenimSplash extends TaElement {
  static properties = {
    logo: { attribute: false },
    heading: {},
    status: {},
  };

  constructor() {
    super();
    this.logo = undefined;
    this.heading = '';
    this.status = '';
  }

  render() {
    return html`<div class="denim-splash-body" role="status" aria-live="polite">
      <div class="denim-splash-logo">${this.logo ? renderOverride(this, 'logo', this.logo, {}) : DEFAULT_LOGO}</div>
      ${this.heading ? html`<strong>${this.heading}</strong>` : nothing}
      <wa-spinner style="font-size: 1.5rem"></wa-spinner>
      <div class="denim-splash-status" data-status>${this.status}</div>
    </div>`;
  }
}

define('denim-splash', DenimSplash);
