// Lightweight syntax gate for CI: `node --check` every source file so an
// unparseable module can never reach main. (Full lint rules live in the
// frontend ESLint config; the backend keeps its dependency surface small.)
import { execFileSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targets = ["src", "scripts"];
const files = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules") continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (full.endsWith(".js")) files.push(full);
  }
}

for (const target of targets) walk(path.join(root, target));

let failures = 0;
for (const file of files) {
  try {
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
  } catch (error) {
    failures++;
    console.error(`✗ ${path.relative(root, file)}`);
    console.error(String(error.stderr || error.message).trim());
  }
}

console.log(
  failures === 0
    ? `✓ syntax check passed for ${files.length} files`
    : `✗ ${failures}/${files.length} files failed the syntax check`
);

process.exit(failures === 0 ? 0 : 1);
