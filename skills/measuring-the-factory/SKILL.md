---
name: measuring-the-factory
description: Use when the Maintenance routine runs, nightly. Exports issues, status history, evidence, pull requests, run costs and deploys with your own tools, runs measure.mjs on the export, and writes every row it prints as a factory snapshot. You never compute or correct a number yourself.
---

# Measuring the factory

The Software Factory pages plot `factory-snapshots`. Every value comes from `measure.mjs`, in this
skill's folder, run on an export you write. A number you compute, round, estimate or fill in
yourself is the one failure of this skill: when the script cannot measure something, the page
shows nothing for it, and that is correct.

Read `working-on-issues` first (`read-recipe.md` for where each fact lives, `evidence-kinds.md`
for the rows the script counts). You write only `factory-snapshots`; you never touch an issue, an
evidence row or a project record.

## 1. Write the export

One JSON file in your scratch directory, holding every `projects` record of the workspace (roots and repositories, the whole tree). The script never
calls the workspace (the sandbox holds no workspace key): what is missing from the export is
missing from the dashboard. Read with your record tools, every page of every query.

```json
{
  "projects": [
    {
      "id": "…", "parent": "record:<id>", "fullName": "owner/repo", "deployWorkflows": "deploy.yml",
      "deploys": [
        { "at": "<iso>", "sha": "…", "failed": false, "merges": [{ "pullRequest": "owner/repo#N", "mergedAt": "<iso>" }] }
      ]
    }
  ],
  "issues": [
    {
      "id": "<record id>",
      "createdAt": "<iso>",
      "values": {
        "title": "…", "status": "…", "type": "…", "origin": "…", "closeReason": "…",
        "project": "<id>", "parent": "record:<id>",
        "pullRequests": "owner/repo#N\nowner/repo#M", "problem": "…", "context": "…"
      },
      "statusHistory": [{ "at": "<iso>", "to": "<status>", "byPerson": true }]
    }
  ],
  "evidence": [
    { "id": "…", "issue": "<id>", "kind": "…", "createdAt": "<iso>", "subject": "…", "data": "{…}",
      "waitKind": "<wait rows>", "resolvedAt": "<wait rows, empty while open>" }
  ],
  "pullRequests": [
    { "ref": "owner/repo#N", "state": "open | merged | closed", "mergedAt": "<iso>", "closedAt": "<iso>" }
  ],
  "runs": [{ "id": "…", "routine": "…", "issue": "<id or null>", "project": "<id or null>", "startedAt": "<iso>", "cost": 0.42 }]
}
```

| Part | Where you read it |
|---|---|
| `issues` | the `issues` object, every status, every project. Sections as markdown text, relations as ids |
| `statusHistory` | each issue's activity: every write of `status`, oldest first, the first one being the value at creation; `byPerson` true when a person wrote it, false for an agent (`working-on-issues` § Statuses: who made a move is read in the activity, never inferred) |
| `evidence` | the `evidence` object, kinds `wait` (with `waitKind` and `resolvedAt`), `verdict` and `ruling` at least; `data` as stored |
| `pullRequests` | every line of every issue's `pullRequests`, read live with your GitHub tools: state, merge time, close time |
| `runs` | the run history of the factory's routines (the workspace's agent runs and AI usage): one entry per run with its cost in the workspace's currency, and the issue or project it worked on when the run says so |
| `projects` | the `projects` object, every record with its `parent` (`record:<id>`; the `parentId` attribute) and, for a repository, its `fullName` |
| `deployWorkflows` | only for a repository: the deploy workflows its discovery found (`working-on-issues` § Repository facts), one per line; none found: leave it empty |
| `deploys` | only for a repository with a deploy workflow: every run of those workflows on its `productionBranch` in the last 14 weeks, `failed` true when the run failed or was rolled back, and the pull requests each deploy shipped (the commits between the previous deploy and this one; for a bump carried by a release, the upstream pull requests the bump brought, `releasing-downstream`) |

Leave `deploys` out of a repository with no deploy workflow: the script then writes « no deploy
data » for it, never zero. An entry you cannot read (a pull request that 404s, a run with no cost)
is left out and named in your report; never guess its value.

Dates are the records' server timestamps and GitHub's, never your sense of the time. `--date` is
the run's start time, from the server.

## 2. Run the script

```bash
node measure.mjs --input <export.json> --date <iso> [--weeks <n>]
```

It prints a JSON array of rows on stdout and, on stderr, one line per measure it skipped and why.
Exit 2 is a usage or input error: fix the call or the export and run it again; it is never a
finding. `--weeks` is 2 by default (this week and last, which is final only once it is over); on
the first run after install, pass `--weeks 12` to draw the history the forecast needs.

| Series | Host | Measure |
|---|---|---|
| `scope`, `done` | every record | issues that exist at the end of the week, less those closed with another reason than `done`; issues closed `done` |
| `forecast_p50`, `forecast_p85` | every record | days from the measurement to the date 50 % and 85 % of 1,000 Monte Carlo runs finish the remaining scope, drawing each week from the last 12 complete weeks of throughput, with a fixed seed |
| `not_enough_history` | every record | 1 when fewer than 3 complete weeks of history or none of them delivered anything: no forecast rows then |
| `throughput_<type>` | every record | issues closed `done` in the week, by `type` |
| `cycle_time_p50`, `cycle_time_p85` | every record | days from the first move to `in_progress` to `done`, `percentile_cont` |
| `wip` | every record | issues `in_progress` or `in_review` at the end of the week |
| `paused_hours_<waitKind>` (`blocker`, `decision`, `task`, `date`, `approval`) | every record | hours spent `paused` in the week, summed over issues, each stretch of a pause given to the kinds of the waits open then (split evenly when several are); the row carries `waitKind` |
| `cost_per_merged_pr` | every record | cost of the week's runs, abandoned attempts included, over the pull requests merged; nothing when no run of the week has a cost |
| `pr_conversion` | every record | pull requests merged over pull requests merged or closed in the week |
| `first_round_go_rate` | every record | merged pull requests whose first `verdict` said `go`; verdicts imported from GitHub (`data.imported`) are left out |
| `autonomy_rate`, `interventions_per_issue` | every record | issues closed `done` with no intervention (a `ruling`, or a person's status move other than the launch; the status set at creation is not a move); the mean count |
| `scout_precision` | every record | issues with a `scout:` origin closed in the week that closed `done` |
| `no_deploy_data` | a record with a repository at or below it | 1 when none of those repositories has a deploy workflow: no deploy rows then |
| `deployment_frequency`, `lead_time`, `change_failure_rate`, `recovery_time` | a record with a repository at or below it | deploys in the week; median hours merge → deploy; failed deploys over deploys; median hours from a failed deploy to the next good one |
| `rework_rate` | a record with a repository at or below it | bugs created in the week citing an issue of those repositories merged less than 30 days before, over the issues merged in the week; written with or without a deploy workflow, since it counts bugs, not deploys |

Umbrellas and every issue with `origin: operator` (the « Factory operations log », factory-bug
issues, target-branch issues) are left out of every issue measure. The script writes each series
on every record of the tree: a repository's own, and each record above it recomputed over the
issues filed on it or below it (a root's cycle time is the median of all its repositories' cycle
times, never an average of theirs; its throughput is their sum). A root's page reads those rows.

These names are the `SERIES` table of the bundle's `dashboard.ts`; a series the page does not
plot is not written.

## 3. Write the rows

Each printed row is `{ project, date, series, value }`, `project` the record the row is about, `waitKind` on a `paused_hours_<waitKind>` row (write it: the stacked chart groups by
it), and `state: true` on a state row (not an attribute: do not write it).

- **A period row:** find the snapshot with the same `project`, `series` and `date`.
  Found: update its `value`. Not found: create it. One row per series per week, never two, so a
  `sum` chart never counts a week twice.
- **A state row** (`not_enough_history`, `no_deploy_data`): find the snapshot with the same
  `project` and `series`, whatever its date. Found: update its `value` and `date`.
  Not found: create it. Its metric reads the current state.

Copy `value` as printed. Never write a row the script did not print, never drop one it printed,
never edit a past week the script did not print again.

## Unverified

Not yet checked against a live workspace: that the workspace's agent runs or AI usage expose a
cost **per run** with the run's issue or project. Without it, leave `runs` empty (cost per merged
PR then prints nothing) and say so in your report; never spread a total over runs yourself.

## Report

The rows written (created, updated) per record, every stderr line of the script
verbatim, and every export entry you left out and why. A run that wrote nothing says so and why.

## Red flags

- a value typed, rounded or estimated by you, or a gap « filled » with zero;
- `deploys` invented for a repository with no deploy workflow;
- a second row for the same series, host and week;
- an issue, evidence row or project record written by this run;
- the forecast drawn from fewer than 3 weeks because the page looked empty.
