# Scouting a suite

A scouting pass measures the suite, finds the few candidates whose trade is
clearly worth a review, and hands each one to the cut as an issue
(`filing-findings`, `origin: scout:tests`). It changes no test.

Most passes should hand over little. The saving from pruning is concentrated:
a handful of tests carry most of the cost, and a pass that finds them does its
job in three candidates.

## 1. Read the room

- Count the project's open issues with `origin: scout:tests`. When the
  project's `context` sets a limit for them and the count is at it, report the
  count and stop.
- Read what was already decided: issues with `origin: scout:tests` closed
  `refuted`, `overtaken` or `wont_do`, and any journal of past test deletions
  the repository keeps. A candidate matching a refusal is handed
  over again only when you can name what changed in the code since.
- Read the project's test conventions — the project's `context`, the
  repository's own agent rules (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules`),
  how suites are split, what runs where, what CI requires (the repository's
  `verify`, its `gate` and its required checks).

*Done when:* you know the queue has room, which candidates were already ruled
on, and how this repository runs its tests.

## 2. Measure the cost

Collect, from the cheapest trustworthy source:

- **durations per test and per file** — the CI's own reports (JUnit and JSON
  artifacts) first, since they are the runs the team pays for; a local run with
  the runner's duration reporter otherwise. Keep the runner's phase breakdown
  (environment, imports, setup, tests) when it prints one.
- **flake records** — CI history on the default branch and the merge queue,
  grouped by commit and job, kept where both outcomes occurred; express each as
  a rate over the window. Resolve a failed job to the test that failed from its log.
  A job that aggregates others is not a test.
- **upkeep** — per test file, the commits that touched it without touching the
  code under test: `git log --format=%H -- <test>` against the files it imports.
- **declared cost** — the largest timeouts, retry allowances and quarantine
  entries; each one is someone admitting a cost.
- **kill matrix**, when the project already runs a mutation tool with per-test
  results (which tests killed each mutant): a test whose every kill is shared
  is a candidate before any probe. Reuse its cached results rather than
  re-running it.

Rank tests and files by cost. Read the head of the ranking, not the average.

*Done when:* you hold a ranked cost table whose every figure names its source
(artifact, run, command), and the head of it — the tests and files carrying
most of the cost — is identified.

## 3. Find candidates

Walk the head of the ranking against the shapes in `SKILL.md`. Then sweep the
whole suite once for the shapes that are cheap to grep: assertions that only
check a mock was called, snapshot-only tests, sleeps and wall-clock bounds,
ratios between measured timings, "renders" tests in heavy environments, tests
whose subject has no other caller.

A candidate clears the bar when at least one holds:

- it has a flake record;
- its cost is a visible share of the job it runs in (a percent or more), or
  deleting it lets a whole file or a heavy environment go;
- it witnessed nothing in a probe.

*Done when:* every test in the head of the ranking was matched against the
shapes, the sweep ran, and each candidate is marked as clearing the bar or not.

## 4. Probe the leaders

For the best candidates by cost, run one probe on the main promise (`SKILL.md`,
*Probe*). A probed candidate hands over evidence; an unprobed one hands over a
hypothesis, and says so. Restore the source after each probe.

*Done when:* each candidate you will hand over carries a red set, or states
why it could not be probed here.

## 5. Hand over

At most three candidates per pass, ranked by cost saved against the confidence
of the probe; no minimum. A pass that finds nothing worth a review is complete,
and its coverage note is the deliverable.

One issue per candidate, filed by `filing-findings` (its budget, ranking and
search come first), carrying in `body` (`## Problem`) and `context`:

1. the candidate — test ids, file, and the shape it matched;
2. the cost, each figure with its source;
3. its promises, one sentence each;
4. the probe — the source edit and the red set, or *not probed* and why;
5. the proposed ruling per promise (delete, fold into a named survivor,
   trade) — labelled as a hypothesis the cut will re-check;
6. an instruction to cut it with `pruning-tests`, `CUT.md`.

Before filing, search the issues filed on the record or any record under it, every status, for the same test or
file; new evidence on an existing issue goes into its `context`
(`filing-findings` § Search first). Candidates below the line get one line
each in the report, under *found, not filed*.

*Done when:* each handed-over candidate carries all six parts, and the report
lists what was measured — how many of the suite's tests the cost table covered,
out of how many — what was found, and what was not filed and why.
