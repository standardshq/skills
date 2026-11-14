---
name: triaging-issues
description: Use when a Screening run takes an issue whose `type` is empty or contradicted by a ruling. Classifies it as bug, enhancement, feature or chore from the issue's own text, keeps the reporter's cause as a hypothesis, and stops for a person when the text cannot settle the type.
---

# Triaging issues

Triage routes the report; it does not diagnose it or design the fix. It is the first step of the
Screening run that took the issue, which goes on to `screening-issues` once `type` is set.

Read `working-on-issues` first. The wake, the `screening` row and stopping for a person are its.

## Evidence boundary

Classify from the issue alone: `title`, `body`, `context`, `origin`, who filed it and when. The
checkout, the code, tests, docs and linked PR diffs stay closed until `type` is set: a plausible
cause invented here is carried by every stage after it.

A cause or fix the reporter or a maintainer proposes is a **hypothesis**, never classification
evidence. Keep it for the brief: `screening-issues` writes it into `## Problem` as "Reported cause
(hypothesis)".

## Choose exactly one type

| `type` | Test | Next |
|---|---|---|
| `bug` | intended, existing behaviour is broken | screening |
| `enhancement` | an existing capability is improved | screening |
| `feature` | a new capability, workflow or product surface | screening, then preview |
| `chore` | maintenance with no behaviour change: a dependency, a rename, a cleanup | screening |

Classify the requested outcome, not the suggested implementation: "rebuild the cache" or "add a
repair screen" leaves one report one type. Set `type`, replacing any earlier value. A `ruling`
that names the type wins over your reading.

## Route or stop

**Route** when the text names one outcome and enough expected-versus-actual behaviour to pick a
type: set `type` and continue into `screening-issues` in the same run.

**Stop for a person** (`working-on-issues` § Stopping for a person, `need: decision`) when the
issue holds several independent outcomes, needs a product ruling to pick a type, or is too vague
to route without inventing behaviour. The question is the one that settles it, asked of the
issue's author when they are an active person of the workspace, else the project's first active
maintainer; `deciding-issues` phrases it. Several outcomes: offer the split into one issue each as
the recommendation. `Resume at: screening`.

*Done when* `type` holds one value, or the checkpoint is written and the issue Paused.

## What you write

Open the prose of this run's `screening` row (or, when you stop, the checkpoint's `Evidence:`)
with:

```
Type: <the type set, or none>
Rationale: <the sentences of the issue that decide it>
Missing information: <a bounded list, or none>
Hypothesis: <the reporter's proposed cause or fix, or none>
```

## Red flags

- opening code because it seems faster than asking;
- writing a likely cause as a fact;
- picking enhancement and feature "to keep options open";
- turning missing evidence into an implementation guess.

Each means: discard the conclusion and triage again from the issue's text.
