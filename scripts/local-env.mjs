import { readFile } from "node:fs/promises";

const DEFAULT_FILES = [".env.local"];

export async function loadLocalEnv(rootUrl, files = DEFAULT_FILES) {
  const loaded = [];
  const sources = {};

  for (const file of files) {
    let text = "";
    try {
      text = await readFile(new URL(file, rootUrl), "utf8");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      continue;
    }

    const keys = [];
    parseEnvText(text).forEach(([key, value]) => {
      keys.push(key);
      if (process.env[key] === undefined) {
        process.env[key] = value;
        sources[key] = file;
      } else if (!sources[key]) {
        sources[key] = "environment";
      }
    });

    loaded.push({ file, keys });
  }

  return { loaded, sources };
}

export function envPresence(name, localEnv = { sources: {} }) {
  return {
    present: Boolean(process.env[name]),
    source: process.env[name] ? localEnv.sources[name] || "environment" : "missing",
  };
}

function parseEnvText(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map(parseEnvLine)
    .filter(Boolean);
}

function parseEnvLine(line) {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (!match) return null;
  const [, key, rawValue] = match;
  return [key, stripQuotes(rawValue.trim())];
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"'))
    || (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}
