---
name: pruning-tests
description: Use when the Maintenance routine sweeps a repository's test suite, when a maintainer asks to audit a suite, or when an issue with origin scout:tests is executed. Scouts the tests whose time, flakiness or upkeep outweighs what they alone catch, audits every test of a suite for what it witnesses, or cuts one candidate, folding its lone assertion into a surviving test first.
---

# Pruning tests

A test is paid for on every run and repaid only on the day it goes red on a
defect nothing else would have caught. Pruning removes the tests whose cost is
measured and whose protection is shared, borrowed, or absent.

Every deletion is a **trade**: time and noise bought back, coverage given up.
The trade is written down. And a deletion often improves another test — when
the candidate is the lone **witness** of something worth keeping, that
assertion moves into a cheaper surviving test before the candidate goes. That
move is the **fold**, and it is as much the output of this skill as the
deletion.

## Three branches

- **Scouting** — find candidates, measure them, and file the best few as
  issues with `filing-findings`. Follow [`SCOUT.md`](SCOUT.md). The Maintenance
  routine runs this branch on each repository the issues filed on the record or any record
  under it are served by (the `projects` records with a `fullName`), in a checkout of its `targetBranch` (`working-on-issues` § Repository facts).
- **Auditing** — give every test of a suite a verdict, and report the whole
  map: what each test witnesses, what is wasted, what nothing witnesses.
  Follow [`AUDIT.md`](AUDIT.md).
- **Cutting** — take one candidate (an issue with `origin: scout:tests`, a
  name, a file) to a merge-ready change: probe, fold, delete, measure, ledger.
  Follow [`CUT.md`](CUT.md). The Build routine runs it inside
  `executing-issues`, which owns the lease, the pull request and the handoff.

A run that was handed a candidate cuts. A run that was handed a suite scouts,
and audits when it was asked about every test. All three use the vocabulary
below.

## Vocabulary

**Promise** — one behaviour of the code under test, stated as a sentence about
the product or the module: *"a refresh from another client is refused with
`invalid_grant`"*. Never a sentence about the test's mechanics. A test holds
one or more promises; every assertion in it maps to one.

**Witness** — a test witnesses a promise when it goes red as that promise
breaks. A promise with several witnesses is *shared*; with one, that test is
its *lone witness*. Witness is established by the probe, never by reading.

**Probe** — the proof of witness. Break the promise in the **source**, run the
candidate and its neighbourhood, record the *red set* — every test that failed
— and restore the source. Line coverage says a line ran; only a probe says a
test would notice. Suites reduced by coverage lose up to a fifth of the defects
they caught; reduced by red sets, none.

- Start **extreme**: make the function under the promise return a default —
  empty, `null`, zero, the input unchanged. One edit per function, and it maps
  which tests care at all. Then write two or three targeted breaks aimed at the
  promise itself: invert a condition, drop a call, skip a guard.
- Leave **arid** code alone — logging, metrics, buffer sizes, cache capacities,
  messages. A promise that only an arid break reveals is a change-detector, and
  the test pinning it is a mirror.
- Confirm every break **applied**: the diff shows it, and the run executed the
  edited build. A break lost to a cached build, a wrong file or a compile error
  is **invalid** and is re-applied — an invalid break reads exactly like an
  empty red set.
- A break nobody catches may be **equivalent** — code that still behaves the
  same. Show the behaviour actually changed (a call's output, a returned value)
  before reading the empty red set. When a model judges equivalence, seed it
  first with one break known to change behaviour and one known not to; a judge
  that misrules either is replaced by the demonstration.
- A break no test even executes is **uncovered** — no test reaches that code.
- A **timeout** is its own outcome, recorded as one — never as a red.
- Probe only from a green baseline: run the neighbourhood once untouched first.

When the red set holds another test, the promise is shared. When it holds only
the candidate, the candidate is its lone witness. When it holds nothing on a
real break, the candidate witnesses nothing and its cost is pure loss.

**Cost** — measured, in the unit the suite pays:

- *time* — the test's own duration, and the file's fixed cost (environment,
  imports, setup), which often outweighs every test body in it. Deleting one
  test from a file saves only that test's body; deleting the last test, or the
  last test that needs a heavy environment (a DOM, a database, a browser),
  saves the fixed cost too. Read the phase breakdown your runner reports before
  pricing a candidate.
- *noise* — a flake rate: both outcomes on the same commit, counted on the
  default branch and the merge queue only (a pull request under development
  fails for its own reasons). Every wasted rerun and every red nobody believed
  counts. Judge the rate against its layer — end-to-end suites run noisier than
  unit suites.
- *upkeep* — commits that edited the test without changing the promise it
  pins: a snapshot refreshed, a mock re-wired after a refactor, a bound widened.

A file whose time is mostly environment, imports and setup is an environment
problem, and it goes to whoever owns the test setup — unless the whole file, or
its heavy environment, can go.

A test that has **never failed** is a prior, never a proof: most tests never
fail, and a quiet test can still be the lone witness of the promise that breaks
next year. The probe decides.

**Value** — the promises the candidate alone witnesses, weighted by what a
regression of each would cost. Permissions, tenant isolation, money and data
loss weigh most.

**Kill set** — the union of the red sets across every probe of a cut. After the
cut it holds every break it held before, or the cut is vetoed.

**Ledger** — one row per deleted test: its cost, its promises, the witness each
promise has now — a named surviving test, or *traded* — and the command that
restores it.

## Shapes of low return

Each shape is a place to look, never a verdict: the probe decides.

- **Twin** — a sibling asserts the same promise, often at a cheaper layer: an
  end-to-end spec replaying what an integration test already pins, two unit
  tests over the same branch with different fixtures.
- **Mirror** — asserts the implementation back to itself: a mock called with
  the arguments it was configured to receive, a snapshot of whatever the code
  produced, a constant equal to its own definition. Its probe red set is often
  empty.
- **Echo** — the expected value comes from the code under test: computed by
  the same function or helper, or pasted from a run of it. A break moves the
  expected and the observed together, and the test stays green. Common where
  one agent wrote both the code and the test. When its promise is worth
  keeping, the fold writes the expected value as a literal worked out from the
  specification.
- **Borrowed promise** — pins the framework, the library or the type checker:
  that a component renders its prop, that a schema library rejects a wrong
  type, a type-level fact the compiler already enforces.
- **Weather vane** — a ratio or a bound between measured timings on shared
  machines. It goes red on load, not on defects, and each repair widens the
  bound until it asserts nothing.
- **Costly smoke** — "renders without crashing" paying a DOM, a database or a
  browser for a promise a lighter test could hold.
- **Tombstone** — pins code whose feature is gone or whose only caller is the
  test.

Two look like candidates and are not:

- **Lucky** — green by coincidence (a clock second, an ordering, a sleep) while
  its promise is real. A flaky lone witness is repaired, not pruned: the defect
  is in the assertion, and the promise deserves its witness. A flaky test whose
  promises are all shared is cut.
- **Drift guard** — a deliberate duplicate: two implementations of one contract
  checked against each other, a constant restated so a change to it is noticed.
  The duplication is the promise.

## Guardrails

- A repair in flight outranks a deletion. Before cutting, and again before the
  change lands, search the project's open issues and the repository's open pull
  requests for the test's name and file; a candidate someone is already
  repairing is left to that repair.
- A test named after a bug or an issue is a regression pin: its promise once
  broke for real. It leaves only when the probe shows another witness, or
  after a fold.
- A lone witness of a permission, isolation, money or data-loss promise is
  folded, never traded.
- The probe edits source, and the source is restored before anything else
  happens. The only lasting changes are to tests, their helpers and their
  configuration. A test file under a `generated` path of the repository is
  never edited by hand; one under a `withheld` path waits for a person's
  approval like any other change there.

The evidence behind these rules, with its sources, is in
[`SOURCES.md`](SOURCES.md) — for a human questioning a rule, not for a run.
