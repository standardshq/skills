#!/usr/bin/env node
/**
 * Computes two family signals over a repository's history: a compensation
 * saga (one operation corrected three times or more) and a missing canonical
 * binding (one name three or more fixes had to add across three or more
 * modules).
 *
 *   node saga-scan.mjs --checkout <dir> [--branch <targetBranch>] [--window=300]
 *
 * Git only, no issue export. Exit code 0 when it printed, 1 when git failed
 * (no checkout, or the branch is not fetched).
 *
 * Both are properties of a *sequence* of commits, and an issue shows one point
 * in time: every individual fix can be correct and reviewed while the
 * operation keeps breaking. This answers one question, "which operations are
 * being fixed over and over, and which name is being forgotten over and
 * over", and leaves the judgement to the agent.
 */
import { fileURLToPath } from "node:url";
import { git as gitIn, parseArgs, resolveRef } from "./standards.mjs";

/**
 * Three is the threshold for both detectors, and it is not arbitrary: two fixes
 * on one operation is a coincidence a reviewer can reasonably read as unrelated.
 * The third is the first one that cannot be explained away.
 */
const SAGA_THRESHOLD = 3;

/** How far back to look. One release week at this repo's rate. */
const DEFAULT_WINDOW = 300;

/**
 * Only corrective commits count. A file touched by ten features is a busy file;
 * a file touched by ten *fixes* is an operation whose contract does not hold.
 * The distinction is the whole signal, so a loose match would erase it.
 */
const CORRECTIVE = /^(fix|perf|revert)[(!]/;

/**
 * Paths that are noise in both detectors: a lockfile or a changeset moves with
 * every commit and would top every ranking without ever being the subject of one.
 */
const IGNORED = /^(pnpm-lock\.yaml|\.changeset\/|CHANGELOG\.md$|.*\/CHANGELOG\.md$)/;

/** Test files follow their subject; counting both double-counts one saga. */
const IS_TEST = /(\.test\.|\.spec\.|\/tests?\/|__tests__\/)/;

/**
 * Calls that satisfy the detector's shape — added often, in many modules —
 * while carrying none of its meaning, which is *a name whose omission is
 * silently wrong*. Language builtins, DOM handlers and generic repository
 * accessors are all called everywhere by design: forgetting one produces a
 * compile error or a visibly broken handler, never a quiet wrong answer.
 *
 * This is a noise floor, not a rule. It exists so the survivors are few enough
 * to judge, and judging them stays the agent's job.
 */
const AMBIENT = new Set([
  "flatMap",
  "entries",
  "toString",
  "forEach",
  "includes",
  "toLowerCase",
  "toUpperCase",
  "filter",
  "reduce",
  "startsWith",
  "endsWith",
  "replace",
  "toSorted",
  "findIndex",
  "getTime",
  "toISOString",
  "stringify",
  "resolve",
  "reject",
  "require",
  "message",
  "readFileSync",
  "writeFileSync",
  "existsSync",
  "process",
  "console",
  "preventDefault",
  "stopPropagation",
  "findById",
  "findByIds",
  "findAll",
]);

/**
 * A file must carry this share of a commit's changed lines to count as one of
 * its subjects.
 *
 * Without it the ranking fills with barrels, locale files and manifests: they
 * are touched by a great many fixes and are the subject of none: an index that
 * exports what each fix added is not a saga, it is what an export list is for.
 * The share is what separates "this fix was about this file" from "this
 * file moved because a fix elsewhere landed".
 */
const SUBJECT_SHARE = 0.15;

let checkout = ".";
const git = (args) => gitIn(checkout, args);

/**
 * One entry per corrective commit in the window, carrying the files it changed
 * with their line counts, so a subject can be told from a passenger.
 */
async function readCorrectiveCommits(ref, window) {
  const log = await git([
    "log",
    ref,
    `-${window}`,
    "--no-merges",
    "--format=%x00%h%x1f%ad%x1f%s",
    "--date=short",
    "--numstat",
  ]);
  const commits = [];
  for (const chunk of log.split("\0").slice(1)) {
    const [header, ...statLines] = chunk.split("\n");
    const [sha, date, subject] = header.split("\x1f");
    if (!CORRECTIVE.test(subject)) continue;
    const files = [];
    for (const line of statLines) {
      const [added, removed, file] = line.split("\t");
      if (!file || IGNORED.test(file)) continue;
      // A binary file reports "-" for both counts; it can never be a subject.
      files.push({ file, changed: (Number(added) || 0) + (Number(removed) || 0) });
    }
    const total = files.reduce((sum, f) => sum + f.changed, 0);
    for (const f of files) f.isSubject = total > 0 && f.changed / total >= SUBJECT_SHARE;
    commits.push({ sha, date, subject, files });
  }
  return commits;
}

/**
 * A compensation saga: one source file corrected by three or more commits.
 *
 * Reported per file rather than per function because the failing unit is the
 * operation, and an operation that needs compensating is spread across helpers
 * by the time it needs it: a per-function count would split one saga into
 * several innocent-looking ones.
 */
function detectSagas(commits) {
  const byFile = new Map();
  for (const commit of commits) {
    for (const { file, isSubject } of commit.files) {
      if (!isSubject || IS_TEST.test(file)) continue;
      if (!byFile.has(file)) byFile.set(file, []);
      byFile.get(file).push(commit);
    }
  }
  return [...byFile.entries()]
    .filter(([, list]) => list.length >= SAGA_THRESHOLD)
    .map(([file, list]) => ({ file, count: list.length, commits: list }))
    .sort((a, b) => b.count - a.count);
}

/**
 * A missing canonical binding: one identifier that three or more corrective
 * commits had to ADD, in three or more distinct modules.
 *
 * Both halves carry weight. Counting additions only is what separates "a name
 * that keeps being forgotten" from "a name that is widely used" — a popular
 * helper appears in many diffs, but it is not repeatedly *introduced* by fixes.
 * Requiring distinct modules is what separates a cross-cutting invariant from
 * one module's local refactor: it is the spread, not the count, that says the
 * default is wrong rather than the callers.
 */
async function detectBindings(commits) {
  const byIdentifier = new Map();
  for (const commit of commits) {
    // Production sources only. Scanning tests too was tried and it ranks
    // `toEqual` and `describe` above every real binding — a test file adds the
    // same matchers in every diff, which is the exact shape this detector
    // rewards, so it has to never see them.
    const diff = await git([
      "show",
      commit.sha,
      "--unified=0",
      "--format=",
      "--",
      ".",
      ":!**/tests/**",
      ":!**/__tests__/**",
      ":!**/*.test.*",
      ":!**/*.spec.*",
    ]);
    const added = new Set();
    for (const line of diff.split("\n")) {
      if (!line.startsWith("+") || line.startsWith("+++")) continue;
      // Called identifiers only. A bare word match would rank every type,
      // variable and keyword in the diff above the call the fix actually added.
      for (const [, name] of line.matchAll(/\b([a-z][A-Za-z0-9]{6,})\(/g)) {
        if (!AMBIENT.has(name)) added.add(name);
      }
    }
    for (const name of added) {
      if (!byIdentifier.has(name)) byIdentifier.set(name, []);
      byIdentifier.get(name).push(commit);
    }
  }

  const moduleOf = (file) => file.split("/").slice(0, 5).join("/");
  return [...byIdentifier.entries()]
    .map(([name, list]) => {
      const modules = new Set(
        list.flatMap((c) =>
          c.files.filter((f) => f.isSubject && !IS_TEST.test(f.file)).map((f) => moduleOf(f.file)),
        ),
      );
      return { name, count: list.length, modules: [...modules], commits: list };
    })
    .filter((b) => b.count >= SAGA_THRESHOLD && b.modules.length >= SAGA_THRESHOLD)
    .sort((a, b) => b.modules.length - a.modules.length || b.count - a.count);
}

function report(sagas, bindings) {
  if (sagas.length === 0 && bindings.length === 0) {
    console.log("saga-scan: no family above threshold");
    return;
  }

  for (const saga of sagas) {
    console.log(`\nSAGA  ${saga.file}  — ${saga.count} corrective commits`);
    for (const c of saga.commits) console.log(`      ${c.date}  ${c.sha}  ${c.subject}`);
    console.log("      → report the transaction boundary, not the next compensation");
  }

  for (const binding of bindings) {
    console.log(
      `\nBINDING  ${binding.name}()  — added by ${binding.count} fixes across ${binding.modules.length} modules`,
    );
    for (const m of binding.modules) console.log(`         ${m}`);
    console.log("      → report the one canonical name, not the next call site");
  }

  console.log(
    `\nsaga-scan: ${sagas.length} saga(s), ${bindings.length} binding(s) above ${SAGA_THRESHOLD}`,
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (typeof args.checkout === "string") checkout = args.checkout;
  const window = args.window ? Number(args.window) : DEFAULT_WINDOW;
  const ref = await resolveRef(checkout, typeof args.branch === "string" ? args.branch : undefined);
  const commits = await readCorrectiveCommits(ref, window);
  console.log(`saga-scan: ${commits.length} corrective commits in the last ${window} of ${ref}`);
  report(detectSagas(commits), await detectBindings(commits));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await main();
  } catch (error) {
    console.error(`saga-scan: ${error.message}`);
    process.exitCode = 1;
  }
}

export { detectSagas, detectBindings, SAGA_THRESHOLD };
