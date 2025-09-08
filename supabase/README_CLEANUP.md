# Supabase folder layout (post-cleanup)

```
smoothr/supabase/
├─ client/                     # SDK/browser-only helpers (re-exported by top-level shims)
│  ├─ browserClient.js
│  └─ authHelpers.js
├─ functions/                  # Edge functions (Deno)
│  ├─ _shared/                 # Shared Deno utilities for functions (no duplicated logic)
│  └─ <function-name>/
├─ policies/                   # RLS policies (source of truth)
├─ migrations/                 # SQL migrations (from CLI / db diff)
├─ seeds/                      # Local seeds (empty, keep .gitkeep)
├─ types/                      # Generated DB types (empty, keep .gitkeep)
├─ .gitignore                  # ignores .temp/, bundles
└─ (shims) authHelpers.js, browserClient.js -> re-export from client/*
```

Notes:
- **RLS** lives only under `policies/`. Archived SQL dumps removed.
- **SDK/browser** helpers live in `client/` with top-level shims for backward compatibility.
- `_shared/` helpers re-export from `shared/` when available to avoid duplication.
- `seeds/` and `types/` are intentionally empty aside from `.gitkeep`.
- **Edge functions** must not import monorepo server code; see guard scripts..
