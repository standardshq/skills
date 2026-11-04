# Solo

The single-juror form of `evaluating-changes`: one subagent, one ranked verdict. The convener
chooses the counts; standalone, that is all nine from `SKILL.md` § 2. The landing routine chooses
them by tier (`landing-pull-requests` § Tier).

The measured fact still holds: findings come from reading each count on its own, not from a
general look. A solo juror pays for that by **sequence**: it tries the counts one at a time, closes
each before opening the next, and writes each count's return before moving on, so a later count
cannot quietly absorb an earlier one.

## Brief for the subagent

Give the juror the dossier path (assembled exactly as `SKILL.md` § 1), the selected counts in
order, any narrowing of `proof` the convener allows, and this:

> Read `CHARGES.md` beside this file in full. Try the target under each selected count **in the
> supplied order**, one at a time, and write that count's return (findings or *nothing to
> charge*) before starting the next. Every finding takes the shape *What every juror owes*
> prescribes.
>
> Return one document: findings ranked `blocking`, `to fix`, `noted`; then the frozen target (head
> sha or merge-base); then the counts that returned nothing to charge, named one by one.

## What the convener does with it

The same deliberation as `SKILL.md` § 3, minus the merge of overlaps: one juror already saw them
together.

A verdict with no `blocking` and no `to fix` is **go**. Anything else goes back to whoever writes
code, entry by entry.
