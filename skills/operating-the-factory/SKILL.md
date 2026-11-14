---
name: operating-the-factory
description: Ops stage. Use when the Ops routine runs a tick over the factory, to relaunch a run that died, hand stranded work back to the stage that owns it, launch Ready issues under a standing order, or run the daily evaluation of the routines.
---

# Operating the factory

Ops sees the pipe through from A to Z: every issue from its filing to its merge, every run of
Intake, Screening, Build and Land. It works in **ticks**: one pass over the runs and the pipe,
closed by a report.

Ops acts through the **owner**: the stage whose work it is. It **relaunches** that stage on one
issue or one pull request, with a context naming the step to run. The change is Build's, the verdict
Land's, the route Screening's, the answer to a Decision a person's. `working-on-issues` owns state,
`workflow.md` owns who moves what, and both win over this skill.

Ops runs on Standards, on its clock alone. Keep in memory, under `ops`, the time of the last tick
and the date of the last evaluation; read them first.

## The tick

### 1. Read the runs

For each of Intake, Screening, Build and Land, read its runs since the last tick
(`working-on-issues/environments.md` § Runs). Sort them into **live** (pending, running) and
**dead** (failed, cancelled, or running for more than 3 hours).

*Done when* every run since the last tick is live, dead or completed.

### 2. Read the pipe

- **Issues:** every issue that is not Done, with `status`, `priority`, `blockedBy`, `pullRequests`,
  `need`, `waitingOn`, `assignee`, and the time of its latest status move; the newest `attempt`,
  `signal` and `screening` row of each In progress, In review and Ready issue.
- **Pull requests** of each repository of the factory: the open ones with their `factory:` labels,
  head sha, draft state, `mergeStateStatus`, the checks' conclusions and the time of the
  `<!-- factory:land -->` comment; those merged or closed since the last tick.
- **Target branches:** the conclusion of the latest run of each required check.

*Done when* every open pull request is matched to its issue, and every issue that is not Done has a
status move time.

### 3. Match live runs to work

A piece of work is **held** when a live run is on it:

| Live run | Holds |
|---|---|
| Land | the pull request carrying `factory:landing` whose status comment was updated in the last 60 minutes |
| Build, started by a trigger | the issue whose move to In progress is the last one before the run started |
| Screening, started by a trigger | the issue created or returned to Backlog last before the run started |
| any run Ops launched | the target of the `ops_relaunch` signal Ops wrote for it |

A live run you cannot match holds whatever its conversation says: find it with `search`
(`kinds: ["session"]`, the routine's label) and `read` it. Reading another conversation closes your
outward tools for the rest of the run, so do it after every relaunch of this tick is sent.

*Done when* every live run holds one named piece of work, or the report names the run you could not
match.

### 4. Repair

Run every row of § Repairs, in order. Each match is one relaunch of its owner (§ Relaunching), on
work no live run holds.

*Done when* each row has a result in the report: nothing found, or the relaunch with its target.

### 5. Launch, under a standing order

With a **standing order** in force (§ The standing order), move the head of the launchable Ready
issues to In progress: by `priority`, empty last, then oldest. One move per tick, since each move
wakes a Build run. An issue is launchable when § Holds names nothing for it.

*Done when* one issue is launched, or the report says why none is.

### 6. Report

In this order: a red target branch; dead runs and what was relaunched; work relaunched for another
reason; merged and opened since the last tick; what waits on a person (Merge it, Decisions,
mockups), oldest first; what Ops could not repair. Issues by title, pull requests by link. Then
write the tick's time in memory.

*Done when* every relaunch of this tick and every wait on a person appears in the report.

### 7. Evaluate, once a day

On the first tick after 06:00 UTC whose date is newer than the last evaluation in memory, run
`evaluating.md` after the report, then write the date in memory. On a Monday, also launch Screening
with the context « weekly sweep ».

## Repairs

| Symptom | Owner | The step its context names |
|---|---|---|
| a dead Build run, its issue In progress with no open pull request | Build | the `Next:` of the issue's newest `attempt` row; without one, « start from the branch `<name>` if it exists, else from the brief » |
| a dead Land run, its pull request open | Land | « take over from the ledger » (`landing-pull-requests` § Taking over) |
| a dead Screening or Intake run | Screening, or nobody | Screening: « screen this issue »; Intake: report the Slack message, a person asks again |
| an issue In progress for 30 minutes with no open pull request, held by no run | Build | « build this issue » |
| an open pull request, not a draft, its checks concluded, no verdict on its head for 30 minutes, held by no run | Land | « judge this head » |
| a pull request with `factory:changes` and no answers comment for 30 minutes, held by no run | Land | « fix what the verdict asks, then judge » |
| a pull request with `factory:go` on its head, neither merged, enqueued nor `factory:waiting`, for 10 minutes | Land | « merge by the mode »; « merge the target branch in first » when it is `DIRTY` or left the queue |
| a pull request carrying `factory:landing` whose status comment is older than 60 minutes | Land | « take over from the ledger » |
| an issue that is not Done whose every linked pull request is merged | Land | « close this issue » |
| a Ready issue a person moved there after its newest `screening` row | Screening | « a person released this issue » |
| a Backlog issue with no `screening` row for 30 minutes, or one whose newest is older than 7 days | Screening | « screen this issue » |
| two open pull requests citing one issue | nobody | report both links; write `signal`, `Rule: duplicate_pull_request` |
| a required check red on a target branch | nobody | report it first; pull requests waiting on it are held, not stranded |

A dead run gets one `signal` on its issue first: `Rule: run_died`, the run's id, its error and how
long it ran. A run that died with nothing on the issue also gets its `attempt` row, `Cause:
environment`, so the next run reads what happened.

## Relaunching

Start a run of the owner with a context (`working-on-issues/environments.md` § Runs): on a pull
request, on its own conversation when your tool can. Write the `signal` first (`Rule:
ops_relaunch`, the target, the symptom), then launch with one paragraph of facts, in this order:

- **Target:** the issue (title and id) or the pull request (`owner/repo#N` and its head sha).
- **Why now:** what the tick saw, with times (« verdict go on 6dcb4099, DIRTY against main since
  10:13 », « run b5c1 failed after 41 minutes: bridge closed »).
- **Step:** the quoted step of § Repairs, with the `Next:` line or the conflicted files when there
  are any.
- **Order:** the standing order this acts on, quoted with its date, when one applies.

Five relaunches per tick at most, dead runs first. A target relaunched at the last tick with no row
from its owner since is not relaunched again: it opens the report as « relaunch brought nothing ».

*Done when* the launch answered a run id, or the report names the lever that failed and why.

## Holds

A Ready issue stays Ready while one of these holds it:

- **Blocked:** an issue of its `blockedBy` is not Done.
- **Same files:** an open pull request, or an issue In progress, changes the same component, locale
  file or module (the issue's `## Seams` against the pull request's file list).
- **Release:** the fix needs a published version of a package its repository consumes.
- **Assigned:** its `assignee` is set: a person holds it.

## The standing order

A maintainer's words, quoted with their date in the run's launch context or in the project's
`context` under `Standing order:` (« launch everything Ready tonight », « launch p1 and p2 bugs »).
It allows § 5 and nothing else; it ends at the date it names, or after 24 hours. With none in
force, Ops repairs and reports, and its report ends with the launches it would make.

## Filing

A fault the evaluation or two ticks saw twice becomes an issue on the factory's project: `search`
the `issues` object first and add the new evidence to an existing issue's `context`. A new one gets
`## Request` (the maintainer's quoted ask, or « Ops evaluation of <date> »), `## Problem` (what was
seen, with times, run ids and links), `## Acceptance`, `## Out of scope`, status Backlog, `origin:
ops`.
