import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Static client paths.
//
// The previous implementation used path.resolve() (the process cwd), so the
// built SPA was only found when the server happened to be started from
// backend/. Hosts like Render start the process from the repository root,
// which made express.static() point outside the project: the HTML fallback
// still returned index.html but /assets/*.js 404'd, producing a blank white
// page. Resolving from this module's own location is cwd-independent.
// ---------------------------------------------------------------------------

/** @param {string} serverLibDir directory of this file (backend/src/lib) */
export function resolveClientDist(serverLibDir) {
  return path.resolve(serverLibDir, "../../../frontend/dist");
}

export function clientIndexHtml(serverLibDir) {
  return path.join(resolveClientDist(serverLibDir), "index.html");
}

export function clientDistExists(serverLibDir) {
  return fs.existsSync(clientIndexHtml(serverLibDir));
}
