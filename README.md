# Dev Setup Builder

Static checklist app that generates macOS `.command` and Windows `.bat` setup scripts from selected tools.

## Deploy

This repo is intentionally buildless. Serve `index.html` from GitHub Pages.

## Local check

Open `index.html` directly, or run a local static server:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

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
