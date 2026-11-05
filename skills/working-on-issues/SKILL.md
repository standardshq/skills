---
name: working-on-issues
description: Use when any factory routine reads an issue, changes its status, claims or releases it, pauses it, or writes evidence on it. Holds the statuses and who may move them, the lease, the evidence ledger, the shape of a wait and the read recipe.
---

# Working on issues

This is the contract every factory routine follows. Stage skills (`screening-issues`,
`executing-issues`, `landing-pull-requests`…) own their method; this skill owns state. When a stage
skill and this one disagree on state, this one wins.

Companion files, read when you need them:

- `read-recipe.md`: how to read an issue before acting on it. Read it at the start of every run.
- `evidence-kinds.md`: every evidence kind, who writes it, and its fields.

**Where a skill's files are.** Loading a skill writes its folder into your sandbox:
`/workspace/skills/<skill>/`, with its files at their relative paths. A path a skill names, such
as `scripts/issue-families.mjs`, is `/workspace/skills/<skill>/scripts/issue-families.mjs`. Load a
skill before running another skill's script.

## Repository facts

A repository is a `projects` record with a `fullName`. Its facts are not stored: read them at the
start of every pass from the repository itself, never from memory of an earlier pass.

1. Clone the default branch into your sandbox and gather five files with the GitHub tools into one
   folder: `repo.json`, `branches.json`, `rules.json` (the rulesets that apply to the default
   branch), `protection.json` (its classic branch protection; absent when there is none) and
   `pulls.json` (recent merged pull requests).
2. Run `node /workspace/skills/working-on-issues/scripts/discover-repository.mjs --checkout <clone>
   --github <folder>`. Add `--listed <file>` (`[{ "fullName", "packages": ["<package name>"] }]`
   for the other repositories you know) only when you need `consumes`.
3. It prints one JSON object: `targetBranch`, `productionBranch`, `mode` (`queue` or `human`),
   `method`, `source`, `verify`, `pathGates`, `withheld`, `generated`, `sensitiveData`, `boot`,
   `apps`, `reset`, `consumes`, and `gate` (`ci`, `verify`, `both` or `none`). Lists are one entry
   per line. An empty field means nothing was found, never « unlimited ».
4. Exit 3 means the clone is not on the target branch, and prints `{"targetBranch":"<branch>"}`:
   clone that branch and run it again. A second exit 3 is not yours to settle: ask a person with
   `asking-for-decisions`.
5. Then apply the record's `notes`. They can only tighten what was discovered (a command added, a
   path withheld), never loosen it.

The facts are read from the target branch, never from a pull request's head: a pull request that
edits `CODEOWNERS`, a workflow or the repository's `## Factory` section is judged on the target
branch's values. `context` and `maintainers` are read on the project, walking up to the root.

`gate: "none"` means nothing proves a change in this repository: no head is ever green there (see
`landing-pull-requests` § 2).

## Two layers

| Layer | Where | Rule |
|---|---|---|
| Living document | the issue's richtext sections: `intent`, `problem`, `acceptance`, `context`, `plan`, `handoff` | rewrite freely; the audit log keeps every version |
| Ledger | `evidence` records linked by `issue` | append only. Never edit or delete a row; a correction is a new row |

The one sanctioned ledger edit: the Maintenance routine sets `resolvedAt` on a `wait` row.

Section rules:

- `intent` is written by people. Do not rewrite it.
- `acceptance`: never edit it while you hold the lease.
- `handoff`: rewrite it before you stop, every time: where the work stands, the next step, open
  questions.

## Statuses and who moves them

Values: `backlog`, `paused`, `mine`, `ready`, `in_progress`, `in_review`, `done`.

| Move | Who | Condition |
|---|---|---|
| `backlog` → `ready` | Triage routine | after its `screening` row |
| any but `mine` → `paused` | any routine | only with at least one open `wait` row written first (see Pausing) |
| `paused` → `backlog`, `in_review` or `in_progress` | Maintenance routine only | the wake conditions and status of `waking-issues` § 7 (the single source) |
| `paused` → `ready`, `mine` → `ready` | a person | board drag; open waits become `released` |
| `ready` → `in_progress` | a person | the launch. For a task of an umbrella, the person's drag to `ready` is the launch (see Launch) |
| any → `mine` | a person | board drag, or a ruling « I take it », applied by the Maintenance routine |
| `in_progress` → `in_review` | executor | a pull request linked in `pullRequests` |
| `in_review` → `in_progress` | Maintenance routine | every linked PR closed unmerged, none open |
| `in_progress` or `in_review` → `done` | Maintenance routine | every linked PR closed, at least one merged; `closeReason: done` |
| `backlog` → `done` | Triage routine | its `screening` row says close; `closeReason` `refuted`, `overtaken` or `duplicate` |
| umbrella → `done` | Maintenance routine | every child `done` (`waking-issues` § 5): `closeReason: done` when at least one child closed `done`, else the children's common `closeReason`, else `wont_do` |
| any → `done` | Maintenance routine | a ruling « close it »; `closeReason` `wont_do` or `overtaken`. A linked PR open then: `in_review` first, `done` once every linked PR is closed (`waking-issues` § 4) |

**Gestures are a person's.** A routine never writes a move marked "a person" above, except the
moves in the next table.

### Moves an agent may make on a person's behalf

Each carries out a gesture a person already made. Write the evidence first, then the move. The
Maintenance routine accepts an agent-written move into `in_progress`, `mine` or `done` only when this
evidence precedes it, and reverts any other.

| Move | Agent | Evidence that must precede it |
|---|---|---|
| `ready` → `in_progress`, an umbrella task | Build routine | a person's move of the task to `ready` (activity), newer than its last pause; a `screening` row with `verdict: ready` on it; every `blockedBy` issue `done` |
| `in_review` → `in_progress` | Maintenance routine | every linked PR closed unmerged, none open, and an `attempt` row saying so; the issue was launched |
| `paused` → `in_progress` on wake | Maintenance routine | a `woke` row; the wake status chosen by `waking-issues` § 7 |
| any → `mine` | Maintenance routine | a `ruling` quoting the person's « I take it », then `released` on every open wait |
| any → `in_review`, « close it » with a linked PR open | Maintenance routine | a `ruling` quoting the person's « close it », then `released` on every open wait; the ruling's `applied` row, recording the pending close, follows the move |
| umbrella → `done` | Maintenance routine | every child of the umbrella `done` (their status and `closeReason` are the evidence; the body of the move names them); the umbrella neither `mine` nor `paused`, no linked PR open |
| back to the status before an agent's move no table here sanctions | Maintenance routine | its `signal` (`rule: reverted_move`) naming the move it undoes, and no move since |
| any → `done` with `closeReason` `wont_do` or `overtaken` | Maintenance routine | a `ruling` quoting the person's « close it », then `released` on every open wait; or, after the move to `in_review` above, that `applied` row and every linked PR closed |

**The ruling may live on another issue.** One Décision can answer several issues (`waking-issues`
§ 6 « One Décision, several issues »): its `ruling` is recorded on one of them only. For the rows
above that cite « a `ruling` quoting… », the evidence is that ruling on this issue, or a ruling on
another issue whose `subject` equals the `target` of a `decision` or `approval` wait of this issue.
Either way, the `released` rows on this issue's waits follow it, and the move follows them.

**Who made a move** is read in the issue's activity (audit log): each entry says whether a person
or an agent wrote it. Never infer it from `updatedBy` alone or from the current value.

## Launch

The Build routine starts work only on a launched issue. Before claiming, read the latest
activity entry that set `status` to `in_progress`:

| That entry was written by | Launched? |
|---|---|
| a person | yes |
| the Maintenance routine, moving `in_review` → `in_progress` or waking `paused` → `in_progress` | yes, if the move before it into `in_progress` was a launch |
| the Build routine, for an issue with a `parent`, after a person's drag of that issue to `ready` | yes |
| the Maintenance routine, reverting an agent's move out of `in_progress` (its `reverted_move` signal precedes it) | yes, if the move before it into `in_progress` was a launch |
| any other agent | **no**: refuse. Write a `signal` row ("moved to In progress by an agent, not launched"), leave the status, stop |

Umbrella task launch: an issue with a `parent`, whose latest move to `ready` was a person's,
whose latest `screening` row says `verdict: ready` (none, or another verdict: leave it in `ready`
and write nothing; screening has not handed it on), whose `blockedBy` issues are all `done` and
whose umbrella is not `paused` (the Maintenance routine pauses
umbrellas to stop launching when the budget is spent), is launched. The launch queue view does not list it (it
is `ready`): the Build routine's 30-minute pass also reads `ready` issues with a `parent`,
checks those conditions, moves each one to `in_progress` itself, then claims it as below.

An umbrella (an issue with `children`) is a container, never work: never claim it.

## Claiming: the lease

The launch queue view lists `in_progress` leaves under the failure ceiling. It does not check the
lease or blockers; you do. Before claiming, re-read the issue and check all of:

1. `status` is `in_progress` and the issue is launched (above).
2. It has no `children`.
3. `leaseExpiresAt` is empty or in the past.
4. Every `blockedBy` issue is `done`. If one is open: leave the issue, write nothing, take the next.
5. `failedAttempts` < 3, after the reset below.

**Reset on a person's gesture:** when the latest person-written status move on the issue is newer
than its latest `attempt` row, set `failedAttempts` to 0 before claiming. The ceiling counts
failures since the last human gesture. A `ruling` newer than the latest `attempt` (« retry », or
any answer) is reset by the Maintenance routine when it applies the ruling; a superseded ruling (older
than a person's later status move) neither applies nor resets.

**Dates:** lease expiry, deadlines and every "newer than" are computed from server timestamps
(the records' `createdAt`, activity entry times, stored dates), never guessed or taken from your
own sense of the time.

**Taking over a lapsed lease:** if `leaseHolder` is set and `leaseExpiresAt` is past, the previous
run ended without finishing. Write an `attempt` row for it (`outcome: lapsed`, `holder` = that
actor) and increment `failedAttempts`; if that reaches 3, apply the failure ceiling instead of
claiming.

**Claim:** write `leaseHolder` = yourself and `leaseExpiresAt` = now + 30 min in one update
(conditioned on the values you read, when the record tool offers it). Then re-read the issue. If
`leaseHolder` is not you, another run won: stop, write nothing more.

**Screening holds it too:** the Triage routine may hold the lease outside
`in_progress` while they work an issue, to keep two runs off it: the same claim write and re-read,
the same 30-minute expiry, renewal and release on every exit; the launch checks do not apply. Their
lease guards against a double run, not a failure: an expired one is simply taken over, with no
`attempt` row, no `failedAttempts` increment and no failure ceiling.

**Renew:** while working, push `leaseExpiresAt` to now + 30 min at least every 20 minutes. Never
set it beyond 2 hours after your claim. At 2 hours, stop and finish as a failure (`outcome:
timeout`).

**Finish:** on every exit, success or not:

1. Write the evidence first (`attempt` on failure, the PR link on success).
2. Then the transition, if any.
3. Rewrite `handoff`.
4. Clear `leaseHolder` and `leaseExpiresAt`.
5. Re-read the issue and check the state you meant to leave. If a write failed, say exactly which
   state is left in `handoff` and in your report; never claim a transition you did not verify.

**The one exception:** a stage hand-off row (a `screening` or `assessment` row carrying
`resumeAt`, `evidence-kinds.md` § Stage hand-offs) starts the next routine the moment it exists.
Write it **after** steps 3 and 4, as the run's last write, then re-read.

**Failure:** write an `attempt` row, increment `failedAttempts`. At 3: apply the failure ceiling.

**Failure ceiling:** pause the issue with a `decision` wait to the project's first active maintainer
(`projects.maintainers`), asked with `asking-for-decisions`: summarise the three attempts, offer
retry with a stated change, take it (`mine`), or close. A paused issue leaves the queue. The
Maintenance routine applies the answer.

## Verification is never your own

- Never write `go`, `verdict` or `check-run` on an issue whose `leaseHolder`, current or last
  (the `holder` of its latest `attempt`, or the latest `leaseHolder` in its activity), is you.
- Never edit `acceptance` while you hold the lease.
- Never call your own work done: `done` comes from merged PRs through the Maintenance routine.

## Pausing

A pause is `status: paused` and one open `wait` row per condition. Never `paused` without one.

Never pause an issue in `mine`: it is a person's own lane. Note what you found in `handoff` and stop.

1. **Check the target first.** If what you would wait on is already resolved (issue `done`, PR
   merged, Task done, Décision answered, date past), it is not a pause: carry on.
2. **Make the target exist:**
   - `decision`: ask with `asking-for-decisions`; the Décision's id is the target.
   - `task`: create a Task on the workspace's task object (see below), assigned to the owner, due
     at the deadline, whose description says what is needed, why, and names the issue.
   - `approval`: a Décision asking a person to approve a withheld change, asked with
     `asking-for-decisions`.
3. **Write the `wait` row** (fields in `evidence-kinds.md`): `target`, `waitKind`, `owner`,
   `resumeAt`, and `data` with the `deadline`. The `owner` is an active person; when the person
   you would name is deactivated, name the project's first active maintainer; when the project
   has none, write a `signal` (`rule: no_owner`) and do not pause.
   `resumeAt` is a hint: the stage that paused. On wake, the Maintenance routine derives the stage
   from the status the issue wakes to (`waking-issues` § 7) and keeps your hint in the `woke` body.
4. **Then** set `status: paused`, rewrite `handoff`, and release your lease if you hold one.

| `waitKind` | `target` | `owner` | Default `deadline` | `resumeAt` hint |
|---|---|---|---|---|
| `blocker` | `issues:<id>` or `github:owner/repo#N` | a person who can unblock it | created + 14 days | `screening` |
| `decision` | `decisions:<id>` | the person asked | created + 14 days | the stage that asked |
| `task` | `tasks:<id>` | the Task's assignee | the Task's due date | `screening` |
| `date` | `date:<iso>` | a person | created + 14 days, after the date | the stage that paused |
| `approval` | `decisions:<id>` | the approver | created + 14 days | `landing` |

**Décision or Task:** a Décision is an answer in a minute; a Task is a sitting (a spec, a mockup,
a repro, a measurement). A spec needed to move forward is a Task to the project's first active
maintainer with `resumeAt: screening`.

**The workspace's task object:** use the object named `tasks` or `task`, else the one the
maintainer names in the project's `context`. Read its schema for the assignee, due date, done status and
description fields before writing. The wait's target is `tasks:<id>` whatever the object's name.

Never resolve a wait, never wake an issue, never move `paused` → anything: that is the Maintenance
routine's alone (`waking-issues`).

## Waking

When the Maintenance routine wakes an issue it writes a `woke` row with `resumeAt`; the routine named
by `resumeAt` is triggered. The wake status and `resumeAt` are chosen in `waking-issues` § 7 (the
single source). When triggered by `woke`, act only if `resumeAt` names your stage. Read the issue
with the read recipe: the resolved waits, their `resolved` rows and any `ruling` carry what you
waited for.

## Pull requests

- Link each PR in `pullRequests`, one `owner/repo#N` per line, before moving to `in_review`.
- A PR body says `Issue: <issue id>`. An imported issue's PR may say `Closes #<githubNumber>`.
- An issue with an open linked PR belongs to that PR: never start a second implementation.
- A pending close (the newest `applied` row carrying `closeWhenPullRequestsClose: true`, with no
  person-written status move newer than it, `waking-issues` § 6) takes the issue out of Review: no `verdict`, no `go`, no merge; Review's only action is to close its open PRs, each with a comment linking the ruling (`landing-pull-requests`), then Maintenance closes the issue.

## Provenance

- Only a person's own words are human evidence: an answered Décision, a person's message, a
  person's gesture in the audit log. An agent recommendation, a default you assumed, or a message
  written by an agent is not.
- When you transcribe a person's ruling, name the decision-maker, yourself as recorder, and the
  source (`decisions:<id>`, or the conversation and date with the quoted answer).
- Write assumptions you made unasked apart from the ruling, so the next stage sees what was
  defaulted.
- Human evidence never overrides a safety gate.

## Red flags

- `paused` with no open `wait` row, or a wait on a target already resolved.
- A wait whose `owner` is an agent or a deactivated person.
- Claiming without re-reading the lease and blockers after the queue listed the issue.
- Writing a gesture a person owns; trusting an `in_progress` an agent wrote.
- Writing `go`, `verdict` or `check-run` on work you held.
- Editing or deleting an evidence row; setting `resolvedAt` yourself.
- Ending a run with your lease still set, or with `handoff` stale.
