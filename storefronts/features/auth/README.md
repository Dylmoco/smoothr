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
<form data-smoothr="auth-form">
  <input type="email" data-smoothr="email" />
  <input type="password" data-smoothr="password" />
  <div data-smoothr="sign-in">Sign In</div>
</form>
<form data-smoothr="auth-form">
  <input type="email" data-smoothr="email" />
  <input type="password" data-smoothr="password" />
  <input type="password" data-smoothr="confirm-password" />
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
<div data-smoothr="sign-in">Sign In</div>
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

### `[data-smoothr="sign-in"]`

```html
<div data-smoothr="sign-in">Sign In</div>
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

### `[data-smoothr="request-password-reset"]`

```html
<div data-smoothr="request-password-reset">Send reset link</div>
```

### `[data-smoothr="submit-reset-password"]`

```html
<div data-smoothr="reset-password">
  <form data-smoothr="auth-form">
    <input type="password" data-smoothr="password" />
    <input type="password" data-smoothr="confirm-password" />
    <div data-smoothr="submit-reset-password">Set new password</div>
  </form>
</div>
```

## Signup

Attach `[data-smoothr="sign-up"]` to an element inside a
`[data-smoothr="auth-form"]` containing `[data-smoothr="email"]`,
`[data-smoothr="password"]` and a matching `[data-smoothr="confirm-password"]`
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

## Reset Password

The SDK supports both pop-up and full-page reset experiences. Triggers marked
`[data-smoothr="request-password-reset"]` send the recovery email via the
Smoothr broker. A wrapper labelled `[data-smoothr="reset-password"]` opens the
reset view when present on the page. Inside that wrapper place a form with the
new password fields and a `[data-smoothr="submit-reset-password"]` trigger.

### Pop-up markup

```html
<div data-smoothr="auth-pop-up" data-smoothr-autoclass="1">
  <div data-smoothr="reset-password">
    <form data-smoothr="auth-form">
      <input type="password" data-smoothr="password" />
      <input type="password" data-smoothr="confirm-password" />
      <div data-smoothr="submit-reset-password">Set new password</div>
    </form>
  </div>
</div>
```

### Dedicated page fallback

```html
<div data-smoothr="reset-password">
  <form data-smoothr="auth-form">
    <input type="password" data-smoothr="password" />
    <input type="password" data-smoothr="confirm-password" />
    <div data-smoothr="submit-reset-password">Set new password</div>
  </form>
</div>
<script type="module">
  import { initAuth } from './auth/index.js';
  initAuth();
</script>
```

Submitting the request form validates the email and shows an inline success
message. Setting a new password requires a strong value (8+ characters with at
least one letter and number) that matches the confirmation field. After a
successful update the SDK performs session bridging and either redirects to the
configured sign-in URL or emits `smoothr:auth:close`.

## Migration Notes

The SDK still accepts legacy attribute names for backward compatibility, but
new integrations should use the updated forms:

| Legacy | Preferred |
| --- | --- |
| `data-smoothr="login"` | `data-smoothr="sign-in"` |
| `data-smoothr="password-reset"` | `data-smoothr="request-password-reset"` |
| `data-smoothr="password-reset-confirm"` | `data-smoothr="submit-reset-password"` |
| `data-smoothr="password-confirm"` | `data-smoothr="confirm-password"` |

The reset confirmation UI may also be wrapped in
`data-smoothr="reset-password"` to scope styles and behaviour.

**GSAP hook:** listen for `smoothr:auth:open`, `smoothr:auth:close`, and
`smoothr:auth:error` on `window` or `document` to drive animations.
