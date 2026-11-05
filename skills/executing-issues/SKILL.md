---
name: executing-issues
description: Use when the Build routine runs, on an issue a person moved to In progress, a woke row with resumeAt execution, or its 30-minute launch-queue pass. Claims a launched issue under a lease and turns it into a verified pull request with Issue <id> in the body, or into a pause that names what it waits on.
---

# Executing issues

One issue, one change, one run. This skill owns *what you may start on* and *what you must leave
behind*. How the code is designed, asserted and reviewed lives in `implementing-changes`, which
you run rather than paraphrase.

The acceptance assertions exist before the diff does, so a reviewer has something to compare
against that the implementation could not have chosen. That, not supervision, is what makes an
agent's pull request mergeable.

Read `working-on-issues` first and completely: § Launch, § Claiming, § Pausing, § Pull requests
and the read recipe hold every rule of state below. When they disagree with this skill, they win.

## 1. Take a launched issue

| Run | Issue |
|---|---|
| an issue moved to `in_progress` | that issue |
| a `woke` row with `resumeAt: execution` | that issue; any other `resumeAt`: stop |
| the 30-minute pass | first the umbrella tasks a person launched (`working-on-issues` § Launch: `ready`, a `parent`, the person's drag to `ready`, every `blockedBy` done, the umbrella not `paused`): move each to `in_progress` yourself, then the launch queue view, in its order |

For each, read it with the read recipe, then check, in order:

1. **Launched:** the latest move into `in_progress` passes `working-on-issues` § Launch. Written by
   any other agent: write a `signal` (`rule: not_launched`, "moved to In progress by an agent, not
   launched"), leave the status, stop.
2. **Not an umbrella:** an issue with `children` is never work.
3. **Its pull request:** a linked pull request still open means the issue belongs to it: never
   start a second implementation. A previous run opened it and stopped before the move: claim,
   then finish § 4 from the move to `in_review`.
4. **Claim** as § Claiming says: the lease free or lapsed (a lapsed one gets its `attempt` row),
   every `blockedBy` issue `done` (one open: leave the issue, write nothing, take the next),
   `failedAttempts` below 3 after the reset on a person's gesture. One conditioned write, then
   re-read: another holder won, stop.

A routine run handles the issue its event names; the 30-minute pass takes issues one at a time
until the queue is empty or your run's time is spent.

## 2. Before the code

| `type` | Extra method, applied on top of § 3 |
|---|---|
| `bug` | `reproducing-bugs` first: its red command, failing on the unmodified branch, is the first commit. Any outcome but `reproduced` ends the run there |
| `feature` | the approved slice is the scope: the ruling « Build » (or the spec) after the `assessment` row. Nothing beyond it |
| any, with a `parent` | the umbrella's sections and rulings are your spec; the task's `acceptance` is its assertions |

Check the premise is still true on the target branch (what the issue cites still exists, what it
asks is still missing). When the work already landed, or the premise is gone, that is not yours to
close: pause on a `decision` wait to the person who launched it (« Close it » recommended, naming
the change that overtook it), release the lease. Not a failure: no `attempt`.

**The workspace:** the project's `repositories`, checked out in your environment (an issue spanning
several gets every checkout). Per repository: read its facts (`working-on-issues` § Repository
facts), fetch `targetBranch`, cut a branch from it, named as the repository's rules say (by default `fix/<slug>`, `feat/<slug>`
or `chore/<slug>`). Read the repository's own agent
rules (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules`) there, and use the facts: `verify`, `pathGates`,
`withheld`, `generated`, `sensitiveData`, `boot`, `apps`, `reset`.

## 3. Implement

Run `implementing-changes` in `execution` mode. Two obligations belong here because they are about
the run rather than the code:

- **Independent tasks run as parallel subagents**, one per task, dispatched in a single message.
  Each receives its acceptance assertions verbatim and the Implementation conventions. Never set a
  tool-call limit on a subagent.
- **Renew the lease** at least every 20 minutes (`leaseExpiresAt` = now + 30 min). At 2 hours
  after your claim, stop: finish as a failure with `outcome: timeout`.

Paths:

| The change touches | Do |
|---|---|
| a `generated` path | never by hand: regenerate it with the repository's own command, or stop |
| a `withheld` path | allowed; say so in the pull request body: landing asks a person to approve it |
| anything `sensitiveData` names | never quote it in code, tests, the pull request or the issue |

**Stops that are decisions, not code:**

| You find | Do |
|---|---|
| the right fix changes a public contract, a security posture or an agent's authority | pause on a `decision` wait to the project's first active maintainer, the one question that forks the work |
| it needs new chrome, a new layout or a new interaction nobody approved | draw the smallest mockup that decides it and ask with `asking-for-decisions` (approve, change, no mockup needed); when you cannot draw it, a `task` wait to the maintainer. Restyling what exists is not a stop: build it |
| it is several changes, not one | pause on a `task` wait to the maintainer for a spec (`shaping-features`) |

Each pause: `resumeAt: execution`, handoff, then release the lease. Not a failure: no `attempt`.

*Done when* every acceptance assertion exists in a test and passes, and every command of `verify`
(plus each `pathGates` command whose path the change touches) is clean on the branch.

## 4. Open the pull request

Per repository changed, in this order:

1. Push the branch; open the pull request against `targetBranch`. Title: as the repository's rules
   say (by default a conventional commit line). Body:
   - `Issue: <issue id>` on its own line (an imported issue may add `Closes #<githubNumber>`);
   - what changed and why, in a few lines;
   - each acceptance assertion and the test that holds it;
   - the `verify` commands run and their result;
   - each mock with its one-line justification; `withheld` paths touched; assumptions made
     unasked; suggestions from the final check you did not apply.
2. Add `owner/repo#N` to `pullRequests`, one per line, keeping the lines already there.

Then finish as `working-on-issues` § Claiming says: the links are the evidence, then status
`in_review`, then `handoff` (what the pull request does, what a reviewer should look at first, what
is left), then clear `leaseHolder` and `leaseExpiresAt`, then re-read and check the state you meant
to leave. A write that failed is named in `handoff` and your report; never claim a transition you
did not verify.

Review, verdicts and merge belong to the Review routine. Never write `verdict`, `go` or
`check-run`, never merge, never call your own work done.

## 5. After the pull request

Once the issue is `in_review` you never take its lease again. Review comments, red checks and
fixes on its pull request, a person's included, belong to the Review routine (juror and fixer,
`landing-pull-requests`).

## 6. When it fails

A run that cannot deliver: write the `attempt` row first (`outcome: failed` or `timeout`, `holder`
= you, `subject` the branch head when there is one, `body`: what was tried, why it failed, what to
try next), increment `failedAttempts`, rewrite `handoff`, release the lease. At 3: the failure
ceiling of `working-on-issues` § Claiming instead.

Both endings count: a verified pull request **or** a pause that names exactly what is missing. A
run that ships a rename because a pull request seemed expected has produced the expensive kind of
nothing.

## Red flags

- starting on an issue whose latest move into `in_progress` an agent wrote;
- starting a second implementation while a linked pull request is open;
- claiming a task whose blocker is open, or one nobody launched because its blocker just merged;
- writing a test after reading the implementation: the assertion predates the code, always;
- widening a deliberately narrow change so the diff feels worth opening;
- inventing chrome, a layout or an interaction instead of stopping for the mockup;
- a pull request without `Issue: <id>`, against a branch other than `targetBranch`, or not
  linked in `pullRequests`;
- editing a `generated` path by hand, or editing `acceptance` while you hold the lease;
- ending a run with the lease set or `handoff` stale.
