/**
 * Branding: app name, tagline, logos. Set VITE_LOGO_LIGHT_URL and VITE_LOGO_DARK_URL
 * (e.g. /logo-light.svg, /logo-dark.svg) or drop files in public/. Fallback: single LOGO_URL.
 */
export const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'step2ck';
export const APP_TAGLINE = import.meta.env.VITE_APP_TAGLINE ?? 'Step 2 CK preparation';

const LOGO_LIGHT = import.meta.env.VITE_LOGO_LIGHT_URL ?? import.meta.env.VITE_LOGO_URL ?? '/logo-light.svg';
const LOGO_DARK = import.meta.env.VITE_LOGO_DARK_URL ?? import.meta.env.VITE_LOGO_URL ?? '/logo-dark.svg';

/** Single logo (e.g. for favicon or when theme is unknown). */
export const LOGO_URL = import.meta.env.VITE_LOGO_URL ?? '/logo.svg';

/** Logo URL for current theme. Use in Header, Landing, Login. */
export function getLogoUrl(theme: 'light' | 'dark'): string {
  return theme === 'dark' ? LOGO_DARK : LOGO_LIGHT;
}
