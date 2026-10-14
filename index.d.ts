// Type declarations for denim-wc.
import type { TaElement, FormSchema, SlotComponent } from '../typical-admin-wc/index.js';
import type { ApolloClient } from '@apollo/client';

export { confirmAsync, setConfirmHandler, toast } from '../typical-admin-wc/index.js';

export interface AppLink {
  /** Sub-path below the app ('' = the app root). */
  path: string;
  text: string;
}
export interface Application {
  /** Label in the header and the app switcher. */
  name: string;
  /** URL segment: the app owns /<path>/*. */
  path: string;
  /** /<path> exactly redirects to /<path>/<defaultRoute>; '' for none. */
  defaultRoute: string;
  /** Key into `components`. */
  frontEnd: string;
  links: AppLink[];
}
/** @deprecated React name. */
export type IApplication = Application;

export interface ShellSettings {
  launchPage: string;
  /** '<mode>-<color>', e.g. 'dark-green'. */
  theme: string;
  fontSize: number;
  [key: string]: any;
}
export const DEFAULT_SETTINGS: Readonly<ShellSettings>;
export const SETTINGS_KEY: string;
export function readLocalSettings(defaults?: Partial<ShellSettings>): ShellSettings;
export function writeLocalSettings(settings: Partial<ShellSettings>): boolean;
export function effectiveSettings(opts: { defaults?: Partial<ShellSettings>; server?: Record<string, any> | null; source: 'local' | 'server' }): ShellSettings;
export function withoutNulls<T extends object>(obj: T): Partial<T>;

/** What an app component receives (as properties, or as the render function's argument). */
export interface AppContext {
  app: Application;
  /** Mount path: '/<path>' or '/kiosk/<path>' (pass it to <ta-admin base>; createAdmin does). */
  base: string;
  kiosk: boolean;
  settings: ShellSettings;
  shell: DenimShell;
}
export interface SettingsTabContext {
  settings: ShellSettings;
  isOpen: boolean;
  /** This tab's contribution to the one save; isValid=false blocks Save and shows `message`. */
  onChange(patch: Record<string, any>, isValid?: boolean, message?: string): void;
  /** Runs after the settings are saved (your own mutations). */
  registerSave(save: (() => void | Promise<void>) | undefined): void;
}
export interface SettingsTab {
  key: string;
  label: string;
  /** Render function or custom-element tag (gets the context as properties). */
  render: string | ((ctx: SettingsTabContext) => unknown);
}

export class DenimShell extends TaElement {
  /** Static app list; when unset, `my.applications` is queried. */
  applications?: Application[];
  /** frontEnd -> component (render function, element class or tag), e.g. the result of createAdmin(). */
  components: Record<string, SlotComponent | ((ctx: AppContext) => unknown)>;
  settingsSource: 'local' | 'server';
  defaultSettings: Partial<ShellSettings>;
  /** Extra AppSettings fields to select (server mode), space-separated. */
  settingsFields: string;
  settingsTabs: SettingsTab[];
  /** Extra form fields on the General tab (a typical-admin-wc form schema). */
  settingsGeneralFields?: FormSchema;
  /** The '/' page (no header); also shown while the backend loads. */
  root?: SlotComponent;
  /** Header brand: text, render function or tag. */
  brand?: string | SlotComponent;
  appTitle: string;
  logo?: SlotComponent;
  controls?: SlotComponent;
  externalApps?: SlotComponent;
  /** Restrict the colour / mode choices. */
  colors?: string[];
  modes?: string[];
  favicon: boolean;
  /** Show the splash until the backend answers even without a server contract. */
  requireBackend: boolean;
  healthInterval: number;
  client?: ApolloClient;
  readonly settings: ShellSettings;
  readonly apps: Application[];
  saveSettings(values: Record<string, any>): Promise<void>;
  openSettings(): void;
}
/** The Settings dialog element (<denim-settings>). */
export class DenimSettings extends TaElement {
  open: boolean;
}
export class DenimSplash extends TaElement {
  heading: string;
  status: string;
}
export class DenimPhoto extends TaElement {
  /** base64, with or without a data: prefix. */
  image: string;
  name: string;
  icon: 'image' | 'user' | string;
  label: string;
  aspect: number;
  maxSize: number;
  maxBytes: number;
  disabled: boolean;
  /** Receives the cropped PNG as base64 (no prefix), or '' when removed. */
  submit?: (base64: string) => void | Promise<void>;
}

export function isLinkActive(pathname: string, appPath: string, linkPath: string): boolean;
export function linkHref(app: Application, link: AppLink): string;
export type ShellRoute =
  | { kind: 'app'; app: Application; base: string; sub: string; kiosk: boolean; redirect?: string }
  | { kind: 'root' }
  | { kind: 'notFound'; kiosk?: boolean };
export function resolveShellRoute(pathname: string, applications?: Application[]): ShellRoute;

export const COLOR_KEYS: string[];
export const COLOR_LABELS: Record<string, string>;
export const MODE_KEYS: Array<'light' | 'dark' | 'auto'>;
export const MODE_LABELS: Record<string, string>;
export const FONT_SIZES: Array<{ value: number; label: string }>;
export function themeKey(mode: string, color: string): string;
export function parseThemeKey(key: string | null | undefined): { mode: 'light' | 'dark' | 'auto'; color: string };
export function themeClasses(key: string, prefersDark?: boolean): { add: string[]; remove: string[]; dark: boolean };
export function applyTheme(settings: { theme?: string; fontSize?: number }, options?: { favicon?: boolean; root?: HTMLElement }): void;
export function setFaviconColor(color: string): void;

export function buildMyQuery(options?: { applications?: boolean; settings?: boolean; settingsFields?: string }): import('../typical-admin-wc/index.js').DocumentNode | null;
export const UPDATE_SETTINGS: import('../typical-admin-wc/index.js').DocumentNode;
export const APPLICATION_FIELDS: string;
export const DENIM_SETTINGS_FIELDS: string;
export const DENIM_CSS: string;
export function ensureDenimStyles(): void;

declare global {
  interface HTMLElementTagNameMap {
    'denim-shell': DenimShell;
    'denim-splash': DenimSplash;
    'denim-photo': DenimPhoto;
  }
}
