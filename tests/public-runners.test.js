import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const macRunner = "public/run-mac.sh";
const windowsRunner = "public/run-windows.ps1";

assert.equal(existsSync(macRunner), true);
assert.equal(existsSync(windowsRunner), true);

const macSyntax = spawnSync("bash", ["-n", macRunner], { encoding: "utf8" });
assert.equal(macSyntax.status, 0, macSyntax.stderr || macSyntax.stdout);

const macContent = readFileSync(macRunner, "utf8");
assert.match(macContent, /DEV_SETUP_SCRIPT_B64/);
assert.match(macContent, /base64 -D/);
assert.match(macContent, /base64 --decode/);

const windowsContent = readFileSync(windowsRunner, "utf8");
assert.match(windowsContent, /DEV_SETUP_SCRIPT_B64/);
assert.match(windowsContent, /FromBase64String/);
assert.match(windowsContent, /cmd\.exe \/c/);

console.log("public runner tests pass");
