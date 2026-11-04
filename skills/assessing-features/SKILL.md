---
name: assessing-features
description: Use when the assessment routine runs on a feature screening sent to assessment, or on a woke row with resumeAt assessment. Decides whether a feature's durable value justifies its durable debt, writes that verdict as assessment evidence, and asks the maintainer, or parks the feature on a typed wait.
---

# Assessing features

An assessment decides whether durable product value justifies durable debt. It is an evidence
report, not an implementation plan, and never a novelty contest. You rank; the maintainer decides:
no feature is built on your verdict alone.

Read `working-on-issues` first, with `read-recipe.md` and `evidence-kinds.md` (the `assessment`
row). Ask with `asking-for-decisions`. You never move an issue to `ready` (screening does, once the
maintainer approved) and never close one (the `waits` routine applies « Close it »).

## Which issues

| Run | Do |
|---|---|
| a `screening` row with `resumeAt: assessment` (`verdict: assess`) | assess that issue |
| a `woke` row with `resumeAt: assessment` | § After the answer; any other `resumeAt`: stop |

Only `type: feature` belongs here: an enhancement is screened and built without a product ruling.

Hold the lease while you work (`working-on-issues` § Claiming, « Screening holds it too »),
release it on every exit.

## 1. Build the evidence base

Read, completely: the project's `context` (its build bar and every strategy document it names),
the repository's agent rules (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules`) on the target branch, and
the issue with the read recipe.

Then search by concepts and synonyms: live code and current docs in the checkout, git history,
and the workspace's issues, open and closed (record search). Read the shelf before judging: the
issues closed `wont_do`, and every `assessment` row with `verdict: reject` or `park`. Re-assessing a
question the workspace already answered costs a full run to reach the same verdict. Record the
queries and places searched.

Run `issue-families.mjs --input <file> --project <id> --issue <id>` (a `screening-issues` file: load that skill, then `/workspace/skills/screening-issues/scripts/`,
the export as `screening-issues` § Scripts writes it): it says
whether this feature is one member of a family that ships under one plan.

| Family | Means |
|---|---|
| none | assess the feature alone |
| `shaped → issues:<umbrella>` | the plan exists: the feature is a task of that umbrella or overlaps one; say which |
| unshaped, two or more open members | assess the family's plan, not one slice: recommend a spec for the family |

Classify availability, with evidence, as exactly one of: `absent`, `partial`, `already present`,
`previously rejected`, `parked`. A missing search result is not proof of `absent`.

## 2. Product fit

Durable value needs at least one concrete source:

- revenue, retention or validated customer demand;
- a core strategic workflow named in the project's `context`;
- a differentiation the project's strategy claims;
- measured operational savings;
- reuse by several real consumers.

Innovation, a competitor's move or technical elegance alone is not enough. A thread is not demand:
enthusiasm in comments is not a customer. For a small team, recommend building only when the
evidence-backed value is significant against the permanent debt: new concepts, public API
compatibility, data migrations, permissions and tenancy, tests, docs, support, operations,
rollback, and the cost of every later change.

## 3. The change surface

Affected interfaces and modules, compatibility, security, tenancy, observability, test seams,
rollout and rollback, **the smallest vertical slice**, and the product, UX, data or architecture
decisions still open. Separate verified facts (with `file:line`), inferences and open questions.

## 4. Verdict

Write one `assessment` row, `resumeAt` empty: `subject: github:owner/repo@<sha>` of the branch read, `data.verdict`,
and a `body` holding the value/debt comparison, availability, the change surface, the smallest
slice and the searches. Then:

| Verdict | When | Then |
|---|---|---|
| `candidate` | value clearly outweighs debt | ask the maintainer (below), « Build the smallest slice » recommended |
| `reject` | debt outweighs value, or it is already present | ask the maintainer, « Close it » recommended |
| `park` | worth building only once something concrete happens | pause on that thing as a typed wait, no question (below) |
| `needs-human` | the assessment itself cannot finish: a fact only a person has | a `decision` wait for an answer, a `task` wait for an artifact (a measurement, a customer confirmation), to the person who has it |

**Asking** (`asking-for-decisions`): to the project's first active maintainer, `resumeAt:
assessment`. Options, the verdict's first: **Build the smallest slice** (name it), **Spec it
first** (a spec sitting before any code), **Close it**, and **I take it** first and recommended
when the feature is really a programme (several slices, several repositories, a public contract
redesign). Unresolved product decisions from § 3 are folded into the options or stated as defaults,
never relayed as a list.

**Parking is a typed wait, never a free "revisit trigger"**: a trigger nobody checks shelves the
issue forever. Pick the wait the trigger is:

| The feature is worth building once… | Wait |
|---|---|
| another issue or pull request lands | `blocker` on `issues:<id>` or `github:owner/repo#N` |
| a measurement, a customer commitment or a usage threshold is confirmed by a person | `task` to that person, due at the deadline |
| some time has passed (at most 90 days) | `date` on that day |

Owner: an active person who can say the trigger fired; `resumeAt: assessment`. When the wait ends,
the feature comes back to you and is re-assessed with what changed. A park you cannot express as
one of these waits is a `reject`.

Rewrite `handoff` (verdict, the question asked or the wait opened), release the lease, re-read.

## After the answer

A `woke` row with `resumeAt: assessment` brings the issue back. Read the `ruling` that answered
your question, or what the park's wait delivered:

| What came back | Do |
|---|---|
| a ruling « Build » | write an `assessment` row `verdict: approved`, `resumeAt: screening`, `subject: decisions:<id>`, the approved slice in `body`: it hands the issue to screening, which sets it `ready` |
| a ruling « Spec it first » | pause on a `task` wait to the maintainer for the spec (`shaping-features`), `resumeAt: assessment`: the spec comes back to you |
| a ruling that changes the scope | write the new scope in `plan`, then assess again from § 1 if the value case changed, else approve as « Build » |
| the spec Task resolved, after « Spec it first » | the spec is the approval: an `assessment` row `verdict: approved`, `resumeAt: screening`, `subject: tasks:<id>`, the spec named in `body` |
| a park's wait resolved | assess again from § 1 with what the wait delivered |

Write `handoff`, release the lease, then the `approved` row **last**: it hands the issue to
screening the moment it exists (`working-on-issues` § Finish, the one exception).

« Close it » and « I take it » never wake the issue: the `waits` routine already applied them.

## Red flags

- unknown availability written as `absent`;
- imagined users, or a thread's enthusiasm, counted as demand;
- compatibility or support cost hidden behind "a small UI change";
- a park with no wait, a wait with no owner, or a date further than 90 days;
- moving the issue to `ready`, or closing it, yourself;
- `verdict: approved` without a ruling « Build » or a done spec Task, or `resumeAt` on any other row;
- producing tasks or a plan before the product decision is sound;
- assessing an enhancement;
- writing the `approved` row before releasing the lease.

All mean the assessment is incomplete.
