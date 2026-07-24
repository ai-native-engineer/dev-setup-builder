import assert from "node:assert/strict";
import {
  PACKAGES,
  deselectWithDependents,
  resolveSelection,
  selectWithDependencies,
  supportsOs,
  visibleResolved
} from "../src/builder.js";

const packageIds = new Set(PACKAGES.map((item) => item.id));

for (const os of ["mac", "win"]) {
  const supported = PACKAGES.filter((item) => supportsOs(item, os));
  const resolved = resolveSelection(new Set(supported.map((item) => item.id)), os);
  const order = visibleResolved(resolved);

  for (const item of supported) {
    for (const dependency of item.deps[os]) {
      assert.equal(dependency === "homebrew" || packageIds.has(dependency), true, `${item.id}: unknown ${dependency}`);
      if (!packageIds.has(dependency)) continue;
      assert.equal(order.indexOf(dependency) < order.indexOf(item.id), true, `${dependency} must install before ${item.id}`);
    }
  }
}

const dockerEngine = selectWithDependencies(new Set(["docker-engine"]), "win");
assert.deepEqual([...dockerEngine], ["docker-engine", "wsl2"]);

const codexTelemetry = selectWithDependencies(new Set(["codex-telemetry"]), "win");
assert.deepEqual(new Set(codexTelemetry), new Set(["codex-telemetry", "codex", "node"]));

const withoutNode = deselectWithDependents(codexTelemetry, "node", "win");
assert.deepEqual([...withoutNode], []);

console.log("dependency tests pass");
