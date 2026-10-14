// <denim-photo>: pick (or drop) an image, crop it, save it as base64 PNG.
//
//   <denim-photo .image=${project.cover ?? ''} name="cover"
//     .submit=${(base64) => save({ cover: base64 || null })}></denim-photo>
//
// `image` is base64 with or without a `data:` prefix; `submit` receives the
// cropped PNG as base64 WITHOUT the prefix, or '' when removed. It never talks
// to the server itself. Browsers apply EXIF orientation when decoding, so
// phone photos come out upright without an EXIF library.
import { html, nothing } from 'lit';
import { TaElement, define, icon, confirmAsync } from '../../typical-admin-wc/index.js';

export class DenimPhoto extends TaElement {
  static properties = {
    image: {},
    name: {},
    icon: {},
    label: {},
    aspect: { type: Number },
    maxSize: { type: Number, attribute: 'max-size' },
    maxBytes: { type: Number, attribute: 'max-bytes' },
    disabled: { type: Boolean },
    submit: { attribute: false },
    picked: { state: true },
    crop: { state: true },
    error: { state: true },
    dragOver: { state: true },
  };

  constructor() {
    super();
    this.image = '';
    this.name = 'photo';
    this.icon = 'image';
    this.label = 'Photo';
    this.aspect = 1;
    this.maxSize = 512;
    this.maxBytes = 10 * 1024 * 1024;
    this.disabled = false;
    this.submit = undefined;
    this.picked = null; // data URL being cropped
    this.crop = null; // { x, y, w, h } in displayed pixels
    this.error = '';
    this.dragOver = false;
  }

  get src() {
    if (!this.image) return '';
    return this.image.startsWith('data:') ? this.image : `data:image/png;base64,${this.image}`;
  }

  pickFile() {
    this.querySelector('input[type=file]')?.click();
  }

  async load(file) {
    this.error = '';
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      this.error = 'Choose an image file (PNG or JPEG).';
      return;
    }
    if (file.size > this.maxBytes) {
      this.error = `That image is larger than ${Math.round(this.maxBytes / 1024 / 1024)} MB.`;
      return;
    }
    this.picked = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });
    this.crop = null;
  }

  onImgLoad(e) {
    // Largest centered box with the requested aspect ratio.
    const img = e.target;
    const W = img.clientWidth;
    const H = img.clientHeight;
    const a = this.aspect || 1;
    let w = W;
    let h = w / a;
    if (h > H) {
      h = H;
      w = h * a;
    }
    this.crop = { x: (W - w) / 2, y: (H - h) / 2, w, h };
  }

  startDrag(e, mode) {
    e.preventDefault();
    e.stopPropagation();
    const img = this.querySelector('.denim-crop img');
    const start = { px: e.clientX, py: e.clientY, ...this.crop };
    const W = img.clientWidth;
    const H = img.clientHeight;
    const a = this.aspect || 1;
    const move = (ev) => {
      const dx = ev.clientX - start.px;
      const dy = ev.clientY - start.py;
      if (mode === 'move') {
        this.crop = {
          ...this.crop,
          x: Math.min(Math.max(0, start.x + dx), W - start.w),
          y: Math.min(Math.max(0, start.y + dy), H - start.h),
        };
      } else {
        let w = Math.max(24, start.w + Math.max(dx, dy * a));
        w = Math.min(w, W - start.x, (H - start.y) * a);
        this.crop = { ...this.crop, w, h: w / a };
      }
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  async saveCrop() {
    const img = this.querySelector('.denim-crop img');
    if (!img || !this.crop) return;
    const scale = img.naturalWidth / img.clientWidth;
    const sw = this.crop.w * scale;
    const sh = this.crop.h * scale;
    const factor = Math.min(1, this.maxSize / Math.max(sw, sh));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(sw * factor);
    canvas.height = Math.round(sh * factor);
    canvas.getContext('2d').drawImage(img, this.crop.x * scale, this.crop.y * scale, sw, sh, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/png').split(',')[1];
    await this.commit(base64);
    this.picked = null;
  }

  async commit(base64) {
    this.error = '';
    try {
      await this.submit?.(base64);
      this.image = base64;
      this.dispatchEvent(new CustomEvent('denim-photo-change', { detail: { image: base64 }, bubbles: true, composed: true }));
    } catch (e) {
      this.error = e?.message ?? 'Saving the image failed.';
    }
  }

  async removeImage() {
    if (await confirmAsync('Remove this image?', { title: 'Remove image', confirmText: 'Remove', danger: true })) await this.commit('');
  }

  render() {
    const fileInput = html`<input
      type="file"
      accept="image/png,image/jpeg,image/webp"
      hidden
      @change=${(e) => {
        this.load(e.target.files?.[0]);
        e.target.value = '';
      }}
    />`;
    if (this.picked) {
      const c = this.crop;
      return html`<div class="denim-photo" style=${`--denim-photo-aspect:${this.aspect}`}>
        <div class="denim-crop">
          <img src=${this.picked} alt="Image to crop" @load=${this.onImgLoad} draggable="false" />
          ${c
            ? html`<div
                class="denim-crop-box"
                style=${`left:${c.x}px;top:${c.y}px;width:${c.w}px;height:${c.h}px`}
                @pointerdown=${(e) => this.startDrag(e, 'move')}
              >
                <div class="denim-crop-handle" @pointerdown=${(e) => this.startDrag(e, 'resize')}></div>
              </div>`
            : nothing}
        </div>
        <div class="denim-photo-actions">
          <wa-button variant="brand" data-crop-save @click=${() => this.saveCrop()}>${icon('crop', { slot: 'start' })}Crop and save</wa-button>
          <wa-button appearance="outlined" data-crop-cancel @click=${() => (this.picked = null)}>Cancel</wa-button>
        </div>
        ${this.error ? html`<div class="ta-field-error" role="alert">${this.error}</div>` : nothing} ${fileInput}
      </div>`;
    }
    return html`<div class="denim-photo" style=${`--denim-photo-aspect:${this.aspect}`}>
      <div
        class="denim-photo-frame ${this.dragOver ? 'denim-drop' : ''}"
        @dragover=${(e) => {
          e.preventDefault();
          this.dragOver = true;
        }}
        @dragleave=${() => (this.dragOver = false)}
        @drop=${(e) => {
          e.preventDefault();
          this.dragOver = false;
          if (!this.disabled) this.load(e.dataTransfer?.files?.[0]);
        }}
      >
        ${this.src ? html`<img src=${this.src} alt=${this.label} data-photo />` : icon(this.icon === 'user' ? 'user' : 'image', { size: '3rem', label: `No ${this.label.toLowerCase()}` })}
      </div>
      ${this.disabled
        ? nothing
        : html`<div class="denim-photo-actions">
            <wa-button size="s" data-pick @click=${() => this.pickFile()}>${icon('image', { slot: 'start' })}${this.src ? 'Change' : 'Choose image'}</wa-button>
            ${this.src
              ? html`<wa-button size="s" appearance="outlined" href=${this.src} download=${`${this.name || 'photo'}.png`} data-download
                    >${icon('download', { slot: 'start' })}Download</wa-button
                  ><wa-button size="s" appearance="outlined" variant="danger" data-remove @click=${() => this.removeImage()}
                    >${icon('trash', { slot: 'start' })}Remove</wa-button
                  >`
              : nothing}
          </div>`}
      ${this.error ? html`<div class="ta-field-error" role="alert">${this.error}</div>` : nothing} ${fileInput}
    </div>`;
  }
}

define('denim-photo', DenimPhoto);
