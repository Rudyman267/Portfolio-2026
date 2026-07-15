/**
 * dev-open — start `next dev` (Webpack) and, once the server is actually
 * responding, open the browser straight to a given route.
 *
 * WHY: Next 16 compiles routes on demand, so whichever page you LAND on is the
 * only one that compiles. Landing on the home page drags in the whole 3D hero /
 * tunnel (the slow, memory-heavy first compile — see PROJECT_LOG §3). Opening
 * directly on a lighter route (e.g. the LIR case study) skips all of that until
 * you actually visit `/`.
 *
 * Next 16 removed the old `next dev --open` flag, so we open the browser here.
 * Usage: node scripts/dev-open.mjs /work/live-incident-response
 */

import { spawn } from "node:child_process";

const route = process.argv[2] || "/";
const port = process.env.PORT || "3000";
const url = `http://localhost:${port}${route}`;

// Start the dev server exactly like `npm run dev` (Webpack — Turbopack is
// disabled on this machine; do NOT re-enable, see PROJECT_LOG §3).
const dev = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["next", "dev", "--webpack", "--port", port],
  { stdio: "inherit", shell: process.platform === "win32" },
);

dev.on("exit", (code) => process.exit(code ?? 0));

// Poll the server; open the browser only once it answers (so we don't race the
// first compile with a dead-connection tab).
const started = Date.now();
const TIMEOUT_MS = 120_000;

async function waitAndOpen() {
  while (Date.now() - started < TIMEOUT_MS) {
    try {
      // any HTTP response (even a compile-in-progress 200/500) means it's up
      const res = await fetch(url, { redirect: "manual" });
      if (res.status > 0) break;
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  openBrowser(url);
}

function openBrowser(target) {
  const platform = process.platform;
  const cmd =
    platform === "win32" ? "cmd" : platform === "darwin" ? "open" : "xdg-open";
  const args =
    platform === "win32" ? ["/c", "start", "", target] : [target];
  spawn(cmd, args, { stdio: "ignore", detached: true }).unref();
  console.log(`\n▸ Opened ${target}\n`);
}

waitAndOpen();
