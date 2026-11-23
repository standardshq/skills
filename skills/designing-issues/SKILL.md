---
name: designing-issues
description: Use when screening routes a full issue to design, or a ruling resumes one at design. Holds the design conversation with the person who asked, on cards, then writes the design into the issue and stops on a Decision for its approval.
---

# Designing issues

A `full` issue is too large or too vague to build from its request. The design conversation finds
out what the person wants and why, settles how it gets built, and leaves the issue holding a
**design** a builder can work from without asking again. The person approves that design once;
nothing is built before.

Read `working-on-issues` first. You run inside the Screening run that routed the issue here, and
each card you send is a Decision (`deciding-issues`): the run stops on it, and the answer brings
the issue back to you (`Resume at: design`).

## Which issues

An issue whose `screening` row of this run says `Verdict: design`, or whose newest `ruling` says
`Resume at: design`. A feature comes here after its preview was approved.

## 1. Look before asking

Read the issue with `read-recipe.md`, its `## Request`, its thread, every ruling, and the notes of
§ Notes when a card was already answered. Then read the code until you can say how the relevant
parts work today and what the change would touch.

Sort every open point into three piles:

| The point | Pile |
|---|---|
| the request, a ruling, the code or the repository's rules answer it | **settled**: use the answer |
| any sensible builder would choose the same way, or the choice does not change what a person gets | **yours**: decide, and write the choice with its reason |
| two answers would give the person different things, and only they can choose | **theirs**: a card |

*Done when* every open point sits in one pile, and each point of the third names what its answer
changes for the person.

## 2. The cards

Write every card for the person who asked, in their words. Name things by what they are for the
person (« the list of meetings on your dashboard »), and say what each answer changes for them.

Send the next card that still has something open, one per run, in this order:

| Card | To | Holds |
|---|---|---|
| **What and why** | the person the `## Request` quotes when they are an active person of the workspace, else the project's first active maintainer | the request said back in a few lines: what they want, who it is for, why, as far as they said; what you found that bears on it (a limit, a conflict, a cheaper path); then the one open question that matters most, with free text as its answer |
| **Which way** | the same person | two or three ways to build it, each concrete enough to picture, with what it costs them; the one you recommend, first, with the reason. Up to three other choices that do not depend on this one, each with its recommended option first. When the ways look different on screen, one mockup per way (`deciding-issues` § 3) |
| **The design** | the project's first active maintainer | § 4 |

Skip a card with nothing open: a request that already says what and why gets no first card; one
sensible way gets no second. A choice the person leaves blank takes its recommended option, written
in the `ruling` as taken unasked.

A request that is really several independent pieces of work: say so on the first card, with the
order you propose, and design the first one; the others go in `## Out of scope`, in that order.

Each card follows `working-on-issues` § Stopping for a person, with `Stage: design` and
`Resume at: design` in its `checkpoint` row.

*Done when* the card is sent and the issue is stopped as that section ends, or no card had anything
open.

## Notes

After each answer, before anything else, append to the issue's `context`, dated:

```
Design notes, <date>
Established: <each thing the answer settled, one line each>
Still open: <each point left in the third pile, or "nothing">
```

Read them before writing a card: a question asked once is asked once.

## 3. Write the design

Once nothing is left in the third pile, write the design into `body`, one section at a time, each
other section written back word for word, `## Request` left as it is:

| Section | Holds |
|---|---|
| `## Problem` | what they want and why, in their words where they gave them |
| `## Plan` | goals; non-goals; anti-goals (what would make it a failure even if it works); constraints; the ways considered, the one picked and why; the feature flag it ships behind, when the repository's rules name flags and a person will see the change; your own calls, one per line, each with its reason |
| `## Acceptance` | each requirement as a result a test or a command proves, with its exact value |
| `## Seams` | the public seams the change is driven and tested through |
| `## Out of scope` | the adjacent changes Build leaves alone |

Keep it under 200 lines: decisions and exact results. A change that brings new chrome, a new layout
or a new interaction carries its approved mockup in `mockups`; the second card is where it was
approved.

**A fresh reader.** Dispatch one subagent that receives the five sections and nothing else, with
this question: « You must build this without asking anyone. List what you could not decide from
this text. » Sort each item as § 1 does: settled goes into the text, yours goes into `## Plan` as
your call, theirs goes on the approval card.

*Done when* the five sections are written in under 200 lines, the reader's list is empty or
sorted, and every line of `## Acceptance` names a value a test can compare.

## 4. Stop for approval

One Decision to the project's first active maintainer (`working-on-issues` § Stopping for a
person, `Resume at: screening`). It says in three lines what will be built and the way picked,
lists your own calls so they can be corrected, and carries the reader's questions that are theirs,
if any. Options: Approve and launch (recommended), Approve, Change (say what), I take it, Close it.

Change returns here: apply it to the design, run the fresh reader again, ask again.

The approving `ruling` is what `screening-issues` reads to route the issue to Ready or to a launch.

*Done when* the approval Decision is sent and the issue is stopped as that section ends.
