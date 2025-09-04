# auth

Authentication utilities powered by Supabase. Attach `[data-smoothr]`
attributes to trigger login and sign-out from any storefront.

> **Why use a `div` for the login button?**
> Webflow blocks password form submissions on `.webflow.io` domains. By never
> triggering a native submit event, this pattern works seamlessly on both
> staging and production sites..

## Redirect lookup

After a successful login or sign-out the SDK queries the `stores` table in
Supabase to find redirect URLs for the current domain. It matches on the
`store_domain` column, normalizing `window.location.hostname` by stripping
`www.` and lowercasing.

If a row exists, it uses the `login_redirect_url` or `sign-out_redirect_url`
columns. If nothing is configured or the domain is not found, the user is
redirected to the site root (`/` or `window.location.origin`).

Required columns in the `stores` table:

- `store_domain` – domain of the storefront
- `login_redirect_url` – URL to redirect after login
- `sign-out_redirect_url` – URL to redirect after sign-out


## Usage

The storefront SDK automatically initializes authentication when loaded. In
Webflow or other drop-in platforms simply include the script tag:

```html
<script type="module" src="https://sdk.smoothr.io/smoothr-sdk.mjs"></script>
```

No additional JavaScript configuration is required. For advanced use you can
still call `initAuth()` manually:

```javascript
import { initAuth } from './auth/index.js';

initAuth();
```

Markup example:

```html
<form data-smoothr="auth-form">
  <input type="email" data-smoothr="email" />
  <input type="password" data-smoothr="password" />
  <div data-smoothr="login">Sign In</div>
</form>
<form data-smoothr="auth-form">
  <input type="email" data-smoothr="email" />
  <input type="password" data-smoothr="password" />
  <input type="password" data-smoothr="password-confirm" />
  <div data-smoothr-password-strength></div>
  <div data-smoothr-error hidden></div>
  <div data-smoothr-success hidden></div>
  <div data-smoothr="sign-up">Create Account</div>
</form>
<div data-smoothr="login-google">Sign in with Google</div>
<div data-smoothr="login-apple">Sign in with Apple</div>
<div data-smoothr="sign-out">Sign Out</div>
```

While a request is in progress the trigger element is disabled and its text is
temporarily replaced with `Loading...`. Style this state using the
`data-original-text` attribute applied during the request:

```html
<div data-smoothr="login">Sign In</div>
<style>
  [data-smoothr][data-original-text] {
    opacity: 0.5;
  }
</style>
```

Error and success containers (`[data-smoothr-error]` and `[data-smoothr-success]`)
can live anywhere near the element that triggers the action. The SDK walks up
the DOM from the clicked element to find the closest container before falling
back to `alert()` and logging a message to the console if none exists.

Both flows dispatch `smoothr:login` and `smoothr:sign-out` DOM events.

## `[data-smoothr]` attributes

Any element with a `[data-smoothr]` attribute can trigger an action. Place the
required inputs (for example fields marked `[data-smoothr="email"]` and
`[data-smoothr="password"]`) inside a parent form or container. The SDK
automatically attaches handlers on page load and uses a `MutationObserver` so
elements added later are also bound.

### `[data-smoothr="login"]`

```html
<div data-smoothr="login">Sign In</div>
```

### `[data-smoothr="sign-up"]`

```html
<div data-smoothr="sign-up">Create Account</div>
```

### `[data-smoothr="login-google"]`

```html
<div data-smoothr="login-google">Sign in with Google</div>
```

### `[data-smoothr="login-apple"]`

```html
<div data-smoothr="login-apple">Sign in with Apple</div>
```

### `[data-smoothr="sign-out"]`

```html
<div data-smoothr="sign-out">Sign Out</div>
```

### `[data-smoothr="password-reset"]`

```html
<div data-smoothr="password-reset">Send reset link</div>
```

### `[data-smoothr="password-reset-confirm"]`

```html
<form data-smoothr="auth-form">
  <input type="password" data-smoothr="password" />
  <input type="password" data-smoothr="password-confirm" />
  <div data-smoothr="password-reset-confirm">Set new password</div>
</form>
```

## Signup

Attach `[data-smoothr="sign-up"]` to an element inside a
`[data-smoothr="auth-form"]` containing `[data-smoothr="email"]`,
`[data-smoothr="password"]` and a matching `[data-smoothr="password-confirm"]`
input. A strength meter element labelled `[data-smoothr-password-strength]` is
optional but recommended. The SDK
validates email format, requires a strong password and ensures both password
fields match. When the sign-up succeeds a confirmation message is shown and the
user is redirected after a short delay.

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

## Apple OAuth login

Call `signInWithApple()` to start an OAuth flow with Apple. You can invoke the
function directly or attach `[data-smoothr="login-apple"]` to any element as
shown above.

The SDK redirects users to the URL defined by the
`NEXT_PUBLIC_SUPABASE_OAUTH_REDIRECT_URL` environment variable. After Supabase
completes authentication the user returns to that page, the login event fires,
and the final redirect is determined by the store settings described earlier.

## Accessing the current user

`initAuth()` retrieves the existing session and exposes it on
`window.smoothr.auth.user.value`. The value is `null` if no user is logged in.
After `initAuth()` resolves (or after automatic initialization when loading
the SDK) you can check whether someone is logged in by reading:

```javascript
window.smoothr?.auth?.user?.value !== null
```

This property is `undefined` before initialization, so ensure `initAuth()` has
completed before relying on it.

## Password reset

To send password reset emails the SDK provides a `requestPasswordReset` helper
and binds triggers marked `[data-smoothr="password-reset"]` inside a form
labelled `[data-smoothr="auth-form"]`. The reset link in
the email must point to a page that calls `initPasswordResetConfirmation()` so
the user can set a new password.

Set `NEXT_PUBLIC_SUPABASE_PASSWORD_RESET_REDIRECT_URL` in your `.env` file to
the URL of that confirmation page:

```bash
NEXT_PUBLIC_SUPABASE_PASSWORD_RESET_REDIRECT_URL=https://your-site.com/reset
```

### Request form markup

```html
<form data-smoothr="auth-form">
  <input type="email" data-smoothr="email" />
  <div data-smoothr="password-reset">Send reset link</div>
</form>
```

### Confirmation page markup

```html
<form data-smoothr="auth-form">
  <input type="password" data-smoothr="password" />
  <input type="password" data-smoothr="password-confirm" />
  <div data-smoothr="password-reset-confirm">Set new password</div>
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
