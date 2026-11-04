---
name: waking-issues
description: Use when the waits routine runs, on an issue set Done, a ruling recorded, or its hourly pass, which also reads every Task done or deleted and every merged or closed pull request. It is the only skill that resolves waits, applies a person's answers, wakes paused issues, and closes issues from their pull requests.
---

# Waking issues

You are the `waits` routine: the only routine that resolves a wait, applies a person's answer,
wakes an issue, and moves an issue on its pull requests. Every other routine writes waits and
asks; you end them and apply the answers.

Read `working-on-issues` first, with its `evidence-kinds.md` (the rows you write) and
`read-recipe.md`. Never write code, never claim a lease, never judge a pull request.

**One wait at a time, never crash the run.** Handle each wait and each issue on its own. A target
you cannot read (a deleted issue, Task, Décision, a PR that 404s) is an `abandoned` target, not an
error. If a write fails, note it in your report and go on to the next wait.

**Dates** (deadlines, lease expiry, "newer than") come from the records' server timestamps
(`createdAt`, activity times, stored dates), never from a guess.

**This pause's waits:** the `wait` rows of the issue created after its latest `woke` row (or since
it was created, if it never woke).

## 1. Find the waits this event concerns

Open waits are `evidence` rows with `kind: wait` and empty `resolvedAt`.

| Event | What to do |
|---|---|
| an issue set `done` | § 2 for open waits with `target: issues:<that id>` |
| a `ruling` row created | § 6 (apply the answer) |
| hourly pass | § 5 |

Then § 7 for every `paused` issue you touched. No GitHub or Task event reaches you: the hourly pass
reads every open wait's target (a pull request merged or closed, a Task done or deleted, with your
tools) and every `in_review` issue's pull requests, so either costs at most an hour.

## 2. Decide each wait

| `waitKind` / target | Target state | Write |
|---|---|---|
| `blocker` `issues:<id>` | `done`, whatever its `closeReason` (the body names it) | `resolved` |
| | deleted | `abandoned` (`target_missing`) |
| `blocker` `github:owner/repo#N` | merged | `resolved` |
| | closed unmerged, or not found | `abandoned` (`pr_closed_unmerged`, or `target_missing`) |
| `decision`, `approval` `decisions:<id>` | a `ruling` with that `subject` exists, on this issue or another | § 6 applies it |
| | Décision deleted | `abandoned` (`target_missing`) |
| | Décision `expired` or `withdrawn`, unanswered | nothing (§ 3) |
| `task` `tasks:<id>` | done | `resolved` |
| | deleted | `abandoned` (`task_deleted`) |
| `date` `date:<iso>` | the date has passed | `resolved` |
| any | still pending | nothing; its deadline is checked in § 5 |

Writing `resolved`, `abandoned` or `released`: create the row (`target` = the wait's,
`subject: evidence:<wait id>`, a `body` saying what happened), **then** set `resolvedAt` = now on
the wait row. Never set `resolvedAt` without the row.

**After `abandoned`:** ask once (§ 6 « Ask », with its « never twice » guard). The pause is never
left without an open wait, and an abandoned wait never wakes the issue.

## 3. An expired Décision

A routine's question expires after 24 hours; the wait's deadline is usually later. An unanswered
Décision, expired or withdrawn, ends nothing: never re-ask it, never write a row. The wait stays
open and shows in Needs you under its owner. At the deadline, § 6 asks once.

## 4. Pull requests: In review, back to In progress, Done

For an issue, read every line of `pullRequests` (and any PR whose body says `Issue: <id>`, or
`Closes #<githubNumber>` for an imported issue, adding it to `pullRequests`).

**A pending close** (§ 6 « Apply ») comes first: while a linked PR is open, no move; once every
linked PR is closed (merged or not), `done` with the `closeReason` its `applied` row recorded, and
the body of the move cites that row. No `attempt`, no `in_progress`. Otherwise:

| Linked PRs | Issue status | Move |
|---|---|---|
| at least one open | `in_review` | none (another repository's PR may still be open) |
| all closed, at least one merged | `in_review` or `in_progress` | `done`, `closeReason: done`; the body of the move names the merged PRs |
| all closed, none merged | `in_review` | check the issue was launched (`working-on-issues` § Launch). Then an `attempt` row (`outcome: failed`, `holder` = the last lease holder, body: PRs closed unmerged), increment `failedAttempts`, then `in_progress` (the launch stands). At 3, apply the failure ceiling instead (§ 6 « Ask »). Not launched: write a `signal` (`rule: in_review_not_launched`) and leave it |
| none | any | none |

Never move an issue that is `paused`, `mine` or `done` on its PRs; note it in your report.

## 5. The hourly pass

In this order:

1. **Every open wait:** decide it as in § 2.
2. **Released waits:** an open wait on an issue that is no longer `paused` gets a `released` row
   (`data.by` = the person who moved it) and its `resolvedAt`, **only when** the activity shows a
   person's move out of `paused` newer than the wait row. An agent's move out of `paused` is the
   operator's to revert: leave the wait open. Otherwise, if the wait is more than 5 minutes
   old, write a `signal` (`rule: wait_without_pause`) and leave the wait; a younger one is a pause
   being written (wait first, then status): leave it. No `woke`: the person's move already decided
   what happens next.
3. **Deadlines:** an open wait whose `data.deadline` has passed: ask once (§ 6 « Ask », with its
   « never twice » guard).
4. **Unapplied rulings:** a `ruling` with an issue it reaches that holds no `applied` row for it
   (§ 6) gets applied there now.
5. **Wake:** § 7 for every `paused` issue.
6. **Pull requests:** § 4 for every `in_review` issue.
7. **Umbrellas:** an issue with `children`, not `done`, `mine` or `paused`, with no linked PR
   open, whose every child is `done`: `done`, the body of the move naming each child and its
   `closeReason`. Its `closeReason`: `done` when at least one child closed `done`; else the
   `closeReason` every child shares; else `wont_do`. A move on a person's behalf: the children's status is its
   evidence (`working-on-issues` § Moves on a person's behalf). A `mine` or `paused` umbrella:
   note it in your report.

## 6. Answers: ask once, apply every answer

### Ask

Deadline passed, target abandoned, or failure ceiling reached in § 4: one Décision per issue,
covering all its waits in this state, asked with `asking-for-decisions`. You decide the rows
around it, not that skill: it only asks and, when answered, writes the `ruling`.

**Never twice:** a wait already cited in an `escalation` row (its `data.waits`), or whose target
is an escalation's Décision (the `subject` of an `escalation` row), is never asked about again,
whatever the state of that Décision: it stays in Needs you. The one exception is a ruling
« Extend » (below).

`to`: the waits' `owner` and the project's first active maintainer; if the owner is deactivated,
the first active maintainer alone; if the project has no active maintainer, write a `signal`
(`rule: no_owner`) instead of asking. Options, the evidence's recommendation first: **Close it**,
**Extend** (by N days, default 14), **I take it**; for an abandoned target, **Wait on something
else** instead of **Extend** (nothing is left to extend); for a failure ceiling, **Retry** with a
stated change instead of **Extend**.

Then:

1. Write an `escalation` row: `subject: decisions:<id>` (the escalation's Décision),
   `data.waits` = the wait ids.
2. For an abandoned target, write a `decision` wait whose `target` is the escalation's Décision
   (the `subject` of the row you just wrote), `owner` = the abandoned wait's owner (fallback as
   above), `data.deadline` = now + 14 days, `resumeAt` = the abandoned wait's, as a hint. The
   pause always keeps an open wait. When the abandoned wait was already cited in an escalation,
   do not ask: open this wait on that escalation's Décision instead, unless one is already open.
3. For a failure ceiling, write the `decision` wait the same way (owner = the first active
   maintainer, `resumeAt: execution`), then set `paused`.

### Apply

The asking run, when the answer resumes it, only writes the `ruling` and stops. You apply every
`ruling`, once per issue it reaches. **The marker:** the `applied` row, written on that issue
(`subject: evidence:<ruling id>`, `data.rows` = the ids you wrote there) is always the **last**
write of an application on that issue, after every `released`/`resolved`/`wait` row and after its
status move. A ruling is done on an issue once that issue holds its `applied` row; an issue it
reaches without one is applied again by the next pass. Applying is idempotent: skip every row
already written and every move already made, and finish each issue with its `applied` row.

**One Décision, several issues.** The operator groups its questions (one Décision per person per
run), so one Décision can be the `target` of open waits on several issues. The ruling is recorded
on one of them. The issues it reaches are the ruling's own issue and every issue holding an open
`decision` or `approval` wait whose `target` equals the ruling's `subject`. Apply it on each, one
issue at a time (a failure on one never stops the others): the answer's section about that issue
when the Décision has one section per case, the whole answer otherwise. The ruling's own issue
gets its `applied` row even when it holds no such wait (`data.skipped: "no_wait"` there, as the
table says). Superseded, the reset of `failedAttempts` and the table below are judged per issue,
against that issue's own activity and rows.

**Superseded:** a ruling older than a person's later status move on the issue (activity) is never
applied and does not reset `failedAttempts`: write its `applied` row with
`data.skipped: "superseded"` and nothing else.

First, **any other `ruling`** on an issue newer than its latest `attempt` row resets
`failedAttempts` to 0: a person spoke since the last failure. Then by answer:

| The answer says | Apply |
|---|---|
| **I take it** | `released` on every open wait of the issue, then `mine` |
| **Close it**, no linked PR open | `released` on every open wait, then `done` with `closeReason: wont_do` (`overtaken` when the answer says the work landed) |
| **Close it**, a linked PR still open | `released` on every open wait, then `in_review`, then the `applied` row with `data.closeReason` (as above) and `data.closeWhenPullRequestsClose: true`: a pending close, which § 4 carries out once every linked PR is closed. No question, no `signal` |
| **Extend** (escalation) | for each cited wait still open: if its target is readable and not in its abandoned state, a new `wait` row identical but for `data.deadline`, then `released` on the old one. Otherwise (target gone, or a `decision`/`approval` wait whose Décision expired): if the `to` of § 6 « Ask » finds no active person, write the `no_owner` `signal` and leave the old wait open; else `released` on the old one, then ask once more with `asking-for-decisions` and open the new wait on the new Décision: **the only re-ask the « never twice » rule allows**, once per Extend ruling |
| **Wait on something else** (escalation) | write the new `wait` the answer names (check its target first, `working-on-issues` § Pausing), then `resolved` on the escalation's own wait |
| **Retry** (failure ceiling) | `resolved` on the wait; the reset above already applied |
| anything else, on a `decision` or `approval` wait | `resolved` on the wait whose `target` is the ruling's `subject` |
| anything else, on a ruling that answers no wait and no escalation (a Décision from the operator or from landing in `human` mode, `asking-for-decisions` § 3) | nothing: the `applied` row with `data.skipped: "no_wait"`; the asking routine acts on the answer itself |
| a free answer to an escalation that fits no option | leave everything open, write a `signal` (`rule: unapplied_ruling`) for the operator, and the `applied` row with `data.skipped: "unmapped"` |

Then the `applied` row, last. « I take it » and « Close it » are moves on a person's behalf: the
`ruling` is their evidence (`working-on-issues` § Moves on a person's behalf). They never wake
the issue.

**Pending close:** the newest `applied` row carrying `data.closeWhenPullRequestsClose: true`, with
no person-written status move newer than it. A person's move cancels it. While it holds,
the issue is out of landing: no `verdict`, no `go`, no merge; landing's only action is to close its open PRs, each with a comment linking the ruling (`landing-pull-requests`), then `waits` closes the issue.

## 7. Wake

After deciding the waits of a `paused` issue, re-read this pause's waits. Wake it only when **all**
hold:

- no wait of this pause has an empty `resolvedAt`;
- at least one wait of this pause ended `resolved`;
- no wait of this pause ended `abandoned` unless the escalation that cites it has a `ruling` with
  an `applied` row;
- the issue is still `paused`, and no `woke` row is newer than the newest wait (another run
  already woke it).

Then, in order:

1. Choose the status:

   | Before the pause (activity: the status the latest move to `paused` left) | A linked PR is open | Status on wake |
   |---|---|---|
   | any | yes | `in_review` |
   | `in_progress` or `in_review`, and launched (`working-on-issues` § Launch) | no | `in_progress`: the launch was already given |
   | anything else (`backlog`, `ready`, never launched) | no | `backlog` |

2. Derive `resumeAt` from that status: `backlog` → `screening`, except `assessment` when `type`
   is `feature`, its latest `screening` row says `verdict: assess`, and no `assessment` row
   `verdict: approved` is newer than that row; `in_progress` → `execution`, `in_review` →
   `landing`.
3. Write one `woke` row: that `resumeAt`; `data.waits` = the resolved waits' ids; `body` = what
   resolved, a sentence each, and the stages the waits named as hints.
4. Set the status. Waking to `in_progress` is a move on a person's behalf: the `woke` row is its
   evidence.
5. Re-read. If a second `woke` row appeared since the newest wait, write a `signal`
   (`rule: double_wake`) and stop touching the issue.

The `woke` row triggers the routine its `resumeAt` names. You never run that stage yourself.

## Report

One line per issue touched: what ended (resolved, abandoned, released), what you moved, what you
asked or applied. Name every wait you could not read and why.

## Red flags

- Waking while a wait is open, or on `abandoned` or `released` alone.
- An `abandoned` wait leaving the pause with no open wait.
- Setting `resolvedAt` without writing the row that ends the wait.
- A second `woke` for one pause.
- `done` while a linked PR is still open in another repository.
- One failing target stopping the whole pass.
- Asking again about a wait already cited in an `escalation`, whatever its Décision's state. The
  one exception: a ruling « Extend » re-asks a cited wait once.
- Applying a ruling twice on one issue, or applying one older than a person's later status move on
  that issue (or letting it reset `failedAttempts`).
- Applying a ruling only on the issue it was recorded on, when open waits on other issues target
  the same Décision; or one `applied` row standing for several issues.
- Closing an issue while one of its PRs is still open: « Close it » then moves it to `in_review`
  with a pending close.
- Releasing a wait without a person's move out of `paused` newer than it.
