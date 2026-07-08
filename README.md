# Dev Setup Builder

React checklist app that generates macOS `.command` and Windows `.bat` setup scripts from selected tools.

## Deploy

GitHub Pages is deployed from the Vite `dist/` build through `.github/workflows/deploy-pages.yml`.

## Local check

Install dependencies and run the Vite dev server:

```bash
pnpm install
pnpm dev
```

Then visit the local URL printed by Vite.

Production build:

```bash
pnpm build
```

Tests:

```bash
pnpm test
```

E2E tests:

```bash
pnpm test:e2e
```

Playwright writes full-page screenshots to `test-results/screenshots/`.

## Generated scripts

The app only emits selected tools plus required dependencies. It does not write editor settings unless the generated script explicitly includes that selected step in the future.

macOS downloads may not keep executable permissions. Run the generated file with `bash setup-mac.command`, or run `chmod +x setup-mac.command` before double-clicking it in Finder.

## Permission help

macOS:

- If the download is not executable, run `bash setup-mac.command`.
- For Finder double-click, run `chmod +x setup-mac.command` first.
- If macOS blocks the file, right-click it, choose Open, then Open again.
- If quarantine still blocks it, run `xattr -d com.apple.quarantine setup-mac.command`.

Windows:

- If Windows blocks the file, right-click it, open Properties, then check Unblock.
- If installers fail, right-click `setup-windows.bat` and choose Run as administrator.
- If SmartScreen appears, choose More info, then Run anyway.
- The generated BAT uses PowerShell `ExecutionPolicy Bypass` only for that script run.
