# Timeline kinds

Every row: `issue`, `kind`, `project` (the issue's), `stage` (the stage whose run writes it:
`intake`, `screening`, `build`, `land` or `ops`), `body`, and `subject` where the table names one.
A routine reads a row back from its `body`: it opens with the labelled lines the table lists, one
`Label: value` per line, then prose a person reads. The **Attributes** column names what the row
also sets as attributes, the same value as its labelled line, so rows are counted by query.

| `kind` | Written by | `subject` | Body opens with | Attributes | Means |
|---|---|---|---|---|---|
| `screening` | Screening | `github:owner/repo@<sha>` of the default branch read | `Verdict:` ready, close, checkpoint, preview or park; `Ruling consumed:` the `ruling` row, or none; `Launch:` small and safe or approved and launched, with its grant, when it launched | `outcome` the verdict | what the issue asserts, re-resolved against today's branch, and the route taken |
| `checkpoint` | the run that sent a Decision | `decisions:<id>` | the labelled lines of `SKILL.md` § The checkpoint row | `round` for a Land checkpoint | a run stopped for a person |
| `ruling` | the run that asked, or the sitting, on an answer; Screening, for a person's move to Ready | `decisions:<id>`, or none for a move | `Decision-maker:`, `Recorded by:`, `Source:` (`decisions:<id>` and the date, or the conversation and its date), `Resume at:`; `Superseded by:` the gesture, when one came first | none | a person's answer, quoted verbatim under the question, with the defaults taken unasked one per line. A move to Ready is written as "proceed as last scoped", with who moved it and when |
| `verify` | Land, on a go head with a screen | `github:owner/repo#N@<sha>` | `Outcome:` proven, not proven or not run; `Link:` the published link; `Video:` the file | `outcome` | the gesture the issue promises, played on the running app and filmed: a proof, never a gate |
| `preview` | Screening, previewing a feature | `github:owner/repo@<sha>` | `Verdict:` candidate, park or reject; for a park, `Revisit when:` and `Expires:` (90 days at most) | `outcome` the verdict | a feature's value weighed against its durable debt |
| `attempt` | the run that could not deliver; Ops, for a run that died without a row | the PR or branch head, when there is one | `Outcome:` failed or timeout; `Cause:` change or environment; `Next:` what the next run should do | `outcome` | a failed execution: what was tried, why it failed, what to try next. Only `Cause: change` increments `failedAttempts` (`SKILL.md` § Three tries) |
| `verdict` | Land's judge, never the author | `github:owner/repo#N@<sha>` | `Outcome:` go or changes; `Round:` 1 to 6 | `outcome`, `round` | the judgement of one PR head, its findings ranked |
| `released` | Land, when every linked PR of an In review issue closed unmerged | none | `Closed:` the PRs, unmerged | none | work given back to Screening |
| `signal` | any run noticing a broken rule | what it is about, when any | `Rule:` a name from the list below | `rule` | something slipped through the structure |

## Signal rules

One name per fault, so a fault is counted. Use the name that fits; a fault none fits gets a new
short name, added here in the same change.

| `rule` | The fault |
|---|---|
| `environment_broken` | a tool, a clone, a login or a skill the run needs is missing |
| `unlaunched` | an issue In progress whose move no launch backs (`workflow.md` § Launch) |
| `two_runs` | two neighbours on one issue or one pull request |
| `pr_tracked_twice` | one pull request in two issues' `pullRequests` |
| `duplicate_pull_request` | two open pull requests for one issue |
| `merged_unjudged` | a pull request merged with no go verdict on its merged head |
| `fix_after_merge` | a fix pushed or owed on a pull request already merged |
| `decision_unsendable` | a Decision the run owed and could not send |
| `target_red` | a required check red on the target branch itself |
| `flaky_check` | a check red on a step the diff cannot reach, twice |
| `run_died` | a run that failed or was interrupted with its work unfinished (written by Ops) |
| `ops_relaunch` | Ops launched or relaunched a stage, with its context and the standing order when one applies |

## A `ruling` row, filled in

```
kind:     ruling
subject:  decisions:<id>
body:     Decision-maker: <person>
          Recorded by: <routine>
          Source: decisions:<id>, answered <date>
          Resume at: <stage>

          **<the question as asked>**

          > <the answer, verbatim>

          Taken as recommended, unasked: <one line each, or "none">.
```
