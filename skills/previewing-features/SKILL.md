---
name: previewing-features
description: Use when screening routes a feature to preview, or a ruling resumes one at preview. Weighs the feature's durable value against its durable debt, writes the verdict candidate, park or reject as a preview row, and stops on a Decision for the maintainer's approval.
---

# Previewing features

A preview decides whether durable product value justifies durable debt. It is an evidence report,
not an implementation plan, and never a novelty contest. You rank; the maintainer decides: every
feature stops on a Decision, whatever your verdict.

Read `working-on-issues` first (`timeline-kinds.md`: the `preview` row). You run inside the
Screening run that routed the issue here.

## Which issues

A `type: feature` issue, when this run's `screening` row says `Verdict: preview`, or its newest
`ruling` says `Resume at: preview`. An enhancement is screened and built without a product ruling:
it never comes here.

## 1. Build the evidence base

Read, completely: the project's `context` (its build bar and every strategy document it names),
the repository's agent rules (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules`) on the target branch, and
the issue with the read recipe.

Then search by concepts and synonyms: live code and current docs in the checkout, git history,
and the workspace's issues, open and closed (record search). Read the shelf first: the issues
closed `wont_do`, and every `preview` row with `Verdict: reject` or `park`. Previewing a question
the workspace already answered costs a full run to reach the same verdict. Record the queries and
places searched.

Run `issue-families.mjs --input <file> --project <id> --issue <id>` (in
`screening-issues/scripts/` in the skills folder, on the export `screening-issues` § Scripts writes):

| Family | Means |
|---|---|
| none | preview the feature alone |
| `shaped → issues:<umbrella>` | the plan exists: the feature is a task of that umbrella or overlaps one; say which |
| unshaped, two or more open members | preview the family's plan, not one slice |

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
When the slice changes what a person sees, the screen is the question: draw one mockup per
option (`deciding-issues` § 3, Show the screen).

## 4. Verdict

Write one `preview` row: `subject: github:owner/repo@<sha>` of the branch read, `Verdict:`, and a
body holding the value/debt comparison, availability, the change surface, the smallest slice and
the searches.

| Verdict | When | Recommended answer |
|---|---|---|
| `candidate` | value clearly outweighs debt | Approve the smallest slice (named) |
| `park` | worth building only once something concrete happens | Park it until the trigger, to its expiry |
| `reject` | debt outweighs value, or it is already present | Close it |

**A park** records `Revisit when:`, the evidence that would reopen it (a named customer
commitment, a usage threshold, an issue or pull request landing), and `Expires:`, a date 90 days
out at most. "Later" is not a trigger: a park you cannot name a trigger for is a `reject`. On its
expiry, screening closes it unless the trigger fired.

*Done when* the `preview` row is written with one verdict.

## 5. Stop for the maintainer

Every feature stops here (`working-on-issues` § Stopping for a person): a `decision` Decision to
the project's first active maintainer, the mockups attached when the screen is the question,
`Resume at: screening`. `deciding-issues` phrases it. The options, the verdict's first: Approve
the smallest slice, with Approve and launch beside it; Park it, naming the trigger and the expiry;
Close it; and I take it first when the feature is really a programme (several slices, several
repositories, a public contract redesign). Open decisions from § 3 are folded into the options or
stated as defaults, never relayed as a list.

The answer comes back through `deciding-issues` as a `ruling`, and screening routes it: an
approval goes to Ready with its brief, or launches on Approve and launch; a park stays in Backlog
until its expiry.

## Red flags

- unknown availability written as `absent`;
- imagined users, or a thread's enthusiasm, counted as demand;
- compatibility or support cost hidden behind "a small UI change";
- a park with no trigger, or an expiry further than 90 days;
- moving the issue to `ready`, or closing it, yourself;
- producing tasks or a plan before the product decision is sound;
- previewing an enhancement.

All mean the preview is incomplete.
