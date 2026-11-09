# Timeline kinds

Every row: `issue`, `kind`, `project` (the issue's), `body`, and `subject` where the table names one.
A routine reads a row back from its `body`: it opens with the labelled lines the table lists, one
`Label: value` per line, then prose a person reads.

| `kind` | Written by | `subject` | Body opens with | Means |
|---|---|---|---|---|
| `screening` | Screening | `github:owner/repo@<sha>` of the default branch read | `Verdict:` ready, close, checkpoint, preview or park; `Ruling consumed:` the `ruling` row, or none; `Launch:` small and safe or approved and launched, with its grant, when it launched | what the issue asserts, re-resolved against today's branch, and the route taken |
| `checkpoint` | the run that sent a Decision | `decisions:<id>` | the labelled lines of `SKILL.md` § The checkpoint row | a run stopped for a person |
| `ruling` | the run that asked, or the sitting, on an answer; Screening, for a person's move to Ready | `decisions:<id>`, or none for a move | `Decision-maker:`, `Recorded by:`, `Source:` (`decisions:<id>` and the date, or the conversation and its date), `Resume at:`; `Superseded by:` the gesture, when one came first | a person's answer, quoted verbatim under the question, with the defaults taken unasked one per line. A move to Ready is written as "proceed as last scoped", with who moved it and when |
| `preview` | Screening, previewing a feature | `github:owner/repo@<sha>` | `Verdict:` candidate, park or reject; for a park, `Revisit when:` and `Expires:` (90 days at most) | a feature's value weighed against its durable debt |
| `attempt` | the run that held the claim; the run taking over its lapsed claim | the PR head, when there is one | `Outcome:` failed, lapsed or timeout; `Holder:` the run that held the claim | a failed execution: what was tried, why it failed, what to try next. Each one increments `failedAttempts` |
| `verdict` | Land's judge, never the author | `github:owner/repo#N@<sha>` | `Outcome:` go or changes; `Round:` 1 to 3 | the judgement of one PR head, its findings ranked |
| `released` | the run taking over an expired claim outside In progress; Land, when every linked PR of an In review issue closed unmerged | none | `Holder:` the run that held it; `Expired:` its `leaseExpiresAt`; or `Closed:` the PRs, unmerged | a claim that lapsed with no failure to count, or work given back to Screening |
| `signal` | any run noticing a broken rule | what it is about, when any | `Rule:` a short name | something slipped through the structure |

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
