#!/bin/bash
set -e

npm ci
npm run build --workspace storefronts --workspace shared
