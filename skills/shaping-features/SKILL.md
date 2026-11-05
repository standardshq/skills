---
name: shaping-features
description: Use when a maintainer wants to choose what to shape next (the map of the open backlog), or when a feature idea, a family of issues, or an issue paused on a spec Task must become one approved spec, written to an umbrella issue with one task issue per change, chained by blockedBy. Runs live with the maintainer, never as a routine.
---

# Shaping features

**Shaping** turns raw work (an idea, a few issues, a family the map found) into a spec the
maintainer approved, cut into ordered **tasks**, one issue and one pull request each, before any
code exists. Execution never brainstorms: each task reaches `executing-issues` carrying everything
it needs. The spec's approval is the maintainer's, so shaping always runs live with them.

Read `working-on-issues` first (statuses, who moves them, the umbrella and its tasks, the read
recipe, Provenance). The scripts of `screening-issues` (`scripts/`) read the issues export
described in its § Scripts: write it with your record tools before running them; they never call
the workspace.

| Asked | Start at |
|---|---|
| « what should we shape next », or no input | § 1, the map; then the family chosen |
| an idea, a list of issues, a family | § 2 |
| an issue paused on a `task` wait for a spec (screening's « beyond one change », assessment's « Spec it first ») | § 2, with that issue and its Task as the input; § 7 delivers into the Task |

## 1. The map

Where each product vertical stands, and which open issues are one plan in disguise. Screening
judges one issue at a time and its sweep judges pairs; neither sees five issues that each read
small and together make one feature. The map is read-only: nothing is written, moved or closed.

```bash
node /workspace/skills/screening-issues/scripts/issue-families.mjs --input <issues.json> --project <id>
```

It groups the project's open issues by vertical (from the code they cite) and prints the candidate
families and their signals, then the singles. `shaped → issues:<id>` means an umbrella already
holds the plan; `already sliced` means the members sit under an umbrella or in a `blockedBy`
chain. Report both; propose neither.

Read every member's sections and rulings, then rule each family **one plan**, **split** (name the
sub-groups), or **not a family** (a shared file, not a shared goal). A single may join a family
when its sections name the same goal: say which signal the script missed. For each family kept:

- the problem in one sentence that names no solution;
- its members, and the size `screening-issues` § 5 would give what is still undelivered;
- its state, the first that holds: `shaped → issues:<id>`; `already sliced`; `in your lane` (a
  member is `mine`); `paused on <wait>` (every member `paused`: name the waits); `owes a decision`
  (an open `decision` wait, or options no ruling picked); `reproduce first` (every member a bug:
  it goes to `reproducing-bugs`); `ready to shape`.

Then one sentence per vertical, in product language, saying what it does for the user today and
where its open issues push it; no file, table or identifier in it. Present in the maintainer's
language, busiest vertical first:

```
## <Vertical>: <n> open issues
<the sentence>

- **<family problem sentence>**: <issue titles> · <size> · <state>
Singles: <issue titles>
```

End with the `ready to shape` family you would shape first, in one clause: how many asks it
settles at once, then what it unblocks. None ready: the family whose state is cheapest to lift,
and what lifts it. The maintainer picks.

## 2. Gather the raw work

For an idea, first search the project's open issues for the asks it covers (the record tools'
search, then `issue-duplicates.mjs --project <id>`): each one found joins the input. For each
input issue, read it with the read recipe, then run `issue-freshness.mjs` on it against the
repositories its work lives in, and rule it **alive**, **delivered** (name the pull request) or
**overtaken**, as `screening-issues` § 2 reads a stale reference.

*Done when* every input issue carries its ruling, and the problem fits one sentence that names no
solution. A delivered or overtaken issue leaves the input (§ 6 says what becomes of it).

## 3. Brainstorm the spec

Follow `brainstorming`, its checklist as written, with the maintainer, the alive issues, their
sections and rulings as the starting context. Three of its defaults change here, and only these:

- the spec is drafted in your scratch directory (`spec-<topic>.md`) and moves into the umbrella
  in § 5, never into a repository file;
- the spec is tried with `evaluating-changes` in its solo form (`SOLO.md`) unless the maintainer
  asks for the full panel;
- its handoff is § 4 of this skill, not `writing-plans`' plan document.

Every requirement ends on an **acceptance assertion**: the observable result with exact values,
or for what must not happen, the exact observable that stays absent. A requirement without one
is a decision execution would have to make, and execution cannot ask.

*Done when* the maintainer approved the written spec, and approved again every part an
`evaluating-changes` finding changed afterwards; you hold each approval quoted, with its date.

## 4. Decompose into tasks

Cut the approved spec with `writing-plans` § File Structure and § Task Right-Sizing (its
boundaries, not its bite-sized steps or code). Each task is one issue and one pull request. Order
them by what each needs from the others; independent tasks share a blocker rather than queue
behind each other.

An alive input issue whose ask one task fully carries **becomes** that task. For each task, give:
its title (the platform behaviour), the spec sections it delivers, its acceptance assertions
copied from the spec, the issue it reuses or `new`, what blocks it, and the `withheld` paths of
its repository (`working-on-issues` § Repository facts) it touches, since those wait for a person's approval before merge.

A task that adds new chrome, a new layout or a new interaction gets its mockup now, drawn with the
maintainer and stored as a file, so execution never pauses on it.

Present the tasks as one table and take the maintainer's approval of the decomposition and the
order.

*Done when* every acceptance assertion of the spec sits in exactly one task, every task that needs
a mockup has one the maintainer approved, and the maintainer approved the table.

## 5. Write the umbrella

The umbrella is an input issue only when its own ask is the whole plan; otherwise create one, in
the `projects` record the work belongs to (the root when it spans several repositories), with `origin: shaping`: screening never screens an issue with that
origin until it has tasks (`screening-issues` § The fence), so it is never mistaken for a leaf.
An adopted umbrella (an input issue whose ask is the whole plan) keeps its origin; its feature
tasks get the same `approved` row as any other (§ 6).
Its living document (the audit log keeps every earlier version):

| Field | Holds |
|---|---|
| `title` | the plan, in a few words |
| `body`, `## Problem` | the problem sentence of § 2 |
| `body`, `## Plan` | the approved spec, whole |
| `body`, `## Acceptance` | « every task done », then the spec's end-to-end assertions, if any |
| `context` | the tasks in order (§ 6 adds their ids); « Considered and set aside », each rejected option with its reason; the input issues and their § 2 rulings |

Leave `## Request` as people wrote it, and add to an adopted umbrella's `context`, never over it. Set `type` to what the whole plan is
(`screening-issues` § 1).

Then write one `ruling` row on the umbrella transcribing the approval (`timeline-kinds.md`):
decision-maker the maintainer, recorder this session, source this conversation and its date (and
`tasks:<id>` when you deliver into a spec Task, as `subject`), the question « Ship this spec,
decomposed into these tasks, in this order? », the approvals quoted verbatim, every earlier ruling
this one overrides named, and the resume stage « the maintainer's drag of each task to Ready ».

*Done when* the umbrella holds the sections of its `body`, its `context` and its `ruling` row.

## 6. Write the tasks

Rewrite a reused issue the same way (its title for its task, its `## Request` kept, its `context` added to; the audit log keeps the original);
create the others in the umbrella's project. Each task:

| Field | Value |
|---|---|
| `parent` | `record:<umbrella id>`, on creation only: a new task is created with `write`, **one per call**. A reused issue is moved under the umbrella with `organize`, action `file_under` (`write` refuses a parent on update) |
| `blockedBy` | the tasks it needs, as the approved table says |
| `type` | what the task itself is (`screening-issues` § 1) |
| `origin` | a new task: `human`; a reused issue keeps its own |
| `body`, `## Problem` | what the task ships, observed against today |
| `body`, `## Plan` | the spec sections it delivers, and `issues:<umbrella id>` |
| `body`, `## Acceptance` | its assertions, verbatim from the spec |
| `context` | at most three paths that anchor it, each existing on the target branch today (name a file the task creates by its role, never by a path: `issue-freshness.mjs` reads a missing path as stale), the `withheld` paths it touches, its approved mockup attached |
| `status` | a new task: `backlog`. A reused issue keeps its status: you never move a person's gesture or a pause |

Create every task right after the umbrella.

**Feature tasks carry the approval:** on each task whose `type` is `feature` (new or reused), write
one `assessment` row right after creating or rewriting it: `data: {"verdict": "approved"}`,
`subject: issues:<umbrella id>` (the approved spec, in the umbrella's `## Plan`), no `resumeAt`, and a
`body` naming the umbrella's `ruling` row (`timeline:<id>`) that quotes the maintainer's approval.
It is what screening's `ready` gate reads for a feature; screening leaves a feature task of a
shaped umbrella alone until the row exists.

**Input issues that became neither the umbrella nor a task:** append to each one's `context`
where its ask went (`issues:<id>` of the task, or the umbrella's « Considered and set aside »),
and list them in § 7. You never close them: closing is a person's move (they may close them in the
session), or screening's, which closes a `backlog` duplicate on its next pass. A `paused` one is
the Maintenance routine's: its wait ends, it wakes, and screening closes it. A live ask an input issue
carried beside the plan gets its own issue, as `curating-requests` writes one; an input that was
`mine` keeps that ask in the maintainer's lane.

*Done when* every task is listed under the umbrella (`working-on-issues` § Launch says how), each task's `blockedBy` matches
the table, the umbrella's `context` names every task, and every input issue says where its ask
went.

## 7. Hand over the bet

**Delivering into a spec Task:** write in the Task's description (or attach) the umbrella
(`record:issues:<id>`) and one line per task, then ask the maintainer to mark the Task done: that
is their approval reaching the paused issue. When they ask you to mark it done, do it and quote
their words in the Task. The Maintenance routine then resolves the wait and wakes the issue
(`waking-issues`): assessment records the approval, or screening finds the umbrella and screens its
tasks.

Report one table (task, issue, blocked by, withheld paths), the umbrella, and the input issues
left to close. The tasks sit in `backlog`; screening screens each one when it is created, against
today's target branch, not against a branch holding its predecessors (none exists yet), and leaves
it there. Its `blockedBy` issues keep it out of the launch queue until they are `done`. The
maintainer's drag of a task to `ready` is its launch: all at once or one by one. A launched task
whose blockers are still open waits; it starts on its own once they are `done` (`working-on-issues`
§ Launch).

## Red flags

- a map that writes, moves or closes anything;
- a requirement whose acceptance is a sentence instead of an exact value;
- a task holding two reviewable deliverables, or one with no test of its own;
- a task citing a path that does not exist yet;
- a task moved to `ready` or `in_progress` by you, or an input issue closed by you;
- an approval recorded that the maintainer did not give in their own words;
- an input issue left open with nothing saying where its ask went.
