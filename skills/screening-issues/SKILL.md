---
name: screening-issues
description: Use when the Triage routine runs, on a new issue, a woke row with resumeAt screening, its daily pass or the Monday backlog sweep. Classifies the issue's type, re-resolves what it asserts against the repository's target branch, closes what no longer holds, and sets Ready, sends a feature to assessment, or pauses on a typed wait.
---

# Screening issues

An issue is a photograph. A pull request it calls open, a `file:line` it quotes, a gap it says
nobody closed: all true when written, all claims now. A stale issue costs a Build run, and it
costs it before anyone can tell: the claim reads as well as the day it was filed.

Screening resolves those claims **by command, not by reading**. Reading is a perceptual task done
under the pull of a plausible claim; a lookup is not. Every screening ends in one verdict:
**close**, **hold**, **assess** or **ready**, and only `ready` work can be launched.

Read `working-on-issues` first, with `read-recipe.md` and `evidence-kinds.md`: statuses, who
moves them, pausing, the `screening` row. Ask people with `asking-for-decisions`. You own
`backlog` → `ready`, `backlog` → `done` (refuted, overtaken, duplicate) and pauses; nothing else.

## Scripts

In `scripts/` of this skill (in your sandbox: `/workspace/skills/screening-issues/scripts/`, `working-on-issues`). They never call the workspace (the sandbox holds no workspace key):
they read an export of issues you write with your own record tools, and git in a repository
checkout. Never hand-assemble what a script prints.

| Script | Prints | Exit |
|---|---|---|
| `issue-freshness.mjs <issue-id> --input <file> --checkout <dir> --branch <targetBranch>` | every `issues:<id>`, `#N`, `owner/repo#N` and path the issue cites, resolved on the branch: `STALE`, `MISSING`, `UNDATED`, `SHORT` or `ok` | 0 all hold; 1 a claim no longer holds; 2 usage or input error |
| `issue-duplicates.mjs --input <file> --project <id> [--issue <id>]` | candidate duplicate pairs: open issues each pair once, or one issue against every other, closed ones included | 0 printed; 1 usage or input error; 2 the export lacks `projects` |
| `saga-scan.mjs --checkout <dir> --branch <targetBranch>` | files corrected by three or more fixes (sagas), names three or more fixes had to add across modules (bindings) | 0 printed; 1 git failed |
| `issue-families.mjs --input <file> --project <id> [--issue <id>]` | families of open issues that may ship under one plan; used by `assessing-features` | 0 printed; 1 usage or input error; 2 the export lacks `projects` |

A usage or input error is not a finding: fix the call or the export and run it again.

**The export** (`--input`): one JSON file per run, in your scratch directory, holding every issue
filed on the project record or any record under it, every status, with the `projects` records of
that tree, so a root covers its repositories. A scripted `--project` run on a bare array of issues
exits 2: the export must carry `projects`.

```json
{
  "projects": [{ "id": "<id>", "parent": "record:<id>" }],
  "data": [
  {
    "id": "<record id>",
    "createdAt": "<iso>",
    "closedAt": "<iso, done issues the screened issue cites>",
    "values": {
      "title": "…", "status": "…", "closeReason": "…", "type": "…", "githubNumber": 123,
      "project": "<id>", "parent": "record:<id>", "blockedBy": ["<id>"],
      "blocks": ["<id>"], "intent": "…", "problem": "…", "acceptance": "…", "context": "…",
      "plan": "…", "handoff": "…"
    }
  }
  ]
}
```

1. Query the `issues` object for the issues filed on the project record or any record under it, with your record tools, all statuses, every page.
2. Write each record as above; the sections as text (markdown), relations as ids.
3. For each `done` issue the screened issue cites (`issues:<id>`, or `#N` matching an imported
   issue's `githubNumber`), read its activity and set `closedAt` to the time of its move to
   `done`. A cited `done` issue without it prints `UNDATED`: date it, then run again.

**The checkout:** the repositories of the project (the `projects` records with a `fullName` at or under the issue's `project`), each checked out in your environment. Per
repository: read its facts (`working-on-issues` § Repository facts), which leaves the checkout on
`targetBranch`, then `git -C <dir> rev-parse origin/<targetBranch>` for the sha your
`screening` row names. Read the repository's own agent rules (`AGENTS.md`, `CLAUDE.md`,
`.cursor/rules`) there, never a copy.

## Which issues

| Run | Issues |
|---|---|
| an issue created | that issue, unless it is already `done` (the « Factory operations log », created closed by any routine, is never screened) |
| a `woke` row with `resumeAt: screening` | that issue; any other `resumeAt`: stop |
| an `assessment` row with `resumeAt: screening` (`verdict: approved`) | that issue: the maintainer approved the feature |
| the daily pass | every `backlog` issue that needs screening (below), oldest first; then every `backlog` feature whose latest `screening` row is `assess` with no newer `assessment` row: run `assessing-features` on it |
| the daily pass on a Monday | the same, then § Weekly sweep |

**Needs screening:** status `backlog`, not an umbrella, and one of: no `screening` row yet; a
`woke` row or a person-written status move newer than its latest `screening` row; an `assessment`
row `verdict: approved` newer than its latest `screening` row `verdict: assess`. Otherwise a
feature whose latest verdict is `assess` belongs to assessment: do not screen it again.

An empty list is a correct outcome: report it and stop. Never widen the search.

**One at a time, with a lease.** Before screening an issue, read it with the read recipe. A
`leaseHolder` whose `leaseExpiresAt` is in the future: another run holds it, take the next. Else
claim the lease (`working-on-issues` § Claiming, « Screening holds it too »). Release it on every exit.

## The fence

| The issue | Do |
|---|---|
| `mine` | stop: write nothing |
| `paused`, `ready`, `in_progress`, `in_review`, `done` | not yours outside § Weekly sweep: stop |
| has tasks (an umbrella: some issue has it as `parent`) | a container, never work: screen its tasks, not it; never close it |
| `origin: shaping` and no task yet | an umbrella `shaping-features` is still writing: stop, write nothing |
| `origin: release`, no `parent` and no task yet | a release umbrella `releasing-downstream` is still writing: stop, write nothing |
| `type: feature`, its `parent` has `origin: shaping`, and no `assessment` row `verdict: approved` on it yet | a task `shaping-features` is still writing: stop, write nothing; the daily pass takes it once the row exists |

Screening closes on repository evidence alone. These stay open whatever the scripts print, because
their evidence lives outside the repository: an issue with a `ruling`; an issue a person edited
after it was filed (activity); an issue whose only defect is age. For them, write the `screening`
row with what you found and pause on a `decision` wait (« close it, or keep it open »), Close it
recommended when the evidence says so.

## 1. Classify the type

When `type` is empty, set it from the issue's text alone: title, sections, origin. Do not read code
to classify; a plausible cause invented here is carried by every stage after it.

| `type` | Test |
|---|---|
| `bug` | intended, existing behaviour is broken |
| `enhancement` | an existing capability is improved |
| `feature` | a new capability, workflow or product surface |
| `chore` | maintenance with no behaviour change (a dependency, a rename, a cleanup) |

Classify the requested outcome, not the suggested implementation. When the text holds several
outcomes, or too little to pick one without inventing behaviour, do not guess: pause on a
`decision` wait asking the issue's author (a person), else the project's first active maintainer,
the one question that settles it.

## 2. Resolve what the issue asserts

Run `issue-freshness.mjs` against each repository the issue's work lives in.

*Done when* every `STALE`, `MISSING` and `SHORT` line is read against the issue's own text and you
can say which sentence of the issue it breaks. A stale reference is not fatal by itself: an issue
may cite a merged pull request as its evidence. The question is always *what did the issue build on
this*.

## 3. Duplicates

Run `issue-duplicates.mjs --project <id> --issue <id>`. Read both issues of every pair; rule
**same** (one change closes both) or **distinct**. Never rule on titles alone.

For a same pair, keep the **richer** issue: further along (in progress before ready before
backlog), then the one with rulings or evidence, then the one people edited, then the older. A
fenced issue is always the kept one. Append to the kept issue's `context` what only the other
carried, with `issues:<id>`. Close the other only if it is the one you are screening, or a
`backlog` issue outside the fence (it gets its own `screening` row). A pair that is the same as a
`done` issue: § 6, closed `duplicate` or `overtaken`.

## 4. Families

Run `saga-scan.mjs` on the repository. If the file the fix lives in tops the saga list, or the fix
would add a call the binding list names, the issue is a symptom: the next compensation, not the
fix. Hold it (§ 6) and name the family: the change that ends it is the boundary, or the one
canonical name every caller must use.

## 5. Size

Estimate the size the change will land at, from the files the issue cites, a scout's *Cost* line,
and these triggers: concurrency, shared state, external input, a public contract, a migration, a
permission or tenancy rule, more than one repository.

| Estimate | Means |
|---|---|
| one reviewable pull request, no trigger | fits |
| several pull requests, or any trigger above with a design still open | beyond one change: hold on a spec |

A task of an umbrella (it has a `parent`) skips this step: its size and decisions were settled
with the maintainer on the umbrella. Put the estimate and the line that drove it in the
`screening` row's body.

## 6. Verdict

Write the `screening` row first, except for `assess` (`subject: github:owner/repo@<sha>` of the repository the work
lives in, every other repository read listed with its sha in `body`; `data.verdict`; `resumeAt`
only for `assess`), then act:

| Verdict | When | Then |
|---|---|---|
| `close`, `closeReason: overtaken` | the gap is closed on the target branch, by a change merged after the issue was filed (a merged pull request naming the issue counts) | status `done`. The body names that pull request or commit |
| `close`, `closeReason: refuted` | the claim is false against the code as it stands, or the proposed fix is wrong or unsafe and what remains is a different issue | status `done`. File the residual as a new issue when it is real |
| `close`, `closeReason: duplicate` | § 3 kept the other issue | status `done`. The body names the kept issue, `issues:<id>` |
| `hold` | a symptom (§ 4) | pause: `decision` wait to the project's first active maintainer, fix the family first (recommended) or patch this one |
| `hold` | beyond one change (§ 5) | pause: `task` wait to the project's first active maintainer for a spec (`shaping-features`), `resumeAt: screening`. Propose the split into one-change issues in the Task |
| `hold` | the right fix changes a public contract, a security posture or an agent's authority | pause: `decision` wait, the one question that forks the work |
| `hold` | it needs something not yet done: another issue, a pull request, a date, a person's artifact | pause on that `blocker`, `date` or `task` wait |
| `assess` | `type: feature`, no `assessment` row `approved` since its last `assess` verdict | status stays `backlog`; the row carries `resumeAt: assessment`, which marks where the same Triage run continues into `assessing-features` (no trigger fires), so it is written last (below) |
| `ready` | every claim resolves, no family owns it, it fits one change, and for a feature an `assessment` row with `verdict: approved` | status `ready`; for a task of an umbrella (it has a `parent`), leave the status `backlog`: the person's drag to `ready` is its launch |

Every pause follows `working-on-issues` § Pausing: check the target first, make it exist, the
`wait` row, then `paused`. A hold is never a free-text "revisit later": it names its wait.

Closing a stale, overtaken or symptomatic issue here costs minutes instead of a Build run:
**closing is the point.** The body of a `close` row states the command that produced the finding
and quotes the line of the issue that no longer holds, so the next reader re-runs it rather than
re-litigates it.

Then rewrite `handoff` (verdict, the evidence, what the next stage needs), release the lease,
re-read the issue and check the state you meant to leave. **The one exception to that order:** an
`assess` verdict's row carries `resumeAt: assessment` and marks where this run continues into
assessment (it triggers nothing), so write it **last**, after `handoff` and the lease release (`working-on-issues`
§ Finish).

## Weekly sweep

On Monday's daily pass, after the issues that need screening, judge the whole open backlog of each
project against itself and today's branch. Every finding comes from a script; read only to rule on
what a script printed. The fence applies unchanged.

1. **Duplicates:** `issue-duplicates.mjs --project <id>`. Rule every pair as in § 3. Close the
   poorer one only when it is `backlog` and outside the fence; when it is `ready`, pause it on a
   `decision` wait (Close it as a duplicate of the kept issue, recommended). Never touch an issue in
   `in_progress`, `in_review` or `mine`: name the pair in your report.
2. **Overtaken:** `issue-freshness.mjs` on every `backlog` and `ready` issue. Each exit 1 is ruled
   as in § 6. A `backlog` issue closes there; a `ready` one is paused on a `decision` wait (Close it,
   recommended, naming the change that overtook it). A stale reference cited only as prior evidence
   leaves it as it is.
3. **Size:** every `ready` issue without a `parent` goes through § 5 again. Beyond one change:
   pause it on the spec `task` wait.

Write a `screening` row for every issue the sweep closes or pauses, with the script line that drove
it.

## Report

One line per issue: verdict, the evidence (the script line, the pull request, the kept issue), the
wait opened. For the sweep, one table (issue, verdict, evidence) and a line naming every fenced
issue you asked about instead of closing.

## Red flags

- closing on a claim you read rather than a line a script printed;
- `overtaken` without naming the change that overtook it;
- reading code to set `type`;
- `ready` on an issue whose target file tops the saga list;
- `ready` on a feature no ruling approved after its assessment;
- a hold with no `wait` row, or a wait on a target already resolved;
- closing an issue with a ruling, one a person edited, or one whose only defect is age;
- moving an issue out of `ready`, `in_progress` or `in_review` other than by a pause;
- ending a run with your lease set or `handoff` stale;
- growing this skill with a rule a script could compute instead.
