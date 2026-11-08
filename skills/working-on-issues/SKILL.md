---
name: working-on-issues
description: Contract of every factory run. Use when a routine takes the next issue of its pipe, claims or releases it, stops for a person, writes a timeline row, or reads a repository's rules.
---

# Working on issues

Stage skills own their method; this contract owns state, and wins when they disagree on it.

Read, in order, before acting:

1. `environments.md`: which tools and paths you have here.
2. `workflow.md`: the pipe of every stage, its exits, and who moves each status. Statuses and their
   movers live there only; follow it as edited.
3. `read-recipe.md`: how to read the issue you took.

`timeline-kinds.md` holds every timeline kind and the shape of its body.

A path a skill names sits under `/workspace/skills/<skill>/` once the skill is loaded (on a harness,
see `environments.md`): load a skill before running its script.

## One issue per run

1. List your stage's pipe (`workflow.md`), ordered by `priority` (`p1_urgent` to `p4_low`, empty
   last), then `createdAt`, oldest first.
2. Take the head. When its claim is live, take the next one. An empty pipe ends the run with nothing
   written.
3. Claim it (below) before reading anything else of it, work it to one exit of your stage, and end.
   Screening's passes that ask nothing may take up to five issues; the first that needs a person
   ends the run after its checkpoint.

## The claim

`leaseHolder` and `leaseExpiresAt` keep two runs off one issue (Land: the issue of the PR it judges).

- **Check:** the claim is free when `leaseExpiresAt` is empty or past, by server timestamps, never
  your own sense of time.
- **Write:** `leaseHolder` = you, `leaseExpiresAt` = now + 30 min, in one update, then re-read. When
  `leaseHolder` is someone else, they won: take the next issue.
- **Renew** to now + 30 min at least every 20 minutes of work. At 2 hours of work, finish as a
  failure (`timeout`).
- **Park:** a run that stops for a person keeps its claim, with `leaseExpiresAt` set to its
  question's expiry (sent + 24 h), and clears it when it resumes.
- **Clear** both fields on every other exit, as the run's last write; then re-read the issue and
  check it shows the state you meant to leave. Report only a move you verified.
- **Expired:** an expired lease frees the issue; no pass cleans claims. The run taking it over writes
  an `attempt` (`lapsed`) on an In progress issue, a `released` row elsewhere.

## Stopping for a person

A run stops for a person only through a Decision, sent as `deciding-issues` says. In a routine run,
any instruction to ask someone, including "ask the user" in a borrowed skill (`implement`, `tdd`,
`diagnosing-bugs`, `pr`), means that Decision.

`deciding-issues` says how it is phrased and sent. Once it is sent:

1. Write the `checkpoint` row (shape below).
2. Set `status: paused`, `need` (`decision` for a ruling, `design` for a mockup) and `waitingOn` (the
   recipient), in one update.
3. Park the claim and end your turn.

The answer resumes this run; `deciding-issues` says what each answer does. Whoever moves an issue
out of Paused clears `need` and `waitingOn` in the same update.

### The checkpoint row

`kind: checkpoint`, `subject: decisions:<id>`, and a body that holds, one labelled line each:

```
Stage: <the blocked stage>
Reason: <why the run cannot go on without a person>
Evidence: <what was found, with paths and links>
Question: <the question as asked>
Options: <each option as offered, recommendation first>
Recommendation: <the option recommended, and why>
Mockups: <file references, or none>
Resume at: <the stage that takes the issue after the answer>
Head: <github:owner/repo#N@sha, or none>
```

## The timeline

`timeline` rows linked by `issue` are its ledger, append only: a correction is a new row. Every row
carries its issue's `project`, so the project page lists its rulings.

The issue is the living document: rewrite `body` one section at a time, the others written back word
for word, `## Request` and, under your claim, `## Acceptance` left as they were. `context` is added
to, never rewritten: its permalinks stop a message being handled twice.

## Only screening queues

Ready is reached by Screening's route or by a person. A routine writes a move `workflow.md` gives to
a person only as that file allows, and Build takes an In progress issue only when its launch holds
(`workflow.md` § Launch). Who made a move is read in the issue's activity, which says whether a
person or an agent wrote each entry.

## Three tries

Every `attempt` row increments `failedAttempts`. At 3, stop for a person with a `decision`
checkpoint: the three attempts summarised; retry with a stated change, I take it, or Close it. Reset
`failedAttempts` to 0 when a person's gesture (a status move or an answered Decision) is newer than
the latest `attempt` row.

## Provenance

- Only a person's explicit answer, message or gesture is human evidence; a recommendation, a default
  or an expired Decision never is. Write defaults apart, one per line.
- Evidence quotes no secret, no environment value and nothing `sensitiveData` names: a row is read by
  whoever can read its issue.
- A judge is never the author: write no `verdict` on work you held.
- Human evidence never overrides a safety gate.

## Pull requests

- Link each PR in `pullRequests`, one `owner/repo#N` per line, before the move to In review.
- A PR body says `Issue: <issue id>`, and `Closes #<githubNumber>` for an imported issue.
- An issue with an open linked PR belongs to that PR: start no second implementation.

## Repository facts

A repository is a `projects` record with a `fullName`; a project's repositories are those at or
under it; `context` and `maintainers` are read walking up to the root. A run that acts on a
repository reads its rules through `discover-repository.mjs` alone, each run, from the target branch,
never from a PR's head.

1. Clone the default branch and gather, with the GitHub tools, into one folder: `repo.json`,
   `branches.json`, `rules.json` (the rulesets of the branch), `protection.json` (its classic
   protection, absent when none) and `pulls.json` (recent merged PRs).
2. Run `node /workspace/skills/working-on-issues/scripts/discover-repository.mjs --checkout <clone>
   --github <folder>`, adding `--listed <file>` (`[{ "fullName", "packages": [...] }]`) only when you
   need `consumes`.
3. **Exit 3** prints `{"targetBranch":"<branch>"}`: clone that branch, fetch `rules.json` and
   `protection.json` for it, run again. A second exit 3 is a person's to settle: stop with a
   `decision` checkpoint naming the branches found.
4. **Exit 2**, a clone you cannot make, or no sandbox: you have no facts. Touch and merge nothing in
   that repository, write a `signal` (`Rule: environment_broken`), clear your claim, end.

Install the package manager the repository declares before running its commands.

| Fact | Holds |
|---|---|
| `targetBranch`, `productionBranch` | where PRs go; what deploys |
| `mode` | `queue` (a merge queue rule: enqueue), `human` (a person merges through Merge it), `direct` (`merge: direct` in `## Factory`: Land merges) |
| `method` | the queue's method, else the first of squash, merge, rebase both the settings and the rulesets allow |
| `verify`, `gate` | the commands that prove a change (a `## Verification` section wins), and `ci`, `verify` or `none` |
| `withheld` | globs a person must approve: workflows, judging files, migrations, `CODEOWNERS` paths, ruleset reviewer patterns |
| `reviewers` | one `<glob>\t<reviewer>,…` line per pattern: `user:<login>`, `team:<slug>`, or `any:<n>` approvals |
| `links` | `true` when `## Factory` says `links: on`: runs may publish the running app |
| `generated`, `sensitiveData` | files never hand-edited; what evidence never quotes |
| `boot`, `apps`, `reset`, `consumes`, `deployWorkflows` | how to run it, seed it, and what it depends on |

Lists are one entry per line; empty means nothing found, never unlimited.
