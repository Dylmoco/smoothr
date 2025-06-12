# Smoothr SaaS Monorepo

This repository contains all code for Smoothr, structured as a modular SaaS platform. Each top-level directory groups frontend storefront features, shared backend utilities, and the admin dashboard.

## Directory Overview

- **/storefronts/** – Client-facing storefront code and widgets.
  - **/core/** – Core storefront modules such as orders, returns, reviews, analytics, discounts, currency, affiliates, customer dashboard, abandoned cart, and subscriptions.
  - **/platforms/** – Adapters for various web builder platforms.
  - **/clonables/** – Embeddable widgets and plug‑and‑play code.
- **/shared/** – Server-side logic for orders, returns, reviews, analytics, discounts, currency, affiliates, abandoned cart, subscriptions, and Supabase helpers.
- **/smoothr/** – Next.js admin dashboard application.
  - **/admin-modules/** – Admin views for orders, returns, reviews, analytics, discounts, currency, affiliates, dashboard, abandoned cart, and subscriptions.
- **.gitignore** – Ignore Node modules, logs, env files, and build output.

This README serves as the source of truth for new developers on how the repository is organized and where modules belong.
