# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]
- Added a readiness poll for Authorize.Net card fields that errors if iframe injection fails.
- Removed the readiness poll for Authorize.Net card fields.
- Added debug logging feature controlled by `SMOOTHR_DEBUG` and documented the setting in the README.
- Simplified test commands so running `npm test` from the repository root executes all package tests.
- Documented Supabase testing instructions including the `OPENEXCHANGERATES_TOKEN` requirement.
- Fixed Stripe iframe width issues using the `forceStripeIframeStyle` helper.
- Added logging for Authorize.Net Accept.js responses and a timeout warning if dispatchData does not fire.

