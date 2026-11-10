# Environments

Where a routine runs changes its tools and its paths, never its rules.

Screening, Build and Land run on one fixed environment, `Factory`, holding every repository of the
factory. Each run gets its own machine, so it clones and installs every time; a Land run woken by a
pull request event starts with that pull request's repository. Intake runs on Standards, with a sandbox it only reads
code in (`curating-requests` § Reading the code).

## Which one am I on

| You have | You are on |
|---|---|
| `exec_command`, working in `/workspace` | **Standards**, the default, or a custom Standards environment |
| your own shell and file tools, plus `standards_read` and `standards_write` | a **harness**: Claude Code, Codex or Cursor |

## What differs

| | Standards | Harness |
|---|---|---|
| Records | `search`, `query`, `read`, `write`, `organize`, `delete` | the same verbs, as `standards_search`, `standards_query`, `standards_read`, `standards_write`, `standards_organize`, `standards_delete` |
| A skill's files (the skills folder) | `/workspace/skills/<skill>/` | `$HOME/.standards/skills/<skill>/` (`$HOME` is often `/vercel`), read-only, written when you read `skill:<skill>` with `standards_read`: read every skill you will run a script of before running it |
| Working directory | `/workspace` | `/vercel/sandbox/work` |
| Machine | Node 22, `git`, `gh`, sudo; install what a repository declares | Node 24, Python 3.14, the harness; install what a repository declares |
| GitHub | `git` and `gh`, as the person the run acts for | the same |
| Slack | Slack tools, when granted | the same |
| Sub-agents | your orchestration tools | your harness's own sub-agents |
| Paid by | the workspace's credits | the key's provider |

Where a skill names the skills folder, a path under `/workspace/skills/`, or a verb such as
`write`, read it through this table.

**`gh` outside a checkout:** your working directory is rarely a clone, so pass `-R <owner/repo>`
to every `gh pr` and `gh issue` command. The machine's `gh` may be older than its docs: a JSON
field it refuses is read with `gh api` instead, never guessed.

**A `send` refused as a repeat** was already delivered: never send it again, and never reword it to
pass the check.

**Long commands:** your shell may refuse a bare `sleep`. Start a long command in the background and
poll for its end, and run the repository's checks scoped to what changed when its rules allow it:
the PR's CI runs the rest.

**A call needing a person's approval** (deleting, archiving, sending outside) changes nothing yet on
a harness. It raises an approval decision and returns at once. Never report it as done, and never
retry it.

**Sub-agents on a harness:** every rule stays: a judge is a fresh sub-agent that never saw the
fix, the gate runs in full, and each row is written as the skill says.

**A rule never bends to the machine.** A tool you lack is a reason to report it and stop, keeping
every gate and juror: a refusal (`SKILL.md` § Refusals), `Rule: environment_broken`, naming what is
missing. A routine run cannot ask for a key: `request_setup` offers keys only to a
person in a conversation.

**Published links** (`*.standards.run`, `publish_port`, on the Standards agent only): publish the
running app, and attach its link to a `design` Decision, to Merge it or to Land's verify step, only
when the repository's facts say `links: true`. No link is published
otherwise.

## Choosing one

This part is for `setting-up-the-factory`.

**Standards** needs no key and no setup, and is the recommendation for a first setup. The `Factory`
environment is a Standards environment holding every repository of the factory; a run installs what
a repository declares. Add to it only what cannot be installed on each run (a service such as Docker
or a database) or takes too long.

**Links** are off by default. Ask the person, per repository, whether runs may publish the running
app; on yes, write `links: on` under the `## Factory` section of that repository's `AGENTS.md`.

A **harness** runs a routine with the person's own coding agent and provider account:

| Harness | Variable to set | Where to get it |
|---|---|---|
| Claude Code | `CLAUDE_CODE_OAUTH_TOKEN`, or `ANTHROPIC_API_KEY` | `claude setup-token`, or the Anthropic console |
| Codex | `OPENAI_API_KEY` | the OpenAI platform |
| Cursor | `CURSOR_API_KEY` | a Cursor user API key |

- In a conversation, ask for it with `request_setup` (`kind: "env_var"`): the card stores the value
  without showing it to you. Otherwise the person sets it in **Settings → Execution → Secrets**. Never
  ask for its value in the chat.
- A turn refused with `ENVIRONMENT_MODEL_ACCESS_MISSING` names the variable this instance needs: set
  that one. An instance may not accept `CLAUDE_CODE_OAUTH_TOKEN` yet, and then needs
  `ANTHROPIC_API_KEY`.
- An environment lists the harnesses it accepts (`acceptedHarnesses`). A routine's **Environment**
  row pairs a harness with an environment: the person picks both there. That confirmation clears
  what a harness cannot honour: tools other than memory, GitHub, Slack and trusted MCP servers,
  delegation, the budget. The model is then picked in the prompt's footer, among that harness's
  models.
- Choosing it makes the person the author of the routine's triggers and schedule.
- **Intake** stays on Standards: anyone in the channel can write to it, so it reads code and runs
  nothing the repository ships (`curating-requests` § Reading the code).
- **Land** uses another model than **Build**, so the judge does not share the author's blind spots.
  With a single provider, pick another of its models.
