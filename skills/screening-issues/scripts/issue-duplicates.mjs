#!/usr/bin/env node
/**
 * Prints the pairs of issues that may describe the same work, so a run judges
 * a short list instead of reading the backlog against itself.
 *
 *   node issue-duplicates.mjs --input <issues.json> --project <id>                 open issues, each pair once
 *   node issue-duplicates.mjs --input <issues.json> --project <id> --issue <id>    one issue against every other, closed ones included
 *   … --json
 *
 * Exit code 0 when it printed, 1 on a usage or input error.
 *
 * A pair is a candidate, not a verdict: the agent reads both issues and rules.
 * One shared file alone pairs unrelated issues (a busy file is cited by every
 * report that touches it), and one citing the other alone pairs families, not
 * duplicates; so each counts only with a second signal. `ref` (a third issue
 * or pull request both cite) is context and never counts.
 */
import { fileURLToPath } from "node:url";
import {
  GITHUB_REF,
  PATH_REF,
  STANDARDS_REF,
  byAge,
  createdAtOf,
  isOpen,
  parseArgs,
  readIssues,
  textOf,
  valuesOf,
} from "./standards.mjs";

const TITLE_THRESHOLD = 0.5;
const TITLE_SUPPORT = 0.2;

function tokens(title) {
  return new Set(
    String(title ?? "")
      .toLowerCase()
      .match(/[\p{L}0-9]+/gu) ?? [],
  );
}

export function jaccard(left, right) {
  const shared = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return union === 0 ? 0 : Math.round((shared / union) * 100) / 100;
}

function intersect(left, right) {
  return [...left].filter((value) => right.has(value));
}

/** What an issue is compared on, reading `text`. Citations are `issues:<id>` and `#N` keys. */
export function describeText(issue, text) {
  const values = valuesOf(issue);
  return {
    id: issue.id,
    createdAt: createdAtOf(issue),
    title: values.title ?? "",
    githubNumber: values.githubNumber ?? null,
    open: isOpen(issue),
    closeReason: values.closeReason ?? null,
    paths: new Set([...text.matchAll(PATH_REF)].map((m) => m[1])),
    refs: new Set([
      ...[...text.matchAll(STANDARDS_REF)].map((m) => `issues:${m[1]}`),
      ...[...text.matchAll(GITHUB_REF)].map((m) => `#${m[2]}`),
    ]),
    tokens: tokens(values.title),
  };
}

/**
 * A duplicate is compared on `title` and `body`, never `context`, which holds
 * what is known around an issue rather than what to do.
 */
const describe = (issue) => describeText(issue, textOf(valuesOf(issue).body));

const keysOf = (issue) => [
  `issues:${issue.id}`,
  ...(issue.githubNumber != null ? [`#${issue.githubNumber}`] : []),
];

export function signals(a, b) {
  const own = new Set([...keysOf(a), ...keysOf(b)]);
  return {
    path: intersect(a.paths, b.paths),
    cites: keysOf(b).some((key) => a.refs.has(key)) || keysOf(a).some((key) => b.refs.has(key)),
    ref: intersect(a.refs, b.refs).filter((key) => !own.has(key)),
    title: jaccard(a.tokens, b.tokens),
  };
}

function isCandidate(s) {
  const supported = s.cites || s.title >= TITLE_SUPPORT;
  return s.title >= TITLE_THRESHOLD || s.path.length >= 2 || (s.path.length === 1 && supported);
}

/** Every candidate pair among open issues, older first, each pair once. */
export function candidatePairs(issues) {
  const described = issues.filter(isOpen).map(describe).sort(byAge);
  const pairs = [];
  described.forEach((a, i) => {
    for (const b of described.slice(i + 1)) {
      const s = signals(a, b);
      if (isCandidate(s)) pairs.push({ a, b, signals: s });
    }
  });
  return pairs;
}

/** Every candidate for one issue, open or closed. */
export function candidatesFor(target, issues) {
  const a = describe(target);
  return issues
    .filter((issue) => issue.id !== target.id)
    .map(describe)
    .sort(byAge)
    .map((b) => ({ a, b, signals: signals(a, b) }))
    .filter((pair) => isCandidate(pair.signals));
}

function label(issue) {
  const state = issue.open ? "" : ` [done: ${issue.closeReason ?? "no reason"}]`;
  return `issues:${issue.id}${state} ${issue.title}`;
}

function format(pair) {
  const s = pair.signals;
  const names = [
    s.path.length && `path ${s.path.join(" ")}`,
    s.cites && "cites",
    s.ref.length && `ref ${s.ref.join(" ")}`,
    s.title >= TITLE_THRESHOLD && "title",
  ].filter(Boolean);
  return `${label(pair.a)}\n  ↔ ${label(pair.b)}\n  ${names.join(", ")}  title=${s.title.toFixed(
    2,
  )}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const project = typeof args.project === "string" ? args.project : undefined;
  const issues = await readIssues(args.input, project);
  let pairs;
  if (typeof args.issue === "string") {
    const target = issues.find((issue) => issue.id === args.issue);
    if (!target)
      throw new Error(
        `issues:${args.issue} is not in ${project ? "this project" : "the workspace"}`,
      );
    pairs = candidatesFor(target, issues);
  } else {
    pairs = candidatePairs(issues);
  }
  if (args.json) {
    console.log(
      JSON.stringify(
        pairs.map((pair) => ({
          a: pair.a.id,
          b: pair.b.id,
          bOpen: pair.b.open,
          signals: pair.signals,
        })),
        null,
        2,
      ),
    );
    return;
  }
  for (const pair of pairs) console.log(`${format(pair)}\n`);
  console.log(
    `issue-duplicates: ${pairs.length} candidate pair(s) across ${issues.length} issue(s)`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await main();
  } catch (error) {
    console.error(`issue-duplicates: ${error.message}`);
    process.exitCode = error.exitCode ?? 1;
  }
}
