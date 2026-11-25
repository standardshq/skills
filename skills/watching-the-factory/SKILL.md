---
name: watching-the-factory
description: Pulse stage. Use when the Pulse routine ticks, or when a goal is created. Tells a person when a stage of the factory has stopped, launches Ready issues under an active goal, and proposes the day's launches on one card.
---

# Watching the factory

Pulse does three things: it **watches** the stages, it **serves** a person's **goals**, and it
**proposes** the day. It moves one status, Ready to In progress, under a goal; every other status
belongs to the stage that owns it (`working-on-issues/workflow.md`).

Pulse runs on Standards, on a small model. Keep in memory, under `pulse`, the open **outages**
(what stopped, since when, whether the alert was sent) and the date of the last proposal; read
them first. What you send quotes no secret, no environment value and nothing `sensitiveData`
names (`working-on-issues` § Provenance).

| Wake | Do |
|---|---|
| the 15-minute tick | § 1, then § 2 |
| the first tick after 07:00 on a weekday, in the maintainer's timezone, whose date is newer than the last proposal in memory | § 1, § 2, then § 3 |
| a goal created | § 1, § 2, then § 3 for that goal |

Watching comes first at every wake, so a launch that fails still leaves its alert sent.

## 1. Watch

Read the runs of Intake, Screening, Build and Land since the last tick
(`working-on-issues/environments.md` § Runs), and check that `gh api rate_limit` answers.

A stage is **stopped** when a row holds:

| Sign | Stopped since |
|---|---|
| Build, Land or Screening has work in its pipe and no run that ended well for 2 hours, counted inside its working hours (`workflow.md`, Working hours) | its last run that ended well |
| a symptom of `operating-the-factory` § Repairs still holds 2 hours after it began, with no run on it | the time that row gives it |
| GitHub refuses the factory's account on two ticks in a row | the first refusal |

**An outage opens once.** A sign with no open outage in memory: write the outage in memory, then
tell the project's first active maintainer with `send`, no question, and a direct Slack message
when your list holds Slack tools:

```
<What stopped> since <time, in their timezone>.
Waiting on it: <n> issues, <the urgent ones by title>.
Likely cause: <one line, in your words>.
```

**Outside 07:00 to 19:00 on weekdays, in the maintainer's timezone,** keep the outage in memory
and send nothing; the day's first tick after 07:00 sends every open one in a single message. An
outage that holds an issue of priority `p1_urgent` is sent at once, whatever the hour.

**An outage closes once.** Its sign no longer holds: send « <What stopped> is running again since
<time>, stopped for <duration> » in the same thread, and remove it from memory.

*Done when* every sign in the table is checked, each open outage in memory matches a sign that
still holds, and each one opened or closed at this tick has its message sent or kept for the
morning.

## Goals

A **goal** is what a person wants out of the factory for now, a record of the `goals` object:

| Attribute | Holds |
|---|---|
| `title` | the goal, in the person's words |
| `project`, `owner`, `until` | where it applies, who set it, when it ends: 30 days at most |
| `status` | `active`, `reached`, `ended` |
| `guidance` | sentences that steer you while it is active (« no migration this week ») |
| `launch` | `ask`: you propose and the person picks. `auto`: you launch what fits |
| `limit` | how many of its issues may be In progress at once; 2 when empty |
| `issues` | the issues attached, each marked `picked`, `launched` or `declined` |

**The grant.** A goal is the grant you launch under when its record's history shows a maintainer
of its project (`maintainers`, walking up to the root) created it and wrote the latest value of
each attribute above, each `picked` mark included. Check each person in the history; a goal that
fails the check is served as `launch: ask`, its card (§ 3) sent to the project's first active
maintainer, and launches nothing until that person's answer picks.

## 2. Serve the goals

For each `active` goal, oldest first:

1. **End it** when `until` has passed, or when every attached issue is finished (Done or Closed) and the Ready and
   Backlog issues of the project hold nothing that fits its `title`: `status: ended` or `reached`,
   and one message to its `owner`: launched, merged, still open, by title.
2. **Count** its issues In progress. A parent counts for one, its tasks for none
   (`working-on-issues/workflow.md`, A large issue and its tasks). At or over `limit`: nothing to
   launch.
3. **Pick** the next issue: with `launch: ask`, among those marked `picked` (§ 3); with
   `launch: auto`, among the project's Ready issues that fit the `title`, respect the `guidance`
   and are not marked `declined`. In the pipe's order (`working-on-issues` § One wake, one piece
   of work), leaving tasks and whatever `operating-the-factory` § Holds names.
4. **Launch** it. Re-read the issue and the goal: go on only if the issue is still Ready with no
   `waitingOn` and the count of step 2 still leaves room. Write the `signal` row on the issue
   (`Rule: goal_launch`, `working-on-issues/timeline-kinds.md`), naming the maintainer whose goal
   or answer grants it; then `status: in_progress`; then mark it `launched` on the goal. One
   launch per goal per tick.

*Done when* each active goal is ended, at its limit, has one more issue In progress under its
`signal` row, or the reason nothing was launched is in your report.

## 3. Propose the day

Once per person per day, on the day's first tick or when their goal is created. For each `active`
goal served as `launch: ask`, read the project's open issues that are not tasks and sort the ones
that fit:

- **Ready now:** what you would launch, in order.
- **Waiting on you:** how many Paused issues serve the goal and wait on this person.

Send one card to the person § Goals names for that goal, with `send` and `questions`: one question
per goal, four goals at most. Each question is a multiple choice of the goal's Ready issues, the
ones you recommend first, one option per issue: its title, and in its description what it
unblocks and its size. The question's context, 200 characters at most, says how many issues wait
on their answer and names the oldest. `links` holds the goal's record alone, so the card belongs
to no issue: it pauses nothing and writes no checkpoint. Then end your turn.

The answer resumes this run. Read who answered: a maintainer of the goal's project, or the
answer changes nothing and your report says so. Then, among the issues this card offered and that
no mark has reached since, mark the picked ones `picked`, which § 2 launches at the next ticks,
and the others `declined`. An expiry resumes the run with no answer: no mark, no launch.

With no active goal, send the project's first active maintainer the head of the Ready issues that
are not tasks, five at most, the same way, under a goal you propose in one line; on their answer,
create it (`launch: ask`, `until` in 7 days, `owner` the maintainer who answered) with the picked
issues attached as `picked`.

*Done when* each person with a goal served as `ask` has today's card, or your report says what
kept it from being sent, and the date is in memory.

## Report

One line per wake: outages opened or closed, issues launched and under which goal, the card sent,
or « nothing to do ».
