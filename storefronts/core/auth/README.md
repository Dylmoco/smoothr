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
<form data-smoothr="signup">
  <input type="email" data-smoothr-input="email" />
  <input type="password" data-smoothr-input="password" />
  <button type="submit">Create Account</button>
</form>
<div data-smoothr="login-google">Sign in with Google</div>
<div data-smoothr="logout">Logout</div>
```

Both flows dispatch `smoothr:login` and `smoothr:logout` DOM events.

## Signup

Attach `[data-smoothr="signup"]` to a form containing `email` and `password`
inputs. The SDK intercepts the submit event, validates the fields and calls
`supabase.auth.signUp()` under the hood. On success the user is automatically
logged in and redirected using the same logic as the login flow.

Environment variables required are the same as for login:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_OAUTH_REDIRECT_URL`

## Google OAuth login

Call `signInWithGoogle()` to start an OAuth flow with Google. You can invoke the
function directly or attach `[data-smoothr="login-google"]` to any element as
shown above.

The SDK redirects users to the URL defined by the
`NEXT_PUBLIC_SUPABASE_OAUTH_REDIRECT_URL` environment variable. After Supabase
completes authentication the user returns to that page, the login event fires,
and the final redirect is determined by the store settings described earlier.

## Accessing the current user

`initAuth()` retrieves the existing session and exposes it on
`window.smoothr.auth.user`. The value is `null` if no user is logged in.
After `initAuth()` resolves (or after automatic initialization when loading
the SDK) you can check whether someone is logged in by reading:

```javascript
window.smoothr?.auth?.user !== null
```

This property is `undefined` before initialization, so ensure `initAuth()` has
completed before relying on it.
