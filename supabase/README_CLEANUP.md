# Supabase folder layout (post-cleanup)

```
smoothr/supabase/
├─ client/                     # SDK/browser-only helpers (re-exported by top-level shims)
│  ├─ browserClient.js
│  └─ authHelpers.js
├─ functions/                  # Edge functions (Deno)
│  ├─ _shared/                 # Shared Deno utilities for functions
│  └─ <function-name>/
├─ policies/                   # RLS policies (source of truth)
├─ migrations/                 # SQL migrations (from CLI / db diff)
├─ seeds/                      # Local seeds (optional)
├─ types/                      # Generated DB types (optional)
├─ .gitignore                  # ignores .temp/, bundles
└─ (shims) authHelpers.js, browserClient.js -> re-export from client/*
```

Notes:
- **RLS** lives only under `policies/`. Root `rls-policies*.sql` was removed to avoid drift.
- **SDK/browser** helpers separated into `client/`. Keep using existing imports; shims re-export from the new location.
- **Edge functions** must not import monorepo server code; see guard scripts.

