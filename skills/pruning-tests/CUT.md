# Cutting one candidate

One candidate, one change. The candidate is a test, a group of tests sharing a
promise, or a file. The steps run in order; each ends on its criterion.

## 1. Confirm it is still a candidate

Find the candidate at the current head of the default branch — tests move and
get renamed. Search the project's open issues and the repository's open pull
requests for its name and its file.

*Done when:* the candidate exists at head and no repair is in flight. If it is
gone, or someone is repairing it, the run ends there — a complete outcome, not
a failure: `executing-issues` pauses the issue on its « Close it » decision,
naming the change that removed the candidate or the repair in flight.

## 2. State its promises

Read the candidate and write each promise it holds as one sentence (see
`SKILL.md`). Map every assertion to one promise; an assertion that maps to none
is a **mirror** line and needs no promise.

*Done when:* every assertion in the candidate is mapped to a promise or marked
as a mirror.

## 3. Probe each promise

Run the neighbourhood once untouched: it must be green, or the run ends on
that finding. Then, for each promise, apply the breaks `SKILL.md` describes
(extreme first, then targeted), run the candidate plus its neighbourhood — the same file, the other tests of the module
under test, and the layer above or below that could hold a twin — and record
the red set. Restore the source before the next probe.

When a promise lives behind infrastructure you cannot start here (a database,
a browser, a deployed service), say so for that promise and treat it as a lone
witness: an unprobed promise is kept, or folded, never traded.

*Done when:* every promise has a recorded red set (timeouts noted apart) or an
explicit *not probed*, the kill set is written down, and the source tree holds
no change.

## 4. Rule on each promise

| Red set | Promise worth keeping? | Ruling |
|---|---|---|
| holds another test | — | **shared** — delete; the ledger names the survivor |
| only the candidate | yes | **fold** |
| only the candidate | no (borrowed, tombstone) | **trade** — delete, ledger says *traded* and why |
| empty | — | **witnesses nothing** — delete |
| not probed | — | **fold**, or keep the candidate |

**Folding.** Move the assertion into the cheapest surviving test that already
reaches the code — the same promise at a lighter layer, a sibling with the
right fixture. Then prove it: re-apply the probe's source edit and see the
survivor go red, restore the source and see it green. Often the survivor comes
out better than either test was — one fixture instead of two, a sharper
assertion, a frozen clock instead of a lucky one.

When every promise is folded and the candidate still holds something the
survivors lack, keep the candidate and say why; the run then ends on that
finding.

*Done when:* every promise has a ruling, and every fold has its red-then-green
on the probe's edit.

## 5. Cut

Delete the ruled tests. Then follow what they leave behind: helpers, fixtures,
constants, factories and setup whose only caller was a deleted test; a file
left empty; configuration that named them — a quarantine list, a per-test
timeout, a retry allowance, a shard assignment. Search for every symbol before
deleting it.

*Done when:* the deleted tests, their orphans and their configuration are gone,
a search for each removed symbol finds no caller, and the repository's
unused-code checker, if it has one, reports nothing new.

## 6. Measure

Run the affected files before and after on the same machine, the same command.
Report the change in wall time, and in the fixed phases when a whole file or a
heavy environment went. Run the affected suites in full and the type checker
over the packages touched.

Re-run every break of step 3 against the cut suite. The kill set must hold
every break it held before; a break that went green is a lost witness, and the
cut goes back to step 4 for that promise.

*Done when:* the kill set is intact, the suites pass, the types check, and the
saving is a number from this machine — or the run says plainly that the saving could not be measured
here and why.

## 7. Write the ledger

In the change's description, one row per deleted test:

| Deleted | Cost | Promise | Witness now |
|---|---|---|---|
| `suite › name` | 42 s, 5 flakes in 30 days | a refresh from another client is refused | `other.test › rotates…` (folded) |

Close with the probes — each break and its red set before and after — so a
reviewer can re-run any of them, and the command that restores the deleted
tests (`git revert <sha> -- <paths>` once merged). A defect later escaping in a
traded promise's area is the signal to run it. If
the repository keeps a journal for test deletions, add the ledger there too.

*Done when:* every deleted test has a row, and every row's *Witness now* is a
named test or *traded* with its reason.
