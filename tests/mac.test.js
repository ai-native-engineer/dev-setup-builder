import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  PACKAGES,
  buildMacScript,
  presetSelection,
  resolveSelection,
  selfTest,
  supportsOs
} from "../src/builder.js";

const settings = { gitName: "A", gitEmail: "a@example.com" };

const codex = resolveSelection(new Set(["codex"]), "mac");
const codexScript = buildMacScript(codex, settings);
const nodeIndex = codexScript.indexOf('brew_formula "Node.js"');
const codexCallIndex = codexScript.lastIndexOf("install_codex_cli");
const codexNativeIndex = codexScript.indexOf("https://chatgpt.com/codex/install.sh");
const codexBrewIndex = codexScript.indexOf("brew install --cask codex");
const codexNpmIndex = codexScript.indexOf('npm_global "Codex CLI"');

assert.equal(codex.has("node"), true);
assert.equal(codex.has("homebrew"), true);
assert.equal(nodeIndex >= 0 && nodeIndex < codexCallIndex, true);
assert.equal(codexNativeIndex >= 0 && codexNativeIndex < codexBrewIndex && codexBrewIndex < codexNpmIndex, true);

const videoClassMac = resolveSelection(presetSelection("video-class"), "mac");
const videoClassMacScript = buildMacScript(videoClassMac, settings);
assert.equal(videoClassMac.has("homebrew"), true);
assert.equal(videoClassMac.has("node"), false);
assert.match(videoClassMacScript, /brew_formula "FFmpeg" "ffmpeg" "ffmpeg"/);
assert.match(videoClassMacScript, /brew_formula "Deno" "deno" "deno"/);
assert.match(videoClassMacScript, /brew_formula "yt-dlp" "yt-dlp" "yt-dlp"/);
assert.equal(videoClassMacScript.indexOf('brew_formula "Deno"') < videoClassMacScript.indexOf('brew_formula "yt-dlp"'), true);

assert.match(videoClassMacScript, /verify_media_tools/);
assert.match(videoClassMacScript, /ffmpeg -hide_banner -filters/);
assert.match(videoClassMacScript, /drawtext/);
assert.match(videoClassMacScript, /ChatGPT 앱을 완전히 종료한 뒤 다시 열어 주세요/);
assert.doesNotMatch(buildMacScript(resolveSelection(new Set(["pnpm"]), "mac"), settings), /verify_media_tools|show_end_notes/);
assert.doesNotMatch(videoClassMacScript, /install_project_folder\(\)/);

const projectMac = buildMacScript(resolveSelection(new Set(["project-folder"]), "mac"), { ...settings, projectUrl: "https://example.com/a;b$c.zip", projectName: "lab", projectSha256: "" });
assert.match(projectMac, /install_project_folder 'https:\/\/example\.com\/a;b\$c\.zip' 'lab' ''/);
assert.match(projectMac, /--proto '=https' --proto-redir '=https'/);
assert.match(projectMac, /\$HOME\/Documents\/\$name/);
assert.doesNotMatch(projectMac, /\beval\b.*\$zip|source "\$stage|bash "\$stage/);

{
  // Run the generated macOS project-folder function with a stubbed curl and a temporary HOME.
  const work = mkdtempSync(join(tmpdir(), "dev-setup-project-mac-"));
  try {
    mkdirSync(join(work, "src", "repo-main", "sub"), { recursive: true });
    writeFileSync(join(work, "src", "repo-main", "README.md"), "# demo\n");
    writeFileSync(join(work, "src", "repo-main", "sub", "a.txt"), "hi\n");
    const zipPath = join(work, "p.zip");
    assert.equal(spawnSync("zip", ["-qr", zipPath, "repo-main"], { cwd: join(work, "src") }).status, 0);
    const sha = spawnSync("shasum", ["-a", "256", zipPath], { encoding: "utf8" }).stdout.split(" ")[0];
    const fnStart = projectMac.indexOf("install_project_folder() {");
    const fnEnd = projectMac.indexOf("\nrefresh_path\n");
    const home = join(work, "home");
    mkdirSync(home);
    const run = (call) => spawnSync("bash", ["-c", [
      "set -u",
      `HOME='${home}'; TMPDIR='${work}'; LOG='${join(work, "log.txt")}'`,
      'info() { :; }; ok() { echo "OK: $1"; }; warn() { echo "WARN: $1"; }; fail() { echo "FAIL: $1"; }',
      `curl() { out=""; while [ $# -gt 0 ]; do [ "$1" = "-o" ] && out="$2"; shift; done; cp '${zipPath}' "$out"; }`,
      projectMac.slice(fnStart, fnEnd),
      call
    ].join("\n")], { encoding: "utf8" });
    const first = run(`install_project_folder 'https://example.com/r.zip' 'lab' '${sha.toUpperCase()}'`);
    assert.match(first.stdout, /OK: .*lab/);
    assert.equal(readFileSync(join(home, "Documents", "lab", "sub", "a.txt"), "utf8"), "hi\n");
    assert.match(run("install_project_folder 'https://example.com/r.zip' 'lab' ''").stdout, /WARN: .*lab-\d{8}/);
    assert.match(run(`install_project_folder 'https://example.com/r.zip' 'other' '${"0".repeat(64)}'`).stdout, /FAIL: .*SHA-256/);
    assert.match(run("install_project_folder 'http://example.com/r.zip' 'x' ''").stdout, /FAIL:/);
    assert.match(run("install_project_folder 'https://example.com/r.zip' '../x' ''").stdout, /FAIL:/);
    assert.match(run("install_project_folder '' 'x' ''").stdout, /WARN:/);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

const claudeCode = resolveSelection(new Set(["claude-code"]), "mac");
const claudeCodeScript = buildMacScript(claudeCode, settings);
const claudeNativeIndex = claudeCodeScript.indexOf("https://claude.ai/install.sh");
const claudeBrewIndex = claudeCodeScript.indexOf("brew install --cask claude-code");
const claudeNpmIndex = claudeCodeScript.indexOf('npm_global "Claude Code CLI"');

assert.equal(claudeCode.has("node"), true);
assert.equal(claudeCode.has("homebrew"), true);
assert.equal(claudeNativeIndex >= 0 && claudeNativeIndex < claudeBrewIndex && claudeBrewIndex < claudeNpmIndex, true);

const codexApp = resolveSelection(new Set(["codex-app"]), "mac");
const codexAppScript = buildMacScript(codexApp, settings);

assert.equal(codexApp.has("homebrew"), false);
assert.match(codexAppScript, /\ninstall_codex_app\n/);
assert.match(codexAppScript, /https:\/\/persistent\.oaistatic\.com\/codex-app-prod\/Codex\.dmg/);
assert.match(codexAppScript, /https:\/\/persistent\.oaistatic\.com\/codex-app-prod\/Codex-latest-x64\.dmg/);

const setup = resolveSelection(new Set(["pnpm", "github-auth", "wsl2"]), "mac");
const setupScript = buildMacScript(setup, settings);

assert.equal(setup.has("node"), true);
assert.equal(setup.has("gh"), true);
assert.equal(setup.has("wsl2"), false);
assert.match(setupScript, /install_pnpm/);
assert.match(setupScript, /check_github_auth/);
assert.doesNotMatch(setupScript, /WSL2/);

const macPackages = PACKAGES.filter((item) => supportsOs(item, "mac"));
assert.equal(macPackages.some((item) => item.id === "wsl2"), false);

const dockerScript = buildMacScript(new Set(["homebrew", "docker"]), settings);
assert.match(dockerScript, /brew_cask "Docker Desktop" "docker" "Docker\.app" ""/);
assert.match(dockerScript, /brew list --cask "\$1"/);

const dockerEngine = resolveSelection(new Set(["docker-engine"]), "mac");
const dockerEngineScript = buildMacScript(dockerEngine, settings);
assert.equal(dockerEngine.has("homebrew"), true);
assert.match(dockerEngineScript, /brew install colima/);
assert.match(dockerEngineScript, /brew install docker/);
assert.match(dockerEngineScript, /colima start/);
assert.match(dockerEngineScript, /docker info/);
assert.doesNotMatch(dockerEngineScript, /brew_cask "Docker Desktop"/);

const claudeTelemetry = resolveSelection(new Set(["claude-code-telemetry"]), "mac");
const claudeTelemetryScript = buildMacScript(claudeTelemetry, {
  ...settings,
  otelEndpoint: "http://collector.local:4317",
  claudeLogUserPrompts: true,
  claudeLogToolDetails: true
});

assert.equal(claudeTelemetry.has("claude-code"), true);
assert.match(claudeTelemetryScript, /CLAUDE_CODE_ENABLE_TELEMETRY=1/);
assert.match(claudeTelemetryScript, /claude-code-telemetry\.sh/);
assert.match(claudeTelemetryScript, /\$HOME\/\.zshrc/);
assert.match(claudeTelemetryScript, /OTEL_EXPORTER_OTLP_ENDPOINT=%s/);
assert.match(claudeTelemetryScript, /configure_claude_code_telemetry 'http:\/\/collector\.local:4317' 'grpc' '' '' 'dev' '' '60000' '5000' 'otlp' 'otlp' 'none' '1' '0' '1'/);

const codexTelemetry = resolveSelection(new Set(["codex-telemetry"]), "mac");
const codexTelemetryScript = buildMacScript(codexTelemetry, {
  ...settings,
  codexLogUserPrompt: true,
  codexMetricsExporter: "otlp"
});

assert.equal(codexTelemetry.has("codex"), true);
assert.match(codexTelemetryScript, /config="\$HOME\/\.codex\/config\.toml"/);
assert.match(codexTelemetryScript, /Dev Setup Builder - Codex telemetry start/);
assert.match(codexTelemetryScript, /\[otel\]/);
assert.match(codexTelemetryScript, /metrics_exporter = %s/);
assert.match(codexTelemetryScript, /configure_codex_telemetry 'http:\/\/localhost:4317' 'grpc' '' '' 'dev' '' '60000' '5000' 'otlp' 'otlp' 'none' '0' '0' '0' '0' 'off' '' 'otlp' 'none' 'otlp' '1'/);

// --- Regression coverage for the script-defect fixes ---

// Codex telemetry must REPLACE config.toml (>), not append (>>), or re-runs stack [otel] tables.
assert.match(codexTelemetryScript, /\}\s*>\s*"\$config"/);
assert.doesNotMatch(codexTelemetryScript, /\}\s*>>\s*"\$config"/);

// Homebrew installer runs non-interactively (no silent RETURN hang).
const brewScript = buildMacScript(new Set(["homebrew"]), settings);
assert.match(brewScript, /NONINTERACTIVE=1 \/bin\/bash -c/);

// Python must not trust the /usr/bin/python3 CommandLineTools stub.
const pythonScript = buildMacScript(resolveSelection(new Set(["python"]), "mac"), settings);
assert.match(pythonScript, /install_python\(\) \{/);
assert.match(pythonScript, /\/opt\/homebrew\/bin\/python3/);
assert.doesNotMatch(pythonScript, /brew_formula "Python"/);

// Telemetry file may hold the OTLP header secret -> owner-only.
assert.match(claudeTelemetryScript, /chmod 600 "\$telemetry_file"/);

// Git identity writes each field only when that specific field is missing.
const gitScript = buildMacScript(resolveSelection(new Set(["git-config"]), "mac"), settings);
assert.match(gitScript, /\[ -z "\$existing_name" \] && git config --global user\.name/);
assert.match(gitScript, /\[ -z "\$existing_email" \] && git config --global user\.email/);

// CR/LF is stripped from telemetry values (TOML/script-line breakout guard).
const crlfScript = buildMacScript(resolveSelection(new Set(["claude-code-telemetry"]), "mac"), {
  ...settings,
  otelEndpoint: "http://x\nEVIL"
});
assert.doesNotMatch(crlfScript, /http:\/\/x\nEVIL/);
assert.match(crlfScript, /http:\/\/xEVIL/);

assert.equal(selfTest().ok, true);
console.log("mac tests pass");
