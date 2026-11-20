---
name: landing-pull-requests
description: Land stage. Use when the Land routine wakes on a pull request event, a launch or its clock, to track that pull request as an In review issue, land it round after round (judge, fixer, merge) for at most six rounds short of go, label it and say each step on it, or close an issue whose every linked PR is merged.
---

# Landing pull requests

Land alone takes a PR from open to merged, every open PR of the factory's repositories, whoever
opened it. **One run lands one PR:** it takes a PR and works it round after round, waiting for
each new head's checks inside the run, until the PR is merged, enqueued, waiting on a person, or
paused after its rounds. In each round a **judge** tries the head, then either the merge goes by
the repository's mode or a **fixer** answers the verdict and pushes. A run that dies mid-way leaves
its `factory:landing` label behind; the next Land run takes the PR over from the ledger (§ Taking
over). The judge and the fixer are
distinct subagents, each from a fresh context; the one who wrote a fix never decides it is good.

The PR is the source of truth and Standards keeps the ledger: everything Land decides is written
on the issue's timeline and said on the PR, so a person reading either sees the same state.

`working-on-issues` owns the state below (§ One wake, one piece of work, § Neighbours, § Stopping
for a person, § Pull requests and its labels, § Provenance, § Repository facts) and wins when this
skill disagrees. Ask people with `deciding-issues`.

## 1. Preflight

Once per run, before anything is written: for each repository of the factory (`projects` records with a
`fullName`), `gh auth status` and `gh repo view <fullName> --json name`, and a checkout you can
fetch. Pass `-R <owner/repo>` to every `gh` command: your working directory is not a checkout.

A failure: one `signal` row for the run, on the issue you would have taken (or none when the pipe
is empty), `Rule: environment_broken`, naming what is missing. Write nothing else, end. The next run tries again.

*Done when* every repository answers, or the run ended on its one signal.

## 2. Track the pull request

A run woken on a pull request tracks that one. The net (a clock wake) tracks every open PR of every
repository.

The project's `trackPullRequests` decides which open PRs are tracked: `all`, every one; `factory`,
a PR whose body carries `<!-- factory:build -->` or that an issue's `pullRequests` already names;
`none`, only the latter. Land leaves every other PR to its author: no issue, no label, no verdict.

For each repository, `gh pr list -R <fullName> --state open --json
number,title,body,author,isDraft,headRefOid,url,createdAt`. Each open PR is tracked by exactly one
issue: an issue whose `pullRequests` holds `owner/repo#N`.

| The PR | Do |
|---|---|
| carries `factory:tracked`, or is already in an issue's `pullRequests` | its issue, as it is. A label with no issue found yet is a neighbour mid-write: read again in a minute before creating anything |
| its description carries the `Standards issue:` link or `Issue: <issue id>`, or `Closes #N` / `Fixes #N` matching an issue's `githubNumber` in the repository's project | add `owner/repo#N` to that issue's `pullRequests`, keeping its lines |
| neither | create the issue (below) |

Then align the issue's status with its open PR, whoever left it behind:

| The issue of an open PR is | Do |
|---|---|
| In review | nothing |
| Backlog, Ready, In progress or Done | `status: in_review`: the open PR is the work, whoever left the issue behind |
| Paused | nothing: it waits on a person (§ 3 reads its answer) |
| Mine | with the project's `reviewMine` on and the PR ready: `status: in_review`, `waitingOn` cleared, judged like any other. A draft, or `reviewMine` off: the person keeps it |

**A created issue:** `title` the PR title, `project` the repository record, `status: in_review`,
`origin: github`, `type` from the title's conventional prefix (`feat` feature, `fix` bug,
`perf` or `refactor` enhancement, anything else chore), `pullRequests` its line, `body` a
`## Request` section quoting the PR description with its author and date, `context` « Opened from
<PR url> by <author> on <date>; no issue tracked it. ». It goes through no screening: the PR is the
work.

**The link and the label on the PR:** a tracked PR's description opens with the `Standards issue:`
line of `working-on-issues` § Pull requests. Add it when missing (`gh pr edit -R … --body`), keeping
the rest of the description word for word, then add `factory:tracked`. Create the issue, then
search `pullRequests` for `owner/repo#N` once more: a second issue found is a neighbour's. Keep the
older, close yours as `duplicate`, and write a `signal`, `Rule: pr_tracked_twice`.

A draft is tracked and linked, never judged: its author is still working. It enters the pipe once
marked ready.

*Done when* each PR this run tracks is in exactly one issue's `pullRequests` and carries its link
line and `factory:tracked`.

## 3. Take the pull request

Woken on a pull request, that PR is your work: find its tier below and go on. A wake because the
merge queue removed it (`dequeued`) is tier 3 at once. The net takes the
head of this order, inside each tier by its issue's `priority`, then the PR's age. A PR is judged
whatever state its issue was left in.

1. **A head to judge:** a PR that is not a draft, whose issue is In review, whose head has no
   `verdict` row (`subject: github:owner/repo#N@<sha>`), its checks concluded or still running
   (§ 5 judges first).
2. **A ruling to apply:** a PR whose issue's newest `ruling` answers a Land checkpoint (its
   checkpoint's `Resume at:` is land) with anything but Merge it, and has no `verdict` row after it.
   Skip it while auto-merge is enabled on it or a Merge it Decision is open.
3. **A go to retry:** a PR whose head has a go `verdict` and is neither merged, nor enqueued, nor
   named by an open or answered Merge it Decision (dequeued, the merge failed, or its Merge it
   expired): run § 6 again.

Then the issues the list no longer shows, from `pullRequests`: an issue of any status but Done
whose every linked PR is merged gets `status: done`, `closeReason: done`; an In review one whose
every linked PR closed unmerged gets `status: backlog` and a `released` row naming them, so
Screening decides what is left. These writes cost nothing: do them all, then take one PR.

**A PR a neighbour is on:** `factory:landing` with a status comment (§ 4) updated less than 60
minutes ago. A run woken on it leaves it and ends; the net skips it and takes the next PR of the
order, ending only when every PR of the order is held or none is left. Otherwise
the PR is yours: add `factory:landing`, write the status comment, and read the issue with
`read-recipe.md`. Close it is `deciding-issues`' to apply: it closes the open PRs itself.

**The round** of the head, at most 6: one more than the `changes` `verdict` rows on this PR newer
than the last person's gesture (a status move or a `ruling`). A go costs no round: a head that
moves after a go (a bot rewriting it, its author pushing, the target branch merged in) is judged
again on the same round.

*Done when* the PR carries your `factory:landing` and status comment and you know its head, its
round, and which tier took it (tier 3 goes to § 6), or nothing is yours and every merged or closed
PR's issue is settled.

## 4. The status comment

One comment per PR, found by its first line `<!-- factory:land -->`, edited in place
(`gh api -X PATCH repos/<o>/<r>/issues/comments/<id> -f body=…`), never posted twice. It says, in
this order:

- `**Land**: <state>` where state is one of `judging <sha>`, `fixing <sha>`, `waiting on checks`,
  `go, enqueued`, `go, waiting on Merge it`, `merged`, `paused: <why>`;
- `Issue: [<title>](https://app.standards.new/fr/~/issues/<issue id>)`;
- `Round: <n> of 6`, the head sha, and the latest verdict in one line (go, or the count of
  blocking and to fix entries);
- `Updated: <ISO time> by <this run>`: the heartbeat neighbours read beside `factory:landing`.

Write it when you take the PR, again at every milestone (a new round, the verdict, the fixer
dispatched and its push, the merge), and every 20 minutes
while you wait. At every exit of the run, remove `factory:landing` and set the label of the state
you leave (`working-on-issues` § Pull requests). Each round also
posts its own verdict comment (§ 5) and the fixer its answers (§ 7): the status comment is the
state, those are the history.

## 5. Freeze the dossier, judge

Pin the head sha. Read the repository's facts from `targetBranch`, never the head: a PR that edits
`CODEOWNERS`, a workflow or `## Factory` is judged on the target's values. Gather, as
`evaluate` § 1 says: the diff, the issue's brief and rulings, every review a person left, and each
check's conclusion on the head; add the issue's `approved` mockup and its `evidence`, the
`withheld` paths, and what `sensitiveData` names, which the dossier never quotes.

**Target red:** a required check red on the head that is also red on the latest run of
`targetBranch` is the target's fault, and no entry of this verdict. Say `waiting on <targetBranch>`
in the status comment, write one `signal` (`Rule: target_red`) naming the check, and hand over
(§ Waiting for checks). It costs no round, and no fixer runs on it.

**Machinery red:** a failed check whose failing step the diff cannot reach (a refused artifact or
download, a runner port already bound, a flake the repository tracks) is rerun once with the
GitHub tools, failed jobs only, when its attempt number is 1, then waited for (§ Waiting for
checks) like any check still running.

**A ruling to apply** (tier 2) skips the judge and is consumed by a `verdict` row on the head
(this section's shape and round), its body citing the ruling:

- "Merge as it stands": `Outcome: go`, the person's approval of this head. Run § 6 from its first
  row, reading `mode: human` as `direct`: withheld paths and required reviews still go to Merge it,
  and a queue repository enqueues.
- any other answer: `Outcome: changes`, its words, quoted and attributed, the one entry, and the
  fixer's brief (§ 7).

Otherwise dispatch the judge: one fresh subagent running `evaluate` on the dossier, as its § 3
says.

- **Round 1:** every count that sits on the target, in `evaluate`'s order.
- **Rounds 2 to 6:** the later-round form of `SOLO.md`: the previous verdict's entries, the
  fixer's answers to them, and `git diff <judged sha>..<head>`, nothing else.

A red required check is a `blocking` entry of any round, with its failed step quoted.

**The review first, the checks after.** Dispatch the judge as soon as the head is pinned, at
every round, whatever state its checks are in: the dossier carries the checks concluded so far and
names the ones still running. A verdict that asks for changes sends the fixer, whose push starts
the checks again on a new head, so waiting for the old ones first buys nothing. On the judge's
return:

- **entries** (`blocking` or `to fix`): write the `changes` verdict now and go to the fixer (§ 7),
  which also answers the checks already red on this head. What the checks find after that comes
  on the new head, as entries of the next round;
- **none:** wait for the head's checks (§ Waiting for checks), then write the verdict: go when
  every required check is green, `changes` with one `blocking` entry per red required check
  otherwise. Target red and Machinery red above apply as on any head.

Write the `verdict` row from the judge's return: `subject: github:owner/repo#N@<sha>`, `stage:
land`, `outcome` and `round` as attributes, body opening `Outcome: go` or `Outcome: changes`, then
`Round: <n>`, then the ranked findings and the counts that returned nothing. Go is no `blocking`
and no `to fix`. Set `factory:go` or `factory:changes` on the PR.

Then post the verdict on the PR: one comment opening `<!-- factory:verdict <sha> -->` and
`Land verdict, round <n>, on <sha>: go` (or `changes`), the findings as the row has them, each with
its file and line. Before merging or pushing anything after it, re-read the head: a head that moved
since you pinned it voids the verdict. Say so in the status comment, pin the new head and judge it
in this run.

*Done when* the `verdict` row exists on the frozen sha and its comment is on the PR.

## 6. Go: merge by the mode

Mark a draft PR ready. Then the first row that holds:

| The head | Do |
|---|---|
| conflicts with `targetBranch` (`mergeStateStatus` `DIRTY`) | the fixer merges `targetBranch` into it (§ 7); the new head is judged on the delta, on the same round |
| left the merge queue unmerged, and does not conflict | § *Dropped by the queue* below |
| touches a `withheld` path, or `reviewers` requires a person's review of its changed paths (`any:<n>`, or a `user:` or `team:` line whose glob matches) | Merge it |
| `gate` is `none` | Merge it, saying no check proves the change and the verdict is all there is |
| `mode: queue` | enqueue: enable auto-merge with `method`, `--match-head-commit <sha>` |
| `mode: human` | Merge it |
| `mode: direct` | merge with `method`, `--match-head-commit <sha>` |

### Dropped by the queue

The queue's checks run on the head merged with what was queued ahead of it, so a drop is either
noise or a real clash. Read why before touching the branch: the latest failed run of the queue
branch that named this PR (`gh run list -R <owner/repo> --event merge_group --json
databaseId,headBranch,conclusion` and keep the `gh-readonly-queue/<targetBranch>/pr-<N>-…`
branches), and the failed steps of its failed jobs.

| The failed steps | Do |
|---|---|
| none the diff can reach, and the same checks are green on the head (a timeout, a runner or download failure, a test the diff does not touch) | enqueue the head again at once, as the `mode: queue` row says: no fixer, no verdict, no round. Write one `signal`, `Rule: flaky_check`, subject the head, naming the job, the test or step and the run; when no open issue tracks that flake, file one as a bug quoting the failed step, and name it in the signal |
| one the diff can reach, or the head was already enqueued again twice (two `flaky_check` signals on this head) | the fixer merges `targetBranch` into it and answers the failed steps (§ 7); the new head is judged on the delta, on the same round |
| no failed run found (removed by a person, or the queue gave no reason) | enqueue the head again once, saying so in the status comment; a second drop of the same head goes to its fixer |

A requeue is a milestone of the status comment (`go, enqueued again: <the flake>`).

**Merge it** is a Decision (`deciding-issues`, its recipient rule for Merge it): the verdict in
two lines, each withheld path with its specific risk, the head, the PR link, and the published link
when `links` is true. Options: Merge it (the person merges on GitHub, recommended), Change (say
what), I take it, Close it. The issue stays In review; the merge itself is the answer the pipe reads.

Enqueued, merged or Merge it sent: update the status comment and the labels (`factory:waiting` on
Merge it). The issue goes Done when a Land run sees every linked PR merged.

*Done when* the head is enqueued, merged, or waits on one open Merge it, and the status comment
says which.

## 7. Not go: the fixer

**Who fixes.** A PR whose body carries `<!-- factory:build -->` is the factory's own: the fixer
always runs. Any other PR was opened by a person: the fixer runs only when the project's
`autoFix` is on. With `autoFix` off, write no fix: the verdict comment is the request to its author, the
status comment says `changes requested`, and the next head the author pushes is judged as it
comes. Round 6 still stops on § 8.

Rounds 1 to 5, a go head to bring up to `targetBranch`, or a ruling's words to
apply, when the fixer runs: set the status comment to
`fixing <sha>`, then dispatch the fixer, a fresh subagent on the build model class when your tools let you choose, with
a checkout of the branch at the pinned head and this brief:

- fix only the verdict's `blocking` and `to fix` entries, the red checks, or the person's words;
- each behaviour fix is red-proven: its covering test seen failing on the unchanged branch, passing
  with the commit;
- a head behind or in conflict with `targetBranch` gets it merged in first, at any round: a merge
  commit, both sides read, a version or changelog both bumped renumbered;
- regenerate a `generated` path with the repository's command; keep `sensitiveData` out of
  everything;
- keep every test and assertion as strict as you found it, and push through the hooks;
- answer each entry in one PR comment opening `<!-- factory:answers <judged sha> -->`: fixed (the
  test or the commit) or refuted (the excerpt that refutes it);
- one commit per entry, on top of the branch: never amend, rebase or force-push;
- right before pushing, fetch the branch: a head that moved since the pinned sha means its author
  is working. Push nothing, return the head unchanged and say so;
- run every `verify` command scoped as the repository's rules allow, push, return the new head sha
  and one line per change.

A PR from a fork, or one you cannot push to, gets no fixer either: the verdict comment is the request to its
author, the status comment says `changes requested`, and the next head is judged when it comes.

Judge the new head at once in this run, its checks running: § 5 on the delta, the next round.

*Done when* the fixer has pushed a new head with its answers and the run has moved on to judging
it, or the head came back unchanged.

## Waiting for checks

Inside the run, never with a bare `sleep`: start a background loop on `gh pr checks -R <owner/repo>
<N>` every minute, and read its result when it ends.

- **Hold the PR while you wait:** rewrite the status comment's `Updated:` every 20 minutes.
- **A head someone else pushed** while you wait (its author, a person): pin the new head and
  judge it (§ 5). The round counts as usual.
- **Checks longer than 60 minutes**, or a run past 2 hours of work: hand over. Status comment
  `waiting on checks` (or the state you are in), remove `factory:landing`, end. This is not a failure: the
  next Land run, woken by the checks or the clock, takes the PR over.

## Taking over

A PR carrying `factory:landing` whose status comment's `Updated:` is older than 60 minutes was left
by a run that stopped. Take it: rewrite the status comment as yours, then read the ledger before
anything else: the `verdict` rows of its heads, the fixer's answers, the status comment. Resume
at the step they name for the current head: judge a head with no verdict, fix a head whose verdict
asked for changes and has no answers comment, merge a go. A step the ledger shows done on the same head stays
done.

## 8. Round 6, still not go

A round-6 verdict short of go, or a fixer that returned the head unchanged (an unresolvable
conflict, a red it could not move; never a head its author moved, which is simply judged next): a `decision` checkpoint (`deciding-issues`), Paused, the open
entries named, each withheld path with its risk. Options: Fix (say what), Merge as it stands,
I take it, Close it. The answer returns the issue to In review, and tier 2 applies it. The status
comment says `paused: waiting on <person>`, and the PR carries `factory:waiting`.

Before round 6, a head that is not go keeps going to the fixer: open entries are work, not a
reason to ask. Stop earlier only for what a fixer cannot move (this section's unchanged head).

*Done when* the checkpoint is sent, the issue is Paused, and the status comment and the label say
so.

## Report

One line: the PRs newly tracked, then the issue, the PR, the head, the round, the verdict, and what happened (merged, enqueued, Merge it sent, fixer pushed, paused, or left and why).
