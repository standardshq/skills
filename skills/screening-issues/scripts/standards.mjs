/**
 * What the screening scripts share: the issues export the agent wrote with
 * its own record tools (`--input <file.json>`, shape in `screening-issues`
 * § Scripts), git on a repository checkout, and the patterns an issue uses to
 * cite its evidence. The scripts never call the workspace: the sandbox holds
 * no workspace key.
 */
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";

const run = promisify(execFile);
const MAX_BUFFER = 64 * 1024 * 1024;

/** The sections an issue cites its evidence in. */
export const SECTIONS = ["intent", "problem", "acceptance", "context", "plan", "handoff"];

/** `issues:<id>`: another Standards issue. */
export const STANDARDS_REF = /\bissues:([\w-]{6,})/g;

/** `owner/repo#N` or a bare `#N`: a pull request, or an imported GitHub issue. */
export const GITHUB_REF = /(?:\b([\w.-]+\/[\w.-]+))?#(\d{1,6})\b/g;

/**
 * A repository path, optionally anchored to a line. It needs a slash and a
 * file extension, so prose like `record.service` is not taken for an anchor;
 * a first segment holding a dot (a domain in a URL) is skipped, a leading
 * dot (`.github/`) is kept.
 */
export const PATH_REF = /(?<![\w/.:-])((?:\.?[\w-]+\/)(?:[\w.-]+\/)*[\w.-]+\.\w{1,5})(?::(\d+))?/g;

/** A relation reads back as an id, an object or a list of either. */
export function idsOf(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value.flatMap(idsOf);
  if (typeof value === "object") return value.id ? [String(value.id)] : [];
  return [String(value)];
}

export const valuesOf = (record) => record.values ?? {};
/** A server timestamp as milliseconds; NaN when absent or unreadable. */
export const timeOf = (value) => (value ? Date.parse(value) : Number.NaN);
export const createdAtOf = (record) => record.createdAt ?? valuesOf(record).createdAt ?? "";

/** Oldest first by creation time, then by id, so every run prints the same order. */
export function byAge(x, y) {
  const left = timeOf(x.createdAt) || 0;
  const right = timeOf(y.createdAt) || 0;
  return left - right || String(x.id).localeCompare(String(y.id));
}
/** When the issue moved to `done`: the export's `closedAt`, read from the issue's activity. */
export const closedAtOf = (record) => record.closedAt ?? valuesOf(record).closedAt ?? "";

/** Richtext may come back as markdown or as a block tree: every string leaf, in order. */
export function textOf(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(textOf).join("\n");
  if (typeof value === "object") return Object.values(value).map(textOf).join("\n");
  return String(value);
}

export function issueText(issue) {
  const values = valuesOf(issue);
  return SECTIONS.map((section) => textOf(values[section])).join("\n");
}

/**
 * The issues of the export, every one of them or one project's. The file is a
 * JSON array of `{ id, createdAt, closedAt?, values }`; a `{ data: [...] }`
 * wrapper is accepted.
 */
export async function readIssues(path, project) {
  if (typeof path !== "string") throw new Error("pass --input <issues.json>");
  const parsed = JSON.parse(await readFile(path, "utf8"));
  const issues = Array.isArray(parsed) ? parsed : parsed?.data;
  if (!Array.isArray(issues)) throw new Error(`${path} is not an array of issues`);
  for (const issue of issues) {
    if (!issue?.id || typeof issue.values !== "object") {
      throw new Error(`${path}: every issue needs an id and values`);
    }
  }
  return project
    ? issues.filter((issue) => idsOf(valuesOf(issue).project).includes(project))
    : issues;
}

export const isOpen = (issue) => valuesOf(issue).status !== "done";

export async function git(checkout, args) {
  const { stdout } = await run("git", ["-C", checkout, ...args], { maxBuffer: MAX_BUFFER });
  return stdout;
}

/** `origin/<branch>` when the checkout has it, else the branch itself; `origin/HEAD` by default. */
export async function resolveRef(checkout, branch) {
  if (!branch) return "origin/HEAD";
  for (const candidate of [`origin/${branch}`, branch]) {
    try {
      await git(checkout, ["rev-parse", "--verify", "--quiet", candidate]);
      return candidate;
    } catch {}
  }
  throw new Error(`${checkout} has no branch ${branch}: fetch it first`);
}

/** `owner/repo` of the checkout's origin, or null. */
export async function repositoryOf(checkout) {
  try {
    const url = (await git(checkout, ["remote", "get-url", "origin"])).trim();
    return /github\.com[:/](.+?)(?:\.git)?$/.exec(url)?.[1] ?? null;
  } catch {
    return null;
  }
}

/** `--name value` pairs and bare flags; positional arguments in `_`. */
export function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      args._.push(arg);
      continue;
    }
    const [name, inline] = arg.slice(2).split("=", 2);
    if (inline !== undefined) args[name] = inline;
    else if (argv[i + 1] && !argv[i + 1].startsWith("--")) args[name] = argv[++i];
    else args[name] = true;
  }
  return args;
}
