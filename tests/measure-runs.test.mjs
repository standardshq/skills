import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const skills = join(dirname(fileURLToPath(import.meta.url)), "..", "skills");
const { measureRuns } = await import(join(skills, "operating-the-factory/scripts/measure-runs.mjs"));

const at = (minute) => new Date(Date.parse("2026-11-14T00:00:00Z") + minute * 60_000).toISOString();
const run = (source, start, end, extra = {}) => ({
  source,
  status: "completed",
  startedAt: at(start),
  completedAt: at(end),
  ...extra,
});

test("measure-runs counts empty clock runs, groups one fault under one line and finds the overlap", () => {
  const report = measureRuns({
    build: [
      run("schedule", 0, 1),
      run("schedule", 1, 2),
      run("trigger", 10, 70),
      run("trigger", 30, 90),
      run("trigger", 40, 41, {
        status: "failed",
        error: "run 3f2a9c10-1111-2222-3333-444455556666 interrupted after 12 steps",
      }),
      run("trigger", 50, 51, {
        status: "failed",
        error: "run 9b8d7e60-aaaa-bbbb-cccc-ddddeeeeffff interrupted after 7 steps",
      }),
      { source: "launch", status: "running", startedAt: at(95) },
    ],
  });

  assert.deepEqual(report.build.sources.schedule, { runs: 2, short: 2, failed: 0, errors: {}, hours: 0 });
  assert.deepEqual(report.build.sources.trigger, {
    runs: 4,
    short: 2,
    failed: 2,
    errors: { "run <id> interrupted after <n> steps": 2 },
    hours: 2,
  });
  assert.equal(report.build.sources.launch.runs, 1);
  assert.equal(report.build.runs, 7);
  assert.equal(report.build.mostAtOnce, 3);
});
