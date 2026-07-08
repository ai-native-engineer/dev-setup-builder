# Dev Setup Builder

React checklist app that generates macOS `.command` and Windows `.bat` setup scripts for a developer workstation.

Live site: <https://ai-native-engineer.github.io/dev-setup-builder/>

## What It Generates

- Core tools: Git, Node.js, pnpm, Python, uv, Bun, Docker Desktop, and Windows WSL2.
- Editor tools: VS Code and the Claude Code VS Code extension.
- AI tools: Claude Desktop, Claude Code CLI, Codex App, and Codex CLI.
- Source control tools: GitHub CLI, GitHub auth check, GitLab CLI, and Git identity defaults.
- Optional deployment tool: Vercel CLI.

Advanced observability settings for Claude Code CLI and Codex CLI are opt-in. They stay off by default, and the UI's "select all" action does not enable them. Prompt/body collection toggles are also off by default.

Switching from macOS to Windows enables WSL2 by default because a Windows developer setup usually needs it.

## Direct Terminal Run

The app can copy a one-line terminal command that downloads a small public runner and passes the generated setup script as base64:

- `public/run-mac.sh`
- `public/run-windows.ps1`

Those public runner files must stay deployable because the generated terminal command references them through the GitHub Pages site.

## Local Development

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

Unit and script tests:

```bash
pnpm test
```

E2E tests:

```bash
pnpm test:e2e
```

Playwright writes full-page screenshots to `test-results/screenshots/`.

## Deploy

GitHub Pages is deployed from the Vite `dist/` build through `.github/workflows/deploy-pages.yml`.

The Vite base path is `/dev-setup-builder/`, so the repository name must stay `dev-setup-builder` unless `vite.config.js`, Playwright base URLs, and docs are updated together.

## Permission Help

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
