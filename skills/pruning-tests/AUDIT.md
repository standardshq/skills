# Auditing a suite

An audit gives **every** test of the suite a verdict and hands over the whole
map. It changes no test; the cuts it motivates run later through `CUT.md`.

Probing every test one by one does not scale, so an audit probes the
**source** instead: one extreme break per function maps, in a single pass,
which tests care about which code. Every test's verdict is read from that
matrix.

## 1. Read the room and measure

Run steps 1 and 2 of `SCOUT.md` — what was already decided, how the
repository runs its tests, and the ranked cost table.

*Done when:* the scouting criteria of both steps hold.

## 2. Inventory

List every test id from the runner itself (its list or collect command), not
from a grep. Group them by file and by the module each file imports.

*Done when:* the inventory's count equals the count the runner reports, and
every test sits under a module — or under *no module*, which is a finding.

## 3. Build the kill matrix

Reuse a mutation tool's per-test results when the project already produces
them. Otherwise, for every function the suite reaches, apply the extreme break
(`SKILL.md`, *Probe*), run the tests of its module and the layers above and
below, record the red set, and restore the source. Skip arid code. Large
suites go module by module; run the slow layers (end-to-end, browser) on the
functions their cost table flags.

Each cell is one of the probe outcomes: red, empty, timeout, invalid,
equivalent, uncovered. Re-apply every invalid break before reading the
matrix.

*Done when:* every function reached by the suite has a recorded outcome, no
invalid cell remains, and the source tree holds no change. A module left
unprobed is named with the reason.

## 4. Give every test a verdict

Read each test's column of the matrix, then match it against the shapes in
`SKILL.md`:

| Verdict | Meaning |
|---|---|
| **witnesses nothing** | red on no break — an echo, a mirror, a tombstone |
| **all shared** | every break it catches, another test catches too |
| **lone witness** | the only red on at least one break — name the promise |
| **not probed** | its code was outside the matrix, with the reason |

A lone witness that is also costly or flaky is a fold candidate; a test that
witnesses nothing or shares everything is a cut candidate, ranked by cost.
Regression pins and drift guards keep their verdict and are flagged as such.

*Done when:* every test of the inventory has exactly one verdict.

## 5. Report

Write the report as a file in your scratch directory and hand it to whoever
asked (attach it to the conversation, or to the issue the audit serves):

1. **Totals** — tests per verdict, and the share of the suite's time each
   verdict costs.
2. **Cut candidates** — one row per test or group: id, shape, cost with its
   source, and the survivor that shares its breaks.
3. **Fold candidates** — the costly or flaky lone witnesses, with the promise
   each one alone holds.
4. **Unwitnessed code** — functions whose break turned no test red, or that no
   test executes, weighted by the promise they carry. Permissions, isolation,
   money and data loss come first. This is the suite's other weakness: the
   audit names it; giving it witnesses is a separate issue, filed with
   `filing-findings`.
5. **Coverage note** — what the matrix covered, out of what, and what was left
   unprobed and why.

Then hand the best candidates over as `SCOUT.md` step 5 does, within the same
limit of three; the report holds the rest.

*Done when:* the report's totals sum to the inventory's count, and every cut
and fold candidate names its evidence.
