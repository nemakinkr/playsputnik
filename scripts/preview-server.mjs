import { execFile, spawn } from "node:child_process";
import { openSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import http from "node:http";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const ROOT = new URL("../", import.meta.url);
const ROOT_PATH = fileURLToPath(ROOT);
const DEFAULT_PORT = 4190;
const DEFAULT_HOST = "127.0.0.1";
const args = process.argv.slice(2);
const mode = args.includes("--check") ? "check" : args.includes("--restart") ? "restart" : "ensure";
const port = Number(valueAfter("--port") || DEFAULT_PORT);
const host = valueAfter("--host") || DEFAULT_HOST;
const url = `http://${host}:${port}/`;
const logPath = new URL("verification/preview-server.log", ROOT);
const logPathname = fileURLToPath(logPath);

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : "";
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getPreview() {
  return new Promise((resolve) => {
    const request = http.get(url, { timeout: 3000 }, (response) => {
      let bytes = 0;
      response.on("data", (chunk) => {
        bytes += chunk.length;
      });
      response.on("end", () => {
        resolve({
          ok: response.statusCode === 200 && bytes > 0,
          statusCode: response.statusCode,
          bytes,
          reason: response.statusCode === 200 && bytes > 0 ? "healthy" : "empty_or_bad_response",
        });
      });
    });
    request.on("timeout", () => {
      request.destroy(new Error("timeout"));
    });
    request.on("error", (error) => {
      resolve({
        ok: false,
        statusCode: 0,
        bytes: 0,
        reason: error.message || "request_error",
      });
    });
  });
}

async function listenerPids() {
  try {
    const { stdout } = await execFileAsync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN"]);
    return stdout
      .split("\n")
      .slice(1)
      .map((line) => line.trim().split(/\s+/))
      .filter((parts) => parts.length >= 2)
      .map((parts) => ({ command: parts[0], pid: Number(parts[1]) }))
      .filter((item) => Number.isFinite(item.pid));
  } catch {
    return [];
  }
}

async function stopListeners(listeners) {
  for (const { pid } of listeners) {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      // Already gone or not killable; the follow-up health check will tell us.
    }
  }
  await wait(700);
  const remaining = await listenerPids();
  for (const { pid } of remaining) {
    try {
      process.kill(pid, "SIGKILL");
    } catch {
      // Leave final reporting to the caller.
    }
  }
  await wait(300);
}

async function startServer() {
  await mkdir(dirname(logPathname), { recursive: true });
  const logFd = openSync(logPathname, "a");
  const child = spawn(
    "python3",
    ["-m", "http.server", String(port), "--bind", host],
    {
      cwd: ROOT_PATH,
      detached: true,
      stdio: ["ignore", logFd, logFd],
    },
  );
  child.unref();
  await wait(900);
  return child.pid;
}

async function main() {
  const before = await getPreview();
  const listenersBefore = await listenerPids();

  if (mode === "check") {
    console.log(JSON.stringify({
      mode,
      url,
      ok: before.ok,
      health: before,
      listeners: listenersBefore,
    }, null, 2));
    process.exit(before.ok ? 0 : 1);
  }

  if (mode === "restart" || !before.ok) {
    if (listenersBefore.length) await stopListeners(listenersBefore);
    await startServer();
  }

  const after = await getPreview();
  const listenersAfter = await listenerPids();
  console.log(JSON.stringify({
    mode,
    url,
    ok: after.ok,
    before,
    after,
    listenersBefore,
    listenersAfter,
    log: logPathname,
  }, null, 2));
  process.exit(after.ok ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
