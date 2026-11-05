---
name: landing-pull-requests
description: Use when the Review routine runs, on an issue moved to In review, a woke row with resumeAt landing, or its sweep every 30 minutes, which reads each pull request's checks, reviews and head itself. Takes each open pull request of an In review issue to merged through its timeline rows - the gate the repository's discovered facts give, red heads handed to a fixer, green heads judged at a tier fixed on the first read, three rounds then the maintainer, a screen demonstrated on video, withheld paths approved by a person, the merge done as the repository's mode says.
---

# Landing pull requests

Four actors, never the same subagent: the **landing run** reads, routes, and merges; a **fixer**
writes code on the branch; a **juror** judges a head; a **demonstrator** performs what a batch of
go heads promises on the running stack, on video. The one who wrote the fix never decides it is
good.

Read `working-on-issues` first, with `read-recipe.md` and `timeline-kinds.md`: § Verification, §
Pausing and § Pull requests hold every rule of state below, and win when this skill disagrees.
Judge with `evaluating-changes` (`SOLO.md`). Ask people with `asking-for-decisions`.

**What landing moves:** pull requests, and nothing else. You never take an issue's lease, never
move an issue's status except to pause it (§ 7), never close an issue: `done` comes from the merged
pull request through the Maintenance routine. Beside its ledger rows, you write only the signals
and Décisions of § 2 and § 7, on the operations log when no issue fits.

## Which pull requests

| Run | Pull requests |
|---|---|
| an issue moved to `in_review` | its open linked pull requests |
| a `woke` row with `resumeAt: landing` | that issue's open linked pull requests; any other `resumeAt`: stop |
| the sweep (every 30 minutes) | every open linked pull request of every `in_review` issue, through § Dispatch |

No GitHub event reaches you: a completed check, a review, a comment or a new head is read by the
next sweep, with the GitHub tools, from the pull request itself.

**Its issue:** the issue whose `pullRequests` lists `owner/repo#N`, else the one the body names
with `Issue: <id>` (or `Closes #<githubNumber>` for an imported issue). Read it with the read
recipe, then leave the pull request alone, with one line in your report, when any of these holds:

- no issue: the pull request is not the factory's;
- no `projects` record carries the repository's `fullName`;
- the issue is not `in_review` (`paused`, `mine`, `done`, or `in_progress` while an executor still
  holds it);

**A pending close** (read recipe step 7) is the one exception to « leave it »: the person said
« Close it » while the pull request was open. Your only action is to close each open linked pull
request with the GitHub tools, with a comment linking the ruling (`decisions:<id>`, quoted in one
line); no `verdict`, no `go`, no merge, no row. The Maintenance routine then closes the issue.

A run on one issue (moved to `in_review`, or woken) handles its pull requests with the fixer and
juror as subagents of this run, and the demo round only when a screen asks for one. The sweep hands every
pull request to one dispatch (§ Dispatch) and enqueues every go together.

## The ledger

Every decision is a `timeline` row on the issue, `subject: github:owner/repo#N@<sha>` naming the
exact head, fields as `timeline-kinds.md` gives them. The rows are landing's whole memory: read
them before anything else, and a judgement exists once its row does. Never a comment stamp on the
pull request.

| `kind` | `data` | Means |
|---|---|---|
| `tier` | `{"tier": "sight" \| "standard" \| "full"}` | fixed on the first read of the pull request, kept through every round |
| `fixing` | `{}` | a fixer owns the branch; any other run leaves it for the fixing window (`operating-the-factory` § Thresholds) after `createdAt` |
| `verdict` | `{"outcome": "go" \| "changes"}` | a juror's round `n` on that head, findings in `body` |
| `go` | `{}` | judged clean on that head; merge once the gate is green on it |
| `check-run` | `{"passed": …, "commands": […]}` | the factory gate ran on that head (§ 2) |
| `demo` | `{"outcome": "pass" \| "fail" \| "skipped", "reason": "…"}` | the gesture performed on that head, the video linked in `body` |

**The round** of a pull request: the number of its juror `verdict` rows (`go` or `changes`) and
its `demo` rows with `outcome: fail`. A Sight `verdict` (written by you, « sight »), a failed
`check-run`, a red check or a refused generated path is not a round. The count never resets: a person's ruling asking a change buys one more round
(§ 7): **the round limit** is three, plus one per ruling asking a change. **The judged head:** the `subject` sha of the latest of those rows.

What GitHub already says is read live, never copied into a row: checks, mergeability, whether the
pull request is enqueued or merged, the GitHub timeline of enqueue events.

**Whose rows count.** Before writing `verdict`, `go` or `check-run`, read the issue's
`leaseHolder`, the `holder` of its latest `attempt` and the latest `leaseHolder` in its activity:
if any is you, write nothing and a `signal` (`rule: self_verification`). A `verdict`, `go` or
`check-run` written by any of them is void: ignore it and write a `signal` with the same rule.

Before quoting a sha, check it exists (`git cat-file -e <sha>`): a fixer once reported a sha that
did not exist, and its prefix survived the glance.

## 1. Read and route

For each pull request, with the GitHub tools: pin the head sha; read the draft flag, mergeability,
whether it is enqueued, and every check on the head. Read the repository's facts
(`working-on-issues` § Repository facts): `targetBranch`, `mode`, `method`, `gate`, `verify`,
`withheld`, `generated`, `sensitiveData`, `boot`, `apps`, `reset`. They come from the
target branch: a pull request that edits `CODEOWNERS`, a workflow or `## Factory` is judged on the
target branch's values, never its own. Then route on the rows first, the head second:

- **enqueued** (auto-merge set or in the merge queue): nothing to do. A go head dropped from the
  queue is the Maintenance routine's (`operating-the-factory`): leave it.
- **`fixing`** inside the fixing window: another run owns it; skip.
- **a person asked for a change:** a person's review (changes requested, or a comment asking for a
  change) or a `ruling` asking one (« Change », « Fix »), newer than the latest `go` or `verdict` on
  this head or, with none on this head, the pull request's latest `verdict`. It beats a `go`: the
  fixer goes first with the person's words, quoted, as its brief, then a juror judges them as in
  rounds 2 and 3 (§ 4). At its round limit, § 7 « Three rounds » wins instead: the maintainer's
  Décision cites the review.
- **`go` on this head**, gate green or `none` (§ 2): § 7. A screen with no `demo` on this head goes to the
  demo round first (§ 5), for a `ci` or `both` repository only once its checks are green.
- **`go` on an older head:** § 4 « A go survives ».
- **`demo` failed on this head:** a verdict entry: round `n+1`, the `demo` row as the previous
  verdict.
- **unverified:** a `verify` or `both` repository with no `check-run` row on this head: the
  factory gate runs first (§ 2), then the head routes again.
- **loud:** a check or the factory gate has no conclusion yet. A pull request with no verdict yet
  waits for the next sweep. One in round 2 or 3 is judged loud: its answers and its delta need no
  gate.
- **target red:** a failed `check-run` on this head whose failing commands (named in its `body`)
  all fail on `targetBranch` too, or a required check failing on the head that fails on the target's
  latest commit as well (§ 3). The head waits, with no fixer. Write the one `signal` and Décision
  (§ 2). Once the target's sha moves past the one in the `body`, the head is red (§ 2). A command
  failing only on the head is red, below.
- **red:** the gate failed (§ 2), or the branch conflicts. Triage (§ 3).
- **generated paths,** on every head whatever the `gate` (§ 2 « Paths »): the verifier checks
  them with the factory gate for `verify` and `both`; for `ci` the juror checks them first, and a
  hit is a `blocking` entry of its verdict.
- **`gate: none`** (§ 2): fix the tier (§ 4) and judge it as a green head would be, at Standard
  at least. On `go`: § 7.
- **green, no go:** fix the tier (§ 4), then judge. A Sight head is never dispatched while no fixer
  touched it and it touches no `withheld` or `generated` path and no `package.json` `scripts` entry: you write its rows yourself (§ 4). A Sight head with a `fixing` row on its pull
  request (a fixer committed on it) is dispatched like any head, judged by a juror at the Standard
  counts: you never approve a fixer's commit yourself.

Mark a draft pull request ready (GitHub tools) only just before its merge.

## 2. The gate

`gate` in the repository's facts says what proves a head green before a merge:

| `gate` | Green when |
|---|---|
| `ci` | every check the repository's ruleset or branch protection requires is green on the head, read live |
| `verify` | a `check-run` row on that head with `passed: true` |
| `both` | both |
| `none` | never |

**`gate: "none"`:** nothing proves the change, so no head is ever green there, nothing merges on
its own and nothing is enqueued. A head is judged by a juror, never at the Sight tier, and on `go`,
whatever `mode` says, a person is asked the way `mode: human` asks (§ 7), saying plainly that no
required check and no `verify` command proves the change, so the juror's judgement is all there is.

**The factory gate** (`verify` or `both`), run on every head that has no `check-run` row:

1. Publish the commit status `Standards Factory / verify` on the sha, state `pending` (GitHub tools,
   the commit statuses API).
2. In the routine's own environment, if it has one, a fresh clone of the pull request head (fetch the pull
   request's head ref, check out the pinned sha); never the fixer's checkout.
3. Run every line of `verify`.
4. Write the `check-run` row: `passed`, `commands` as run, `body` with each command, its exit code
   and the failing output (trimmed; nothing `sensitiveData` names).
5. Publish the status `success` or `failure`, its description one line (« 4 commands passed »,
   « pnpm test failed »).

A command that cannot start (a tool missing from the environment, the environment failing to
build) proves nothing about the change: no `check-run`, status `error`, a `signal`
(`rule: environment_broken`) for the Maintenance routine.

A command that fails on the target branch too proves nothing against the pull request either:
when a head fails one, the verifier runs it on a fresh clone of `targetBranch` too. It fails there
as well: the `check-run` stays failed, its `body` names the commands and the target's sha, the
outcome is `target-red`, and no fixer is sent. Only the landing run writes what follows, once per
rule and sha: one `signal` (`rule: target_red`, `subject: github:owner/repo@<sha>` of the target) and
one Décision to the project's first active maintainer, on the « Target branch red: owner/repo »
issue when one is open (`operating-the-factory` § 7), else on the project's « Factory operations
log » (created on first need, as `operating-the-factory` says); a `signal` with that rule and
subject already there means it was done. The Décision offers the two things a person does in the
repository: **Repair the target**, or **Remove the command with `skipVerify` in `AGENTS.md`**.
Either moves the target's sha, which is what sends the waiting heads through a fixer and the
gate again, so answering changes nothing by itself: it opens no wait and no ruling is routed. The
verifier always runs every line of `verify`, and a command is never skipped for a head: only
`## Factory` on the target branch removes one. A command failing only on the head goes to the
fixer as usual.

**A head whose latest `check-run` carries a target sha that has since moved** is red, its failure
« the target moved past <sha>: merge `targetBranch` in and re-run `verify` ». The fixer's merge
commit keeps a `go` (§ 4 « A go survives »), and the gate runs again on the new head.

**Paths,** on every head whatever the `gate`, from the diff against the merge-base:

- **`generated`:** a file matching a `generated` glob is refused at verification, unless the
  repository's own generator for it (named in its own files or scripts), run on a fresh clone,
  leaves it unchanged: then it is regenerated output, not an edit. Refused, for `verify` and
  `both`: a failed `check-run` (the paths and « generated path edited » in `body`) and the status
  `failure`, run by the verifier; for `ci`: a `blocking` entry of the juror's `verdict`. Neither is
  a round of its own beyond that verdict. The fixer's brief: regenerate with the repository's
  command or revert the file.
- **`withheld`:** allowed, never merged without a person's approval (§ 7).
- **`scripts`:** a `verify` line runs the head's own script (`pnpm run test` runs its
  `scripts.test`), so a pull request could redefine what proves it. Before running `verify`, the
  verifier diffs the `scripts` block of every `package.json` between the merge-base and the head. A
  changed script that a `verify` line runs is a failed `check-run` (the script and « verify command
  redefined » in `body`) and the status `failure`, like an edited `generated` path, and never
  `target-red`. The fixer's brief: revert the script, or return the head unchanged when the issue
  asks for that change, which puts it to a person (§ 7 « Three rounds »). On `ci` no verifier runs:
  a juror reads the change, since such a diff is never Sight (§ 4).

Without branch protection nothing stops a merge but this skill: a merge happens only through § 7,
on a `go` and a green gate on the same head.

## 3. Red: triage, then one fixer per head

Read the failed step before blaming the diff. **Machinery** (an artifact refused, an action
download refused, a port already bound on the runner, a step in a shared preamble the diff cannot
reach, a flake the repository already tracks as an issue) is rerun once with the GitHub tools
(failed jobs only, and only when the run's attempt number is 1), then left. Anything the diff can
reach is a finding for a fixer.

A required CI check that fails on the head gets the same test first: read the same check on the
latest commit of `targetBranch` (live, GitHub tools). It fails there too: the head is target red
(§ 1), not the fixer's. A check absent from the target's commit (CI that runs only on pull
requests) is not failing on the target: the head goes to the fixer as before.

A fixer gets a checkout of the branch, the pinned head, the failed step's log or the factory gate's
`check-run` body, and the conflict if any. Its brief:

- write the `fixing` row on the pinned head before touching a line;
- reproduce the failure before touching a line;
- a brief saying the target moved: merge `targetBranch` in, in a merge commit, with nothing to
  reproduce; a command that also fails on the target is not yours to fix, so push the merge and the
  gate says so;
- a behaviour fix is **red-proven**: the covering test seen failing on the unchanged branch,
  passing with the commit; a conflict is resolved by reading both sides, never by taking one, in a
  **merge commit**;
- never edit a `generated` path by hand; never quote what `sensitiveData` names;
- run `verify` before pushing;
- push, and return the new head sha and one line per change.

A fix keeps every assertion and every test as strict as it found them and pushes through the
hooks; a fixer that widened, skipped or bypassed a hook gets the branch back with the finding
restated. The push moves the head: the next run re-reads it from § 1.

Run the fixer on the build model class when your orchestration tools let you choose; the juror
stays on yours.

## 4. Green: judge once per round

### Tier: fixed on the first read

No `tier` row on the pull request yet: read its additions, deletions and files, pick one tier,
write the row. The pull request keeps that tier through every round, whatever tests the fixers add.

| Tier | Bound | Round 1 |
|---|---|---|
| **Sight** | (release-note files, lockfiles, locale files, test-only diffs; or ≤ 50 changed lines), and no `withheld` or `generated` path and no `package.json` `scripts` entry, ever: a diff touching one is Standard at least; never Sight on a `gate: none` repository | no juror, no dispatch: once the gate is green, you write `verdict` (`go`, « sight ») and `go` yourself. A later head of a Sight pull request is judged by a juror at the Standard counts when it touches a `withheld` or `generated` path or a `scripts` entry, or when the pull request carries a `fixing` row (a fixer committed on it): a fixer's work is never self-approved by landing |
| **Standard** | ≤ 500 changed lines, ≤ 12 files, none of the Full triggers | one juror, counts `coherence`, `omission`, `proof` |
| **Full** | > 500 lines or > 12 files; or the diff touches concurrency, shared state, or external input | one juror, all nine counts |

A trigger is something the diff **does**, read from its files: a line count that would fit
Standard fits Standard.

### Round 1

One independent juror per head, run as `evaluating-changes` `SOLO.md` with the tier's counts on
the pinned sha. Its dossier adds the issue's `## Acceptance` and rulings, and every review a person
left on the pull request. It writes the `verdict` row with its entries (`blocking`, `to fix`,
`noted`, and the counts that found nothing).

No `blocking`, no `to fix`: outcome `go`, and the juror writes the `go` row on the same head right
after. Otherwise outcome `changes`: the verdict is the fixer's brief, in the same chain; the fixer
answers every entry or refutes it in writing, and round 2 follows on its push.

**A person's review** (changes requested, or a comment asking for a change) or a ruling asking a
change: the fixer answers it first, like a juror's entry, and the next juror judges it as in rounds
2 and 3. A review bot's comment is material for the juror, not an entry.

### Rounds 2 and 3: the answers and the delta, nothing else

A round-2 or round-3 juror is convened on **two things only**: the previous verdict's entries,
each with the fixer's answer, and `git diff <judged sha>..<head>`. Its brief replaces the counts:

> For each entry of the previous verdict, return **closed** (the answer holds: quote the test or
> the excerpt that proves it) or **open** (say what is still missing). Then read the delta alone
> and return any `blocking` it introduces. Return nothing else: a `to fix` or `noted` on the delta
> is out of scope, and the rest of the pull request has been judged.

Every entry **closed** and no `blocking` on the delta: `go`. An **open** entry or a `blocking`: the
fixer again, in the same chain. Rounds follow each other without waiting for the gate; a go merges
once the gate is green on its head, and a red on a go head is § 3 like any other.

The round at the limit (§ The ledger) is the last. Its verdict still short of go: § 7 « Three
rounds ».

### A go survives

A `go` row stands on a **newer** head when every commit since the go sha is a merge commit or an
empty commit:

```bash
git log --first-parent --no-merges --format='%h %s' <go sha>..<head>
```

Nothing listed, or only commits whose `git show --stat --format= <h>` prints nothing: write a `go`
row on the new head whose `body` cites the one it carries. The verdict stands through a merge of
the target branch, a conflict resolved in a merge commit, a fresh head pushed to dodge a flake.
The gate does not: it runs again on the new head.

A real commit listed: one more round (§ Rounds 2 and 3) on `git diff <go sha>..<head>` only, the
previous verdict having no open entry.

## 5. Demo: the last round, five heads on one stack

A head has a **screen** when its diff touches the source of an app the repository lists in `apps`
that a person sees (the repository's own rules or the project's `context` say which paths render
screens). A repository without `apps` or `boot` has no demo round: a go merges on its gate. A
surface the project's `context` marks as model-backed gets `demo` `skipped` (`reason: "model"`)
and merges on its gate.

Go heads with a screen wait in a batch; the demonstrator takes **five**, or whatever is left when
every other chain has finished, one batch at a time on one stack:

1. A throwaway branch from `targetBranch` with the batch merged in, never pushed. A head that
   conflicts with the batch leaves it for the next one, with no row: the merge would have found
   the same.
2. Bring the stack up with `boot` (once per run), restore seeded data with `reset`, rebuild on each
   batch. A repository with `sensitiveData` runs on seeded or anonymised data only.
3. For each head, the **gesture** written from the pull request's title and the issue before the
   diff is read: route, steps, end state a person can check. One browser spec per head, written
   and run as the repository's own end-to-end setup says, video on, the five in parallel, each
   asserting its end state, unique data names per spec.
4. A gesture that fails is replayed **alone**: the head merged with `targetBranch` only. Fails
   again: `demo` `fail`, the video, the spec, expected against observed; the fixer takes it as a
   verdict entry in the same run. Passes alone: an interaction inside the batch; both heads stay
   unmerged and go to § 7 « Three rounds » with the pair named.
5. A gesture that passes: attach the video to the issue record, then the `demo` row (`pass`, the
   gesture in three lines, the video linked), then the **announcement** in the announcement
   channel the project's `context` names, with the native Slack tools: one message, the video
   uploaded as mp4 and playing inline, the text as its comment:

   > **New feature on its way:** <what a person can now do, one sentence, in their words>
   > <where to find it: the screen and the gesture, one line>

   The sentence names the benefit, never the mechanism, and quotes nothing `sensitiveData` names.
   Convert the video first:

   ```bash
   ffmpeg -loglevel error -y -i video.webm -c:v libx264 -pix_fmt yuv420p \
     -movflags +faststart -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" demo.mp4
   ```

   No announcement channel named, or an upload that fails: one line in your report; the row
   stands.

A stack that stays down after one retry ends the demos of the run: every batched head gets `demo`
`skipped` (`reason: "stack"`, the failing step's output) and merges nothing; a second run in a row
with the stack down writes a `signal` (`rule: environment_broken`). A refused port or a container
gone is a rerun, never a `fail`.

## 6. Dispatch: every chain at once

Read `dispatch.js` beside this file. When your orchestration tools run a workflow script, run it
with this `args`; otherwise run the same chains yourself as parallel subagents, one per head,
dispatched in a single message, following the script as the plan.

```json
{ "skill": "landing-pull-requests",
  "solo": "<path of evaluating-changes/SOLO.md in your skills>",
  "stack": "<the demo checkout>",
  "repositories": { "owner/repo": { "targetBranch": "main", "gate": "verify", "verify": "…" } },
  "heads": [ { "issue": "<issue id>", "repo": "owner/repo", "number": 4004, "branch": "fix/…",
               "head": "<sha>", "tier": "full", "round": 1, "limit": 3, "state": "green",
               "screen": true, "ciGreen": true,
               "judged": "<sha the last verdict judged>", "previousVerdict": "<entries + answers>" },
             { "issue": "<id>", "repo": "owner/repo", "number": 4023, "branch": "…",
               "head": "<sha>", "tier": "standard", "round": 0, "state": "red", "screen": false,
               "failure": "<failed step and log excerpt, the conflict, or the target that moved>" },
             { "issue": "<id>", "repo": "owner/repo", "number": 4291, "branch": "…",
               "head": "<sha>", "tier": "standard", "round": 1, "state": "unverified",
               "screen": false } ] }
```

`state` is `red` (also a head whose target moved: § 2), `green`, `unverified` (a factory gate not
yet run on the head), `change` (a person asked for a change: `previousVerdict` holds their words) or `demo` (a go head with a screen
and no `demo` row). `round`, `limit` and `judged` are § The ledger's (`judged` absent when the pull request has no juror verdict yet); `ciGreen` says the required
checks are green on the head now. A pull request at its round limit goes to § 7, never to the
dispatch, and an untouched green Sight head that touches no `withheld` or `generated` path and no `scripts` entry never goes to it. Every row is written by the fixer, juror,
verifier or demonstrator inside its chain, so a chain that dies leaves the ledger true up to its
last row. Then act on each outcome: `go` → § 7, `with-maintainer` (also a fixer that returned the head unchanged: an unresolvable conflict, a red it could not move) → § 7 « Three rounds »,
`fixed` → the next run re-reads the head, `red` → the next run triages the failed `check-run`
(§ 3), `gate-error` → nothing merges; the `environment_broken` signal is the Maintenance routine's,
`target-red` → nothing merges and no fixer; write the signal and Décision of § 2, then wait for the
target's sha to move,
`demo-skipped` → merge when the reason is a model, wait when it is the stack.

## 7. Merge, approve, or ask

A head merges when it has a `go` row, a green gate (§ 2; `none`: ask as below), and, with a screen, a `demo` row `pass`
or `skipped` for a model, all on that head. Then, in order:

**Withheld paths.** The diff touches a `withheld` path, `mode` is not `human` and `gate` is not `none`: the merge needs a
person's approval. An approval stands when a `ruling` approving the merge answers an `approval` wait
on this pull request and every commit since the head it named leaves the withheld paths untouched.
None: ask with `asking-for-decisions` an approval Décision to the project's first active
maintainer, naming each withheld path and the specific risk (never just the path), the verdict
summary and the head; options **Approve the merge** (recommended when the verdict is clean),
**Change** (say what), **Close it**, **I take it**. Open the `approval` wait (`resumeAt: landing`)
and pause the issue (`working-on-issues` § Pausing). On wake, read the ruling: approved, merge;
« Change », § 1 « a person asked for a change ». A « Merge as it stands » ruling (§ Three rounds)
whose Décision named the withheld paths and their risk is also an approval.

**`mode`,** a `gate: none` repository taking the `human` row (§ 2):

| `mode` | Do |
|---|---|
| `queue` | mark ready, enable auto-merge with `method` (the merge queue batches); in the sweep, every go of the run in the same pass |
| `human` | merge nothing. Mark ready, then ask the project's first active maintainer with `asking-for-decisions` one Décision per head, naming any withheld path and its risk: **Merge it** (you merge it on GitHub; recommended), **Change** (say what), **Close it**, **I take it**. Open no wait and leave the issue `in_review`: the merge itself is the answer the Maintenance routine watches. Ask once per head: while a Décision linked to the issue names this head, open, answered or expired, never ask again (no daily re-ask). An expired one left unanswered: write one `signal` (`rule: merge_unanswered`, `subject` the head) and leave the issue `in_review`; a newer head is a new question. The answer's `ruling` is recorded as `asking-for-decisions` § 4 says; a « Change » is read by the next run (§ 1) |

Enqueue a go head only once: when the pull request's GitHub timeline shows it was enqueued since its
`go` row and it is no longer, it was dropped, and re-queuing is the Maintenance routine's.

**Three rounds.** A round-3 verdict short of go, an interaction the demo cannot settle, or a head
the fixer returned unchanged (name the conflict or the red it could not move): ask the
project's first active maintainer with `asking-for-decisions`, the open entries named, options
**Merge as it stands** (in `human` mode, or on a `gate: none` repository: you merge it), **Fix** (say what), **Close it**, **I take
it**; name any withheld path and its risk, so « Merge as it stands » also approves them. Open the
`decision` wait (`resumeAt: landing`) and pause the issue. On wake, read the ruling: « Merge as it
stands » is a `go` row on that head citing the ruling, then this section from the top; « Fix » buys
one round: the fixer first with the person's words as its brief, then one juror on them as in
rounds 2 and 3, and short of go again, ask again.

« Close it » and « I take it » are the Maintenance routine's to apply; after « I take it » you leave the
issue alone, after « Close it » you close its pull requests (§ Which pull requests).

## Report

One line per pull request: its issue, the head, the tier, the round, what the gate said, what you
wrote, and whether it merged, was enqueued, paused or left (and why).

## Red flags

- judging before reading the rows, or a judgement with no row;
- a tier re-decided, a round past the limit, the round count reset, a verdict reopened by a merge
  of the target branch;
- a round-2 juror handed the counts instead of the entries and the delta;
- the fixer and the juror in one subagent;
- writing `verdict`, `go` or `check-run` on an issue you held, or trusting one its holder wrote;
- merging without a `go` and a green gate on the same head, or a `withheld` path merged without an
  approval;
- a factory gate run in the fixer's checkout instead of a fresh clone, or without its commit status;
- a `generated` path edited by hand let through;
- merging in `human` mode, re-asking « Merge it » for a head whose Décision expired, or re-queuing a
  pull request the queue dropped;
- a Sight head a fixer committed on approved by you instead of a juror at the Standard counts;
- a gesture written from the diff, or a failed gesture recorded without its solo replay;
- the demo branch pushed, or two demo stacks at once;
- moving an issue's status other than to pause it, or doing anything on a pending close but
  closing its pull requests;
- a comment on the pull request used as state.
