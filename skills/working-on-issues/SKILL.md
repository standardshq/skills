---
name: working-on-issues
description: Contract of every factory run. Use when a routine takes the issue or pull request its wake names, checks its neighbours, stops for a person, writes a timeline row, labels a pull request, or reads a repository's rules.
---

# Working on issues

Stage skills own their method; this contract owns state, and wins when they disagree on it.

Read, in order, before acting:

1. `workflow.md`: the pipe of every stage, its exits, and who moves each status. Statuses and their
   movers live there only; follow it as edited.
2. `environments.md`: which tools and paths you have here.
3. `read-recipe.md`: how to read the issue you took.

`timeline-kinds.md` holds every timeline kind and the shape of its body.

## One wake, one piece of work

A run's **wake** is what started it: the event of a trigger, the context of a launch, or the clock.
The wake names the work, and the run that was woken on a piece of work owns it. No field is written
on an issue to hold it.

1. **A wake that names an issue or a pull request:** work that one, to one exit of your stage, and
   end. Leave every other issue of the pipe to its own wake.
2. **A clock wake** names nothing: the run is the **net** under the events. Read your routine's
   runs (`environments.md` § Runs). While another one is pending or running, end the run: that
   neighbour, or Ops, has the pipe. Alone, list your stage's pipe (`workflow.md`), ordered by
   `priority` (`p1_urgent` to `p4_low`, empty last), then `createdAt`, oldest first, and take the
   head.
3. An empty pipe ends the run with nothing written.

Screening's passes that ask nothing may take up to five issues; the first that needs a person ends
the run after its checkpoint. Land lands the pull request of its wake to the end in the same run.

## Neighbours

A **neighbour** is another live run of the factory. Two neighbours on one piece of work is the
fault this section removes.

- **Before the first outward write** on an issue (a branch pushed, a pull request opened, a
  Decision sent), re-read the issue and its repository: an open pull request that cites the issue,
  a newer `checkpoint` row, or a status your stage does not own means a neighbour got there first.
  Write nothing more on it and end; say so in your report.
- **A pull request says where it stands** through its `factory:` labels (§ Pull requests): a run
  reads them before taking a PR and sets them as it works.
- **Ops sees every run.** It launches the owner on work no live run is on, and relaunches a run
  that died (`operating-the-factory`). A stage run never launches another routine.
- **Two hours of work** ends a Build or Screening run as a failure (`timeout`); Land hands over
  instead (`landing-pull-requests` § Waiting for checks), which is not a failure.
- **Two neighbours found on one piece of work** is a `signal`, `Rule: two_runs`, written by the one
  that noticed, which then ends.

## Stopping for a person

A run stops for a person only through a Decision, sent as `deciding-issues` says. Any instruction to ask someone, including "ask the user" in a borrowed skill (`implement`, `tdd`,
`diagnosing-bugs`, `pr`), means that Decision.

Once it is sent:

1. Write the `checkpoint` row.
2. Set `waitingOn` (the recipient) and, except for Merge it, which leaves the issue In review,
   `status: paused` with `need` (`decision` for a ruling, `design` for a mockup), in one update.
3. End your turn. The Decision carries its own expiry; nothing on the issue holds it.

The answer resumes this run; `deciding-issues` says what each answer does. Whoever moves the issue
out of Paused clears `need` and `waitingOn`, except the move to Mine on I take it, which keeps
`waitingOn` (the person who took it); after Merge it, the resumed run clears `waitingOn`.

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
carries its issue's `project`, so the project page lists its rulings, and the attributes
`timeline-kinds.md` names for its kind (`stage`, `outcome`, `round`, `rule`), so Ops counts rows
without reading their bodies.

The issue is the living document: rewrite `body` one section at a time, the others written back word
for word, `## Request` and `## Acceptance` left as they were. `context` is added
to, never rewritten: its permalinks stop a message being handled twice.

## Refusals

A run that cannot act on the issue of its wake (no facts, a missing tool, an unlaunched move) writes a
`signal` with its `Rule:` and ends. It writes that signal on an
issue once: a run meeting the same refusal while that signal is the issue's newest row, with no
person's gesture since, stops for a person with a `decision` checkpoint instead.

## Only screening queues

Ready is reached by Screening's route or by a person. A routine writes a move `workflow.md` gives to
a person only as that file allows, and Build takes an In progress issue only when its launch holds
(`workflow.md` § Launch). The issue's activity says whether a person or an agent
made each move.

## Three tries

An `attempt` row whose `Cause:` is `change` (a red gate, a refused change) increments
`failedAttempts`. One whose `Cause:` is `environment` (a missing tool, a timeout, a push refused, a
run that died) leaves it as it was: the machine failed, the issue did not. At 3, stop for a person
with a `decision` checkpoint summarising the three: retry with a stated change, I take it, or Close
it. Reset `failedAttempts` to 0 when a person's gesture (a status move or an answered Decision) is
newer than the latest `attempt` row.

A run that cannot push attaches its patch to the issue before it ends, so the next run starts from
it.

## Provenance

- Only a person's explicit answer, message or gesture is human evidence; a recommendation, a default
  or an expired Decision never is. Write defaults apart, one per line.
- Evidence quotes no secret, no environment value and nothing `sensitiveData` names: a row is read by
  whoever can read its issue.
- A judge is never the author: write no `verdict` on work you held.
- Human evidence never overrides a safety gate.

## Pull requests

- Link each PR in `pullRequests`, one `owner/repo#N` per line, before the move to In review.
- A PR description carries the line
  `Standards issue: [<issue title>](https://app.standards.new/fr/~/issues/<issue id>)`, and
  `Closes #<githubNumber>` for an imported issue.
- A PR Build opens also carries the line `<!-- factory:build -->` in its body: the one mark of a
  PR the factory wrote, since Build pushes as the person the run acts for. Only the run that opened
  the PR writes it.

**Labels** say where a PR stands, to people, to Ops and to every neighbour. A run sets them with
`gh pr edit -R <owner/repo> <N> --add-label … --remove-label …`, creating a missing one with
`gh label create`:

| Label | Means | Set by | Removed by |
|---|---|---|---|
| `factory:tracked` | one issue's `pullRequests` holds this PR | Land, right after linking | nobody |
| `factory:landing` | a Land run is on this PR now | Land, taking the PR | Land, at every exit of its run |
| `factory:changes` | the latest verdict asks for changes | Land, on a `changes` verdict | Land, on the next verdict |
| `factory:go` | the latest verdict on the current head is go | Land, on a go verdict | Land, when the head moves |
| `factory:waiting` | the next move is a person's (Merge it, a checkpoint) | Land, once the Decision is sent | Land, applying the answer |

A label is the state a glance reads; the ledger stays the timeline.

## Repository facts

A repository is a `projects` record with a `fullName`; `context` and `maintainers` are read walking
up to the root. A run that acts on a repository reads its rules through `discover-repository.mjs`
alone, each run, from the target branch, never from a PR's head.

1. Clone the default branch, blobless (`gh repo clone <fullName> -- --filter=blob:none`: the whole
   history, file contents fetched on demand), and gather, with the GitHub tools, into one folder:
   `repo.json`, `branches.json`, `rules.json` (the rulesets of the branch), `protection.json` (its
   classic protection, absent when none) and `pulls.json` (recent merged PRs).
2. Run `node <skills folder>/working-on-issues/scripts/discover-repository.mjs --checkout <clone>
   --github <folder>`, adding `--listed <file>` (`[{ "fullName", "packages": [...] }]`) only when you
   need `consumes`.
3. **Exit 3** prints `{"targetBranch":"<branch>"}`: clone that branch, fetch `rules.json` and
   `protection.json` for it, run again. A second exit 3 is a person's to settle: stop with a
   `decision` checkpoint naming the branches found.
4. **Exit 2**, a clone you cannot make, or no sandbox: you have no facts. Touch and merge nothing in
   that repository: a refusal (§ Refusals), `Rule: environment_broken`.

Install the package manager the repository declares before running its commands.

| Fact | Holds |
|---|---|
| `targetBranch`, `productionBranch` | where PRs go; what deploys |
| `mode` | `queue` (a merge queue rule: enqueue), `human` (a person merges through Merge it), `direct` (`merge: direct` in `## Factory`: Land merges) |
| `method` | the queue's method, else the first of squash, merge, rebase both the settings and the rulesets allow |
| `verify`, `gate` | the commands that prove a change (a `## Verification` section wins), and `ci`, `verify` or `none` |
| `withheld` | globs a person must approve: workflows, judging files, migrations, `CODEOWNERS` paths, ruleset reviewer patterns |
| `reviewers` | one `<glob>\t<reviewer>,…` line per pattern: `user:<login>`, `team:<slug>`, or `any:<n>` approvals; name ruleset reviewers by saving `gh api orgs/<org>/teams` as `teams.json` and `gh api repos/<o>/<r>/collaborators` as `users.json` in the folder |
| `links` | `true` when `## Factory` says `links: on`: runs may publish the running app |
| `generated`, `sensitiveData` | never hand-edited; never quoted |
| `boot`, `apps`, `reset`, `consumes`, `deployWorkflows` | how to run it, seed it, and what it depends on |

Lists are one entry per line; empty means nothing found, never unlimited.
