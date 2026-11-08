---
name: evaluating-changes
description: Trial of a change before it is trusted. Use when Land's judge tries a PR head, or a person asks for a pull request, a branch or a written spec to be judged. One juror, five counts in sequence, one ranked verdict, nothing written to the code.
---

# Evaluating changes

The work is the accused. One juror tries it count by count, each count on its own, and returns one
ranked verdict. Nothing is committed, no line is fixed: the trial judges and reports.

**Who may judge.** On an issue's work, `working-on-issues` § Provenance first: a judge is never
the author. What the verdict becomes on the issue (a `verdict` row) is the convener's:
`landing-pull-requests` writes it. On a person's request, return the verdict to that person and
write nothing.

## 1. Freeze the dossier

Freeze one target:

- **A pull request:** with the GitHub tools, its description, its reviews and bot comments, its
  diff against the base, each check's conclusion on the head, and the head sha. A new head voids
  the trial.
- **A branch:** the merge-base against the repository's `targetBranch`, `git diff` against it, and
  the commit list.
- **A spec or plan:** the document, plus the code it claims to change, read at `targetBranch`.

Add the issue when there is one, read with `working-on-issues` `read-recipe.md`: its brief
(`## Problem`, `## Acceptance`, `## Seams`, `## Out of scope`), its rulings (a ruling outranks the
section it contradicts), and an umbrella's sections and rulings for a task. Add the repository's
agent rules (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules`) and whatever they point at for the surface
touched, read on `targetBranch`: the head's version is part of the diff on trial. Add the facts
`withheld`, `generated` and `sensitiveData`; nothing `sensitiveData` names is quoted in the
dossier or the verdict. Add the issue's `approved` mockup and its `evidence`: `experience` judges
the `proof` against the mockup, and against the `reproduction` for a bug.

Then **map the change** once: each changed file with its callers, found by searching its exported
names; the test files that import a changed file or that the diff touches, named one by one.

Write the dossier and its map to one file in your scratch directory.

*Done when* the file names the frozen sha or merge-base and holds every part above that exists.

## 2. Seat the counts

A count sits when its row says so; a count that sits with no material returns *nothing to charge*.
A count that does not sit is named in the verdict as *not convened*, with the row that kept it out.

| Count | What it tries | Sits on |
|---|---|---|
| `spec` | the work against what was asked: missing, partial, wrong, unasked, the other call sites | every target |
| `standards` | the repository's rules, the neighbours, what it rebuilds, what could be deleted, the Fowler smells | every target |
| `proof` | whether each test goes red without the change, and earns its place | a behaviour change |
| `risk` | blast radius, surface, concurrency, performance, each part on its trigger | every target |
| `experience` | what a person meets on the screen: states, keyboard, focus, copy, theme | a target with a screen |

A **behaviour change** is code that decides, computes, stores, fetches or renders conditionally,
or a test added, edited or deleted. Styles, copy, docs, comments and config values alone are not.

A target **has a screen** when it changes code that renders what a person sees: a component, a
hook or store a component reads, a page, a style, a locale. It is **screen-only** when every file
it changes, tests aside, is screen code. On a spec, read both off the code it claims to change.

Run the juror on the largest model available: `standards` pays for judgment rather than for
looking.

*Done when* every count is seated or named not convened with its reason.

## 3. Try them in sequence

Convene the juror as `SOLO.md` says, with the dossier path and the seated counts in this order:
`spec`, `standards`, `proof`, `risk`, `experience`.

## 4. Deliberate and return

Read the return and:

- **Strike what is paraphrased:** a finding whose evidence summarises the code rather than quoting
  it, or running it, has no evidence.
- **Keep the singletons:** one count is sufficient authority for a finding.
- **Rank** each entry on the ladder in `CHARGES.md`. The juror's line on why a lower rung tempted
  it is the only ground for lowering.

Return one document, findings first, ranked `blocking`, `to fix`, `noted`, each in the shape
`CHARGES.md` prescribes. Close with the frozen target, the counts that returned nothing to charge,
and the counts not convened with their reason.

**Go** is no `blocking` and no `to fix`. Anything else goes back to whoever writes code, entry by
entry; what to do with the verdict belongs to whoever convened the trial.

*Done when* every seated count has returned and every surviving finding carries an executable
command or a quoted excerpt.
