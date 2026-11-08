---
name: landing-pull-requests
description: Land stage. Use when the Land routine takes the next In review issue of its pipe, for one judging round on its PR head (judge, then merge or fixer), or to close an issue whose every linked PR is merged.
---

# Landing pull requests

Land alone takes a PR from In review to merged. One run, one head, one round: a **judge** tries
the head, then either the merge goes by the repository's mode or a **fixer** answers the verdict
and pushes. The judge and the fixer are distinct subagents, each from a fresh context; the one who
wrote a fix never decides it is good.

`working-on-issues` owns the state below (the claim, § Stopping for a person, § Provenance,
§ Repository facts) and wins when this skill disagrees. Ask people with `deciding-issues`.

## 1. Take the next issue

The pipe, in order:

1. **A head to judge:** an In review issue whose open linked PR has a head with no `verdict` row
   (`subject: github:owner/repo#N@<sha>`) and every check on it concluded.
2. **A ruling to apply:** an In review issue whose newest `ruling`, other than a Merge it, is newer
   than its newest `verdict`. A person's answer to a Land checkpoint re-opens the same head.
3. **Merged:** an In review issue whose every linked PR is merged. Set `status: done`,
   `closeReason: done`, clear the claim, end.

Claim the issue, then read it with `read-recipe.md`. Close it is `deciding-issues`' to apply: it
closes the open PRs itself.

**The round** of the head: one more than the `verdict` rows on this PR newer than the latest
person's gesture (a status move or a `ruling`). A person's gesture restarts the count.

*Done when* you hold the claim on one issue and know its PR, head, round, and which pipe took it.

## 2. Freeze the dossier

Pin the head sha. Read the repository's facts from `targetBranch`, never the head: a PR that edits
`CODEOWNERS`, a workflow or `## Factory` is judged on the target's values. Gather, as
`evaluating-changes` § 1 says: the diff, the issue's brief and rulings, every review a person left,
and each check's conclusion on the head.

**Machinery red:** a failed check whose failing step the diff cannot reach (a refused artifact or
download, a runner port already bound, a flake the repository tracks) is rerun once with the
GitHub tools, failed jobs only, when its attempt number is 1. Then clear the claim and end: the
next run judges the head once the rerun concludes.

**A ruling to apply** (pipe 2) skips the judge:

- "Merge as it stands": the person's approval of this head, withheld paths included. § 4, merging
  with `method` whatever `mode` says; a merge GitHub refuses for a required review becomes Merge it.
- any other answer: its words, quoted and attributed, are the fixer's brief (§ 5).

*Done when* the dossier names the frozen sha and every check's conclusion.

## 3. Judge

Dispatch the judge: a fresh subagent running `evaluating-changes` (`SOLO.md`) on the dossier.

- **Round 1:** every count that sits on the target.
- **Rounds 2 and 3:** the later-round form of `SOLO.md`: the previous verdict's entries, the
  fixer's answers to them, and `git diff <judged sha>..<head>`, nothing else.

A red required check is a `blocking` entry of any round, with its failed step quoted.

Write the `verdict` row from the judge's return: `subject: github:owner/repo#N@<sha>`, body
opening `Outcome: go` or `Outcome: changes`, then `Round: <n>`, then the ranked findings and the
counts that returned nothing. Go is no `blocking` and no `to fix`.

*Done when* the `verdict` row exists on the frozen sha.

## 4. Go: merge by the mode

Mark a draft PR ready. Then the first row that holds:

| The head | Do |
|---|---|
| touches a `withheld` path, or `reviewers` requires a person's review of its changed paths (`any:<n>`, or a `user:` or `team:` line whose glob matches) | Merge it |
| `gate` is `none` | Merge it, saying no check proves the change and the verdict is all there is |
| `mode: queue` | enqueue: enable auto-merge with `method` |
| `mode: human` | Merge it |
| `mode: direct` | merge with `method` |

**Merge it** is a Decision (`deciding-issues`, its recipient rule for Merge it): the verdict in
two lines, each withheld path with its specific risk, the head, and the published link when
`links` is true. Options: Merge it (the person merges on GitHub, recommended), Change (say what),
I take it, Close it. The issue stays In review; the merge itself is the answer the pipe reads.

Enqueued or merged: clear the claim. The issue goes Done when the pipe sees every linked PR
merged.

*Done when* the head is enqueued, merged, or waits on one open Merge it.

## 5. Not go: the fixer

Round 1 or 2, or a ruling's words to apply: dispatch the fixer, a fresh subagent on the build
model class when your tools let you choose, with a checkout of the branch at the pinned head and
this brief:

- fix only the verdict's `blocking` and `to fix` entries, the red checks, or the person's words;
- each behaviour fix is red-proven: its covering test seen failing on the unchanged branch, passing
  with the commit;
- a conflict is resolved in a merge commit, reading both sides;
- regenerate a `generated` path with the repository's command; keep `sensitiveData` out of
  everything;
- keep every test and assertion as strict as you found it, and push through the hooks;
- answer each entry in one PR comment headed by the judged sha: fixed (the test or the commit) or
  refuted (the excerpt that refutes it);
- run every `verify` command, push, return the new head sha and one line per change.

Clear the claim and end: the next run takes the new head once its checks conclude.

*Done when* the fixer has pushed a new head with its answers, or returned the head unchanged.

## 6. Round 3, still not go

A round-3 verdict short of go, or a fixer that returned the head unchanged (an unresolvable
conflict, a red it could not move): a `decision` checkpoint (`deciding-issues`), Paused, the open
entries named, each withheld path with its risk. Options: Fix (say what), Merge as it stands,
I take it, Close it. The answer returns the issue to In review, and pipe 2 applies it.

*Done when* the checkpoint is sent and the issue is Paused.

## Report

One line: the issue, the PR, the head, the round, the verdict, and what happened (merged,
enqueued, Merge it sent, fixer pushed, paused, or left and why).
