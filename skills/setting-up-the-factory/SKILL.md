---
name: setting-up-the-factory
description: Use when a person sets up Factory, adds a repository to it, changes its Slack channel, or asks why it skips a repository.
---

# Setting up the factory

You walk one person from "I added Factory" to a running pipeline. They may know none of these
terms.

- One question at a time, in the person's language, with no field names, tool names or ids.
- You never change a GitHub setting. `upsert_agent` shows a card the person approves, and switches
  nothing on. You cannot switch a routine on or create an environment: say so plainly when you reach
  them, and give the exact steps.
- Safe to run again: read first. An existing record or trigger is shown and updated, never
  duplicated. Resume at the first step not done.

| Asked | Do |
|---|---|
| set up Factory | every step, in order |
| add a repository | steps 1 to 4; ask whether they have a Factory environment, and if so, the end of step 7 |
| change the Slack channel, or who may raise requests | step 5 |
| why does it skip this repository | § Why it skips; write nothing |

## 1. Connections

With no sandbox tool here, say this needs the general chat and stop: that is not a missing link.

Read `get_agents`, `include: ["available"]`. In `available.toolGroups.kinds`, `github` and
`slack.read` list the workspace's installations under `resources`, whose `id` you use below; empty
means not installed. Check the person's own account with `gh auth status` in your sandbox.

- **GitHub is required:** the routines read the code and open pull requests with the GitHub account
  of the person who switches them on, with no fallback. Send them to **Settings →
  Workspace integrations**: **Install for workspace** when there is no installation, **Link my
  account** when `gh auth status` fails. Stop here until both work, and resume when they return.
- **Slack is recommended:** without it, issues are only created in the app. If they skip it, tell
  them Intake cannot be switched on until Slack is connected, and they can come back and ask. Skip
  step 5.

## 2. Repositories

List what the GitHub app sees: `gh api /user/installations`, then
`gh api --paginate /user/installations/<id>/repositories`. A `projects` record with that `fullName` is
already active: say so. Ask which ones to activate. One is missing: ask them to grant the app access
to it on GitHub, and wait.

## 3. Projects

Propose a grouping from what GitHub shows: repositories that depend on each other, the organisation,
names and descriptions. Write it in plain sentences: "I would put the app and the site under one
project called Acme, and keep the docs apart." The person corrects or accepts.
**Nothing is written before they accept.**

## 4. Write the projects

- A group: reuse its root if it exists, else create it first, with no `fullName`. Then each
  repository with `write` and `parent: record:<id>`, one per call.
- A repository alone: one record with its `fullName`, no parent.
- `maintainers` is the person. `context` is drafted from each README: what it is and what belongs
  there, since Intake routes on it. Leave `notes` empty: only a person writes it.
- That `fullName` already exists: show the record and update it. Regrouping uses `organize`, action
  `file_under`.

Then read each repository's facts (`working-on-issues` § Repository facts) and report them in a
sentence or two, with anything unproven: "A person will merge here, there is no merge queue."
"Nothing proves a change here yet, so the factory will ask someone each time." Never a table, and
nothing to approve: every repository is accepted. If they find it too strict, a `## Factory` section
in the repository's `AGENTS.md` on the target branch corrects it. If you cannot read the facts, say
so and go on: the routines read them on their first pass.

## 5. Intake's trigger

A routine with nothing to fire cannot be switched on, so this comes first. Ask which Slack
channel requests arrive in, then who may raise them: everyone in the channel, or named people.

Find the ids with `slack_find`, or ask for the channel's link: its id follows `/archives/`. Never
send an empty `channels`: that listens to every channel. A public channel is joined on save; a
private one needs `/invite @Standards` before the card. Read `intake` with `get_agents`
(`id`) for its `revision`, then `upsert_agent`:

```json
{
  "id": "<intake>",
  "revision": "<revision>",
  "triggers": [{
    "eventType": "slack",
    "connectionId": "<Slack installation id>",
    "match": { "on": "message", "channels": ["<channel id>"], "sender": "human", "conditions": [] },
    "continueConversation": true
  }]
}
```

- `sender` is `"human"` for everyone, bots excluded, or `{ "users": ["<Slack user id>"] }`.
- No `position` condition: messages and replies both wake it.
- A trigger already there (`get_agents` shows its `id`, not its channel): pass that `id`, and ask
  them to confirm the channel on the routine's page.

## 6. GitHub access

Add GitHub to `triage`, `build`, `review` and `maintenance`, one `upsert_agent` card each, grouped in
one message so they can approve them in a row. `toolGroups` replaces the whole list: read each routine with `get_agents` (`id`) and send its list plus
`github:<id>` for **every** installation in `resources`, with its `revision`. A routine granted a
different installation than the person's link gets no token; extra grants are harmless. Skip one
that already holds them all.

## 7. What the repositories need

Read what each listed repository asks for (`engines`, `packageManager`, lockfile, other manifests),
install it in your sandbox and run the repository's install. If that works, say nothing about
environments: every run installs what a repository declares.

It needs an environment only when something cannot be installed this way (a service such as Docker
or a database) or takes too long on each run. Ask whether the **Environment** row of `build` already
shows `Factory`; if so, skip to attaching or rebuilding. If not, give the values to enter from that
row, **New environment** (not offered: this instance cannot create one, ask an admin):

- name: `Factory`
- harness: Standards, no API key needed
- visibility: Workspace, accepting the shared machine notice
- repositories: every listed repository
- setup script: one you write for them to paste, installing what each repository needs, with no
  secret, since members can read the machine

They choose the **Build** button at the top of the environment dialog; if it fails, read its last
lines with them and correct the script. Once built, they choose it in the **Environment** row of
`triage`, `build`, `review` and `maintenance`. Adding a repository later: it joins this environment too, and whoever created it builds it again.

## 8. Switch them on

List the routines not yet on (`get_agents` returns `active`), each linked as `/routines/<id>`; four
without Slack. Each has a switch on its page. They should switch all of them themselves: anyone else
must choose **Link my account** first, and those routines then act as them.

- **Intake** turns a Slack message into an issue.
- **Triage** checks an issue is true, then assesses features.
- **Build** turns a started issue into a pull request.
- **Review** judges pull requests, fixes red ones, merges.
- **Maintenance** wakes waiting issues, catches stuck work, measures, carries releases, runs scouts.

## 9. First test

Suggest one real test: post a message in the channel and watch the issue appear. Without Slack,
create an issue in the app and watch Triage pick it up.

## Why it skips

Check in order, and answer in a sentence or two:

1. A `projects` record has that `fullName`.
2. The GitHub app sees the repository for this person. If someone else switched the routines on,
   their access is what counts: ask them to check.
3. `triage`, `build`, `review` and `maintenance` hold the GitHub access and are switched on.
4. `working-on-issues` § Repository facts runs. A repository with nothing proving a change is not
   skipped: Review asks a person each time.
