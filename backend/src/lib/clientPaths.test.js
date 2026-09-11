import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { clientIndexHtml, resolveClientDist } from "./clientPaths.js";

test("resolveClientDist points at <repo>/frontend/dist regardless of cwd", () => {
  const serverLibDir = path.join(path.sep, "repo", "backend", "src", "lib");
  assert.equal(resolveClientDist(serverLibDir), path.resolve(path.sep, "repo", "frontend", "dist"));
});

test("clientIndexHtml appends index.html", () => {
  const serverLibDir = path.join(path.sep, "repo", "backend", "src", "lib");
  assert.equal(
    clientIndexHtml(serverLibDir),
    path.join(path.resolve(path.sep, "repo", "frontend", "dist"), "index.html")
  );
});

test("resolving from this file's real location finds a sibling frontend folder", () => {
  // backend/src/lib -> ../../../frontend/dist
  const here = path.dirname(fileURLToPath(import.meta.url));
  assert.equal(resolveClientDist(here), path.resolve(here, "../../../frontend/dist"));
  assert.match(resolveClientDist(here), /frontend[\\/]dist$/);
});
