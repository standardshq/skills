---
name: reproducing-bugs
description: Use when the Build routine works a launched bug, before any diagnosis or fix. Produces one fast, deterministic command whose assertion fails on the reported symptom against the unmodified target branch, or ends the run with the exact missing artifact asked for.
---

# Reproducing bugs

Prove the reporter's exact symptom through a tight red loop. Do not diagnose, propose a fix, or
take a nearby failure as proof during this step. `executing-issues` runs this skill first on every
`type: bug`; the red command it produces is the fix's first commit.

Read the issue with `working-on-issues` § read recipe. Run everything in the repository checkout,
on a branch cut from the repository's `targetBranch`. The repository's own agent rules and its
facts (`working-on-issues` § Repository facts: `verify`, `boot`, `apps`, `reset`) say how to run tests and the app.

## Establish the red loop

1. Restate expected versus observed, environment, version, inputs, and the smallest public seam
   where the symptom is observable.
2. Write or find one command an agent can run whose assertion names that exact symptom.
3. Run it now, on the unmodified branch; capture its exit status and the relevant output.
4. Repeat until deterministic. When outside nondeterminism is unavoidable, pin seeds and
   conditions and report a stable reproduction rate over enough runs to justify it.
5. Minimise one setup element at a time, re-running after each removal: every service, fixture,
   step and datum left must be load-bearing.

Prefer a focused test or a minimal script over a broad suite. The final command must be fast
enough to drive the fix and its review. Random fixtures, an 18-minute suite, or one matching
failure among unrelated failures is not a usable red loop.

**No red-capable command, no fix.** A failing sorting test does not prove a duplicate-card report
unless its assertion observes the duplicate.

## Outcomes

Exactly one, with commands and captured evidence:

| Outcome | Requirement | Then |
|---|---|---|
| `reproduced` | the command, already run, reliably asserts the exact symptom | write the reproduction into `## Problem` of `body` (below) (change that section alone, `working-on-issues` § Two layers); `executing-issues` goes on to the fix |
| `cannot-reproduce` | the complete reported conditions ran without the symptom | pause on a `decision` wait to the reporter, else the first active maintainer of the issue's project (`maintainers`, read up the tree): what you ran, and « close it » or the one condition you may have missed |
| `needs-info` | one precise artifact or condition from the reporter is missing | pause on a `task` wait to the person who has it: the exact artifact (a record, a file, a screen recording, a version), and why |
| `needs-human` | reproducing is unsafe, security-sensitive or needs production access the factory must not have | pause on a `task` wait to the first active maintainer of the issue's project (`maintainers`, read up the tree) |

Every pause follows `working-on-issues` § Pausing (`resumeAt: execution`), then release the lease.
None of these is a failed attempt: write no `attempt` row.

**`reproduced`, written into `## Problem` (change that section alone, `working-on-issues` § Two layers):** expected and actual, environment, the command, the
observed failure, the reproduction rate, the minimised setup and why each remaining element is
needed. Ask only for the exact missing artifact or action in the other outcomes.

## Red flags

- "The cause is obvious."
- "The existing test is close enough."
- "We can tighten the test after the fix."
- recording a command that has not actually run, or that ran on a branch already holding the fix.

All mean: stay in reproduction and do not touch production behaviour.
