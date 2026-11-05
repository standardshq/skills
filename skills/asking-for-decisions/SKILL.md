---
name: asking-for-decisions
description: "Use when a factory routine needs a person's answer before an issue can move: a product or architecture call, an approval, a mockup to approve, a passed deadline. Asks one forking question as a Décision written as a briefing, opens the decision wait, and records the answer as a ruling."
---

# Asking for decisions

A Décision is a person's answer in a minute. You ask one question, the person rules, you write
their ruling into the ledger. You never implement, never resolve the wait, never wake the issue:
the Maintenance routine does that when your `ruling` row appears.

Read `working-on-issues` first: § Pausing for the wait you open, § Provenance for what counts as a
ruling, and `evidence-kinds.md` for the `wait` and `ruling` rows.

**Décision or Task?** Something the person answers by choosing: a Décision. Something they must
produce over a sitting (a spec, a repro, a measurement, a mockup they draw): a Task
(`working-on-issues` § Pausing), not this skill.

## 1. Re-resolve before asking

A question written days ago is a photograph. Before asking, check against today's default branch,
the issue's evidence and its linked PRs that the question is still open:

- the work may have landed: then ask « close it or keep it open », and say which PR or commit
  moved it;
- a `ruling` may already answer it: then do not ask; use it;
- the premise may be gone: then say so in the issue and do not ask.

Asking a person a question the evidence already answers is the one failure that costs them.

## 2. One forking question

Of all the open questions, ask the one whose answers produce different work. Fold the others into
defaults you will state in the ruling as « taken as recommended, unasked ». If a second question
truly blocks, ask it after the first is answered, never together.

Every question has:

| Part | Rule |
|---|---|
| Situation | One or two plain sentences: what the product does today, what was asked, what blocks it. Readable cold, weeks later, by someone who remembers neither the issue nor its thread. |
| Names | Every issue, PR, commit, file or flag named by what it is: « the pull request that adds undo per tab (merged on 4 October) », never a bare id. |
| Options | Each says what work it produces, for a user or for the code, then what it costs (size, a withheld path, a breaking change). The recommended option comes first, marked recommended; the recommendation comes from the evidence, not a fresh opinion. |
| Exit | Always offer **Close it**: a parked issue that no longer deserves building is a legitimate, cheap ruling. |
| Programme | A feature that is really a programme (several slices, several repositories, a public contract redesign) gets **I take it** first and recommended: the person builds it in their own lane (`mine`). |

**A mockup instead of a question:** when the open point is how an interface looks or behaves (new
chrome, new layout, new interaction), draw the smallest mockup that decides it, store it as a
document or file, attach it, and ask: approve, change (say what), or no mockup needed. Restyling
something that exists needs no mockup. A mockup nobody approved is not a ruling.

## 3. Ask

Call `send` with `questions`:

| Input | Value |
|---|---|
| `to` | the wait's owner (an active person); add the project's first active maintainer when the question is about a deadline, a failure ceiling or an abandoned target. A deactivated owner is replaced by that maintainer; with no active maintainer, write a `signal` (`rule: no_owner`) and do not ask |
| `title` | the decision in a few words, at most 120 characters, naming the issue by its title |
| `why` | one sentence, at most 200 characters: why you cannot go on without it |
| `change` | one sentence, at most 200 characters, in the future: what answering will make possible |
| `links` | `record:<issue id>` and any record the question is about |
| `attachments` | the mockup, when there is one |
| the question | situation, then question, then options, as § 2 |

Write in the language the person uses in the workspace. No em dash in the text.

**Askers who open no wait and never pause:**

| Asker | Its questions | The rows around them |
|---|---|---|
| the Maintenance routine | a deadline, a failure ceiling, an abandoned target | `waking-issues` § 6 |
| the Maintenance routine | everything it asks, except the missing wait of a broken invariant and the budget stop, where its action is the wait | `operating-the-factory` |
| landing in `human` mode | « Merge it » on a go head: the merge itself is the answer | `landing-pull-requests` § 7 |

Their rulings are recorded as § 4 says. « I take it » and « Close it » are applied by the Maintenance
routine like any other; for every other answer the asking routine acts on the answer itself. Every
other routine asks only to pause, and opens the wait, as follows.

Then open the wait (`working-on-issues` § Pausing): find the Décision's id (from the `send` result,
or `search` with `kinds: ["decision"]`, `link: record:issues:<issue id>`, `state: open`), write the
`wait` row with `target: decisions:<id>`, `waitKind: decision` (`approval` for a withheld change),
`owner`, `resumeAt` = the stage that asked, `data: {"deadline": …, "question": "<the question as
asked>"}`, then set the issue `paused`.

Finish everything that does not depend on the answer, then let the run wait.

## 4. Record the answer

When the answer resumes your run, `read decision:<id>` for the answer, `answeredBy` and
`completedAt`. Then write one `ruling` row:

- `subject`: the wait's target, `decisions:<id>`, even when the person answered a follow-up;
- `body`: decision-maker (the person who answered), recorder (your routine), source
  (`decisions:<id>` and the date), the question as asked, the answer **quoted verbatim**, the
  defaults taken unasked (one line each, or « none »), and the resume stage;
- `data`: `{"answeredBy": "<person id>", "answeredAt": "<iso>"}`.

Then stop. Never move a status. The `ruling` row triggers the Maintenance routine, which applies
every answer (`waking-issues` § 6): it resolves the wait and wakes the issue, or, for « I take
it » and « Close it », releases the waits and moves the issue to `mine` or `done` (for « Close
it » with a linked PR open, `in_review` now and `done` once every linked PR is closed). For « I
take it », write the person's direction into `handoff` before you stop: it is their brief.

**Answered with a question:** answer it from the codebase and the evidence, then ask again in the
same conversation with the missing context added. Never guess on the person's behalf.

**No answer:** a routine's question expires after 24 hours and your run resumes with « no
answer ». Write nothing, leave the wait open, and say so in your report. The wait stays in
Needs you under its owner; nobody asks again before its deadline, when the Maintenance routine asks
once.

## Red flags

- Relaying every open question instead of the one that forks.
- A question whose meaning lives only in ids.
- Asking what a ruling, a merged PR or a later comment already answered.
- An agent recommendation, a default, or an unanswered Décision recorded as a ruling.
- Paraphrasing the answer instead of quoting it.
- Resolving the wait or changing the issue's status yourself, whatever the answer.
- A mockup attached that the person never saw, recorded as approved.
