---
name: evaluate
description: Use when a pull request, an unpushed branch, or a written spec must be tried before it is trusted — one juror subagent tries every count the target calls for, one at a time, and returns one ranked verdict, nothing written to the code.
---

# Evaluate

The work is the accused. One juror, a single subagent from a fresh context,
tries it count by count and returns a single ranked verdict. Nothing is
committed, no issue is filed, no line is fixed: the trial judges and reports.

Across four review tools and 617 findings, 93.4% were raised by exactly one
reviewer: findings come from reading each count on its own, not from a general
look. The juror pays for that by **sequence**: it closes each count, its return
written, before opening the next, so a later count cannot quietly absorb an
earlier one.

## 1. Instruct the dossier

Read the project's **review adapter** first: `docs/agents/review.md`, or the
file the convener names. It may give the commands that read a pull request,
its diff and its checks on this forge; the screen paths; the rule files; a
mutation report for the diff. What it leaves out falls back to: the forge's own
CLI (`gh` on GitHub, `glab` on GitLab), `AGENTS.md` and `CLAUDE.md` as rule
files, the screen definition in §2, and no mutation report.

Freeze one target and build the dossier the juror will read. The three targets
differ only in how the dossier is assembled:

- **A pull request** — its description and bot comments, its diff, and the
  head SHA. Record the head SHA: a new head voids the trial.
- **The current branch** — the merge-base against the default branch, `git diff`
  against it, and the commit list.
- **A spec or plan** — the document, plus the code it claims to change, read at
  the default branch.

Add the originating issue when there is one, with its acceptance criteria and
every ruling on it (a ruling outranks the section it contradicts), and the
project's rule files with whatever they point at for the surface being touched.
Add whatever the convener hands over: an approved mockup, a reproduction, the
paths a person must approve, the data that must never be quoted.

Then **map the change** once, so the juror does not pay for it per count:

- each changed file with its callers, found by searching its exported names;
- the test files that import a changed file or that the diff touches — files
  named one by one, never a directory or a whole package;
- the head's CI checks, when they ran.

Write the dossier and its map to one file in the scratchpad. The juror starts
from the map and widens only where a count leads.

## 2. Seat the counts

A count sits when its row below says so. A count that sits with no material
returns *nothing to charge*, which is cheap and is a real answer. A count that
does not sit is named in the verdict as *not convened*, with the row that kept
it out.

A target **has a screen** when it changes code that renders what a person
sees: a component, a hook or store a component reads, a page, a style, a
locale. Where the adapter lists screen paths, read them there. A target is
**screen-only** when every file it changes, tests aside, is screen code. On a
spec, read both off the code it claims to change.

| Count | What it prosecutes | Sits on |
|---|---|---|
| `omission` | what the work should have touched and did not | every target |
| `coherence` | the diff against the patterns already in the code and the project's stated rules | every target |
| `dry` | what this rebuilds that the codebase already has | every target |
| `elegance` | the abstraction nobody needed, the flexibility no caller uses | every target |
| `blast-radius` | tenancy, permissions, visibility, migrations, rollback | every target; a screen-only one when it gates on a permission or a visibility |
| `concurrency` | two things happening at once: the race, the stale read, the double write | its trigger |
| `surface` | secrets, injection, the authorization the change exposes | its trigger |
| `performance` | the cost per request, per record, per render: the unbounded query, the re-render, the extra round trip, the heavy import | its trigger |
| `state-of-the-art` | the deprecated API, the idiom the upstream docs retired | every target but a screen-only one |
| `experience` | what a person meets on the screen: states, keyboard, focus, copy, theme | a target with a screen |
| `proof` | whether the test fails without the change | its trigger |

A trigger is something the target **does**, read from its files:

- `concurrency` — an optimistic update or a mutation hook; a realtime channel,
  stream or subscription that writes into state the user also edits; a job,
  retry, queue, lease or lock; a read followed by a write on the same row; a
  cache shared across requests; requests fired in parallel whose answers are
  merged; a submit a person can fire twice.
- `proof` — a change to behaviour: code that decides, computes, stores,
  fetches or renders conditionally; a test added, edited or deleted. Styles,
  copy, docs, comments and config values alone do not trip it.
- `performance` — a query, repository, migration or index; a job, sweep, loop
  or batch; code on a request path; a component, hook, store or context;
  streaming, polling, subscriptions or realtime; a cache; a new dependency or a
  heavy import.
- `surface` — external input (a route or operation handler, a webhook, an
  integration client, a parser of a third-party payload, an upload, a URL
  fetched server-side); authentication, sessions, tokens, secrets, keys or
  crypto; a permission or grant check; a query, shell command, template or
  file path built from a value; a log line or error carrying user data; a
  sandbox, browser or code-execution tool.

The rows rest on 261 trials where all nine original counts sat: `surface`
sent work to a fixer on 3% of them and `performance` on 5%, `surface` on none
of the 56 screen-only ones, `state-of-the-art` on none at all; on screen-only
targets the findings about focus, keyboard, translations and states were
scattered across `omission` and `coherence`, which is the reading
`experience` now owns.

## 3. Convene the juror

Dispatch one subagent, on the largest model available: `dry` and `elegance`
pay for judgment rather than for looking, and a fast tier spends the call
without buying it. Give it the dossier path, the seated counts in the order of
the table above, any narrowing of `proof` you allow, and the brief in
[`SOLO.md`](SOLO.md) beside this file. A later round, a head that answers an
earlier verdict, takes the later-round brief in the same file instead.

## 4. Deliberate

Read the return and:

- **Strike what is paraphrased.** A finding whose evidence summarises the code
  rather than quoting it, or running it, has no evidence.
- **Move what sits under the wrong count** to the count it belongs to, and keep
  it there once.
- **Keep the singletons.** One count is sufficient authority; corroboration
  raises rank, its absence never removes a finding.
- **Rank** each entry on the ladder in `CHARGES.md` (*The rank ladder*). The
  juror's line on why a lower rung tempted it is the only ground for lowering.

## 5. Return the verdict

One document, ranked, findings first, each entry in the shape `CHARGES.md`
prescribes. Close with the frozen target — head SHA or merge-base — the
counts that returned nothing to charge, and the counts not convened with the
row that kept each out, named one by one.

**Go** is no `blocking` and no `to fix`. The trial is complete when every count
that sat has returned and every surviving finding carries an executable
command or a quoted excerpt as its evidence. The ruling on what to do with the
verdict belongs to whoever convened the court.
