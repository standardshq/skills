---
name: screening-issues
description: Use when the Screening routine takes the next issue of its pipe, on a ruling, a person's release, a new issue or a refresh, and on its Monday sweep. Re-resolves what the issue asserts against the target branch, closes what no longer holds, and routes the rest to Ready with an agent brief, to a launch, to preview or to a Decision.
---

# Screening issues

An issue is a photograph. A pull request it calls open, a `file:line` it quotes, a gap it says
nobody closed: all true when written, all claims now. A stale issue costs a Build run, and it
costs it before anyone can tell: the claim reads as well as the day it was filed.

Screening resolves those claims **by command, not by reading**. Reading is a perceptual task done
under the pull of a plausible claim; a lookup is not. Every screening ends in one verdict:
**close**, **checkpoint**, **preview**, **park** or **ready**, and only `ready` work can be launched.

Read `working-on-issues` first: `workflow.md` gives Screening's pipe and exits, `timeline-kinds.md`
the `screening` and `ruling` rows. An issue with an empty `type` goes through `triaging-issues`
before anything here; a feature routed to preview goes on to `previewing-features` in the same run.

## Scripts

In `scripts/` of this skill's folder (`environments.md` says where it is on your machine). They
never call the workspace (the sandbox holds no workspace key): they read an export of issues you
write with your own record tools, and git in a repository checkout. Never hand-assemble what a
script prints.

| Script | Prints | Exit |
|---|---|---|
| `issue-freshness.mjs <issue-id> --input <file> --checkout <dir> --branch <targetBranch>` | every `issues:<id>`, `#N`, `owner/repo#N` and path the issue cites, resolved on the branch: `STALE`, `MISSING`, `UNDATED`, `SHORT` or `ok` | 0 all hold; 1 a claim no longer holds; 2 usage or input error, or the export lacks `projects` |
| `issue-duplicates.mjs --input <file> --project <id> [--issue <id>]` | candidate duplicate pairs: open issues each pair once, or one issue against every other, closed ones included | 0 printed; 1 usage or input error; 2 the export lacks `projects` |
| `saga-scan.mjs --checkout <dir> --branch <targetBranch>` | files corrected by three or more fixes (sagas), names three or more fixes had to add across modules (bindings) | 0 printed; 1 git failed |
| `issue-families.mjs --input <file> --project <id> [--issue <id>]` | families of open issues that may ship under one plan | 0 printed; 1 usage or input error; 2 the export lacks `projects` |

A usage or input error is not a finding: fix the call or the export and run it again.

**The export** (`--input`): one JSON file per run, in your scratch directory, holding every issue
filed on the project record or any record under it, every status, with the `projects` records of
that tree, so a root covers its repositories.

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
      "blocks": ["<id>"], "body": "…", "context": "…"
    }
  }
  ]
}
```

1. Query the `issues` object for the issues filed on the project record or any record under it, with your record tools, all statuses, every page.
2. Write each record as above; `body` and `context` as text (markdown), relations as ids.
3. For each `done` issue the screened issue cites (`issues:<id>`, or `#N` matching an imported
   issue's `githubNumber`), read its activity and set `closedAt` to the time of its move to
   `done`. A cited `done` issue without it prints `UNDATED`: date it, then run again.

**The checkout:** per repository the issue's work lives in, read its facts (`working-on-issues`
§ Repository facts), which leaves the checkout on `targetBranch`, then `git -C <dir> rev-parse
origin/<targetBranch>` for the sha your `screening` row names. An issue on a repository record
lives in that repository. An issue on a root project lives in the repositories its `context` paths
name; without paths, `gh search code "<the wording or name the issue cites>" --repo <fullName>` on
each repository under the root names them, and with no hit you clone them all. Code found in
another project's repository goes in your `screening` row; the issue keeps its `project`.

## Which issue

Screening's pipe, in this order; inside each tier by `priority` then age, the claim first
(`working-on-issues` § One issue per run):

1. **Rulings and releases:** a `backlog` issue with a `ruling` row newer than its latest
   `screening` row; a `ready` issue whose latest move to `ready` was a person's and is newer than
   its latest `screening` row.
2. **Never screened:** a `backlog` issue with no `screening` row.
3. **Refresh:** a `backlog` issue whose latest `screening` row is older than 7 days; a
   parked feature only once its `Expires:` date has passed.

Up to 5 issues per run while each one asks nothing; the first that sends a Decision ends the run.

The first run after Monday 06:00 UTC (the one starting before 06:15) runs § Weekly sweep before
its pipe.

## The fence

| The issue | Do |
|---|---|
| `mine`, `done`, `paused`, `in_progress`, `in_review` | not in the pipe; a ruling on a `mine` or `done` issue is history: leave it |
| an umbrella (some issue has it as `parent`) | a container, never work: screen its tasks, never route or close it |

Screening closes on repository evidence alone. These stay open whatever the scripts print, because
their evidence lives outside the repository: an issue with a `ruling`; one a person edited after
it was filed (activity); one whose only defect is age. For them, stop for a person
(`need: decision`, « close it, or keep it open »), Close it recommended when the evidence says so.

## Release and rulings

**A person's move to Ready** is the ruling "proceed as last scoped":

1. Write a `ruling` row, no `subject`: `Decision-maker:` who moved it, `Recorded by:` Screening,
   `Source:` the move and its time from the activity, `Resume at: screening`, and the scope taken as approved (the latest
   brief, `preview` row or ruling that named one).
2. Clear `need` and `waitingOn`; its open Decision stays (`deciding-issues`, A person's gesture).
3. Screen it in this run (§ 1 to § 5), naming the ruling in `Ruling consumed:`. The release is the
   approval of that scope, a feature never previewed included: it skips preview. A released issue
   leaves screening only three ways: it stays `ready` (with its brief, § 6), it launches
   (§ Launch), or, when the evidence contradicts it (delivered, refuted, overtaken, a duplicate,
   a symptom, `full`), a `decision` checkpoint sent as a new Decision (`deciding-issues` § Ask 4)
   takes it to Paused, Close it among the options. Screening never closes a released issue itself.

**A `ruling` row** routes by its `Resume at:`: `screening` and `preview` run here; `build` is
screened, then reached through Ready or a launch (§ Launch); `land` is not screening's
(`deciding-issues` returns those issues to In review). Any other target is a refusal
(`working-on-issues` § Refusals), `Rule: unroutable_ruling`. A ruling marked `Superseded by:` is
history.

## 1. Resolve what the issue asserts

Run `issue-freshness.mjs` against each repository the issue's work lives in.

*Done when* every `STALE`, `MISSING` and `SHORT` line is read against the issue's own text and you
can say which sentence of the issue it breaks. A stale reference is not fatal by itself: an issue
may cite a merged pull request as its evidence. The question is always *what did the issue build on
this*.

## 2. Duplicates

Run `issue-duplicates.mjs --project <id> --issue <id>`. Read both issues of every pair; rule
**same** (one change closes both) or **distinct**. Never rule on titles alone.

For a same pair, keep the **richer** issue: further along (in progress before ready before
backlog), then the one with rulings or evidence, then the one people edited, then the older. A
fenced issue is always the kept one. Append to the kept issue's `context` what only the other
carried, with `issues:<id>`. Close the other only when it is the one you are screening, with the kept
issue in its `links` (`kind: duplicates`); the kept one gets the inverse on its own.

## 3. Families

Run `saga-scan.mjs` on the repository. If the file the fix lives in tops the saga list, or the fix
would add a call the binding list names, the issue is a symptom: the next compensation, not the
fix. Name the family: the change that ends it is the boundary, or the one canonical name every
caller must use.

## 4. Size

Estimate the size the change will land at, from the files the issue cites, a scout's *Cost* line,
and the triggers: concurrency, shared state, external input, a public contract, a migration, a
permission or tenancy rule, more than one repository.

| Size | Bound |
|---|---|
| `small` | about 50 changed lines, no withheld path, no trigger |
| `standard` | one reviewable pull request, no trigger |
| `full` | several pull requests, or any trigger with a design still open: beyond the factory |

A task of an umbrella (it has a `parent`) skips this step: its size was settled on the umbrella.
Put the size and the line that drove it in the `screening` row.

## 5. Verdict

Write the `screening` row first (`subject: github:owner/repo@<sha>` of the repository the work
lives in, every other repository read listed with its sha in `body`), then act:

| Verdict | When | Then |
|---|---|---|
| `close`, `closeReason: overtaken` | the gap is closed on the target branch, by a change merged after the issue was filed (a merged pull request naming the issue counts) | `done`. The body names that pull request or commit |
| `close`, `closeReason: refuted` | the claim is false against the code as it stands, or the proposed fix is wrong or unsafe and what remains is a different issue | `done`. File the residual as a new issue when it is real, in `links` with `kind: follows-up` |
| `close`, `closeReason: duplicate` | § 2 kept the other issue | `done`. The body names the kept issue, `issues:<id>` |
| `checkpoint` | a symptom (§ 3) | `decision`: fix the family first (recommended), or patch this one |
| `checkpoint` | `full` (§ 4) | `decision`, I take it first, the split into one-change issues proposed |
| `checkpoint` | the right fix changes a public contract, a security posture or an agent's authority; or the route needs a fact or an artifact only a person has | `decision`: the one question that forks the work |
| `preview` | `type: feature`, not released by a person, with no ruling answering its latest `preview` row | `previewing-features`, in this run |
| `park` | a ruling parked the feature its latest `preview` row named | stays `backlog` until its `Expires:` |
| `ready` | every claim resolves, no family owns it, it is not `full`, and a feature has a ruling approving its preview, or a person's release | § 6, then § Launch, else `ready` |

A checkpoint stops for a person (`working-on-issues` § Stopping for a person) with the question
`deciding-issues` phrases, `Resume at: screening`.

**Closing is the point:** a stale, overtaken or symptomatic issue closed here costs minutes
instead of a Build run. The body of a `close` row states the command that produced the finding and
quotes the line of the issue that no longer holds, so the next reader re-runs it rather than
re-litigates it.

A parked feature past its `Expires:` closes `wont_do`, its park ruling the authority, unless
evidence in the workspace shows the `Revisit when:` trigger fired: then preview it again.

## 6. The agent brief

Build works from the brief; the request and discussion are context. Write it into `body`, one
section at a time, each other section written back word for word:

| Section | Holds |
|---|---|
| `## Problem` | current behaviour and desired behaviour, edge and error cases included; "Reported cause (hypothesis)" when triage kept one; for a task, what its umbrella settled |
| `## Acceptance` | criteria a test or a command proves, each one on its own: `toBe`-exact, never "works correctly" |
| `## Seams` | the public seams the change is driven and tested through: types, function signatures, commands, routes, config shapes. `tdd` reads its seams here |
| `## Out of scope` | the adjacent changes Build leaves alone |

Write it to stay true while the code moves: interfaces and behaviour, never paths or line numbers;
what the system does, never how to edit it. A ruling outranks the sections it contradicts.

## Launch

Screening moves a `ready`-routed issue to `in_progress` in exactly two cases. Every other issue
waits in Ready for a person.

| Case | Who granted it | Condition Screening checks |
|---|---|---|
| Small and safe | the project's `autoLaunch` switch, last set by a maintainer of the project (read from the record's history), off by default | the issue was created by a maintainer, or moved to Ready by one; `type` bug or enhancement; smallest size tier; no withheld path; no migration; no new chrome, layout or interaction; no open blocker |
| Approved and launched | a maintainer's answer "Approve and launch" to a Decision | the `ruling` row names `decisions:<id>`, that Decision was answered by a maintainer of the project with that option, and the scope is unchanged since |

A maintainer is a person in the project's `maintainers`, walking up to the root. Check each
person, never assume one:

- **created or released by a maintainer:** the issue's `createdBy`, or the actor of its latest
  move to `ready`;
- **the grant:** the last writer of `autoLaunch` in the project record's history;
- **the answer:** the person who answered the Decision the `ruling` names, with exactly that
  option; scope unchanged means no newer `ruling`, `preview` row or person's edit of `body`.

The smallest tier is `small` (§ 4); withheld paths are the repository's `withheld` globs. A
feature never launches on `autoLaunch`; a ruling from a sitting never launches code.

To launch: the § 5 `screening` row, the run's only one for the issue, carries `Launch:` the case
and its grant (`autoLaunch` set by whom and when, or `decisions:<id>` answered by whom); then
`status: in_progress`.

## Weekly sweep

Judge the whole open backlog of each project against itself and today's branch. Every finding
comes from a script; read only to rule on what a script printed. The fence applies unchanged, and
the sweep sends no Decision.

1. **Duplicates:** `issue-duplicates.mjs --project <id>`. Rule every pair as in § 2. Close the
   poorer one when it is `backlog` and outside the fence, with its `screening` row; otherwise
   append the pair to both issues' `context`, so their next screening rules on it.
2. **Families:** `issue-families.mjs --project <id>`. For an unshaped family of two or more open
   members, append the family to each member's `context`: one plan may ship them.

## Report

One line per issue: verdict, the evidence (the script line, the pull request, the kept issue), the
Decision sent or the launch case. For the sweep, one table (issue, finding, evidence).

## Red flags

- closing on a claim you read rather than a line a script printed;
- `overtaken` without naming the change that overtook it;
- `ready` on an issue whose target file tops the saga list;
- a launch with a grant, a creator or an answer you did not check against `maintainers`;
- a brief naming paths or line numbers, or acceptance no test can prove;
- growing this skill with a rule a script could compute instead.
