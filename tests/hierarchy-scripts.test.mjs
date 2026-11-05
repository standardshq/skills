import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const skills = join(dirname(fileURLToPath(import.meta.url)), "..", "skills");
const { families } = await import(join(skills, "screening-issues/scripts/issue-families.mjs"));
const { measure } = await import(join(skills, "measuring-the-factory/measure.mjs"));
const { plan } = await import(join(skills, "importing-github-issues/import.mjs"));

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
