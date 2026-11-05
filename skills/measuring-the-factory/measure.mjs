#!/usr/bin/env node
/**
 * Every number of the Software Factory dashboard, computed from an export.
 *
 *   node measure.mjs --input <export.json> --date <iso> [--weeks <n>] [--project <id>] [--seed <n>]
 *
 * The export is written by the Maintenance routine with its own record and
 * GitHub tools (shape in `measuring-the-factory` § 1). The script
 * never calls the workspace: it prints, on stdout, a JSON array of
 * `factory-snapshots` rows for the routine to upsert, and on stderr one line
 * per measure it could not compute and why.
 *
 * Series names and their aggregation are the SERIES table of the bundle's
 * `dashboard.ts`; a period is an ISO week starting Monday 00:00 UTC. Rows of
 * the current week and the `--weeks - 1` weeks before it are printed (2 by
 * default: the previous week is final only once it is over). State rows
 * (`not_enough_history`, `no_deploy_data`) describe the latest week only.
 * A forecast row's value is a number of days counted from the measurement
 * date: the end of its week, or `--date` for the current week.
 *
 * Exit 0 rows printed; 2 usage or input error.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/** Monte Carlo: 1,000 runs over the last 12 weeks; fewer than 3 weeks is not enough history. */
export const FORECAST = { runs: 1000, window: 12, minWeeks: 3, maxWeeks: 520, seed: 20261103 };
/** A bug born within 30 days of the merge of the issue it cites is rework. */
const REWORK_WINDOW = 30 * DAY;
const THROUGHPUT_TYPES = ["bug", "enhancement", "feature", "chore"];
const WAIT_KINDS = ["blocker", "decision", "task", "date", "approval"];
const IN_FLIGHT = new Set(["in_progress", "in_review"]);

/** `percentile_cont`: linear interpolation between the closest ranks of the sorted values. */
export function percentile(values, p) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = p * (sorted.length - 1);
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  return sorted[low] + (sorted[high] - sorted[low]) * (rank - low);
}

/** Mulberry32: a seeded generator, so one export always gives one forecast. */
export function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/**
 * Weeks until `remaining` items are done, drawing each week's throughput from
 * `history`: the 50 % and 85 % points of 1,000 runs, in weeks. Null when the
 * history is too short or never delivered anything.
 */
export function forecast(history, remaining, seed = FORECAST.seed) {
  if (history.length < FORECAST.minWeeks || history.every((count) => count === 0)) return null;
  if (remaining <= 0) return { p50: 0, p85: 0 };
  const random = seeded(seed);
  const outcomes = [];
  for (let run = 0; run < FORECAST.runs; run++) {
    let left = remaining;
    let weeks = 0;
    while (left > 0 && weeks < FORECAST.maxWeeks) {
      left -= history[Math.floor(random() * history.length)];
      weeks++;
    }
    outcomes.push(weeks);
  }
  return { p50: percentile(outcomes, 0.5), p85: percentile(outcomes, 0.85) };
}

const time = (value) => (value ? Date.parse(value) : Number.NaN);
const valuesOf = (record) => record.values ?? {};
const idOf = (value) => (value && typeof value === "object" ? String(value.id) : value);
const idsOf = (value) =>
  value == null ? [] : (Array.isArray(value) ? value : [value]).map(idOf).filter(Boolean);
const linesOf = (text) =>
  String(text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
const textOf = (value) =>
  value == null ? "" : typeof value === "string" ? value : JSON.stringify(value);
const round = (value) => Math.round(value * 1000) / 1000;
const dataOf = (row) => {
  if (!row.data) return {};
  if (typeof row.data === "object") return row.data;
  try {
    return JSON.parse(row.data);
  } catch {
    return {};
  }
};

/** Monday 00:00 UTC of the week holding `at`. */
export function weekStart(at) {
  const day = new Date(at);
  day.setUTCHours(0, 0, 0, 0);
  return day.getTime() - ((day.getUTCDay() + 6) % 7) * DAY;
}
const isoDate = (at) => new Date(at).toISOString().slice(0, 10);

/** An issue's status history, oldest first, opened by its creation status when the export lacks it. */
function historyOf(issue) {
  const moves = (issue.statusHistory ?? [])
    .map((move) => ({ at: time(move.at), to: move.to, byPerson: move.byPerson === true }))
    .filter((move) => !Number.isNaN(move.at))
    .sort((a, b) => a.at - b.at);
  if (moves.length === 0) {
    return [{ at: time(issue.createdAt), to: valuesOf(issue).status, byPerson: false }];
  }
  return moves;
}

function statusAt(issue, at) {
  if (time(issue.createdAt) > at) return null;
  let status = issue.history[0]?.to ?? null;
  for (const move of issue.history) {
    if (move.at > at) break;
    status = move.to;
  }
  return status;
}

/** When the issue last moved to `done`, if it is done now. */
function doneAt(issue) {
  if (valuesOf(issue).status !== "done") return null;
  const last = issue.history.filter((move) => move.to === "done").at(-1);
  return last ? last.at : null;
}

const doneWell = (issue) => valuesOf(issue).closeReason === "done";
const within = (at, period) => at != null && at >= period.start && at < period.end;

/**
 * Hours an issue spent paused between `from` and `to`, by the kind of what it
 * waited on: each stretch of a pause goes to the waits open then, split evenly
 * when several kinds are open at once, so the kinds add up to the time paused.
 * A stretch with no open wait (a broken invariant) is counted nowhere.
 */
function pausedHoursByKind(issue, waits, from, to) {
  const hours = new Map();
  issue.history.forEach((move, index) => {
    if (move.to !== "paused") return;
    const start = Math.max(move.at, from);
    const end = Math.min(issue.history[index + 1]?.at ?? Number.POSITIVE_INFINITY, to);
    if (end <= start) return;
    const cuts = new Set([start, end]);
    for (const wait of waits) {
      for (const at of [wait.createdAt, wait.resolvedAt]) if (at > start && at < end) cuts.add(at);
    }
    const points = [...cuts].sort((a, b) => a - b);
    for (let i = 0; i + 1 < points.length; i++) {
      const open = new Set(
        waits
          .filter((wait) => wait.createdAt <= points[i] && !(wait.resolvedAt <= points[i]))
          .map((wait) => wait.waitKind),
      );
      for (const kind of open) {
        hours.set(kind, (hours.get(kind) ?? 0) + (points[i + 1] - points[i]) / open.size / HOUR);
      }
    }
  });
  return hours;
}

/**
 * A person's interventions on an issue: every ruling, and every status move a
 * person wrote except the launch (their first move into `in_progress`, or
 * into `ready` for a task of an umbrella, `working-on-issues` § Launch).
 */
function interventions(issue, rulings) {
  const launchTo = parentIdOf(valuesOf(issue)) !== null ? "ready" : "in_progress";
  // The first entry is the status the issue was created with: a creation, not a move.
  const personal = issue.history.filter((move, index) => index > 0 && move.byPerson);
  const launch = personal.findIndex((move) => move.to === launchTo);
  return personal.length - (launch === -1 ? 0 : 1) + (rulings.get(issue.id) ?? 0);
}

/** The id a `parent` points at: `record:<id>`, an object or a bare id. */
const parentIdOf = (values) => {
  const [parent] = idsOf(values.parent ?? values.parentId);
  return parent ? String(parent).replace(/^record:/, "") : null;
};

/** The repository part of `owner/repo#N`. */
const repositoryOfRef = (ref) => ref.split("#")[0].toLowerCase();

/**
 * Every series of one record of the `projects` tree, over the issues filed on
 * it or on any record below it: a root is recomputed from the merged issues of
 * its repositories, never averaged from their rows.
 */
function measureProject(context, project, period, rows, notes) {
  const { issues, timeline, pullRequests, runs, measuredAt } = context;
  const at = Math.min(period.end, measuredAt);
  const date = isoDate(period.start);
  const add = (series, value) => rows.push({ project: project.id, date, series, value: round(value) });
  const subtree = context.subtreeOf.get(project.id);
  const leaves = issues.filter(
    (issue) => subtree.has(issue.project) && !issue.isUmbrella && issue.origin !== "operator",
  );

  const live = leaves.filter((issue) => statusAt(issue, at) !== null);
  const done = live.filter((issue) => statusAt(issue, at) === "done");
  const scope = live.length - done.filter((issue) => !doneWell(issue)).length;
  const doneCount = done.filter(doneWell).length;
  add("scope", scope);
  add("done", doneCount);

  const finished = leaves.filter((issue) => within(issue.doneAt, period) && doneWell(issue));
  for (const type of THROUGHPUT_TYPES) {
    add(`throughput_${type}`, finished.filter((issue) => issue.type === type).length);
  }

  const cycles = finished
    .map((issue) => {
      const launch = issue.history.find((move) => move.to === "in_progress");
      return launch ? (issue.doneAt - launch.at) / DAY : null;
    })
    .filter((days) => days != null && days >= 0);
  if (cycles.length > 0) {
    add("cycle_time_p50", percentile(cycles, 0.5));
    add("cycle_time_p85", percentile(cycles, 0.85));
  } else notes.push(`${project.id} ${date}: no issue merged, no cycle time`);

  add("wip", live.filter((issue) => IN_FLIGHT.has(statusAt(issue, at))).length);
  const paused = new Map(WAIT_KINDS.map((kind) => [kind, 0]));
  for (const issue of leaves) {
    const waits = context.waitsOf.get(issue.id) ?? [];
    for (const [kind, hours] of pausedHoursByKind(issue, waits, period.start, at)) {
      if (paused.has(kind)) paused.set(kind, paused.get(kind) + hours);
    }
  }
  for (const [waitKind, hours] of paused) {
    rows.push({
      project: project.id,
      date,
      series: `paused_hours_${waitKind}`,
      value: round(hours),
      waitKind,
    });
  }

  const first = Math.min(...leaves.map((issue) => time(issue.createdAt)));
  const complete = Number.isFinite(first)
    ? Math.max(0, Math.floor((period.start - weekStart(first)) / WEEK))
    : 0;
  const window = Math.min(FORECAST.window, complete);
  const history = Array.from({ length: window }, (_, index) => {
    const start = period.start - (window - index) * WEEK;
    const week = { start, end: start + WEEK };
    return leaves.filter((issue) => within(issue.doneAt, week) && doneWell(issue)).length;
  });
  const outlook = forecast(history, scope - doneCount, context.seed);
  if (outlook) {
    add("forecast_p50", outlook.p50 * 7);
    add("forecast_p85", outlook.p85 * 7);
  } else {
    notes.push(
      `${project.id} ${date}: not enough history (${window} complete weeks, ${history.reduce(
        (a, b) => a + b,
        0,
      )} done), no forecast`,
    );
  }
  if (period.latest) {
    rows.push({
      project: project.id,
      date: isoDate(at),
      series: "not_enough_history",
      value: outlook ? 0 : 1,
      state: true,
    });
  }

  const refs = new Set(leaves.flatMap((issue) => issue.pullRequests));
  const prs = pullRequests.filter((pr) => refs.has(pr.ref));
  const merged = prs.filter((pr) => within(time(pr.mergedAt), period));
  const closed = prs.filter((pr) => within(time(pr.mergedAt ?? pr.closedAt), period));
  const ownRuns = runs.filter(
    (run) =>
      within(time(run.startedAt), period) &&
      subtree.has(idOf(run.project) ?? context.projectOf.get(idOf(run.issue))),
  );
  const priced = ownRuns.filter((run) => Number.isFinite(Number.parseFloat(run.cost)));
  if (merged.length === 0) {
    notes.push(`${project.id} ${date}: no pull request merged, no cost per merged PR`);
  } else if (priced.length === 0) {
    notes.push(`${project.id} ${date}: no run of the week has a cost, no cost per merged PR`);
  } else {
    const cost = priced.reduce((sum, run) => sum + Number.parseFloat(run.cost), 0);
    add("cost_per_merged_pr", cost / merged.length);
    if (priced.length < ownRuns.length) {
      notes.push(
        `${project.id} ${date}: ${ownRuns.length - priced.length} runs without a cost left out`,
      );
    }
  }
  if (closed.length > 0) add("pr_conversion", merged.length / closed.length);

  const judged = merged
    .map(
      (pr) =>
        timeline
          .filter(
            (row) =>
              row.kind === "verdict" &&
              dataOf(row).imported !== true &&
              String(row.subject ?? "").startsWith(`github:${pr.ref}@`),
          )
          .sort((a, b) => time(a.createdAt) - time(b.createdAt))[0],
    )
    .filter(Boolean);
  if (judged.length > 0) {
    add(
      "first_round_go_rate",
      judged.filter((row) => dataOf(row).outcome === "go").length / judged.length,
    );
  }

  if (finished.length > 0) {
    const counts = finished.map((issue) => interventions(issue, context.rulings));
    add("autonomy_rate", counts.filter((count) => count === 0).length / counts.length);
    add("interventions_per_issue", counts.reduce((a, b) => a + b, 0) / counts.length);
  }

  const scouted = leaves.filter(
    (issue) => issue.origin.startsWith("scout:") && within(issue.doneAt, period),
  );
  if (scouted.length > 0) {
    add("scout_precision", scouted.filter(doneWell).length / scouted.length);
  }
}

/** The repositories of a subtree: the records holding a `fullName`. */
const repositoriesOf = (context, project) =>
  context.projects.filter(
    (each) => String(each.fullName ?? "").trim() !== "" && context.subtreeOf.get(project.id).has(each.id),
  );

/**
 * A deploy is a run of the repository's deploy workflows on its production
 * branch. `deployWorkflows` empty: none found; absent or null: discovery
 * failed, so nothing is known (never read as « does not deploy »).
 */
const deployKnown = (repository) => repository.deployWorkflows != null;
const hasDeployWorkflow = (repository) =>
  (Array.isArray(repository.deployWorkflows)
    ? repository.deployWorkflows.join("\n")
    : String(repository.deployWorkflows ?? "")
  ).trim() !== "";

/** Delivery rows of one record, from the repositories at or below it. */
function measureDelivery(context, project, period, rows, notes) {
  const all = repositoriesOf(context, project);
  const date = isoDate(period.start);
  const add = (series, value) => rows.push({ project: project.id, date, series, value: round(value) });
  if (all.length === 0) {
    if (period.latest) {
      rows.push({
        project: project.id,
        date: isoDate(Math.min(period.end, context.measuredAt)),
        series: "no_deploy_data",
        value: 1,
        state: true,
      });
    }
    return;
  }
  const repositories = all.filter(deployKnown);
  if (repositories.length === 0) {
    if (period.latest) notes.push(`${project.id}: deploy discovery failed, no delivery rows`);
    return;
  }
  const names = new Set(repositories.map((each) => String(each.fullName).toLowerCase()));

  const withDeploys = repositories.filter(hasDeployWorkflow);
  const signalled = withDeploys.length > 0;
  const excluded = all.length - repositories.length;
  if (period.latest && excluded > 0) {
    notes.push(
      `${project.id}: ${excluded} repositor${excluded === 1 ? "y" : "ies"} with failed deploy discovery left out of its delivery rows`,
    );
  }
  // With a repository unknown, « nothing deploys » is not established: write no state row.
  if (period.latest && (signalled || excluded === 0)) {
    rows.push({
      project: project.id,
      date: isoDate(Math.min(period.end, context.measuredAt)),
      series: "no_deploy_data",
      value: signalled ? 0 : 1,
      state: true,
    });
  }
  if (signalled) {
    const deploys = withDeploys
      .flatMap((repository) => repository.deploys ?? [])
      .map((deploy) => ({ ...deploy, at: time(deploy.at) }))
      .filter((deploy) => !Number.isNaN(deploy.at))
      .sort((a, b) => a.at - b.at);
    const shipped = deploys.filter((deploy) => within(deploy.at, period));
    add("deployment_frequency", shipped.length);
    const leads = shipped.flatMap((deploy) =>
      (deploy.merges ?? [])
        .map((merge) => (deploy.at - time(merge.mergedAt)) / HOUR)
        .filter((hours) => hours >= 0),
    );
    if (leads.length > 0) add("lead_time", percentile(leads, 0.5));
    if (shipped.length > 0) {
      const failed = shipped.filter((deploy) => deploy.failed === true);
      add("change_failure_rate", failed.length / shipped.length);
      const recoveries = failed
        .map((deploy) => {
          const next = deploys.find((later) => later.at > deploy.at && later.failed !== true);
          return next ? (next.at - deploy.at) / HOUR : null;
        })
        .filter((hours) => hours != null);
      if (recoveries.length > 0) add("recovery_time", percentile(recoveries, 0.5));
    }
  } else if (period.latest) {
    notes.push(`${project.id}: no deploy workflow, no deploy rows`);
  }

  const served = context.issues.filter(
    (issue) =>
      !issue.isUmbrella &&
      issue.origin !== "operator" &&
      issue.pullRequests.some((ref) => names.has(repositoryOfRef(ref))),
  );
  const merged = served.filter((issue) => within(issue.doneAt, period) && doneWell(issue));
  const reworked = context.issues.filter((bug) => {
    if (bug.type !== "bug" || !within(time(bug.createdAt), period)) return false;
    return served.some(
      (origin) =>
        origin.id !== bug.id &&
        doneWell(origin) &&
        origin.doneAt != null &&
        origin.doneAt <= time(bug.createdAt) &&
        time(bug.createdAt) - origin.doneAt < REWORK_WINDOW &&
        (bug.text.includes(`issues:${origin.id}`) ||
          origin.pullRequests.some((ref) => bug.text.includes(ref))),
    );
  });
  if (merged.length > 0) add("rework_rate", reworked.length / merged.length);
  else if (reworked.length > 0) {
    notes.push(`${project.id} ${date}: ${reworked.length} rework bugs, nothing merged`);
  }
}

/** The export, read once into the shape every measure uses. */
export function prepare(input, { date, seed = FORECAST.seed }) {
  const measuredAt = time(date);
  if (Number.isNaN(measuredAt)) throw new Error(`--date is not a date: ${date}`);
  // A row may come back flat or as a record with `values`; relations as an id or an object.
  const timeline = (input.timeline ?? []).map((row) => ({ ...row, ...(row.values ?? {}) }));
  const rulings = new Map();
  const waitsOf = new Map();
  for (const row of timeline) {
    const issue = idOf(row.issue);
    if (row.kind === "ruling") rulings.set(issue, (rulings.get(issue) ?? 0) + 1);
    if (row.kind === "wait" && row.waitKind) {
      const wait = {
        waitKind: row.waitKind,
        createdAt: time(row.createdAt),
        resolvedAt: row.resolvedAt ? time(row.resolvedAt) : Number.POSITIVE_INFINITY,
      };
      waitsOf.set(issue, [...(waitsOf.get(issue) ?? []), wait]);
    }
  }
  const issues = (input.issues ?? []).map((record) => {
    const values = valuesOf(record);
    const issue = {
      ...record,
      id: String(record.id),
      project: idOf(values.project),
      type: values.type ?? null,
      origin: String(values.origin ?? ""),
      isUmbrella: false,
      pullRequests: linesOf(values.pullRequests),
      text: [values.title, values.body, values.context].map(textOf).join("\n"),
    };
    issue.parentId = parentIdOf(values);
    issue.history = historyOf(issue);
    issue.doneAt = doneAt(issue);
    return issue;
  });
  // An umbrella is read from its tasks: `childIds` holds six ids at most.
  const umbrellas = new Set(issues.map((issue) => issue.parentId).filter(Boolean));
  for (const issue of issues) issue.isUmbrella = umbrellas.has(issue.id);
  const projects = (input.projects ?? []).map((record) => ({
    ...record,
    ...valuesOf(record),
    id: String(record.id),
    parentId: parentIdOf({ ...record, ...valuesOf(record) }),
  }));
  const subtreeOf = new Map(projects.map((each) => [each.id, new Set([each.id])]));
  for (const each of projects) {
    for (let up = each.parentId, hops = 0; up && hops <= projects.length; hops++) {
      subtreeOf.get(up)?.add(each.id);
      up = projects.find((candidate) => candidate.id === up)?.parentId;
    }
  }
  return {
    projectOf: new Map(issues.map((issue) => [issue.id, issue.project])),
    projects,
    subtreeOf,
    pullRequests: input.pullRequests ?? [],
    runs: input.runs ?? [],
    timeline,
    issues,
    rulings,
    waitsOf,
    measuredAt,
    seed,
  };
}

/** Every row for the `weeks` weeks ending with the one holding `date`. */
export function measure(input, { date, weeks = 2, project, seed } = {}) {
  const context = prepare(input, { date, seed });
  const rows = [];
  const notes = [];
  const current = weekStart(context.measuredAt);
  for (let back = weeks - 1; back >= 0; back--) {
    const start = current - back * WEEK;
    const period = { start, end: start + WEEK, latest: back === 0 };
    for (const each of context.projects) {
      if (project && !context.subtreeOf.get(project)?.has(each.id)) continue;
      measureProject(context, each, period, rows, notes);
      measureDelivery(context, each, period, rows, notes);
    }
  }
  return { rows, notes };
}

function parseArgs(argv) {
  const options = { weeks: 2 };
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!flag.startsWith("--") || value === undefined) throw new Error(`unexpected ${flag}`);
    options[flag.slice(2)] = value;
    index++;
  }
  if (!options.input || !options.date) throw new Error("--input and --date are required");
  options.weeks = Number(options.weeks);
  if (!Number.isInteger(options.weeks) || options.weeks < 1) throw new Error("--weeks must be ≥ 1");
  if (options.seed !== undefined) options.seed = Number(options.seed);
  return options;
}

async function main() {
  let options;
  let input;
  try {
    options = parseArgs(process.argv.slice(2));
    input = JSON.parse(await readFile(options.input, "utf8"));
  } catch (error) {
    console.error(
      `${error.message}\nusage: measure.mjs --input <export.json> --date <iso> [--weeks <n>] [--project <id>] [--seed <n>]`,
    );
    process.exit(2);
  }
  const { rows, notes } = measure(input, options);
  for (const note of notes) console.error(note);
  console.log(JSON.stringify(rows, null, 2));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
