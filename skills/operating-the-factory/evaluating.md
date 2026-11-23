# Evaluating the routines

Once a day Ops measures the last 24 hours and says what went well, what went wrong and what to
change. Numbers come from commands and queries; reading is kept for the three conversations of § 4.

## 1. Measure the runs

Save each stage's runs of the window to a file, `{ "<routine>": [<run rows>] }`, then run
`node <skills folder>/operating-the-factory/scripts/measure-runs.mjs <file>`. It prints, per
routine and per source (trigger, schedule, launch): runs, runs under 2 minutes, failed runs with
their errors grouped, the most runs at once, and hours of work.

*Done when* the table covers every stage, Pulse included.

## 2. Measure the ledger

With `query` and `aggregate` on `timeline`, rows of the window:

| Count | Group by | Reads as |
|---|---|---|
| `kind: verdict` | `round`, `outcome` | how many rounds a go takes; a round 4 to 6 that ends go earns the six-round cap |
| `kind: signal` | `rule`, `stage` | which rule broke, and where; `goal_launch` counts the launches Pulse made |
| `kind: progress` | `issue` | how many runs a parent takes |
| `kind: attempt` | `outcome`, and `Cause:` read from the body | failures of the change against failures of the machine |
| `kind: checkpoint` | `stage` | how often each stage stops for a person |

And on `issues`: the count by `status`; Ready issues without `priority`; Paused issues by `need`
and age; the time from a go verdict to Done for issues closed in the window.

*Done when* each row of the table has its numbers.

## 3. Measure the evals

`read` each stage's `routine:<id>` with `include: ["evaluations"]`: the eval lists attached to it
and, per UTC day over 30 days, its counts. Take the last 7 full days; today's row is still filling.

| From | Take | Reads as |
|---|---|---|
| `days`, per list | `passed` over `judged` | how often a judged conversation meets the list |
| `days`, per list | `skipped`, by reason | conversations the judge never scored: `budget` and `no_payer` are money, `failed` and `refused` the judge itself |
| `lists` | each `active: false`, with its `pausedReason` | a list that stopped judging |
| `attention` | `decisionsAnswered` and `decisionsExpired` over `decisionsRaised` | whether a person answers what the stage asks |

These are counts: which conversation failed, and why, is a person's read in the routines'
Evaluations view.

A stage with no numbers gets one of three answers in the report: « no eval list » (`lists` is
empty), « counts unavailable » (`counts: "unavailable"`), « evals not readable » (your tools refuse
the include).

*Done when* each stage has its numbers per list, or one of the three answers.

## 4. Read three conversations

Pick, across the stages: the longest dead run, the longest completed run, and one run under 2
minutes started by a trigger. Read each (`read` of its `session:<id>`) against the skill of its
stage, and answer in two lines each: what the run did that its skill does not ask for, and what its
skill asks that the run skipped.

This closes your outward tools: it is the last step of the run.

*Done when* three conversations have their two lines, or the report says which could not be read.

## 5. The evaluation

One report, in this order:

- **Went well:** the measures inside their bounds, one line each.
- **Went wrong:** each measure outside its bound, with its number and yesterday's.
- **To change:** one concrete change per fault (a trigger's condition, a clock, a rule of a skill, a
  grant), and the issue filed or updated for it (`SKILL.md` § Filing). For an eval list under its
  bound the change is « a person reads its failed conversations », and the issue carries the list's
  numbers per day.

| Measure | Bound |
|---|---|
| failed runs of a stage | under 5% of its runs |
| runs under 2 minutes started by a trigger | under 25% of that trigger's runs |
| runs of one stage at once | 3 at most |
| `two_runs`, `pr_tracked_twice`, `duplicate_pull_request` signals | none |
| verdicts on round 6 short of go | none that a fixer could have moved |
| a go verdict to Done | under 2 hours for 9 in 10 |
| Ready issues without `priority` | none |
| an eval list's `passed` over `judged`, on 10 judged or more | at least 80% |
| eval lists paused, and conversations skipped for `budget` or `no_payer` | none |
| decisions expired | none |

*Done when* every measure outside its bound has a change and an issue.
