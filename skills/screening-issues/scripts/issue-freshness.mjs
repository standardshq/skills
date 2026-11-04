#!/usr/bin/env node
/**
 * Re-resolves everything an issue asserts, before a run acts on it.
 *
 * An issue is a photograph: it cites pull requests, other issues and
 * `file:line` anchors, all true when it was written. Reading them again is a
 * perceptual task performed under the pull of a plausible claim; resolving
 * them is a lookup. This does the lookup.
 *
 *   node issue-freshness.mjs <issue-id> […] --input <issues.json> --checkout <dir> [--branch <targetBranch>]
 *
 * Issues come from the export (`--input`); pull requests and paths are
 * resolved in the repository checkout, on the target branch: a pull request is
 * merged when a commit of that branch names it `(#N)`. Exit code 0 when every
 * claim holds, 1 when one no longer holds (or a cited done issue has no
 * `closedAt` to date it), 2 on a usage or input error.
 */
import { fileURLToPath } from "node:url";
import {
  GITHUB_REF,
  PATH_REF,
  STANDARDS_REF,
  closedAtOf,
  createdAtOf,
  git,
  idsOf,
  issueText,
  parseArgs,
  readIssues,
  repositoryOf,
  resolveRef,
  timeOf,
  valuesOf,
} from "./standards.mjs";

function unique(matches, keyOf) {
  const seen = new Map();
  for (const match of matches) {
    const key = keyOf(match);
    if (!seen.has(key)) seen.set(key, match);
  }
  return [...seen.values()];
}

/** The commit of `ref` whose subject names `(#N)`, the squash or merge of that pull request. */
async function mergeOf(checkout, ref, number) {
  const log = await git(checkout, [
    "log",
    ref,
    "--fixed-strings",
    `--grep=(#${number})`,
    "--format=%h%x1f%cI%x1f%s",
  ]);
  const line = log.split("\n").find((entry) => entry.split("\x1f")[2]?.includes(`(#${number})`));
  if (!line) return null;
  const [sha, mergedAt, subject] = line.split("\x1f");
  return { sha, mergedAt, subject };
}

/**
 * A citation is stale when what it names changed after the issue was written:
 * a pull request merged since (the gap may be closed), an issue done since.
 * One that changed before is the issue's own evidence, cited correctly.
 */
async function resolveGithub({ repo, number }, context) {
  const sameRepo = !repo || repo === context.repository;
  if (sameRepo) {
    const merge = await mergeOf(context.checkout, context.ref, number);
    if (merge) {
      const stale = timeOf(merge.mergedAt) > timeOf(context.createdAt);
      return `${stale ? "STALE" : "ok   "}  pr #${number}  merged ${merge.mergedAt} in ${
        merge.sha
      }  ${merge.subject}`;
    }
  }
  const imported = context.imported.get(number);
  if (sameRepo && imported) return resolveStandards(imported.id, context);
  return `ref    ${repo ?? ""}#${number}  not merged on ${context.ref}${
    sameRepo ? "" : " (another repository: read it)"
  }`;
}

function resolveStandards(id, context) {
  const issue = context.byId.get(id);
  if (!issue) return `MISSING  issues:${id}  not in the export`;
  const values = valuesOf(issue);
  const title = values.title ?? "";
  if (values.status !== "done") return `ok     issue issues:${id}  ${values.status}  ${title}`;
  const state = `done (${values.closeReason ?? "no reason"})`;
  const closedAt = timeOf(closedAtOf(issue));
  if (Number.isNaN(closedAt)) {
    return `UNDATED  issue issues:${id}  ${state}, no closedAt in the export: read when it closed  ${title}`;
  }
  const stale = closedAt > timeOf(context.createdAt);
  return `${stale ? "STALE" : "ok   "}  issue issues:${id}  ${state} ${closedAtOf(
    issue,
  )}  ${title}`;
}

/** A path holds when the file exists on the branch and, if a line was named, still reaches it. */
async function resolvePath({ path, line }, context) {
  let lines;
  try {
    lines = (await git(context.checkout, ["show", `${context.ref}:${path}`])).split("\n").length;
  } catch {
    return { ok: false, text: `MISSING  ${path}${line ? `:${line}` : ""}` };
  }
  if (line && Number(line) > lines) {
    return { ok: false, text: `SHORT  ${path}:${line} (file has ${lines} lines)` };
  }
  return { ok: true, text: `ok     ${path}${line ? `:${line}` : ""}` };
}

async function check(id, options) {
  const issue = options.byId.get(id);
  if (!issue) throw new Error(`issues:${id} is not in the export`);
  const values = valuesOf(issue);
  const projects = idsOf(values.project);
  const text = issueText(issue);
  const ref = await resolveRef(options.checkout, options.branch);
  const sha = (await git(options.checkout, ["rev-parse", "--short", ref])).trim();
  const context = {
    checkout: options.checkout,
    ref,
    repository: await repositoryOf(options.checkout),
    createdAt: createdAtOf(issue),
    byId: options.byId,
    /** Imported issues of the same project, by GitHub number. */
    imported: new Map(
      [...options.byId.values()]
        .filter((other) => valuesOf(other).githubNumber != null)
        .filter((other) => idsOf(valuesOf(other).project).some((p) => projects.includes(p)))
        .map((other) => [String(valuesOf(other).githubNumber), other]),
    ),
  };

  console.log(`issues:${id}  ${values.title}`);
  console.log(
    `created ${context.createdAt}, read against ${
      context.repository ?? options.checkout
    }@${sha} (${ref})\n`,
  );

  const standards = unique(text.matchAll(STANDARDS_REF), (m) => m[1]).filter((m) => m[1] !== id);
  const github = unique(text.matchAll(GITHUB_REF), (m) => `${m[1] ?? ""}#${m[2]}`).filter(
    (m) => String(values.githubNumber ?? "") !== m[2] || (m[1] && m[1] !== context.repository),
  );
  const paths = unique(text.matchAll(PATH_REF), (m) => `${m[1]}:${m[2] ?? ""}`);

  const lines = [
    ...(await Promise.all(standards.map((m) => resolveStandards(m[1], context)))),
    ...(await Promise.all(github.map((m) => resolveGithub({ repo: m[1], number: m[2] }, context)))),
  ];
  const anchors = await Promise.all(
    paths.map((m) => resolvePath({ path: m[1], line: m[2] }, context)),
  );
  for (const line of lines) console.log(`  ${line}`);
  for (const anchor of anchors) console.log(`  ${anchor.text}`);

  const stale = lines.filter((line) => /^(STALE|MISSING|UNDATED)/.test(line)).length;
  const broken = anchors.filter((anchor) => !anchor.ok).length;
  console.log(`\nissue-freshness: ${stale} stale reference(s), ${broken} broken anchor(s)`);
  if (stale > 0)
    console.log("→ the claim may have no object: re-read it against the branch before acting");
  return stale + broken;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args._.length === 0 || typeof args.checkout !== "string") {
    console.error(
      "usage: node issue-freshness.mjs <issue-id> […] --input <issues.json> --checkout <dir> [--branch <targetBranch>]",
    );
    process.exitCode = 2;
    return;
  }
  const branch = typeof args.branch === "string" ? args.branch : undefined;
  const byId = new Map((await readIssues(args.input)).map((issue) => [issue.id, issue]));
  let problems = 0;
  for (const id of args._) problems += await check(id, { checkout: args.checkout, branch, byId });
  if (problems > 0) process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await main();
  } catch (error) {
    console.error(`issue-freshness: ${error.message}`);
    process.exitCode = 2;
  }
}
