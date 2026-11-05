import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const skills = join(dirname(fileURLToPath(import.meta.url)), "..", "skills");
const { families } = await import(join(skills, "screening-issues/scripts/issue-families.mjs"));
const { measure } = await import(join(skills, "measuring-the-factory/measure.mjs"));
const { plan, check } = await import(join(skills, "importing-github-issues/import.mjs"));

const DAY = 86_400_000;
const T0 = Date.parse("2026-10-05T00:00:00Z"); // a Monday
const at = (days) => new Date(T0 + days * DAY).toISOString();

test("issue-families finds an umbrella from its tasks", () => {
  const row = (id, extra = {}) => ({
    id,
    createdAt: at(0),
    values: { title: `unrelated ${id} zebra${id}`, status: "backlog", ...extra },
  });
  const issues = [
    row("u"),
    ...["t1", "t2", "t3", "t4", "t5", "t6", "t7"].map((id) => row(id, { parent: "record:u" })),
  ];
  const found = families(issues);
  assert.equal(found.length, 1);
  assert.deepEqual(found[0].members.map((m) => m.id).sort(), ["t1", "t2", "t3", "t4", "t5", "t6", "t7", "u"]);
  assert.equal(found[0].members.find((m) => m.id === "u").umbrella, true);
  assert.equal(found[0].members.find((m) => m.id === "t1").umbrella, false);
  assert.equal(found[0].shaped, "u");
});

/** An issue done in `[from, to]` days after T0, of one project. */
function issue(id, project, from, to, type = "bug") {
  return {
    id,
    createdAt: at(from - 1),
    values: { project, type, status: "done", closeReason: "done", origin: "slack" },
    statusHistory: [
      { at: at(from - 1), to: "backlog" },
      { at: at(from), to: "in_progress" },
      { at: at(to), to: "done" },
    ],
  };
}

const projects = [
  { id: "R", name: "Root" },
  { id: "A", name: "a", parentId: "R", fullName: "org/a", deployWorkflows: "deploy.yml" },
  { id: "B", name: "b", parentId: "R", fullName: "org/b", deployWorkflows: "" },
];
// The week of 2026-11-02, after nine weeks of history.
const DATE = "2026-11-04T12:00:00Z";
const WEEK = 7;
const finishedThisWeek = (id, project, days, type) => {
  const base = 28 * 1; // 2026-11-02 is 28 days after T0
  return issue(id, project, base + 1, base + 1 + days, type);
};

function run(issues, extra = {}) {
  return measure({ projects, issues, ...extra }, { date: DATE, weeks: 1, seed: 7 });
}
const valueOf = (rows, project, series) =>
  rows.find((row) => row.project === project && row.series === series)?.value;

test("measure rolls throughput up to the root", () => {
  const { rows } = run([
    finishedThisWeek("a1", "A", 1),
    finishedThisWeek("a2", "A", 1),
    finishedThisWeek("b1", "B", 1),
    finishedThisWeek("b2", "B", 1),
    finishedThisWeek("b3", "B", 1),
    finishedThisWeek("r1", "R", 1),
  ]);
  assert.equal(valueOf(rows, "A", "throughput_bug"), 2);
  assert.equal(valueOf(rows, "B", "throughput_bug"), 3);
  assert.equal(valueOf(rows, "R", "throughput_bug"), 6);
});

test("measure recomputes cycle time on the root", () => {
  const { rows } = run([
    finishedThisWeek("a1", "A", 1),
    finishedThisWeek("a2", "A", 3),
    finishedThisWeek("b1", "B", 5),
  ]);
  assert.equal(valueOf(rows, "A", "cycle_time_p50"), 2);
  assert.equal(valueOf(rows, "B", "cycle_time_p50"), 5);
  assert.equal(valueOf(rows, "R", "cycle_time_p50"), 3);
});

test("measure forecasts the root from merged rows", () => {
  const history = [];
  for (let week = 1; week <= 5; week++) {
    const from = 28 - week * WEEK + 1;
    history.push(issue(`a${week}`, "A", from, from + 1), issue(`b${week}`, "B", from, from + 1));
    if (week % 2) history.push(issue(`b${week}x`, "B", from, from + 1));
  }
  const open = (id, project) => ({
    id,
    createdAt: at(0),
    values: { project, type: "bug", status: "backlog", origin: "slack" },
  });
  const merged = [...history, open("o1", "A"), open("o2", "B"), open("o3", "B"), open("o4", "B")];
  const { rows } = run(merged);
  const flat = run(merged.map((each) => ({ ...each, values: { ...each.values, project: each.values.project === "B" ? "A" : each.values.project } })), {
    projects: [{ id: "R", name: "R" }, { id: "A", parentId: "R", fullName: "org/a" }],
  });
  assert.equal(typeof valueOf(rows, "R", "forecast_p50"), "number");
  assert.equal(valueOf(rows, "R", "forecast_p50"), valueOf(flat.rows, "A", "forecast_p50"));
  assert.equal(valueOf(rows, "R", "forecast_p85"), valueOf(flat.rows, "A", "forecast_p85"));
});

test("no row carries a repository key", () => {
  const { rows } = run([finishedThisWeek("a1", "A", 1)]);
  assert.ok(rows.length > 0);
  assert.ok(rows.every((row) => !("repository" in row)));
});

test("a repository with no deploy workflow gets no deploy data", () => {
  const { rows } = run([finishedThisWeek("a1", "A", 1)]);
  assert.equal(valueOf(rows, "B", "no_deploy_data"), 1);
  assert.equal(valueOf(rows, "A", "no_deploy_data"), 0);
  assert.equal(valueOf(rows, "R", "no_deploy_data"), 0);
});

const github = (extra) => ({
  state: "OPEN",
  title: "t",
  body: "",
  url: "u",
  createdAt: "2026-10-01T00:00:00Z",
  labels: { nodes: [] },
  ...extra,
});

test("import plans a sub-issue's parent for its creation", () => {
  const { entries } = plan(
    [
      github({ number: 12, parent: { number: 10, repository: { nameWithOwner: "org/app" } } }),
      github({ number: 10 }),
    ],
    { repository: "org/app", project: "p", maintainer: "m", sha: "abc" },
  );
  const child = entries.find((entry) => entry.githubNumber === 12);
  assert.equal(child.parent, 10);
  assert.deepEqual(child.relations, { blockedBy: [] });
  assert.ok(entries.findIndex((e) => e.githubNumber === 10) < entries.findIndex((e) => e.githubNumber === 12));
});

test("a root without repositories gets no deploy data, and a failed discovery gets none", () => {
  const lone = { id: "L", name: "Lone" };
  const { rows } = measure({ projects: [lone], issues: [] }, { date: DATE, weeks: 1, seed: 7 });
  assert.equal(valueOf(rows, "L", "no_deploy_data"), 1);
  const unknown = [
    { id: "R", name: "R" },
    { id: "A", parentId: "R", fullName: "org/a" },
  ];
  const result = measure({ projects: unknown, issues: [] }, { date: DATE, weeks: 1, seed: 7 });
  assert.equal(valueOf(result.rows, "A", "no_deploy_data"), undefined);
  assert.equal(valueOf(result.rows, "R", "no_deploy_data"), undefined);
});

test("readIssues includes issues on records at any depth under the project", async () => {
  const { readIssues } = await import(join(skills, "screening-issues/scripts/standards.mjs"));
  const { writeFileSync, mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const file = join(mkdtempSync(join(tmpdir(), "export-")), "issues.json");
  const issue = (id, project) => ({ id, values: { project } });
  writeFileSync(
    file,
    JSON.stringify({
      projects: [
        { id: "R" },
        { id: "A", parent: "record:R" },
        { id: "AA", parent: "record:A" },
        { id: "X" },
      ],
      data: [issue("i1", "R"), issue("i2", "A"), issue("i3", "AA"), issue("i4", "X")],
    }),
  );
  assert.deepEqual((await readIssues(file, "R")).map((each) => each.id), ["i1", "i2", "i3"]);
  assert.deepEqual((await readIssues(file, "A")).map((each) => each.id), ["i2", "i3"]);
});

test("a mixed root with a failed discovery never reads as not deploying", () => {
  const mixed = [
    { id: "R", name: "R" },
    { id: "A", parentId: "R", fullName: "org/a" },
    { id: "B", parentId: "R", fullName: "org/b", deployWorkflows: "" },
  ];
  const { rows, notes } = measure({ projects: mixed, issues: [] }, { date: DATE, weeks: 1, seed: 7 });
  assert.equal(valueOf(rows, "R", "no_deploy_data"), undefined);
  assert.equal(valueOf(rows, "B", "no_deploy_data"), 1);
  assert.ok(notes.some((note) => note.startsWith("R: 1 repository with failed deploy discovery")));
});

test("issue-duplicates exits 2 on a bare array with --project", async () => {
  const { spawnSync } = await import("node:child_process");
  const { writeFileSync, mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const file = join(mkdtempSync(join(tmpdir(), "bare-")), "issues.json");
  writeFileSync(file, JSON.stringify([{ id: "i1", values: { project: "A" } }]));
  const run = spawnSync(
    process.execPath,
    [join(skills, "screening-issues/scripts/issue-duplicates.mjs"), "--input", file, "--project", "R"],
    { encoding: "utf8" },
  );
  assert.equal(run.status, 2);
  assert.match(run.stderr, /carries no `projects`/);
});

test("an export without a projects tree exits 2 in every script that reads one", async () => {
  const { spawnSync } = await import("node:child_process");
  const { writeFileSync, mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const dir = mkdtempSync(join(tmpdir(), "notree-"));
  const rows = [{ id: "i1", values: { project: "A", status: "backlog" } }];
  const bare = join(dir, "bare.json");
  const wrapped = join(dir, "wrapped.json");
  writeFileSync(bare, JSON.stringify(rows));
  writeFileSync(wrapped, JSON.stringify({ data: rows }));
  const script = (name) => join(skills, "screening-issues/scripts", name);
  const spawn = (name, ...args) =>
    spawnSync(process.execPath, [script(name), ...args], { encoding: "utf8" });
  assert.equal(spawn("issue-duplicates.mjs", "--input", wrapped, "--project", "R").status, 2);
  assert.equal(spawn("issue-families.mjs", "--input", bare, "--project", "R").status, 2);
  const freshness = spawn("issue-freshness.mjs", "i1", "--input", bare, "--checkout", dir);
  assert.equal(freshness.status, 2);
  assert.match(freshness.stderr, /carries no `projects`/);
});

test("measure counts a ruling from the timeline as an intervention", () => {
  const { rows } = run([finishedThisWeek("a1", "A", 1)], {
    timeline: [{ id: "t1", issue: "a1", kind: "ruling", createdAt: at(28) }],
  });
  assert.equal(valueOf(rows, "A", "interventions_per_issue"), 1);
  assert.equal(valueOf(rows, "A", "autonomy_rate"), 0);
});

test("measure reads a bug's body for the issue it reworks", () => {
  const origin = finishedThisWeek("a1", "A", 1);
  origin.values.pullRequests = "org/a#1";
  const bug = (id, values) => ({
    id,
    createdAt: at(31),
    values: { project: "A", type: "bug", status: "backlog", origin: "slack", ...values },
  });
  const cited = run([origin, bug("b1", { body: "## Problem\nBroke after issues:a1." })]);
  assert.equal(valueOf(cited.rows, "A", "rework_rate"), 1);
  const uncited = run([origin, bug("b1", { body: "## Problem\nSomething else." })]);
  assert.equal(valueOf(uncited.rows, "A", "rework_rate"), 0);
});

test("import writes an issue's text to body and its rows to timeline", () => {
  const { entries, summary } = plan(
    [github({ number: 7, body: "It broke.", labels: { nodes: [{ name: "preview:candidate" }] } })],
    { repository: "org/app", project: "p", maintainer: "m", sha: "abc" },
  );
  const [entry] = entries;
  assert.equal(entry.values.body, "It broke.");
  assert.equal("problem" in entry.values, false);
  assert.equal("evidence" in entry, false);
  assert.equal(entry.timeline.length, 1);
  assert.equal(summary.timelineRows, 1);
});

test("import check reads open waits from the timeline", () => {
  const paused = { id: "i1", values: { project: "p", status: "paused", githubNumber: 1 } };
  const clean = check({
    open: [1],
    existing: [paused],
    timeline: [{ kind: "wait", issue: "i1" }],
    project: "p",
  });
  assert.deepEqual(clean.pausedWithoutWait, []);
  const held = check({ open: [1], existing: [paused], timeline: [], project: "p" });
  assert.deepEqual(held.pausedWithoutWait, ["i1"]);
});

test("the screening scripts read an issue's body and context, no other field", async () => {
  const { issueText } = await import(join(skills, "screening-issues/scripts/standards.mjs"));
  const text = issueText({
    id: "i",
    values: { body: "in body", context: "in context", problem: "gone", handoff: "gone" },
  });
  assert.equal(text, "in body\nin context");
});

test("issue-duplicates pairs on paths in body or context, and on the title", async () => {
  const { candidatePairs } = await import(join(skills, "screening-issues/scripts/issue-duplicates.mjs"));
  const row = (id, values) => ({ id, createdAt: at(0), values: { title: `zebra${id}`, status: "backlog", ...values } });
  const paths = "src/one/a.ts and src/two/b.ts";
  const inBody = candidatePairs([row("a", { body: paths }), row("b", { body: paths })]);
  assert.deepEqual(inBody.map((pair) => [pair.a.id, pair.b.id]), [["a", "b"]]);
  const inContext = candidatePairs([row("a", { context: paths }), row("b", { context: paths })]);
  assert.deepEqual(inContext.map((pair) => [pair.a.id, pair.b.id]), [["a", "b"]]);
  const titleInBody = candidatePairs([
    row("a", { body: "the export drops rows" }),
    row("b", { body: "the export drops rows" }),
  ]);
  assert.deepEqual(titleInBody, []);
  const sameTitle = candidatePairs([
    row("a", { title: "the export drops rows" }),
    row("b", { title: "the export drops rows" }),
  ]);
  assert.equal(sameTitle.length, 1);
});

test("issue-families joins issues that cite each other in context", () => {
  const row = (id, values) => ({ id, createdAt: at(0), values: { title: `zebra${id}`, status: "backlog", ...values } });
  const found = families([row("first1"), row("second", { context: "Follows issues:first1." })]);
  assert.deepEqual(found.map((family) => family.members.map((m) => m.id).sort()), [["first1", "second"]]);
});

test("issue-families prints an issue with no family", async () => {
  const { spawnSync } = await import("node:child_process");
  const { writeFileSync, mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const file = join(mkdtempSync(join(tmpdir(), "single-")), "issues.json");
  const data = [{ id: "lone01", createdAt: at(0), values: { title: "zebra", status: "backlog", project: "R" } }];
  writeFileSync(file, JSON.stringify({ projects: [{ id: "R" }], data }));
  const run = spawnSync(
    process.execPath,
    [join(skills, "screening-issues/scripts/issue-families.mjs"), "--input", file, "--project", "R"],
    { encoding: "utf8" },
  );
  assert.equal(run.status, 0);
  assert.match(run.stdout, /issues:lone01/);
});

test("issue-freshness flags a stale path cited in body or in context", async () => {
  const { spawnSync, execFileSync } = await import("node:child_process");
  const { writeFileSync, mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const dir = mkdtempSync(join(tmpdir(), "fresh-"));
  execFileSync("git", ["init", "-q", "-b", "main", dir]);
  execFileSync("git", ["-C", dir, "-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "--allow-empty", "-m", "x"]);
  const freshness = (id, values) => {
    const file = join(dir, `${id}.json`);
    writeFileSync(file, JSON.stringify({ projects: [], data: [{ id, createdAt: at(0), values: { title: "t", status: "backlog", ...values } }] }));
    return spawnSync(
      process.execPath,
      [join(skills, "screening-issues/scripts/issue-freshness.mjs"), id, "--input", file, "--checkout", dir, "--branch", "main"],
      { encoding: "utf8" },
    ).stdout;
  };
  assert.match(freshness("i1", { body: "see src/gone/a.ts" }), /src\/gone\/a\.ts/);
  assert.match(freshness("i2", { context: "see src/gone/b.ts" }), /src\/gone\/b\.ts/);
  assert.doesNotMatch(freshness("i3", { problem: "see src/gone/c.ts" }), /src\/gone\/c\.ts/);
});
