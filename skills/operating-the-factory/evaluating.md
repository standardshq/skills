# Evaluating the routines

Once a day Ops measures the last 24 hours and says what went well, what went wrong and what to
change. Numbers come from commands and queries; reading is kept for the three conversations of § 3.

## 1. Measure the runs

Save each stage's runs of the window to a file, `{ "<routine>": [<run rows>] }`, then run
`node <skills folder>/operating-the-factory/scripts/measure-runs.mjs <file>`. It prints, per
routine and per source (trigger, schedule, launch): runs, runs under 2 minutes, failed runs with
their errors grouped, the most runs at once, and hours of work.

*Done when* the table covers all four stages.

## 2. Measure the ledger

With `query` and `aggregate` on `timeline`, rows of the window:

| Count | Group by | Reads as |
|---|---|---|
| `kind: verdict` | `round`, `outcome` | how many rounds a go takes; a round 4 to 6 that ends go earns the six-round cap |
| `kind: signal` | `rule`, `stage` | which rule broke, and where |
| `kind: attempt` | `outcome`, and `Cause:` read from the body | failures of the change against failures of the machine |
| `kind: checkpoint` | `stage` | how often each stage stops for a person |

And on `issues`: the count by `status`; Ready issues without `priority`; Paused issues by `need`
and age; the time from a go verdict to Done for issues closed in the window.

*Done when* each row of the table has its numbers.

## 3. Read three conversations

Pick, across the stages: the longest dead run, the longest completed run, and one run under 2
minutes started by a trigger. Read each (`read` of its `session:<id>`) against the skill of its
stage, and answer in two lines each: what the run did that its skill does not ask for, and what its
skill asks that the run skipped.

This closes your outward tools: it is the last step of the run.

*Done when* three conversations have their two lines, or the report says which could not be read.

## 4. The evaluation

One report, in this order:

- **Went well:** the measures inside their bounds, one line each.
- **Went wrong:** each measure outside its bound, with its number and yesterday's.
- **To change:** one concrete change per fault (a trigger's condition, a clock, a rule of a skill, a
  grant), and the issue filed or updated for it (`SKILL.md` § Filing).

| Measure | Bound |
|---|---|
| failed runs of a stage | under 5% of its runs |
| runs under 2 minutes started by a trigger | under 25% of that trigger's runs |
| runs of one stage at once | 3 at most |
| `two_runs`, `pr_tracked_twice`, `duplicate_pull_request` signals | none |
| verdicts on round 6 short of go | none that a fixer could have moved |
| a go verdict to Done | under 2 hours for 9 in 10 |
| Ready issues without `priority` | none |

*Done when* every measure outside its bound has a change and an issue.
