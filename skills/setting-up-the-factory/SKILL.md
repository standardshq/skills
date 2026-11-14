---
name: setting-up-the-factory
description: Use when a person sets up Factory, adds a repository to it, changes its Slack channel, resets an old install, or asks why it skips a repository.
---

# Setting up the factory

You walk one person from "I added Factory" to a running pipeline. They may know none of these
terms.

- One question at a time, in the person's language, with no field names, tool names or ids.
- `request_setup` asks for what you lack on a card the person fills: a key, a catalog connector, or
  GitHub and Slack for the workspace. It ends your turn; resume when they continue.
- You change no GitHub setting; a pull request is yours to open only once the person says yes.
  `upsert_agent` shows a card the person approves, and switches nothing on. Switching a routine on,
  deleting one and creating an environment are the person's: say so plainly when you reach them, and
  give the exact steps.
- Safe to run again: read first. An existing record or trigger is shown and updated, never
  duplicated. Resume at the first step not done.

The factory is five routines: `intake` turns Slack messages into issues; `screening`, `build` and
`land` each work the issue or pull request their wake names; `ops` ticks over all of them
(`working-on-issues/workflow.md`).

`ops` runs on Standards, never on a harness, with no GitHub trigger: switch it on last. It starts
runs of the other routines, so the person who arms its schedule needs `agents:manage`; say so
before they switch it on.

| Asked | Do |
|---|---|
| set up Factory | § An old install when it applies, then every step, in order |
| add a repository | steps 1, 3, 4, 5 and 6, then the repository joins the environment (step 9) |
| change the Slack channel, or who may raise requests | step 7 |
| change where routines run | steps 2 and 9 |
| stop or restore the reports of empty runs | step 10 |
| reset an old install | § An old install |
| why does it skip this repository | § Why it skips; write nothing |

## An old install

Read the routines with `get_agents`. A routine named `triage`, `review` or `maintenance` comes from
the earlier Factory, and the pipeline does not run until it is gone. Name each one you find, linked
as `/routines/<id>`, and give the reset, in this order:

1. Switch off `triage`, `review` and `maintenance`, each on its page.
2. Update the Factory bundle from where they added it.
3. Delete `triage`, `review` and `maintenance`.

Resume when they return, and read again: name any of the three still there.

*Done when* `get_agents` lists none of the three.

## 1. Connections

With no sandbox tool here, say this needs the general chat and stop: that is not a missing link.

Read `get_agents`, `include: ["available"]`. In `available.toolGroups.kinds`, `github` and
`slack.read` list the workspace's installations under `resources`, whose `id` you use below; empty
means not installed. Check the person's own account with `gh auth status` in your sandbox.

What is not installed, ask for on one card: `request_setup` with `kind: "connector"`, `provider`
`"github"` and, unless they already said no, `"slack"`, each with a one-line `reason`. The card opens
the provider's own install, so the card is the one place to send them.

- **GitHub is required:** the routines read the code and open pull requests with the GitHub account
  of the person who switches them on, with no fallback. When `gh auth status` fails, send them to
  **Connectors → GitHub → Link my account**. Stop here until both work, and resume when they return.
- **Slack is recommended:** without it, issues are only created in the app. If they skip it, tell
  them Intake cannot be switched on until Slack is connected, and they can come back and ask. Skip
  step 7.

## 2. Who runs the routines

Read `environments.md` in `working-on-issues`, § Choosing one, and follow it. Ask who should run
`screening`, `build` and `land`: Standards, which needs nothing and is what you recommend for a first
setup, or a coding agent they already pay for (Claude Code, Codex or Cursor). The harness is picked
apart from the environment, on each routine's **Environment** row (step 9). Intake stays on
Standards.

For a coding agent, read the key names in `get_agents`, `include: ["available"]`, and ask for a
missing key with `request_setup`: `kind: "env_var"`, its `key`, plain `instructions` saying what to
create, and the https `url` where to create it. The card stores the value without showing it to you,
so the chat never holds it. Have them choose the whole workspace, so every routine can use it.

## 3. Repositories

List what the GitHub app sees: `gh api /user/installations`, then
`gh api --paginate /user/installations/<id>/repositories`. A `projects` record with that `fullName` is
already active: say so. Ask which ones to activate. One is missing: ask them to grant the app access
to it on GitHub, and wait.

## 4. Projects

Propose a grouping from what GitHub shows: repositories that depend on each other, the organisation,
names and descriptions. Write it in plain sentences: "I would put the app and the site under one
project called Acme, and keep the docs apart." The person corrects or accepts.
**Nothing is written before they accept.**

## 5. Write the projects

- A group: reuse its root if it exists, else create it first, with no `fullName`. Then each
  repository with `write` and `parent: record:<id>`, one per call.
- A repository alone: one record with its `fullName`, no parent.
- `maintainers` is the person. `context` is drafted from each README: what it is, what belongs
  there and what does not, since Intake routes on it.
- That `fullName` already exists: show the record and update it. Regrouping uses `organize`, action
  `file_under`.

## 6. Each repository's rules

The routines read a repository's rules from its target branch at every run, so what the factory may
do there lives in the repository itself. For each repository:

1. Read its facts (`working-on-issues` § Repository facts) and report them in a sentence or two, with
   anything unproven: "A person will merge here, there is no merge queue." Every repository is
   accepted, with nothing to approve. Facts you cannot read: say so and go on to the next
   repository; the routines read them on their first pass.
2. Ask whether runs may publish the running app on a private link, so the person sees the real
   screen beside a mockup or before a merge. Off unless they say yes.
3. When `mode` is not `queue`, ask whether Land may merge itself once its judge says go. Otherwise
   a person merges each pull request, on a Decision Land sends them.
4. When none of `AGENTS.md`, `CLAUDE.md` and `CONTRIBUTING.md` on the target branch has a
   `## Verification` section that lists commands, propose the commands that must pass before a pull request opens,
   starting from `verify`, and let them correct the list. Build runs exactly these.
5. Anything to add (a yes, or the commands): show the lines, and on their yes open one pull request
   on the target branch, branch `chore/factory-setup`, adding them to that repository's `AGENTS.md`
   (an existing `## Factory` section gains the lines). Tell them the routines follow it once it is
   merged.

```markdown
## Factory

- links: on
- merge: direct

## Verification

- `pnpm lint`
- `pnpm test`
```

*Done when* every repository has its answers, and a pull request link or "nothing to add".

## 7. Intake's trigger

A routine with nothing to fire cannot be switched on, so this comes first. Ask which Slack
channel requests arrive in, then who may raise them: everyone in the channel, or named people.

Find the ids with `slack_find`, or ask for the channel's link: its id follows `/archives/`. Always
name the channel in `channels`: an empty list listens to every channel. A public channel is joined
on save; a private one needs `/invite @Standards` before the card. Read `intake` with `get_agents`
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

## 8. GitHub access

Add GitHub to `screening`, `build` and `land`, one `upsert_agent` card each, grouped in one message
so they can approve them in a row. `toolGroups` replaces the whole list: read each routine with
`get_agents` (`id`) and send its list plus `github:<id>` for **every** installation in `resources`,
with its `revision`. A routine granted a different installation than the person's link gets no
token; extra grants are harmless. Skip one that already holds them all.

## 9. The Factory environment

`screening`, `build` and `land` run on one environment, `Factory`, holding every repository: a run on
a clock has no repository of its own to pick one by. Ask whether the **Environment** row of `build`
already shows `Factory`. If so, a repository missing from it is added, and whoever created it builds
it again.

If not, read what each listed repository asks for (`engines`, `packageManager`, lockfile, other
manifests), install it in your sandbox and run the repository's install, then give the values to
enter from that row, **New environment** (not offered: this instance cannot create one, ask an
admin):

- name: `Factory`
- accepted harnesses: the one chosen in step 2, plus Standards
- visibility: Workspace, accepting the shared machine notice
- repositories: every listed repository
- setup script: only what failed or took too long in your sandbox (a service such as Docker or a
  database), with no secret, since members can read the machine; none when every install worked

They choose the **Build** button at the top of the environment dialog; if it fails, read its last
lines with them and correct the script. Once built, on the **Environment** row of `screening`,
`build` and `land` they pick the `Factory` environment and the harness chosen in step 2, and accept
the confirmation; then the model in the prompt's footer, Land another than Build. With a coding
agent, they check the row is not greyed: a coding agent without its key is.

*Done when* the three routines show `Factory` and their harness in their **Environment** row.

## 10. Empty runs

Screening and Land run every quarter of an hour, Build every half hour. A run that finds nothing in
its pipe sends a one-line report to Decisions. Ask whether they want those reports. Kept unless they
say no.

On no: for `screening`, `build` and `land`, read each with `get_agents` (`id`) for its `systemPrompt`
and `revision`, and send one `upsert_agent` card each, grouped in one message, with the prompt as it
is plus, as its last line: « When your pipe is empty, end the run without sending anything. » Skip a
routine whose prompt already ends with it. On a later yes, the same cards remove that line.

*Done when* their answer is applied to the three routines, or kept.

## 11. Switch them on

List the routines not yet on (`get_agents` returns `active`), each linked as `/routines/<id>`; three
without Slack. Each has a switch on its page. They should switch all of them themselves: anyone else
must choose **Link my account** first, and those routines then act as them.

- **Intake** turns a Slack message into issues, or asks in its thread.
- **Screening** checks each new issue against the code and readies it, or asks a ruling.
- **Build** turns a launched issue into a pull request.
- **Land** judges pull requests, fixes red ones, merges or asks a person to.

Questions to people arrive in **Decisions**.

## 12. First test

Suggest one real test: post a message in the channel and watch the issue appear. Without Slack,
create an issue in the app and watch Screening pick it up within a quarter of an hour.

## Why it skips

Check in order, and answer in a sentence or two:

1. A `projects` record has that `fullName`.
2. The GitHub app sees the repository for this person. If someone else switched the routines on,
   their access is what counts: ask them to check.
3. The `Factory` environment holds the repository.
4. `screening`, `build` and `land` hold the GitHub access, run on `Factory` and are switched on, and
   no `triage`, `review` or `maintenance` routine remains (§ An old install).
5. `working-on-issues` § Repository facts runs. A repository with nothing proving a change is not
   skipped: Land asks a person to merge each pull request.
