#!/usr/bin/env node
/**
 * Plans the import of a repository's GitHub issues into the factory.
 *
 *   node import.mjs query
 *   node import.mjs plan --github <file>[,<file>…] --repository <owner/repo> --project <id>
 *                        --maintainer <user id> --sha <target branch sha>
 *                        [--existing <issues.json>] [--confirmations <file>]
 *   node import.mjs check --open <numbers.json> --existing <issues.json> --evidence <evidence.json>
 *                         --project <id>
 *
 * `query` prints the GraphQL search query the skill runs with `gh api graphql
 * --paginate --slurp`. `plan` reads those pages and prints, as JSON on stdout,
 * every issue to create with its fields, its evidence rows and its draft wait;
 * a summary goes to stderr. It never calls GitHub or the workspace and writes
 * nothing: the agent applies the plan with its record tools, after the
 * maintainer's go. `check` compares what was imported with the open GitHub
 * issues and lists paused issues with no open wait.
 *
 * Exit: `plan` 0 when every draft wait is confirmed (or none), 1 when drafts
 * await the maintainer's sitting; `check` 0 clean, 1 a mismatch; 2 usage or
 * input error.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const DAY = 86_400_000;
const DEADLINE_DAYS = 14;
/** Characters of GitHub discussion copied into `context`; the rest stays linked. */
const DISCUSSION_BUDGET = 20_000;
const QUESTION_BUDGET = 800;

export const QUERY = `query($q: String!, $endCursor: String) {
  search(query: $q, type: ISSUE, first: 25, after: $endCursor) {
    pageInfo { hasNextPage endCursor }
    nodes {
      ... on Issue {
        number title body url state stateReason createdAt closedAt
        author { login }
        labels(first: 50) { nodes { name } }
        comments(last: 100) { totalCount nodes { author { login } body createdAt url } }
        parent { number repository { nameWithOwner } }
        subIssues(first: 50) { nodes { number } }
        blockedBy(first: 20) { nodes { number state repository { nameWithOwner } } }
        closedByPullRequestsReferences(first: 10, includeClosedPrs: true) {
          nodes {
            number url state headRefOid repository { nameWithOwner }
            comments(last: 100) { nodes { body createdAt url } }
          }
        }
        projectItems(first: 10) {
          nodes { fieldValueByName(name: "Priority") { ... on ProjectV2ItemFieldSingleSelectValue { name } } }
        }
      }
    }
  }
}`;

const TYPES = { "type:bug": "bug", "type:enhancement": "enhancement", "type:feature": "feature" };
const PRIORITIES = { urgent: "p1_urgent", high: "p2_high", medium: "p3_medium", low: "p4_low" };
const PREVIEW_VERDICTS = {
  "preview:candidate": "candidate",
  "preview:parked": "park",
  "preview:rejected": "reject",
};
const PAUSE_LABELS = ["factory:paused", "needs-decision", "needs-design", "preview:parked"];

/** `land:` stamps on a pull request head, as evidence rows. */
const STAMPS = [
  { pattern: /^land:\s*tier\s+(sight|standard|full)\s+([0-9a-f]{7,40})/i, kind: "tier" },
  { pattern: /^land:\s*verdict\s+\d+\s+([0-9a-f]{7,40})/i, kind: "verdict" },
  { pattern: /^land:\s*go\s+([0-9a-f]{7,40})\s*$/im, kind: "go" },
  { pattern: /^land:\s*go\s+([0-9a-f]{7,40})\s*[—-]+\s*withheld/i, kind: "withheld" },
  { pattern: /^land:\s*demo\s+failed\s+([0-9a-f]{7,40})/i, kind: "demo-fail" },
  { pattern: /^land:\s*demo\s+skipped\s*[—-]+\s*(.*)$/im, kind: "demo-skipped" },
  { pattern: /^land:\s*demo\s+([0-9a-f]{7,40})/i, kind: "demo" },
];

const namesOf = (issue) => (issue.labels?.nodes ?? []).map((label) => label.name);
const nodes = (connection) => connection?.nodes ?? [];
const iso = (at) => new Date(at).toISOString();
const quote = (text) =>
  String(text ?? "")
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    throw new Error(`${path}: ${error.message}`);
  }
}

/** Issues from one or more `--paginate --slurp` outputs, each number once. */
export function issuesOf(pages) {
  const byNumber = new Map();
  for (const page of pages.flat()) {
    const found = nodes(page?.data?.search);
    for (const issue of found) if (issue?.number) byNumber.set(issue.number, issue);
  }
  return [...byNumber.values()].sort((a, b) => a.number - b.number);
}

function originOf(labels, body) {
  const scout = labels.find(
    (name) => name.startsWith("scout:") && name !== "scout:refuted" && name !== "scout:overtaken",
  );
  if (scout) return scout;
  if (/intake channel/i.test(body ?? "")) return "slack";
  return "github";
}

function closeReasonOf(issue, labels) {
  if (labels.includes("scout:refuted")) return "refuted";
  if (labels.includes("scout:overtaken")) return "overtaken";
  if (issue.stateReason === "DUPLICATE") return "duplicate";
  if (issue.stateReason === "NOT_PLANNED" || labels.includes("preview:rejected")) return "wont_do";
  return "done";
}

function priorityOf(issue) {
  for (const item of nodes(issue.projectItems)) {
    const value = PRIORITIES[String(item?.fieldValueByName?.name ?? "").toLowerCase()];
    if (value) return value;
  }
  return null;
}

const isStamp = (body) => /^land:/i.test(String(body ?? "").trim());
const isRuling = (body) => /^##\s*Decision\s*$/m.test(String(body ?? ""));

/** The latest comment that is neither a stamp nor a ruling: the open question, as a draft. */
function lastQuestion(issue) {
  const comment = nodes(issue.comments)
    .filter((each) => !isStamp(each.body) && !isRuling(each.body))
    .at(-1);
  return comment ? String(comment.body).slice(0, QUESTION_BUDGET) : null;
}

function discussion(issue) {
  const comments = nodes(issue.comments).filter((each) => !isStamp(each.body));
  const blocks = [];
  let used = 0;
  for (const comment of [...comments].reverse()) {
    const block = `**${comment.author?.login ?? "unknown"}, ${comment.createdAt}** (${
      comment.url
    })${isRuling(comment.body) ? " · ruling, history only" : ""}\n\n${quote(comment.body)}`;
    if (used + block.length > DISCUSSION_BUDGET) break;
    blocks.unshift(block);
    used += block.length;
  }
  const total = issue.comments?.totalCount ?? comments.length;
  const left = total - blocks.length;
  return { blocks, left };
}

/** Evidence rows for the stamps of each open linked pull request. */
function stampRows(pullRequest, ref) {
  const rows = [];
  const notes = [];
  for (const comment of nodes(pullRequest.comments)) {
    const body = String(comment.body ?? "").trim();
    if (!isStamp(body)) continue;
    const stamp = STAMPS.map((each) => ({ ...each, match: body.match(each.pattern) })).find(
      (each) => each.match,
    );
    const source = `Imported from the \`${body.split("\n")[0]}\` stamp of ${comment.createdAt} (${
      comment.url
    }).`;
    if (!stamp || stamp.kind === "withheld") {
      notes.push(`${source} Not carried over: landing judges this head again.`);
      continue;
    }
    const [, first, second] = stamp.match;
    // Stamps may carry a short sha; landing reads full ones. Expand it from the PR head when it
    // is that head's prefix; a `go` that names no full head is not carried (unmatched).
    const shaOf = (sha) =>
      pullRequest.headRefOid?.startsWith(sha)
        ? pullRequest.headRefOid
        : sha.length === 40
          ? sha
          : null;
    const subject = (sha) => `github:${ref}@${shaOf(sha) ?? sha}`;
    const stampSha = stamp.kind === "tier" ? second : first;
    if (stamp.kind === "go" && !shaOf(stampSha)) {
      notes.push(`${source} Not carried over: unmatched, its short sha names no current head.`);
      continue;
    }
    if (stamp.kind === "tier") {
      rows.push({
        kind: "tier",
        subject: subject(second),
        body: source,
        data: { tier: first.toLowerCase() },
      });
    } else if (stamp.kind === "verdict") {
      rows.push({
        kind: "verdict",
        subject: subject(first),
        body: `${source}\n\n${body}`,
        data: { outcome: "changes" },
      });
    } else if (stamp.kind === "go") {
      rows.push({ kind: "go", subject: subject(first), body: source, data: {} });
    } else if (stamp.kind === "demo") {
      rows.push({
        kind: "demo",
        subject: subject(first),
        body: `${source}\n\n${body}`,
        data: { outcome: "pass" },
      });
    } else if (stamp.kind === "demo-fail") {
      rows.push({
        kind: "demo",
        subject: subject(first),
        body: `${source}\n\n${body}`,
        data: { outcome: "fail" },
      });
    } else if (stamp.kind === "demo-skipped" && pullRequest.headRefOid) {
      rows.push({
        kind: "demo",
        subject: subject(pullRequest.headRefOid),
        body: `${source}\n\n${body}`,
        data: { outcome: "skipped", reason: first.trim() },
      });
    }
  }
  // `imported` keeps these rows out of the dashboard's first-round measures.
  return { rows: rows.map((row) => ({ ...row, data: { ...row.data, imported: true } })), notes };
}

/** The wait a paused GitHub issue would carry, before the maintainer confirms it. */
function draftWaitOf(issue, labels, repository) {
  const openBlockers = nodes(issue.blockedBy).filter((blocker) => blocker.state === "OPEN");
  if (labels.includes("needs-design")) {
    return {
      waitKind: "task",
      target: "a Task to create: the mockup this issue owes",
      task: `Mockup for « ${issue.title} »`,
      resumeAt: "screening",
    };
  }
  if (labels.includes("preview:parked")) {
    const expires = nodes(issue.comments)
      .map((comment) => String(comment.body).match(/Expires:\s*(\d{4}-\d{2}-\d{2})/))
      .filter(Boolean)
      .at(-1)?.[1];
    if (expires)
      return { waitKind: "date", target: `date:${expires}T00:00:00Z`, resumeAt: "assessment" };
    return {
      waitKind: "decision",
      target: "a Décision to ask",
      question: "Parked with no expiry: revisit it now, keep it parked until a date, or close it?",
      resumeAt: "assessment",
    };
  }
  if (!labels.includes("needs-decision") && openBlockers.length > 0) {
    const blocker = openBlockers[0];
    const same = blocker.repository?.nameWithOwner === repository;
    return same
      ? { waitKind: "blocker", target: `issues:#${blocker.number}`, resumeAt: "screening" }
      : {
          waitKind: "decision",
          target: "a Décision to ask",
          question: `Blocked by ${blocker.repository?.nameWithOwner}#${blocker.number}, an issue of another repository: wait on its import there, or go on?`,
          resumeAt: "screening",
        };
  }
  return {
    waitKind: "decision",
    target: "a Décision to ask",
    question:
      lastQuestion(issue) ?? "Paused with no recorded question: resume it, close it, or take it?",
    resumeAt: "screening",
  };
}

function plannedStatus(issue, labels) {
  if (issue.state !== "OPEN") return "done";
  if (labels.includes("factory:human")) return "mine";
  const paused = PAUSE_LABELS.some((label) => labels.includes(label));
  // A shaped task waited in factory:paused alone for the drag to Ready; here the drag is its launch.
  const shapedTask =
    issue.parent &&
    labels.includes("factory:paused") &&
    !PAUSE_LABELS.some((label) => label !== "factory:paused" && labels.includes(label));
  if (paused && !shapedTask) return "paused";
  if (nodes(issue.closedByPullRequestsReferences).some((pr) => pr.state === "OPEN"))
    return "in_review";
  if (shapedTask) return "backlog";
  if (labels.includes("factory:queued") || labels.includes("factory:active")) return "ready";
  return "backlog";
}

export function plan(issues, options) {
  const { repository, project, maintainer, sha, existing = [], confirmations } = options;
  const imported = new Map(
    existing
      .filter((record) => String(record.values?.project?.id ?? record.values?.project) === project)
      .filter((record) => record.values?.githubNumber != null)
      .map((record) => [Number(record.values.githubNumber), record.id]),
  );
  const confirmedAt = confirmations?.confirmedAt ? Date.parse(confirmations.confirmedAt) : null;
  const entries = [];
  const skipped = [];
  const awaiting = [];

  for (const issue of issues) {
    if (imported.has(issue.number)) {
      skipped.push({
        githubNumber: issue.number,
        reason: `already imported as ${imported.get(issue.number)}`,
      });
      continue;
    }
    const labels = namesOf(issue);
    const status = plannedStatus(issue, labels);
    const pullRequests = nodes(issue.closedByPullRequestsReferences).map(
      (pr) => `${pr.repository?.nameWithOwner ?? repository}#${pr.number}`,
    );
    const notes = [];
    const evidence = [];

    for (const [label, verdict] of Object.entries(PREVIEW_VERDICTS)) {
      if (labels.includes(label)) {
        evidence.push({
          kind: "assessment",
          subject: `github:${repository}@${sha}`,
          body: `Imported from the \`${label}\` label of ${issue.url}: the previous pipeline's preview verdict, a ranking, never an approval. The sha is the target branch at the import, not the branch the preview read.`,
          data: { verdict, imported: true },
        });
      }
    }
    if (status !== "done") {
      for (const pr of nodes(issue.closedByPullRequestsReferences).filter(
        (each) => each.state === "OPEN",
      )) {
        const stamped = stampRows(pr, `${pr.repository?.nameWithOwner ?? repository}#${pr.number}`);
        evidence.push(...stamped.rows);
        notes.push(...stamped.notes);
      }
    }

    const parent =
      issue.parent?.repository?.nameWithOwner === repository ? issue.parent.number : null;
    if (issue.parent && parent == null) {
      notes.push(
        `Sub-issue of ${issue.parent.repository?.nameWithOwner}#${issue.parent.number}, another repository.`,
      );
    }
    const blockedBy = nodes(issue.blockedBy)
      .filter((blocker) => blocker.repository?.nameWithOwner === repository)
      .map((blocker) => blocker.number);
    for (const blocker of nodes(issue.blockedBy)) {
      if (blocker.repository?.nameWithOwner !== repository) {
        notes.push(
          `Blocked by ${blocker.repository?.nameWithOwner}#${blocker.number}, another repository.`,
        );
      }
    }

    const { blocks, left } = discussion(issue);
    const context = [
      `Imported from ${issue.url} (github:${repository}#${issue.number}), opened ${
        issue.createdAt
      } by ${issue.author?.login ?? "unknown"}${
        issue.closedAt ? `, closed ${issue.closedAt}` : ""
      }.`,
      `GitHub labels: ${labels.join(", ") || "none"}.`,
      ...notes,
      blocks.length || left
        ? `### GitHub discussion\n\nRulings below are history: their effect is the status above, and they are never applied again.${
            left > 0 ? ` ${left} earlier comments are at ${issue.url}.` : ""
          }\n\n${blocks.join("\n\n")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    let wait = null;
    let finalStatus = status;
    let closeReason = status === "done" ? closeReasonOf(issue, labels) : null;
    if (status === "paused") {
      const draft = { ...draftWaitOf(issue, labels, repository), owner: maintainer };
      const answer = confirmations?.issues?.[String(issue.number)];
      if (!answer || confirmedAt == null) {
        awaiting.push(issue.number);
        wait = { ...draft, confirmed: false };
      } else if (answer.action === "backlog" || answer.action === "mine") {
        finalStatus = answer.action;
      } else if (answer.action === "close") {
        finalStatus = "done";
        closeReason = answer.closeReason ?? "wont_do";
      } else {
        const after = draft.waitKind === "date" ? Date.parse(draft.target.slice(5)) : 0;
        const deadline = Math.max(confirmedAt + DEADLINE_DAYS * DAY, after + DEADLINE_DAYS * DAY);
        wait = {
          ...draft,
          ...(answer.question ? { question: answer.question } : {}),
          owner: answer.owner ?? maintainer,
          deadline: iso(deadline),
          confirmed: true,
        };
      }
    }

    entries.push({
      githubNumber: issue.number,
      url: issue.url,
      githubState: issue.state,
      createWithStatus: finalStatus === "paused" ? "backlog" : finalStatus,
      status: finalStatus,
      values: {
        title: issue.title,
        type: Object.entries(TYPES).find(([label]) => labels.includes(label))?.[1] ?? null,
        origin: originOf(labels, issue.body),
        priority: priorityOf(issue),
        closeReason,
        project,
        githubNumber: issue.number,
        problem: issue.body ?? "",
        context,
        pullRequests: pullRequests.join("\n"),
      },
      // The parent is set on creation only (`write` with `parent`); it is never a relation to write after.
      parent,
      relations: { blockedBy },
      evidence,
      wait,
    });
  }

  // Parents before their tasks, so a task's parent exists when it is created, at any depth.
  const parentOfNumber = new Map(entries.map((entry) => [entry.githubNumber, entry.parent]));
  function depth(number) {
    let levels = 0;
    for (let next = parentOfNumber.get(number); next != null; next = parentOfNumber.get(next)) {
      if (++levels > entries.length) break;
    }
    return levels;
  }
  entries.sort((a, b) => depth(a.githubNumber) - depth(b.githubNumber) || a.githubNumber - b.githubNumber);

  const count = (predicate) => entries.filter(predicate).length;
  const summary = {
    repository,
    project,
    toCreate: entries.length,
    skipped: skipped.length,
    openOnGithub: count((entry) => entry.githubState === "OPEN"),
    closedOnGithub: count((entry) => entry.githubState !== "OPEN"),
    byStatus: Object.fromEntries(
      ["backlog", "paused", "mine", "ready", "in_review", "done"].map((status) => [
        status,
        count((entry) => entry.status === status),
      ]),
    ),
    draftWaits: Object.fromEntries(
      ["blocker", "decision", "task", "date"].map((kind) => [
        kind,
        count((entry) => entry.wait?.waitKind === kind),
      ]),
    ),
    evidenceRows: entries.reduce((sum, entry) => sum + entry.evidence.length, 0),
    awaitingConfirmation: awaiting,
  };
  return { summary, ready: awaiting.length === 0, entries, skipped };
}

export function check({ open, existing, evidence, project }) {
  const numbers = new Set(open.map((each) => Number(each.number ?? each)));
  const mine = existing.filter(
    (record) => String(record.values?.project?.id ?? record.values?.project) === project,
  );
  const imported = new Map(
    mine
      .filter((record) => record.values?.githubNumber != null)
      .map((record) => [Number(record.values.githubNumber), record]),
  );
  const missing = [...numbers].filter((number) => !imported.has(number));
  const notOpen = [...imported.entries()]
    .filter(([number, record]) => record.values?.status !== "done" && !numbers.has(number))
    .map(([number]) => number);
  const openWaits = new Set(
    evidence
      .filter((row) => row.kind === "wait" && !row.resolvedAt && !row.values?.resolvedAt)
      .map((row) => String(row.issue?.id ?? row.issue ?? row.values?.issue)),
  );
  const pausedWithoutWait = mine
    .filter((record) => record.values?.status === "paused" && !openWaits.has(String(record.id)))
    .map((record) => record.id);
  return {
    missing,
    notOpen,
    pausedWithoutWait,
    clean: !missing.length && !notOpen.length && !pausedWithoutWait.length,
  };
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    if (!flag.startsWith("--") || argv[index + 1] === undefined)
      throw new Error(`unexpected ${flag}`);
    options[flag.slice(2)] = argv[index + 1];
  }
  return options;
}

const USAGE = `usage:
  import.mjs query
  import.mjs plan --github <file>[,<file>…] --repository <owner/repo> --project <id> --maintainer <user id>
                  --sha <target branch sha>
                  [--existing <issues.json>] [--confirmations <file>]
  import.mjs check --open <numbers.json> --existing <issues.json> --evidence <evidence.json> --project <id>`;

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  try {
    if (command === "query") {
      console.log(QUERY);
      return;
    }
    const options = parseArgs(rest);
    if (command === "plan") {
      for (const flag of ["github", "repository", "project", "maintainer", "sha"]) {
        if (!options[flag]) throw new Error(`--${flag} is required`);
      }
      const pages = await Promise.all(options.github.split(",").map(readJson));
      const result = plan(issuesOf(pages), {
        ...options,
        existing: options.existing ? await readJson(options.existing) : [],
        confirmations: options.confirmations ? await readJson(options.confirmations) : null,
      });
      console.error(JSON.stringify(result.summary, null, 2));
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.ready ? 0 : 1);
    }
    if (command === "check") {
      for (const flag of ["open", "existing", "evidence", "project"]) {
        if (!options[flag]) throw new Error(`--${flag} is required`);
      }
      const result = check({
        open: await readJson(options.open),
        existing: await readJson(options.existing),
        evidence: await readJson(options.evidence),
        project: options.project,
      });
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.clean ? 0 : 1);
    }
    throw new Error(`unknown command ${command ?? ""}`);
  } catch (error) {
    console.error(`${error.message}\n${USAGE}`);
    process.exit(2);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
