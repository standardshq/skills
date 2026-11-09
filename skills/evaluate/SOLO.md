# The juror's brief

Read by the convener of `/evaluate` (`SKILL.md` §3), and handed to the one
juror subagent as written below.

## A first round

Give the juror the dossier path, the seated counts in order, any narrowing of
`proof` the convener allows, and this:

> Read `CHARGES.md` beside this file in full. Try the target under each seated
> count **in the supplied order**, one at a time, and write that count's
> return — findings or *nothing to charge* — before starting the next. Report
> each finding under the count whose section it answers. Every finding takes
> the shape *What every juror owes* prescribes.
>
> Return one document: findings ranked `blocking`, `to fix`, `noted`; then
> the frozen target (head SHA or merge-base); then the counts that returned
> nothing to charge, named one by one.

## A later round

When the convener brings a head that answers an earlier verdict, the juror is
given **two things only**: the previous verdict's entries, each with the
answer the fixer gave, and `git diff <judged sha>..<head>`. Its brief replaces
the counts:

> For each entry of the previous verdict, return **closed** (the answer holds:
> quote the test or the excerpt that proves it) or **open** (say what is still
> missing). Then read the delta alone and return any `blocking` it introduces.
> Return nothing else: a `to fix` or `noted` on the delta is out of scope, and
> the rest of the change has been judged.

Every entry closed and no `blocking` on the delta: **go**. An open entry or a
`blocking`: not go, and those entries are the next brief.
