# Evidence kinds

Every row: `issue` (required), `kind` (required), `body` (markdown a person reads). The other
fields are used only where the table says. `data` is JSON text holding what a routine reads back
and nothing else; it never repeats `owner`, `waitKind`, `resumeAt`, `target` or `subject`, which
are attributes. Write valid JSON (`{}` when empty, or leave `data` empty).

Rows are never edited or deleted. The one exception: the Maintenance routine sets `resolvedAt` on a
`wait` row when it writes the matching `resolved`, `abandoned` or `released` row.

| `kind` | Written by | Fields | `data` | Means |
|---|---|---|---|---|
| `screening` | Triage routine | `subject`: `github:owner/repo@<sha>` of the default branch read; `resumeAt: assessment` when the verdict is `assess` | `{"verdict": "ready" \| "close" \| "hold" \| "assess"}` | what the issue asserts, re-resolved against today's default branch |
| `assessment` | Triage routine; `shaping-features` for the `approved` row of each feature task of an umbrella it writes | `subject`: `github:owner/repo@<sha>` of the branch read, or `decisions:<id>` / `tasks:<id>` for `approved`, or `issues:<umbrella id>` for a shaped task's `approved`; `resumeAt: screening` when the verdict is `approved` | `{"verdict": "candidate" \| "reject" \| "park" \| "needs-human" \| "approved"}` | a feature's durable value weighed against its durable debt (`assessing-features`): a ranking, never an approval. `approved` records the maintainer's approval (a ruling « Build », or the spec Task done) and hands the feature back to screening |
| `wait` | any routine pausing the issue; the Maintenance routine writing a missing wait or re-routing one with no active owner | `target`, `waitKind`, `owner`, `resumeAt`; `resolvedAt` set later by the Maintenance routine | `{"deadline": "<iso>"}` plus target details a routine needs (for a `decision`: `"question"`) | the issue is held until the target resolves |
| `resolved` | Maintenance routine | `target` (the wait's), `subject`: `evidence:<wait row id>` | `{}` | the awaited thing happened |
| `abandoned` | Maintenance routine | `target`, `subject`: `evidence:<wait row id>` | `{"reason": "pr_closed_unmerged" \| "task_deleted" \| "target_missing"}` | the awaited thing will not happen; a person is asked, nothing wakes |
| `released` | Maintenance routine | `target`, `subject`: `evidence:<wait row id>` | `{"by": "<actor id>"}` | a person moved the issue out of `paused` (a drag newer than the wait), or answered « I take it », « close it » or « extend » (`by` = the answerer) |
| `woke` | Maintenance routine | `resumeAt`, derived from the wake status (`waking-issues` § 7) | `{"waits": ["<wait row id>", …]}` | every wait of the pause ended and at least one resolved; the stage in `resumeAt` picks the issue up; the waits' own `resumeAt` are hints quoted in the body |
| `ruling` | the session that asked (`asking-for-decisions`), the Maintenance routine included for an escalation; applied only by the Maintenance routine | `subject`: `decisions:<id>` (the wait's target when it answers a wait) | `{"answeredBy": "<actor id>", "answeredAt": "<iso>"}` | a person's answer, quoted, with decision-maker, recorder and source |
| `attempt` | the run that held the lease; the run taking over a lapsed one; the Maintenance routine when every linked PR closed unmerged on a launched issue | `subject`: the PR head when there is one | `{"outcome": "failed" \| "lapsed" \| "timeout", "holder": "<actor id>"}`; `holder` is the run that held the lease, or the last lease holder when another routine writes the row | a failed execution: what was tried, why it failed, what to try next. Every `attempt` increments `failedAttempts`, whoever writes it |
| `verdict` | Review routine (its juror; the Review run itself for a Sight head, not a round), never the lease holder | `subject`: `github:owner/repo#N@<sha>` | `{"outcome": "go" \| "changes"}` | a juror's judgement of one PR head, with findings; a refused generated path is a failed `check-run` or a `blocking` entry |
| `go` | Review routine, never the lease holder | `subject`: `github:owner/repo#N@<sha>` | `{}` | permission to merge that exact head |
| `tier` | Review routine | `subject`: `github:owner/repo#N@<sha>` of the first head read | `{"tier": "sight" \| "standard" \| "full"}` | the review depth of one PR, fixed once and kept through every round (`landing-pull-requests` § 4) |
| `fixing` | Review routine (its fixer) | `subject`: `github:owner/repo#N@<sha>` | `{}` | a fixer owns the PR's branch; other runs leave it for the fixing window (`operating-the-factory` § Thresholds) |
| `demo` | Review routine (its demonstrator) | `subject`: `github:owner/repo#N@<sha>` | `{"outcome": "pass" \| "fail" \| "skipped", "reason": "<model \| stack, when skipped>"}` | the gesture a PR promises, performed on the running stack; the video linked in `body` |
| `check-run` | Review routine, never the lease holder | `subject`: `github:owner/repo#N@<sha>` | `{"passed": true \| false, "commands": ["…"]}` | the factory gate ran `verify` on that head |
| `escalation` | any routine; the Maintenance routine for deadlines and abandoned targets | `subject`: `decisions:<id>` when a Décision was asked | `{"waits": ["<wait row id>", …]}` when it is about waits | a person is needed beyond an ordinary wait (deadline passed, target abandoned). A wait it cites is never asked about again, except once per « Extend » ruling (`waking-issues` § 6) |
| `applied` | Maintenance routine | `subject`: `evidence:<ruling id>` | `{"rows": ["<id>", …]}`, or `{"skipped": "superseded" \| "unmapped" \| "no_wait"}`; for « Close it » with a linked PR open, also `"closeReason"` and `"closeWhenPullRequestsClose": true` | the last row of applying a ruling on one issue: its presence on an issue means the ruling is done there. A ruling whose Décision is the target of waits on several issues gets one `applied` row on each (`waking-issues` § 6). With `closeWhenPullRequestsClose`, Maintenance closes the issue with that `closeReason` once every linked PR is closed (`waking-issues` § 4) |
| `signal` | the Maintenance routine, or any routine noticing a broken rule | `subject` (optional): what it is about, such as a PR head, `evidence:<id>` or `repositories:<id>` | `{"rule": "<short name>"}` | something slipped through the structure |

**Stage hand-offs:** `resumeAt` on a `screening` or `assessment` row names the next stage, and
creating the row triggers that stage's routine: `screening` → `assessment` for a feature to assess,
`assessment` → `screening` for an approved feature. Leave `resumeAt` empty on every other
`screening` and `assessment` row. A hand-off row is the **last** write of its run, after
`handoff` and the lease release: written earlier, the next stage would start while you still hold
the issue (`working-on-issues` § Finish).

## A `wait` row, filled in

```
issue:     <issue id>
kind:      wait
waitKind:  decision
target:    decisions:<id>
owner:     <person id>
resumeAt:  execution
body:      Waiting on <person> to choose between A and B: <one sentence of why>.
data:      {"deadline": "2026-11-17T09:00:00Z", "question": "<the question as asked>"}
```

## A `ruling` row, filled in

```
kind:     ruling
subject:  decisions:<id>
body:     Decision-maker: <person>
          Recorded by: <routine>
          Source: decisions:<id>, answered <date>

          **<the question as asked>**

          > <the answer, verbatim>

          Taken as recommended, unasked: <one line each, or "none">.
          Resume at: <stage>.
data:     {"answeredBy": "<person id>", "answeredAt": "<iso>"}
```

## Targets

| Target | Resolved when | Abandoned when |
|---|---|---|
| `issues:<id>` | the issue is `done` (any `closeReason`) | the issue is deleted |
| `github:owner/repo#N` | the PR is merged | the PR is closed unmerged, or no longer exists |
| `tasks:<id>` | the Task is done | the Task is deleted |
| `decisions:<id>` | a `ruling` row with that `subject` exists (applied by the Maintenance routine) | the Décision is deleted. An expired or withdrawn, unanswered Décision leaves the wait open until its deadline |
| `date:<iso>` | the date has passed | never |
