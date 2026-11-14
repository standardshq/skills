#!/usr/bin/env node
/**
 * Measures a day of factory runs for Ops's evaluation.
 *
 *   node measure-runs.mjs runs.json
 *
 * `runs.json` holds `{ "<routine>": [<run row>, ...] }`, each row as a routine's
 * runs are read: `status`, `startedAt`, `completedAt`, `source` (`trigger`,
 * `schedule` or `launch`) and `error`. Prints one JSON report on stdout.
 */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const SHORT_MINUTES = 2;

function minutes(run) {
  if (!run.startedAt || !run.completedAt) return undefined;
  return (Date.parse(run.completedAt) - Date.parse(run.startedAt)) / 60_000;
}

/** An error with its ids and numbers folded, so one fault groups under one line. */
function errorKey(error) {
  return String(error || "no error recorded")
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27}/g, "<id>")
    .replace(/\d+/g, "<n>")
    .slice(0, 100);
}

/** The most runs of one routine in progress at the same instant. */
function mostAtOnce(runs) {
  const edges = runs
    .filter((run) => minutes(run) !== undefined)
    .flatMap((run) => [
      [Date.parse(run.startedAt), 1],
      [Date.parse(run.completedAt), -1],
    ])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let live = 0;
  let most = 0;
  for (const [, step] of edges) {
    live += step;
    most = Math.max(most, live);
  }
  return most;
}

function measureSource(runs) {
  const durations = runs.map(minutes).filter((value) => value !== undefined);
  const failed = runs.filter((run) => run.status === "failed");
  const errors = {};
  for (const run of failed) errors[errorKey(run.error)] = (errors[errorKey(run.error)] ?? 0) + 1;
  return {
    runs: runs.length,
    short: durations.filter((value) => value < SHORT_MINUTES).length,
    failed: failed.length,
    errors,
    hours: Math.round(durations.reduce((sum, value) => sum + value, 0) / 6) / 10,
  };
}

export function measureRuns(byRoutine) {
  const report = {};
  for (const [routine, runs] of Object.entries(byRoutine)) {
    const sources = {};
    for (const source of ["trigger", "schedule", "launch"]) {
      const rows = runs.filter((run) => run.source === source);
      if (rows.length > 0) sources[source] = measureSource(rows);
    }
    report[routine] = { ...measureSource(runs), mostAtOnce: mostAtOnce(runs), sources };
  }
  return report;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const file = process.argv[2];
  if (!file) {
    console.error("usage: measure-runs.mjs <runs.json>");
    process.exit(2);
  }
  console.log(JSON.stringify(measureRuns(JSON.parse(readFileSync(file, "utf8"))), null, 2));
}
