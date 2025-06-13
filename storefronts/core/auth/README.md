# auth

Authentication utilities powered by Supabase. Attach `[data-smoothr]`
attributes to trigger login and logout from any storefront.

> **Why use a `div` for the login button?**
> Webflow blocks password form submissions on `.webflow.io` domains. By never
> triggering a native submit event, this pattern works seamlessly on both
> staging and production sites.

## Redirect lookup

After a successful login or logout the SDK queries the `stores` table in
Supabase to find redirect URLs for the current domain. It matches on the
`store_domain` column, normalizing `window.location.hostname` by stripping
`www.` and lowercasing.

If a row exists, it uses the `login_redirect_url` or `logout_redirect_url`
columns. If nothing is configured or the domain is not found, the user is
redirected to the site root (`/` or `window.location.origin`).

Required columns in the `stores` table:

- `store_domain` – domain of the storefront
- `login_redirect_url` – URL to redirect after login
- `logout_redirect_url` – URL to redirect after logout


## Usage

The storefront SDK automatically initializes authentication when loaded. In
Webflow or other drop-in platforms simply include the script tag:

```html
<script type="module" src="https://sdk.smoothr.io/smoothr-sdk.js"></script>
```

No additional JavaScript configuration is required. For advanced use you can
still call `initAuth()` manually:

```javascript
import { initAuth } from './auth/index.js';

initAuth();
```

Markup example:

```html
<form data-smoothr="login-form">
  <input type="email" data-smoothr-input="email" />
  <input type="password" data-smoothr-input="password" />
  <div data-smoothr="login">Sign In</div>
</form>
<div data-smoothr="logout">Logout</div>
```

Both flows dispatch `smoothr:login` and `smoothr:logout` DOM events.
