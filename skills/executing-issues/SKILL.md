---
name: executing-issues
description: Build stage. Use when the Build routine takes the next In progress issue of its pipe and turns it into a pull request on a green gate, or into a Decision that names what is missing.
---

# Executing issues

One issue, one change, one run, ending at the pull request: from In review on, the PR is Land's.
The acceptance criteria and seams exist in the agent brief before the diff does, so the judge has
something to compare against that the implementation could not have chosen.

`working-on-issues` owns the state below (the claim, § Stopping for a person, § Three tries,
§ Pull requests, § Repository facts) and wins when this skill disagrees.

## 1. Take the next issue

The pipe (`workflow.md`, Build): In progress issues with no live claim whose latest move into In
progress passes `workflow.md` § Launch, and with no open linked PR. One with an open linked PR
enters only because a run died between opening it and moving the issue: claim it, finish § 6's
last writes, end; Build starts no second implementation.
An issue that has tasks (`childIds`) is never work; one with a `blockedBy` issue not Done waits,
with nothing written.

Claim it, then read it with `read-recipe.md`.

*Done when* you hold the claim on one launched leaf issue, or the pipe is empty and the run ends.

## 2. Before the code

**The premise.** Check it on the target branch: what the issue cites still exists, what it asks is
still missing. The work already landed, or the premise is gone: a `decision` checkpoint
(`deciding-issues`, Close it recommended, naming what overtook it).

**The workspace.** For each repository of the issue's `project`: read its facts, fetch
`targetBranch`, cut a branch named as the repository's rules say (by default `fix/<slug>`,
`feat/<slug>` or `chore/<slug>`), and read its agent rules there (`AGENTS.md`, `CLAUDE.md`,
`.cursor/rules`).

**The scope.** The brief's `## Problem`, `## Acceptance`, `## Seams` and `## Out of scope`; for a
feature, the slice its approving `ruling` names; for a task, its umbrella's sections and rulings
too. A ruling outranks the section it contradicts.

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

Renew the claim as `working-on-issues` § The claim says.

| The change touches | Do |
|---|---|
| a `generated` path | regenerate it with the repository's own command |
| a `withheld` path | build it, and name it in the PR body: a person approves the merge |
| anything `sensitiveData` names | keep it out of code, tests, the PR and the issue |

**A ruling met mid-way** stops the run with a `decision` checkpoint, the one question that forks
the work:

- the right fix changes a public contract, a security posture or an agent's authority;
- the issue is several changes, not one: I take it first, as `deciding-issues` § Ask 2 says for a
  programme.

*Done when* every acceptance criterion holds in a passing test, and the bug's red test is green.

## 5. The gate

Run every command of `verify` on the branch: commands only, green or red, no judgment. Judging the
code against the repository's conventions is Land's, once, by a judge that did not write it.

Red: read the failure, fix it, run the whole gate again. Red on the third run: a `decision`
checkpoint with the three failures quoted (trimmed, no `sensitiveData`), options retry with a
stated change (Approve, or Approve and launch), I take it, Close it.

An empty `verify`: the PR's CI is the gate, and Land reads it there.

A change with a screen you can run (the repository's `## Verification`, or a published link):
attach a capture of the result to `evidence` (`kind: proof`), the same screen as the approved
mockup or the reproduction.

*Done when* every `verify` command exits 0 on the branch head you will push.

## 6. Open the pull request

Per repository changed:

1. Push the branch and open the PR against `targetBranch`. Title as the repository's rules say (by
   default a conventional commit line). Body by `pr`, with the lines `working-on-issues`
   § Pull requests requires (`<!-- factory:build -->` among them), plus: each acceptance criterion and the test that holds it, the
   `withheld` paths touched, and the assumptions made unasked, one per line.
2. Add `owner/repo#N` to `pullRequests`, one per line, keeping the lines already there.

Then `status: in_review`, clear the claim, re-read the issue, at once: never wait for the PR's CI.
The CI is Land's to read, and an issue left In progress beside its open PR is one Land has to
repair.

*Done when* the re-read shows every PR in `pullRequests`, the issue In review, and the claim
empty. A write that failed is named in your report, never claimed.

## When a run fails

A run that cannot deliver (a tool missing mid-way, a timeout, a branch it cannot push) writes the
`attempt` row (`Outcome:` failed or timeout; what was tried, why it failed, what to try next;
`subject` the branch head when there is one), increments `failedAttempts`, clears the claim. At 3,
`working-on-issues` § Three tries.

Both endings count: a PR on a green gate, or a checkpoint that names exactly what is missing.
