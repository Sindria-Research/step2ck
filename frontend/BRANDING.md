# Branding & logos

## Where to put logos

Place your logo files in the **`frontend/public/`** folder so they are served at the root path:

| File | Use |
|------|-----|
| `logo.svg` | Fallback when theme is unknown (e.g. favicon). |
| `logo-light.svg` | Used in **light** theme (sidebar, landing, login). |
| `logo-dark.svg` | Used in **dark** theme (sidebar, landing, login). |

The app uses **`getLogoUrl(theme)`** from `src/config/branding.ts` to pick the correct asset. If you only have one logo, put it as `logo.svg` and set `VITE_LOGO_URL=/logo.svg` (or use both `logo-light.svg` and `logo-dark.svg` for theme-aware branding).

## Env overrides (optional)

In `.env` or `.env.local` you can override paths:

- `VITE_LOGO_URL` – single logo (e.g. `/logo.svg`)
- `VITE_LOGO_LIGHT_URL` – light theme logo (default: `/logo-light.svg`)
- `VITE_LOGO_DARK_URL` – dark theme logo (default: `/logo-dark.svg`)
- `VITE_APP_NAME` – app name (default: `step2ck`)
- `VITE_APP_TAGLINE` – short tagline (default: `Step 2 CK preparation`)

Replace the placeholder SVGs in `public/` with your own files; no code changes needed.
