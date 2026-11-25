---
name: executing-issues
description: Build stage. Use when the Build routine is woken or launched on an In progress issue, or on a push to the draft pull request it opened, and turns the issue into a pull request on a green gate, or into a Decision that names what is missing.
---

# Executing issues

One issue, one pull request per repository, ending at the pull request: from In review on, the PR
is Land's. A `small` or `standard` issue takes one run; a parent takes several, one task after the
other (§ A parent and its tasks).
The acceptance criteria and seams exist in the agent brief before the diff does, so the judge has
something to compare against that the implementation could not have chosen.

`working-on-issues` owns the state below (§ One wake, one piece of work, § Neighbours, § Stopping
for a person, § Three tries, § Pull requests, § Repository facts) and wins when this skill
disagrees.

## 1. Take the issue of your wake

The issue your wake names (`workflow.md`, Build), read with `read-recipe.md`. It is yours to build
when it is In progress, its latest move into In progress passes `workflow.md` § Launch, it is a
leaf that is not a task, or a parent (`workflow.md`, A large issue and its tasks), every
`blockedBy` issue is Done,
and no open PR is linked, or the only open PR is the draft Build opened on this parent.

Any other issue takes the first exit that matches:

| The issue | Exit |
|---|---|
| is a task of a parent (`origin: design`) | the run that holds its parent moved it: end, and say so in your report |
| is no longer In progress | a person or a neighbour moved it: end, and say so in your report |
| has an open linked PR that is not Build's draft on it | a run died between opening it and moving the issue: finish § 6's last writes, end; Build starts no second implementation |
| entered In progress on a move no launch backs | a refusal, `Rule: unlaunched` |
| is `full` by its newest `screening` row and has no task | a `decision` checkpoint, `Resume at: screening`: Design it first (recommended), Build it as one change (Approve and launch), Close it |
| has tasks that carry another `origin` | a refusal, `Rule: umbrella`: its tasks are the work |
| has a `blockedBy` issue not Done | a refusal, `Rule: blocked`, naming each open one |

A refusal is `working-on-issues` § Refusals: its `signal` the first time, a Decision the second.
`Rule: umbrella` and `Rule: blocked` take both in this run: the `signal`, then the `decision`
checkpoint that takes the issue out of In progress.

A launch whose context carries a `Next:` line (Ops relaunching a run that died) starts from it: the
branch or the patch it names, before anything is rebuilt.

*Done when* you hold one launched issue that is yours, a leaf or a parent, or its exit is written
and the run ends.

## 2. Before the code

**The premise.** Check it on the target branch: what the issue cites still exists, what it asks is
still missing. The work already landed, or the premise is gone: a `decision` checkpoint
(`deciding-issues`, Close it recommended, naming what overtook it).

**The workspace.** For each repository of the issue's `project`: read its facts, fetch
`targetBranch`, cut a branch named as the repository's rules say (by default `fix/<slug>`,
`feat/<slug>` or `chore/<slug>`), and read its agent rules there (`AGENTS.md`, `CLAUDE.md`,
`.cursor/rules`).

**The scope.** The brief's `## Problem`, `## Plan`, `## Acceptance`, `## Seams` and
`## Out of scope`; for a feature, the slice or the design its approving `ruling` names; for a task,
its parent's or its umbrella's sections and rulings too. A ruling outranks the section it contradicts.
`## Acceptance` is the oracle you are judged on: it is read, and left exactly as it is.

**A mockup owed.** The change brings new chrome, a new layout or a new interaction, and no file of
`mockups` is `approved`: before any code, a `design` Decision through `deciding-issues`
§ Ask 3, drawn as `mockups.md` says, or sent with `Mockups: none` when no run can draw the screen.
Restyling what exists is built, never asked. An `approved` mockup is the screen to build.

*Done when* every repository has its branch and facts, and no checkpoint is owed.

## 3. A bug: red first

`type: bug` runs `diagnosing-bugs` before any production edit. Its loop ends on a red command: a
test or script that fails on the unmodified branch for the reported reason. That failing test is
the first commit. A bug you can see on a screen gets a capture of it in `evidence`
(`kind: reproduction`) unless one is there already.

No red after the loop: a `decision` checkpoint naming each attempt to reproduce and what it
showed, with Close it recommended when the evidence says the bug is gone.

*Done when* the red command is committed, or the checkpoint is sent.

## 4. Implement

Run `implement`, which drives `tdd` at the seams the brief's `## Seams` lists. Each criterion of
`## Acceptance` gets a test asserting its exact value; a bug's red test turns green.

| The change touches | Do |
|---|---|
| a `generated` path | regenerate it with the repository's own command |
| a `withheld` path | build it, and name it in the PR body: a person approves the merge |
| anything `sensitiveData` names | keep it out of code, tests, the PR and the issue |

**A ruling met mid-way** stops the run with a `decision` checkpoint, the one question that forks
the work:

- the right fix changes a public contract, a security posture or an agent's authority;
- the issue turns out larger or vaguer than its brief says, and no design was approved: the
  question is « design it first », `Resume at: screening`, so Screening sizes it `full`.

**Stuck.** The work cannot go on, and no test you could write or command you could run would
change that: an acceptance criterion the code cannot meet as written, a dependency that is absent,
two criteria that contradict. Stop there with a `decision` checkpoint, `Resume at: build`, whose `Reason:` names what is
missing and `Evidence:` what you checked; its options are the change that would free the work
(Approve, or Approve and launch), I take it, Close it. A criterion or a test's expectation changes only on that person's ruling.

*Done when* every acceptance criterion holds in a passing test, and the bug's red test is green.

## A parent and its tasks

A parent (`workflow.md`, A large issue and its tasks) is built over several runs on one branch,
one pull request per repository. Its tasks are the issues whose `parent` is this one and whose
`origin` is `design`, in the order of the parent's `### Tasks`. You hold the parent; its tasks are
yours to move.

**Each run**, in order:

1. Read your routine's runs (`working-on-issues/environments.md` § Runs): another live run on this
   parent holds it, so write a `signal`, `Rule: two_runs`, and end. Then read the tasks and their
   statuses, the parent's newest `progress` row, and `git log` of the branch; they outrank what
   you remember. A task found In progress is a run's that ended: set it `ready`.
2. Run the repository's quickest check from `verify` on the branch before adding anything: red
   here is fixed first.
3. A task in Mine, or Done for a reason other than `done`, that no ruling on the parent has left
   out: pause the parent as `workflow.md`, A large issue and its tasks, says, after step 6's
   writes. Otherwise take the first task that is Ready and whose `blockedBy` tasks are all In
   review, Done or left out: set
   it `in_progress`, then build it as § 3 and § 4 say, against its own `## Acceptance`. Tasks that
   share no file and need nothing from each other may go to parallel subagents, one each, with the
   task, its acceptance lines and the seams; each returns what it changed and the commands it ran.
   You read the diff and run the tests yourself.
4. Its tests green in this run: commit, then set the task `in_review`. Take the next.
5. A task that does not get there is written on the task, never on the parent. A red you could
   not turn green: an `attempt` row and the task's own `failedAttempts` (`working-on-issues`
   § Three tries), then the task back to `ready` for the next run, or Paused under its checkpoint
   at 3. Stuck (§ 4): its checkpoint, which leaves the task Paused. Go on with the tasks that do
   not need it.
6. At 100 minutes of work, or when no task is left to take, end the run with two writes, in this
   order: a `progress` row on the parent (`timeline-kinds.md`), its `subject` the commit you are
   about to push; then the push, the run's last act: it wakes the next run. A push the remote
   refuses means the branch moved under you: write an `attempt` on the parent, `Cause:
   environment`, and set the tasks this run took to In review back to `ready`.

The first run pushes its first task's commit as soon as it is made and opens the pull request as a
draft, body by `pr`, linked in the parent's `pullRequests`: the draft must exist for the run's
last push to wake the next one.

**The last run**, every task In review or left out: § 5 on the whole branch, the push, the draft marked ready,
then § 6 from step 2 for the parent. Its body gains `Rollback:` the way back (a revert, a flag
to switch off, a migration's down path); a change a person can see ships behind the flag the
design names, when it names one.

A run that finds every remaining task Paused, or waiting on a Paused one, pushes what it has and
ends on its `progress` row, `Next:` naming the tasks that wait on a person.

*Done when* a re-read shows the parent under this run's `progress` row, each task it names In
review, the draft's head equal to the row's `subject`, and every other task Ready, Paused, In
review or Done; or one of § 7's endings.

## 5. The gate

Run every command of `verify` on the branch: commands only, green or red, no judgment. Judging the
code against the repository's conventions is Land's, once, by a judge that did not write it.

Red: read the failure, fix it, run the whole gate again. A failure in a package the diff leaves
alone is checked on the unmodified `targetBranch`, same machine: red there too, it is the target's,
named in the PR body and not counted. Red on the third run that counts: a `decision`
checkpoint with the three failures quoted (trimmed, no `sensitiveData`), options retry with a
stated change (Approve, or Approve and launch), I take it, Close it.

An empty `verify`: the PR's CI is the gate, and Land reads it there.

A change with a screen you can run (the repository's `## Verification`, or a published link):
attach a capture of the result to `evidence` (`kind: proof`), the same screen as the approved
mockup or the reproduction.

*Done when* every `verify` command exits 0 on the branch head you will push.

## 6. Open the pull request

Per repository changed:

1. Re-read the repository's open PRs for one that cites this issue (`working-on-issues`
   § Neighbours): one there means a neighbour opened it, so push nothing and end. Otherwise push the
   branch and open the PR against `targetBranch`. Title as the repository's rules say (by
   default a conventional commit line). Body by `pr`, with the lines `working-on-issues`
   § Pull requests requires (`<!-- factory:build -->` among them), plus: each acceptance criterion and the test that holds it, the
   `withheld` paths touched, and the assumptions made unasked, one per line.
2. Add `owner/repo#N` to `pullRequests`, one per line, keeping the lines already there.

Then `status: in_review`, re-read the issue, at once: the PR's CI is not yours to wait for.
The CI is Land's to read, and an issue left In progress beside its open PR is one Land has to
repair.

*Done when* `gh pr view` shows each PR's body carrying the `Standards issue:` line and
`<!-- factory:build -->`, and the re-read shows every PR in `pullRequests` and the issue In
review. A write that failed is named in your report as failed.

## 7. End on a row

Whatever step the run stops at, it ends as `working-on-issues` § Every run ends on a row says.
For Build the endings are:

| The run | Leaves |
|---|---|
| delivered | the issue In review, a PR linked on a green gate |
| needs a person | the issue Paused under its `checkpoint`, which names exactly what is missing |
| worked a parent (§ A parent and its tasks) | the parent In progress under this run's `progress` row |
| is stuck (§ 4) | the issue Paused under its `checkpoint` |
| could not deliver | the issue In progress under an `attempt` row copied from the filled-in one in `timeline-kinds.md`, then `failedAttempts` updated as `working-on-issues` § Three tries says |

A branch the run cannot push leaves its patch attached to the issue.

*Done when* a re-read of the issue shows one of these endings, and for the last, an `attempt` row
whose body holds `Outcome:`, `Cause:` and `Next:`.
