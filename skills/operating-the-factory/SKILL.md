---
name: operating-the-factory
description: Use when the Maintenance routine runs, every 15 minutes. Catches what slipped through the structure - broken invariants, gestures or a repository's `notes` written by an agent, waits with no active owner, double or looping leases, self-verification, idle or dropped pull requests, a red target branch, piled-up Décisions, failing routines, unhealthy repositories, a stalled delivery chain, a blown budget - and answers each with one listed action or a Décision.
---

# Operating the factory

The structure makes stuck work unlikely; you catch what slips. Every 15 minutes you look, write a
`signal` for what you notice, take at most the one action the table allows for it, and otherwise
ask a person. You are a safety net, not a stage: you never do another skill's work.

Read `working-on-issues` first, with `evidence-kinds.md` and `read-recipe.md`: the statuses, who
moves them, the moves an agent may make on a person's behalf and the evidence each needs, the
lease, the wait shape. Read `waking-issues` to know what that skill owns, so you leave it to it: a Maintenance
run does both, as separate passes, and this one never wakes an issue. Ask people with `asking-for-decisions`.

## What you never do

- Wake an issue, resolve or release a wait, apply a ruling: never write `woke`, `resolved`,
  `abandoned`, `released` or `applied`, never set `resolvedAt`, never run `waking-issues` logic,
  even when the answer looks obvious. A wait on a resolved target is `waking-issues`' to end.
- Claim a lease, write code, judge or merge a pull request, write `verdict`, `go`, `check-run` or
  `attempt`.
- Edit or delete an evidence row. Every correction you make is a new row.
- Re-ask a question: deadlines and their one question, Extend's one re-ask included, are the
  `waking-issues`' (§ 6).
- Take an action the table below does not list. When the right move is not on it, do not take it:
  write a `signal` (`rule: refused_action`) saying what you would have done and why, and ask the
  person the table names with a Décision.

## How every action is written

1. **Notice first:** a `signal` row on the issue (`data.rule`, `subject` naming what it is about:
   a pull request head, `evidence:<id>`, `projects:<id>`), `body` saying what you saw, with
   dates from the records' server timestamps. You noticed it already when a `signal` with the same
   `rule` and `subject` is newer than the condition's start: do not write it again, and take only
   the next step the table allows (a Décision after a re-queue, for instance).
2. **Then the action,** at most one, from the table.
3. **Then the Décision,** when the table says so, asked with `asking-for-decisions` (re-resolve,
   one forking question, a briefing): to the project's first active maintainer unless the table
   names someone else. It opens no wait and moves no status, except where the action itself is a
   wait (an invariant, the budget). Group: one Décision per person per run, one section per case.
   When an answer comes back, record its `ruling` as that skill says, on the issue it is about,
   and act on it only within the table.

**No issue to hang it on** (a repository's `notes`, a routine, a repository's
health): write the `signal` on the project's **« Factory operations log »** issue, and link the
record in the Décision (`record:projects:<id>`). One per project, found by its title and
`origin: operator`; any routine that finds it missing creates it, on first need, with `status: done`, `closeReason: done`, `type:
chore`, `origin: operator`, and an `intent` saying it only carries the factory routines' signals. It is
never screened, launched or reopened; the dashboard's Health block reads the signals on it. A
repository serving several projects: the log of each.

**No active maintainer:** where you would ask, write the `signal` (`rule: no_owner`) instead.

**Your own rows sanction your own moves.** A revert you made is preceded by its `signal`
(`rule: reverted_move`); a pause you made by its `wait`; a revert of `notes` by its `signal`
(`rule: notes_reverted`). Never revert any of them on the next pass.

## The pass

In this order. Handle each case on its own: a record you cannot read is a line in your report, not
the end of the pass.

### 1. Invariants

| Broken | Act |
|---|---|
| an issue `paused` with no open `wait` row, its move to `paused` more than 5 minutes old (younger: a pause being written) | write the missing wait: ask the first active maintainer « paused, waiting on nothing » with **Resume it**, **Close it**, **I take it**, then a `decision` `wait` on that Décision (`owner` the maintainer, `resumeAt` the stage the status before the pause implies, `waking-issues` § 7, deadline per § Thresholds, `data.question`). The status stays `paused`. Then the factory-bug issue |
| an open `wait` whose target resolved (`evidence-kinds.md` § Targets) more than 90 minutes ago (`waking-issues`' hourly pass missed it) | nothing to the wait: the `signal`, the factory-bug issue, and a Décision naming the issues |
| an open `wait` on an issue that is not `paused`, with no person's move out of `paused` newer than it (an agent's move is § 2's to revert, as `waking-issues` § 5 leaves it), more than 90 minutes old | the same: `signal`, factory-bug issue, Décision |

**The factory-bug issue:** one open issue per broken rule, in the project of the issue that broke
it: `type: bug`, `origin: operator`, title « Factory: <rule> », `problem` naming each case (issue,
row ids, times) and what you did, `acceptance` « the invariant holds on the next Maintenance pass ».
One already open for that rule: add a dated line to its `context` instead.

### 2. Moves an agent wrote

Read the activity of every issue since your previous pass (with a 15-minute overlap). For each
status move an agent wrote, it is sanctioned when the status table of `working-on-issues` names
that agent as the mover and its condition held at the time, or when the table of moves on a
person's behalf lists it and its evidence was written before it; your own reverts and pauses are
sanctioned by the rows you wrote first. A `ruling` that table asks for may be on another issue:
a ruling whose `subject` equals the `target` of a `decision` or `approval` wait of this issue (one
Décision, several issues: `waking-issues` § 6). Look for it there before calling the move
unsanctioned. Any other agent-written move is a gesture taken from a
person:

1. the `signal` (`rule: reverted_move`, `subject` the issue and the move, by whom, when);
2. **revert** the status to the value before the move, unless anyone moved the issue since (then
   no revert: a later move stands);
3. a Décision to the first active maintainer naming the agent, the move and the revert.

A record created directly at a status (by `importing-github-issues`, `shaping-features`,
`releasing-downstream`, or the « Factory operations log » created `done`) is a creation, not an
agent status move: its first status is never reverted. A move to `paused` with no
wait is § 1, not a revert. An agent's move into `paused` of an issue that
was `mine` is reverted. A revert out of `done` cannot undo what `waking-issues` already did on
that move (waits on the issue it resolved): name those issues in the Décision.

### 3. Notes written by an agent

On every repository (a `projects` record with a `fullName`), the activity since your previous pass
on `notes`. A person's write stands. An agent's write does not: the `signal`
(`rule: notes_reverted`) on the operations log, **revert** `notes` to its previous value, then a
Décision to the maintainers of the repository's projects naming both values and the writer. Your
own revert is an agent write too, sanctioned by that `signal`: a write to `notes` that a
`notes_reverted` signal names stands, never reverted again. The
other facts of a repository are discovered, never stored, so there is nothing else to revert.

### 4. Waits with no active owner

An open `wait` whose `owner` is empty, an agent, or deactivated:

- its project has an active maintainer: **re-route** it, once. Write a new `wait` row identical to
  it (same `issue`, `target`, `waitKind`, `resumeAt`, `data`, the deadline unchanged) with `owner`
  the first active maintainer and a `body` citing the old row (`evidence:<id>`) and why, then the
  `signal` (`rule: wait_rerouted`, `subject: evidence:<old id>`). The old row stays as it is; the
  that skill ends both when the target resolves, and asks at the deadline. A wait already
  re-routed (a `wait_rerouted` signal on it) is never re-routed again.
- no active maintainer: the `signal` (`rule: no_owner`), once.

### 5. Leases

| Seen | Act |
|---|---|
| two actors holding one lease: a claim written while another actor's lease on the issue was unexpired and not cleared, or two runs leaving work (two open pull requests from one repository, two `attempt` rows for overlapping runs) | `signal` (`rule: double_holder`, both actors, the times); a Décision when both runs left work |
| a lease renewed in a loop without progress: held more than 2 hours after its claim, or renewed 4 times with no new commit on the branch and no new evidence row | `signal` summarising the run's attempts and where it stands (the summary is the action); a second time for the same claim: Décision |
| `failedAttempts` ≥ 3 on an issue neither `paused` with a `decision` wait newer than its latest `attempt`, nor `mine` nor `done` | `signal` summarising the last three attempts; Décision |
| a `verdict`, `go` or `check-run` written by the issue's current or last lease holder (`working-on-issues` § Verification) | `signal` (`rule: self_verification`): the row is void and landing ignores it; Décision |

### 6. Pull requests

For every open pull request linked to an `in_review` issue, read live with the GitHub tools:

| Seen | Act |
|---|---|
| dropped from the merge queue: its timeline shows it enqueued after its `go` row and no longer, unmerged, head unchanged | **re-queue once** (enable auto-merge with the repository's `method`), `signal` (`rule: requeued`, `subject` the head); dropped again on the same head: Décision |
| idle: no evidence row on the issue and no commit, review or check on the pull request for the idle period (§ Thresholds) | when its timeline shows this head was enqueued and then dropped, the row above applies. Otherwise (a head never enqueued, whatever its rows): `signal` (`rule: idle_review`), Décision; never enqueue it yourself |

A pull request whose issue carries a pending close (read recipe step 7) is landing's to close: idle
more than 24 hours, the `signal` and a Décision; never re-queue it.

### 7. Target branch red

For each repository: the latest commit on `targetBranch` fails a required check (or a commit status),
and at least two open pull requests fail the same check. Find the open issue for it (`origin:
operator`, title « Target branch red: owner/repo »): one exists, the `signal` on it (`rule:
target_red`, `subject: github:owner/repo@<sha>`), and a Décision when it is `paused` or has
not moved in 24 hours. None: **open it** on the repository's own `projects` record (`type: bug`,
`origin: operator`, `problem` the failing check and its run, `acceptance` the check green on
`targetBranch`), then the `signal`. You never wake it: screening picks it up, a person launches it.

### 8. Décisions piling up

Deadlines are `waking-issues`' alone: it asks once per wait, and a wait cited in an
`escalation` is never asked about again (`waking-issues` § 6). You never group, list or re-ask
waits.

- Ten or more open, unanswered Décisions to one person from the factory's routines: **one digest**
  Décision listing them, most consequential first, unless a digest of yours to that person is
  still open. No ruling is recorded from a digest; each Décision is answered on its own.

### 9. Routines

From the factory routines' run history:

| Seen | Act |
|---|---|
| a routine whose last three runs failed | **retry once**: run it again on the event of its last failed run, `signal` (`rule: routine_failing`) on the issue that run was about; the retry fails too: Décision |
| an `environment_broken` signal from a stage | the routine's own environment, if it has one: **rebuild once**; fails again: Décision to the maintainers of the projects whose repositories it works on |

### 10. Repository health

Once a day (your first pass after 06:00 UTC), per repository, on its discovered facts
(`working-on-issues` § Repository facts): the repository readable through the GitHub app, `boot`
answers when set, the `verify` commands pass on a fresh clone of `targetBranch`. A repository whose
`gate` is `none` is not unhealthy: nothing proves its changes, which Review already says. A failure:
the `signal` (`rule: repository_unhealthy`, `subject: projects:<id>`, the failed lines in `body`) on
the « Factory operations log » of each of its projects, which the Factory economics page's Health
block lists, then a Décision to the maintainers of its projects, unless one about that repository
is still open. No other action.

**Its limit:** this check runs inside the Maintenance routine, so it cannot see Maintenance itself
failing or never firing. A failed Maintenance run gives its owner the failure decision; a routine
switched off is noticed by nobody.

### 11. Delivery chain

A release a repository published whose bump issue in a consuming repository (a task of the
release umbrella) is not `done` 48 hours later: the `signal` on the bump issue
(`rule: delivery_stalled`), then a Décision. You never wake it: a `paused` bump issue wakes through
its waits, a `backlog` or `ready` one moves on a person's gesture.

### 12. Budget

The budget the project's `context` states (an amount per period); none stated: skip. When the
spend of the factory's routines over that period (the workspace's AI usage) exceeds it, **stop
launching chain tasks**: one Décision to the first active maintainer (the spend, the budget, the
biggest consumers; **Resume launching**, **Raise the budget** (say to what)), then, on each open
umbrella of the project with a `ready` task not yet launched, neither `mine` nor `paused`, a
`decision` `wait` on that Décision (`resumeAt: screening`, deadline + 14 days) and the move to
`paused`. A task of a `paused` umbrella is not launched (`working-on-issues` § Launch). The answer
ends the waits through `waking-issues`; an unanswered Décision keeps launching stopped until
the deadline. An answered budget Décision covers the current period: skip this check until the
period ends or the budget in the project's `context` changes (its activity shows the edit).

## Thresholds and sources

Every number you act on, in one place. A threshold the project's `context` states wins over the
default.

| What | Default | Source |
|---|---|---|
| a pause being written (§ 1) | 5 minutes after the move to `paused` | activity |
| a wait on a resolved target, an open wait on an issue not `paused` (§ 1) | 90 minutes | the target's state, the wait's `createdAt` |
| the activity window of a pass (§ 2, § 3) | since the previous pass, 15-minute overlap | activity |
| a lease looping (§ 5) | held > 2 hours after its claim, or 4 renewals with no commit and no row | activity, the branch |
| a pull request idle (§ 6) | 24 hours with no row, commit, review or check | evidence, GitHub |
| a wait's deadline when you write one (§ 1, § 12) | created + 14 days | `working-on-issues` § Pausing |
| the fixing window (`landing-pull-requests`) | 30 minutes after the `fixing` row's `createdAt` | evidence |
| Décisions piling up (§ 8) | 10 open, unanswered, to one person | Décisions |
| a routine failing (§ 9) | its last 3 runs | the routines' run history |
| the health check (§ 10) | once a day, first pass after 06:00 UTC | – |
| a delivery chain stalled (§ 11) | bump issue not `done` 48 hours after the release | the release, the bump issue |
| the budget (§ 12) | none: the check is off; an answered budget Décision silences it for the period | the amount and period the project's `context` states; the spend from the workspace's AI usage of the factory's routines |

## The allowed actions

Exactly these, all reversible; for any of them you may choose the Décision instead.

| Signal | On its own | Otherwise |
|---|---|---|
| invariant broken (`paused` without an open wait; an open wait on a resolved target) | write the missing wait as a `decision` to the maintainer | a factory-bug issue |
| a gesture, or a repository's `notes`, written by an agent | revert to the previous value | Décision |
| a wait with no active owner | re-route it to the first active maintainer, once | `signal` `no_owner` |
| pull request dropped from the merge queue (idle or not; only a head enqueued then dropped) | re-queue once | Décision; an idle head never enqueued: Décision |
| target branch red, blocking every pull request | open that repository's issue, or signal the open one | Décision |
| lease renewed in a loop without progress; failure ceiling; double holders; self-verification | summarise on the issue (`signal`) | Décision |
| Décisions piling up | one reminder digest, no ruling recorded | – |
| a routine failing repeatedly; an environment build broken | retry once | Décision |
| repository health check failing | none | Décision to its maintainers |
| delivery chain stalled | signal the bump issue | Décision |
| cost budget exceeded | stop launching chain tasks (the umbrellas' pause) | Décision |

## Report

One line per case: the rule, the record, what you wrote and did. Name every record you could not
read and why. Nothing noticed: say so in one line.

## Red flags

- writing `woke`, `resolved`, `released`, `abandoned` or `applied`, or setting `resolvedAt`;
- ending a wait whose target resolved instead of signalling it;
- reverting a move the working-on-issues tables sanction, your own included, or one a later move
  superseded;
- editing an old `wait` row instead of writing a new one;
- a second re-queue or retry on the same head or run, or enqueuing a head never enqueued;
- the same signal written on every pass;
- an action the table does not list, taken because it looked harmless;
- one Décision per case when one per person would do.
