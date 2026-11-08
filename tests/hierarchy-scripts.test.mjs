import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const skills = join(dirname(fileURLToPath(import.meta.url)), "..", "skills");
const { families } = await import(join(skills, "screening-issues/scripts/issue-families.mjs"));

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
