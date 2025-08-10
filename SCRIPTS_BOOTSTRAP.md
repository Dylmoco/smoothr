# Bootstrap Profiles

## Default: `npm run bootstrap:full`
- Installs deps, runs import guards, builds all workspaces (Next + Vite).
- Use for tasks that **touch server code**, Next API routes, or any build/test.

## Fast: `npm run bootstrap:fast`
- Installs deps and runs Supabase import guards only.
- **Skips builds and tests.**
- Use only for **file edits / refactors** that don’t require build outputs.
