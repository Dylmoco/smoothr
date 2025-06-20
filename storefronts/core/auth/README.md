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
  <input type="password" data-smoothr-input="password-confirm" />
  <div data-smoothr-password-strength></div>
  <div data-smoothr-error hidden></div>
  <div data-smoothr-success hidden></div>
  <button type="submit">Create Account</button>
</form>
<div data-smoothr="login-google">Sign in with Google</div>
<div data-smoothr="signup-google">Sign up with Google</div>
<div data-smoothr="logout">Logout</div>
```

Error and success containers (`[data-smoothr-error]` and `[data-smoothr-success]`)
can live anywhere near the element that triggers the action. The SDK walks up
the DOM from the clicked element to find the closest container before falling
back to `alert()` and logging a message to the console if none exists.

Both flows dispatch `smoothr:login` and `smoothr:logout` DOM events.

## `[data-smoothr]` attributes

Any element with a `[data-smoothr]` attribute can trigger an action. Place the
required inputs (for example email and password fields) inside a parent form or
container. The SDK automatically attaches handlers on page load and uses a
`MutationObserver` so elements added later are also bound.

### `[data-smoothr="login"]`

```html
<div data-smoothr="login">Sign In</div>
<button data-smoothr="login">Sign In</button>
<a href="#" data-smoothr="login">Sign In</a>
```

### `[data-smoothr="signup"]`

```html
<button data-smoothr="signup">Create Account</button>
```

### `[data-smoothr="login-google"]`

```html
<button data-smoothr="login-google">Sign in with Google</button>
```

### `[data-smoothr="signup-google"]`

```html
<button data-smoothr="signup-google">Sign up with Google</button>
```

### `[data-smoothr="logout"]`

```html
<a href="#" data-smoothr="logout">Logout</a>
```

### `[data-smoothr="password-reset"]`

```html
<button data-smoothr="password-reset">Send reset link</button>
```

### `[data-smoothr="password-reset-confirm"]`

```html
<form data-smoothr="password-reset-confirm">
  <input type="password" data-smoothr-input="password" />
  <input type="password" data-smoothr-input="password-confirm" />
  <button type="submit">Set new password</button>
</form>
```

## Signup

Attach `[data-smoothr="signup"]` to a form containing `email`, `password` and a
matching `password-confirm` input. A strength meter element labelled
`[data-smoothr-password-strength]` is optional but recommended. The SDK
validates email format, requires a strong password and ensures both password
fields match. When the signup succeeds a confirmation message is shown and the
user is redirected after a short delay.

Environment variables required are the same as for login:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

`signInWithGoogle()` sets the `redirectTo` parameter to
`\`${window.location.origin}/auth/callback\``, so Google OAuth returns users to
the same subdomain. Ensure this origin appears
in the Supabase dashboard under **Authentication → URL Configuration → Additional Redirect URLs** or the login will fail.

## Supabase URL configuration

Open your Supabase project and navigate to **Authentication → URL Configuration**.
Add your client domain in the **Site URL** field and include the full path that
handles the OAuth callback under **Additional Redirect URLs**, for example:

```
https://your-site.com/auth/callback
```

Ensure this callback URL appears in the list or Supabase will reject the login
attempt.

## Google OAuth login

Call `signInWithGoogle()` to start an OAuth flow with Google. You can invoke the
function directly or attach `[data-smoothr="login-google"]` or `[data-smoothr="signup-google"]` to any element as
shown above.

Because the `redirectTo` URL is set to the current subdomain, the OAuth flow
automatically returns to whatever site the user started on. After Supabase
completes authentication the login event fires and the final redirect is
determined by the store settings described earlier.
The helper `lookupRedirectUrl('login')` queries the `stores` table for the
current domain and resolves the post-login URL. If no matching row exists the
SDK falls back to `/` on the current site.

If users are redirected to the wrong domain ensure `window.location.origin` is
included in your Supabase redirect URLs.

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

## Password reset

To send password reset emails the SDK provides a `requestPasswordReset` helper
and binds forms marked with `[data-smoothr="password-reset"]`. The reset link in
the email must point to a page that calls `initPasswordResetConfirmation()` so
the user can set a new password.

Set `NEXT_PUBLIC_SUPABASE_PASSWORD_RESET_REDIRECT_URL` in your `.env` file to
the URL of that confirmation page:

```bash
NEXT_PUBLIC_SUPABASE_PASSWORD_RESET_REDIRECT_URL=https://your-site.com/reset
```

### Request form markup

```html
<form data-smoothr="password-reset">
  <input type="email" data-smoothr-input="email" />
  <button type="submit">Send reset link</button>
</form>
```

### Confirmation page markup

```html
<form data-smoothr="password-reset-confirm">
  <input type="password" data-smoothr-input="password" />
  <input type="password" data-smoothr-input="password-confirm" />
  <button type="submit">Set new password</button>
</form>
<script type="module">
  import { initAuth, initPasswordResetConfirmation } from './auth/index.js';
  initAuth();
  initPasswordResetConfirmation({ redirectTo: '/' });
</script>
```

Submitting the request form validates the email and shows an inline success or
error message. On the confirmation page the password strength meter updates as
the user types. The new password must be strong and match the confirmation
field. After a successful update the page redirects after a short delay.

## Rebuilding and deploying

After updating environment variables run `vite build` from the `storefronts`
workspace to rebuild `dist/smoothr-sdk.js`. Deploy the updated file to your
hosting platform so clients receive the corrected redirect settings.
