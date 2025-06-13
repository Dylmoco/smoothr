# storefronts

Client-facing storefront code and widgets.

This package contains the core storefront modules located in `./core`.

The bundled SDK is designed for zero‑config installation on platforms like
Webflow. Simply include

```html
<script type="module" src="https://sdk.smoothr.io/smoothr-sdk.js"></script>
```

and authentication will initialize automatically.

## Core modules

- abandoned-cart
- affiliates
- analytics
- currency
- dashboard
- discounts
- orders
- returns
- reviews
- subscriptions

### Usage

```javascript
import * as core from './core/index.js';

core.discounts; // example access
```

## Running tests

Run `npm install` once before executing the test suite to ensure all dependencies are available.

```bash
npm install
npm test
```

`npm test` also triggers a `pretest` step that installs dependencies automatically if needed.
