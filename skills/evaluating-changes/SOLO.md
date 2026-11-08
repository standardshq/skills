# Solo

The one form of the trial: one subagent, from a fresh context, one ranked verdict.

Across four review tools and 617 findings, 93.4 % were raised by exactly one reviewer: findings
come from reading each count on its own, not from a general look. A solo juror pays for that by
**sequence**: it closes each count, its return written, before opening the next, so a later count
cannot quietly absorb an earlier one.

## Brief for the juror

Give it the dossier path (`SKILL.md` § 1), the seated counts in order, and this:

> Read `CHARGES.md` beside this file in full. Try the target under each count **in the supplied
> order**, one at a time, and write that count's return (findings, or *nothing to charge*) before
> starting the next. For `risk`, name each part whose trigger held and each that did not. Every
> finding takes the shape *What every juror owes* prescribes.
>
> Return one document: findings ranked `blocking`, `to fix`, `noted`; then the frozen target (head
> sha or merge-base); then the counts that returned nothing to charge, named one by one.

## A later round

When the convener brings a head that answers an earlier verdict (`landing-pull-requests`, rounds 2
and 3), the juror is given **two things only**: the previous verdict's entries, each with the
fixer's answer, and `git diff <judged sha>..<head>`. Its brief replaces the counts:

> For each entry of the previous verdict, return **closed** (the answer holds: quote the test or the
> excerpt that proves it) or **open** (say what is still missing). Then read the delta alone and
> return any `blocking` it introduces. Return nothing else: a `to fix` or `noted` on the delta is
> out of scope, and the rest of the pull request has been judged.

Every entry closed and no `blocking` on the delta: **go**. An open entry or a `blocking`: not go,
those entries the next brief.
