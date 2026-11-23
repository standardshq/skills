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
them first.

| Wake | Do |
|---|---|
| the 15-minute tick | § 1, then § 2 |
| the first tick after 07:00 on a weekday, in the maintainer's timezone, whose date is newer than the last proposal in memory | § 1, § 2, then § 3 |
| a goal created | § 1, § 2, then § 3 for that goal |

Watching comes first at every wake, so a launch that fails still leaves its alert sent.

## 1. Watch

Read the runs of Intake, Screening, Build and Land since the last tick
(`working-on-issues/environments.md` § Runs), the issues that are not Done with the time of their
latest status move, and check that `gh api rate_limit` answers.

A stage is **stopped** when a row holds:

| Sign | Stopped since |
|---|---|
| Build, Land or Screening has work in its pipe and no run that ended well for 2 hours, counted inside its working hours (`workflow.md`, Working hours) | its last run that ended well |
| an issue In progress with no live run, no open pull request and no row for 1 hour | its move to In progress |
| a pull request with `factory:go`, neither merged, enqueued nor `factory:waiting`, for 2 hours | its verdict |
| GitHub refuses the factory's account on two ticks in a row | the first refusal |
| the day's spend of the routines, when your tools read it, passes 80 %, then 100 %, of the budget the project's `context` names | the tick that saw it |

**An outage opens once.** A sign with no open outage in memory: write the outage in memory, then
tell the project's first active maintainer with `send`, no question, and a direct Slack message
when your list holds Slack tools:

```
<What stopped> since <time, in their timezone>.
Waiting on it: <n> issues, <the urgent ones by title>.
Likely cause: <one line from the failed run's error or the refusal>.
```

**Outside 07:00 to 19:00 on weekdays, in the maintainer's timezone,** keep the outage in memory
and send nothing; the day's first tick after 07:00 sends every open one in a single message. An outage that holds
an issue of priority `p1_urgent` is sent at once, whatever the hour.

**An outage closes once.** Its sign no longer holds: send « <What stopped> is running again since
<time>, stopped for <duration> » in the same thread, and remove it from memory. An outage still
open 4 hours after its alert gets one reminder, then none.

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
| `issues` | the issues you attached, each marked `proposed`, `picked`, `launched` or `declined` |

A goal whose `owner` is a maintainer of its project (`maintainers`, walking up to the root) is the
grant you launch under. Any other goal is served as `launch: ask`, its card (§ 3) sent to the
project's first active maintainer.

## 2. Serve the goals

For each `active` goal, oldest first:

1. **End it** when `until` has passed, or when every attached issue is Done and the Ready and
   Backlog issues of the project hold nothing that fits its `title`: `status: ended` or `reached`,
   and one message to its `owner`: launched, merged, still open, by title.
2. **Count** its issues In progress. At or over `limit`: nothing to launch.
3. **Pick** the next issue: with `launch: ask`, among those marked `picked` (§ 3); with `launch: auto`, among the project's Ready issues that fit the `title`
   and respect the `guidance`. By `priority`, empty last, then oldest. Leave one that
   `operating-the-factory` § Holds names.
4. **Launch** it: write a `signal` row on the issue, `Rule: goal_launch`, quoting the goal's
   `title`, its `owner` and date, and the answer when one picked it; then `status: in_progress`;
   then mark it `launched` on the goal. Re-read the issue. One launch per goal per tick.

You launch from Ready, and only what `operating-the-factory` § Holds leaves free.

*Done when* each active goal is ended, at its limit, has one more issue In progress under its
`signal` row, or the reason nothing was launched is in your report.

## 3. Propose the day

Once per person per day, on the day's first tick or when their goal is created. For each `active`
goal, read the project's open issues and sort the ones that fit:

- **Ready now:** what you would launch, in order, with one line each: what it unblocks, its size.
- **Waiting on you:** Paused issues that serve the goal and wait on this person, each by title,
  with what is asked.

Send one card to the goal's `owner` with `send` and `questions`: one question per goal, four goals
at most, each a multiple choice of its Ready issues with the ones you recommend first, and the
waiting ones listed in its context. Its `links` name the goal's record, and no issue: the card
pauses nothing and writes no checkpoint. Mark each issue offered `proposed` on the goal, then end
your turn.

The answer resumes this run: mark the issues picked `picked`, which § 2 launches at the next
ticks, and the others `declined`, which are left out of later cards for that goal. An expiry
resumes it with no answer: every issue stays `proposed`, and nothing is launched.

With no active goal, send the project's first active maintainer the head of Ready, five at most,
the same way, under a goal you propose in one line; on their answer, create it (`launch: ask`,
`until` in 7 days, `owner` that person) with the picked issues attached as `picked`.

*Done when* each person with an active goal has today's card, or your report says what kept it
from being sent, and the date is in memory.

## Report

One line per wake that did something: outages opened or closed, issues launched and under which
goal, the card sent. A wake that found nothing to do sends nothing.
