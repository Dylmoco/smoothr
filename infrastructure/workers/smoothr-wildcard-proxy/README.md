# smoothr-wildcard-proxy

Cloudflare Worker that forwards all `*.smoothr.io` traffic to `smoothr.pages.dev`.

## Deploying

1. Install [Wrangler](https://developers.cloudflare.com/workers/wrangler/).
2. Update `wrangler.toml` with your Cloudflare `account_id` and `zone_id`.
3. Deploy the worker:

```bash
cd infrastructure/workers/smoothr-wildcard-proxy
wrangler deploy
```
