---
name: deciding-issues
description: "Decisions, the one way a factory run asks a person. Use when a run must stop for a ruling or a mockup, when its question is answered or expires, when Intake asks a reporter in Slack, or when a person starts a sitting to clear Paused issues."
---

# Deciding issues

A Decision is a person's answer in a minute: the run that needs it asks one question, the person
rules, and the answer alone moves the issue on.

`working-on-issues` owns the state around the question: § Stopping for a person and § Provenance.

## Ask

Any stage whose row in `workflow.md` names a Decision `need`, at the point its skill says to stop.

### 1. Re-resolve before asking

Check the question against today's target branch, the issue's timeline and its linked PRs:

- the work landed: ask « close it or keep it open », naming the PR or commit that moved it;
- a `ruling` already answers it: use it and ask nothing;
- the premise is gone: say so in your stage's row and ask nothing.

### 2. One forking question, written as a briefing

Of the open questions, ask the one whose answers produce different work. Fold the others into
defaults, written in the checkpoint's `Recommendation:` and later in the ruling as taken unasked.
A second blocking question waits for the first answer.

The person reads it cold, perhaps weeks later, in the workspace's language, with no em dash:

| Part | Rule |
|---|---|
| Situation | One or two plain sentences first: what the product does today, what was asked, what blocks it. |
| Names | Every issue, PR, commit, file or flag named by what it is: « the pull request that adds undo per tab (merged on 4 October) », never a bare id. |
| Options | Each says the work it produces, for a user or for the code, then its cost: size tier, a withheld path, a breaking change. The recommended option comes first, marked recommended; the recommendation comes from the evidence, never a fresh opinion. |
| Close it | Always offered: an issue that no longer deserves building is a legitimate, cheap ruling. |
| I take it | First and recommended for a programme (tier `full`, several slices, several repositories, a public contract redesign): the person builds it in their own lane, Mine. |
| Approve and launch | Beside Approve when the approval is all that stands between the issue and Build, Build's own `design` and gate-red Decisions included (`screening-issues` § Launch, approved and launched). |

### 3. Mockups

A `design` need is owed for new chrome, a new layout or a new interaction; restyling never needs
one. Draw it as `mockups.md` says, one PNG per option, each stored as a file attached to the issue,
and ask: Approve, Change (say what), No mockup needed, Close it. A `decision` whose question is a
screen (Preview) carries its mockups the same way.

A screen you cannot draw (no source for it, or a direction only a person can choose): send the
`design` Decision without one, its options Draw it with me in a sitting, No mockup needed,
Close it, and write `Mockups: none, <why>` in the checkpoint. The sitting draws it.

When the repository's facts say `links: true`, a `design` Decision and Merge it also carry the
running app's published link (`working-on-issues/environments.md`, Published links).

### 4. Send

Search first: `search` with `kinds: ["decision"]`, `link: record:<issue id>`, `state: open`. One
exists and a person moved the issue out of Paused after it was sent: write the ruling « proceed as
last scoped » as Screening does (`screening-issues` § Release and rulings) and go on without
asking. Otherwise the issue waits on it: send nothing, clear your claim, end.

Call `send` with `questions`:

| Input | Value |
|---|---|
| `to` | one recipient, below |
| `title` | the decision in a few words, at most 120 characters, naming the issue by its title |
| `why` | one sentence, at most 200 characters: why the run cannot go on without it |
| `change` | one sentence, at most 200 characters, in the future: what answering makes possible |
| `links` | `record:<issue id>`, any record the question is about, the published link when there is one |
| `attachments` | the mockups, when there are any |
| the question | § 2: situation, question, options |

**The recipient** is the project's first active maintainer (`maintainers`, walking up to the
root), unless:

- the stage skill names another (triage: the issue's author, when an active person);
- **Merge it**: take the `reviewers` line whose glob matches the PR's changed paths, the last
  match winning (`**` matches every path). `user:<login>`: the active maintainer with that GitHub
  login. `team:<slug>`: an active maintainer who belongs to it (`gh api
  orgs/<org>/teams/<slug>/members`). Otherwise (`any:<n>`, an unresolved `team:<id>`, no
  maintainer matching): the first active maintainer, and the question names the reviewer the
  repository asks for and says the person receives it as the fallback.

No active maintainer: a refusal (`working-on-issues` § Refusals), `Rule: no_owner`.

Then follow `working-on-issues` § Stopping for a person, with the `decisions:<id>` the `send`
result returns.

*Done when* one open Decision links the issue, a `checkpoint` row names it, and the issue is
Paused with `need` and `waitingOn` set (Merge it: In review, `waitingOn` alone).

## Answer

The answer resumes the run that asked. `read decision:<id>` for the answer, `answeredBy` and
`completedAt`, then reread the issue. The first matching row decides:

| Found | Write | Then |
|---|---|---|
| the issue is no longer where you left it (Paused, or In review for Merge it): a person moved it, or the PR merged | the `ruling`, with `Superseded by:` that gesture and its time | change nothing else |
| Draw it with me | the `ruling` | it stays Paused for the sitting |
| Merge it | the `ruling` | it stays In review. The person merges on GitHub, and Land's pipe sets Done |
| I take it | the `ruling`, and the person's direction added to `## Plan` of `body`, dated and attributed, the rest kept | Mine, `waitingOn` the person who answered, so Needs you shows it |
| Close it | the `ruling` | Done, `closeReason` `wont_do` unless the answer names refuted, overtaken or duplicate; close its open PRs with a comment naming the ruling |
| any other answer to a Land checkpoint whose PR is open | the `ruling` | In review; Land's next run judges it again |
| any other answer | the `ruling` | Backlog: Screening takes rulings first and routes by `Resume at:` |

Every answer but I take it, superseded included, clears `waitingOn`; a move out of Paused also
clears `need`, in the same update. Then clear your claim and end: a run never continues its own stage after its
question.

**The `ruling` row** (`timeline-kinds.md`): `subject: decisions:<id>`; `Decision-maker:` who
answered, `Recorded by:` your routine, `Source:` `decisions:<id>` and the date, `Resume at:` the
checkpoint's; the question as asked, the answer quoted verbatim, the defaults taken unasked one per
line, or « none ». An approved mockup is named by its file, attached to the issue.

**Answered with a question:** answer it from the codebase and the evidence, then ask again (§ Ask)
with the missing context added. Write no ruling; never guess on the person's behalf.

**Expired** (24 hours, the run resumes with no answer): write nothing, change nothing, clear your
claim, end. The issue stays Paused, for a sitting or a person's move to Ready.

**A person's gesture while a Decision is open** (a move to Ready, Mine or Done): only the run that
asked closes its question, so the card stays open. Answered later, the first row above records it
superseded; expired, it leaves nothing. Screening records a move to Ready as a release
(`screening-issues` § Release and rulings).

## In Slack

A question Intake asks the reporter is a Decision sent `to` the reporter: the runtime posts it as a
card in the thread that woke Intake, and the reporter answers there. It writes no checkpoint and
pauses nothing; the answer resumes Intake, which judges the message again with it
(`curating-requests`). A reporter who is not an active person of the
workspace cannot answer a Decision: ask them in plain text, one reply in the thread.

Every other routine's Decisions go to Decisions, for the maintainer, never to the channel.

## The sitting

A person starts this skill in a conversation to clear what no run can answer. You ask, they rule,
you write it down; you never implement, and a ruling from a sitting never launches code.

1. **Select** Paused issues with no live claim whose latest Decision expired or that never had one,
   and Paused `design` issues whose checkpoint says `Mockups: none`. Skip any other issue with an
   open Decision: its card is where it gets answered. Order by `priority`, empty last, then oldest.
2. **Re-resolve** each as § Ask 1, reading the checkpoint and every row after it, and the target
   branch's log for commits naming the issue.
3. **Ask** in the conversation, where questions do not expire: at most four issues per batch, one
   question each, headed by the issue's title, written as § Ask 2 without Approve and launch. A
   free-text answer overrides every option; a question asked back is handled as § Answer says.
4. **Draw** a design with the person looking, as `mockups.md` says, and attach it to the issue.
   Their approval, their change, or their « no mockup needed » is the ruling; a mockup they never
   saw is not.
5. **Record** each answer as § Answer, under a claim (`working-on-issues` § The claim):
   `subject` the expired Decision or none, `Recorded by:` the sitting, `Source:` the conversation
   and its date.
6. **Report** one table: issue, ruling, what happens next (Screening, Mine, Done, still Paused).
   Name every issue you skipped and why. An issue left Paused untouched is a correct outcome.

*Done when* every selected issue is recorded or named as skipped.

