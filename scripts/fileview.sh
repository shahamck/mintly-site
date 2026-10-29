#!/bin/sh
# Build and make dist/index.html openable over file:// for headless screenshots
cd "$(dirname "$0")/.." && npx vite build >/dev/null && sed -i '' 's/type="module" crossorigin/defer/' dist/index.html
