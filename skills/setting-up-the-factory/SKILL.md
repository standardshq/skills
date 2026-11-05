---
name: setting-up-the-factory
description: Use when a person sets up Factory, adds a repository to it, changes its Slack channel, or asks why it skips a repository.
---

# Setting up the factory

You walk one person from "I added Factory" to a running pipeline, in one conversation. They may
know none of these terms.

- One question at a time, in the person's language, with no field names, tool names or ids.
- Say in a sentence what you found and what comes next, then wait.
- You never change a GitHub setting. You cannot switch a routine on or create an environment: say
  so plainly when you reach them, and give the exact steps.
- Safe to run again: read first. An existing record or trigger is shown and updated, never
  duplicated. Resume at the first step not done.

| Asked | Do |
|---|---|
| set up Factory | every step, in order |
| add a repository | steps 1 to 4, then add it to the Factory environment if there is one |
| change the Slack channel, or who may raise requests | step 5 |
| why does it skip this repository | § Why it skips; write nothing |

## 1. Connections

Read the workspace with `get_agents`, `include: ["available"]`. `available.toolGroups.kinds` holds
one entry per kind: `github` and `slack.read` each list the workspace's installations under
`resources`, whose `id` you use below. An empty list means not installed. That says nothing about
the person's own account: check it with `gh auth status` in your sandbox.

- **GitHub is required.** Explain why: the routines read the code and open pull requests with the
  GitHub account of the person who sets them up. Send them to **Settings → Workspace integrations**:
  **Install for workspace** when there is no installation, **Link my account** when `gh auth status`
  fails. Stop here until both work, and resume when they return.
- **Slack is recommended.** Without it, issues are only created in the app. They may skip it; then
  skip step 5 and leave Intake off.

## 2. Repositories

List what the GitHub app sees for this person: `gh api /user/installations`, then
`gh api --paginate /user/installations/<id>/repositories`. Read the `projects` records too: one with
a `fullName` is already active, so say so. Ask which ones to activate.

A repository is missing: ask them to grant the app access to it on GitHub, and wait.

## 3. Projects

Propose a grouping from what GitHub shows: repositories that depend on each other, the organisation,
names and descriptions. Write it in plain sentences: "I would put the app and the site together
under one project called Acme, and keep the docs on their own." The person corrects or accepts.
**Nothing is written before they accept.**

## 4. Write the projects

`projects` records hold `name`, `context`, `maintainers`, `fullName` and `notes`.

- A group: create the root first, with no `fullName`. Then each repository with `write` and
  `parent: record:<id>`, one per call.
- A repository alone: one record with its `fullName`, no parent.
- `maintainers` is the person. `context` is drafted from each README: what it is and what belongs
  there, since Intake routes on it. Leave `notes` empty: only a person writes it.
- A record with that `fullName` already exists: show it and update it. Regrouping moves it with
  `organize`.

Then read each repository's facts (`working-on-issues` § Repository facts) and report what you found
in a sentence or two, with anything unproven: "A person will merge here, there is no merge queue."
"Nothing proves a change here yet, so the factory will ask someone each time." Never a table, and
nothing to approve: every repository is accepted. If they find it too strict, a `## Factory` section
in the repository's `AGENTS.md` on the target branch corrects it.

If your sandbox lacks the tools to read them, say so, do step 7 first, and leave the facts to the
routines' first pass.

## 5. Intake's trigger

This comes before any switch: a routine with nothing to fire cannot be switched on, and adding the
bundle leaves Intake without a trigger. Ask which Slack channel requests arrive in. Then ask who may raise
them: everyone in the channel, or named people.

Find the ids with `slack_find`, or ask for the channel's link, whose last part is its id. Never send
an empty `channels`: that listens to every channel. Read `intake` with `get_agents` (`id`) for its
`revision`, then `upsert_agent`:

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
- No `position` condition: top-level messages and replies both wake it.
- A trigger already there (`get_agents` shows its `id`, not its channel): pass that `id` to update
  it, and ask the person to confirm the channel they see on the routine's page.
- A public channel is joined on save. A private one needs `/invite @Standards` in Slack, then
  **Refresh** in the channel picker of the routine's **Triggers** section.

The person approves it on a card. A card never switches anything on.

## 6. GitHub access

Add the GitHub installation to `triage`, `build`, `review` and `maintenance`, one `upsert_agent` card
each, grouped in one message: "Four cards, the same thing each time, you can approve them in a row."
`toolGroups` replaces the whole list, so read each routine with `get_agents` (`id`), send its list
plus `github:<GitHub installation id>` with its `revision`, and skip one that already holds it.

## 7. Environment

In your sandbox, run `node --version` and `pnpm --version` and compare them with what a listed
repository asks for (`engines`, `packageManager`, its lockfile).

- **They work:** say nothing is needed. Offer an environment only when a repository needs tools that
  are missing.
- **They do not:** say plainly that this chat cannot create it, and give the exact values to enter
  from the **Environment** row of the `build` routine's page, **New environment**:
  - name: `Factory`
  - harness: Standards, which needs no API key (the image stays Documents)
  - visibility: Workspace, accepting the shared machine notice
  - repositories: every listed repository
  - setup script: one you write for them to paste, installing Node and pnpm at the versions the
    repositories ask for, plus what each repository's facts show it needs (`verify`, `boot`). If you
    could not read the facts yet, go by its manifests and lockfile. No secret in it: members can
    read the machine.

  They choose **Build**. A failed build: read its last lines with them and correct the script. Once
  built, they choose it in the **Environment** row of `triage`, `build`, `review` and `maintenance`.

Adding a repository later: it joins this environment too, and they build it again.

## 8. Switch them on

Say plainly that you cannot do this: each routine has its own switch on its page, and it acts with
the GitHub account of whoever switches it on. List the five, each linked as `/routines/<id>`:

- **Intake** turns a Slack message into an issue.
- **Triage** checks an issue is true, then assesses features.
- **Build** turns a started issue into a pull request.
- **Review** judges pull requests, fixes red ones, merges.
- **Maintenance** wakes waiting issues, catches stuck work, measures, carries releases, runs scouts.

## 9. First test

Suggest one real test: post a message in the channel and watch the issue appear. Tell them they can
come back and ask you to change the channel or add a repository.

## Why it skips

Check in this order, and answer in a sentence or two:

1. A `projects` record has that `fullName`.
2. The GitHub app sees the repository for this person.
3. `triage`, `build`, `review` and `maintenance` hold the GitHub access and are switched on.
4. `working-on-issues` § Repository facts runs. A repository with nothing proving a change is not
   skipped: Review asks a person each time.
