import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export function configureRuntimeSource(source, value) {
  const requestedOrigin = String(value || "").trim().replace(/\/+$/, "");
  if (requestedOrigin && !/^https:\/\//.test(requestedOrigin)) {
    throw new Error("PLAYSPUTNIK_API_ORIGIN must be an HTTPS origin");
  }
  const next = source.replace(/^(\s*)apiOrigin:\s*"[^"]*"/m, `$1apiOrigin: "${requestedOrigin}"`);
  if (next === source && requestedOrigin) throw new Error("runtime-config.js apiOrigin field was not found");
  return { next, requestedOrigin };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const file = new URL("../runtime-config.js", import.meta.url);
  const current = await readFile(file, "utf8");
  const { next, requestedOrigin } = configureRuntimeSource(current, process.env.PLAYSPUTNIK_API_ORIGIN);
  await writeFile(file, next);
  console.log(requestedOrigin ? "Runtime API origin configured for deployment." : "Runtime API origin left empty; local fallback remains active.");
}
