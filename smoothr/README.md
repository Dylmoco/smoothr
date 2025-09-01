# smoothr

Next.js admin dashboard application.

## Running tests

This workspace currently has no automated tests. If you add any in the future,
ensure `vitest` is listed in `devDependencies` and run `npm install` in this
directory before executing `npm test` from the repository root.

## Store branding

The auth pages support per-store theming via the `store_branding` table. The
following fields are used, falling back to sensible defaults if absent:

- `logo_url` – logo image URL *(default: none)*
- `primary_color` – primary brand color *(default: `#0E7AFE`)*
- `bg_color` – page background *(default: `#FFFFFF`)*
- `text_color` – main text color *(default: `#111111`)*
- `muted_color` – hint text color *(default: `#666666`)*
- `btn_radius` – button border radius in pixels *(default: `8`)*
- `font_family` – CSS font stack *(default: `Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif`)*
- `custom_css_url` – optional stylesheet URL *(default: none)*

Any missing values will use the defaults shown above.
