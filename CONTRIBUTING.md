# Contributing

## Offline dependency installation

If your environment cannot reach the public npm registry you can still install dependencies in two ways:

1. **Pre-bundled `node_modules`**
   - On a machine with network access run `npm install` for the repository root and each workspace.
   - Archive the resulting `node_modules` directories and copy them to the target machine.
   - Extract the archives so that each workspace already contains a populated `node_modules` folder.
   - The `pretest` script in `storefronts/package.json` will detect the folder and skip `npm install` when tests run.

2. **Local npm registry**
   - Set up a private npm registry (e.g. using [Verdaccio](https://verdaccio.org/)) and mirror required packages while online.
   - Point npm to the registry with:
     ```bash
     npm set registry http://<local-registry-host>:4873
     ```
   - Run `npm install` as usual which will now resolve packages from the local registry.

Both approaches avoid external network traffic when preparing dependencies.
