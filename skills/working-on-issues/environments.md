# Environments

Where a routine runs changes its tools and its paths, never its rules. Read this at the start of
every run, then work out which case you are in.

## Which one am I on

| You have | You are on |
|---|---|
| `exec_command`, working in `/workspace` | **Standards**, the default, or a custom Standards environment |
| your own shell and file tools, plus `standards_read` and `standards_write` | a **harness**: Claude Code, Codex or Cursor |

## What differs

| | Standards | Harness |
|---|---|---|
| Records | `search`, `query`, `read`, `write`, `organize`, `delete` | the same verbs, as `standards_search`, `standards_query`, `standards_read`, `standards_write`, `standards_organize`, `standards_delete` |
| A skill's files | `/workspace/skills/<skill>/` | `$HOME/.standards/skills/<skill>/`, read-only, written when you read `skill:<skill>` with `standards_read` |
| Working directory | `/workspace` | `/vercel/sandbox/work` |
| Machine | Node 22, `git`, `gh`, sudo; install what a repository declares | Node 24, Python 3.14, the harness; install what a repository declares |
| GitHub | `git` and `gh`, as the person the run acts for | the same |
| Slack | Slack tools, when granted | the same |
| Sub-agents | your orchestration tools, and workflow scripts such as `dispatch.js` | your harness's own sub-agents; no workflow script |
| Paid by | the workspace's credits | the key's provider |

Where a skill names a path under `/workspace/skills/`, or a verb such as `write`, read it through
this table.

**A call needing a person's approval** (deleting, archiving, sending outside) changes nothing yet on
a harness. It raises an approval decision and returns at once. Never report it as done, and never
retry it.

**A workflow script on a harness:** do its phases yourself, in its order, with your own sub-agents.
Every rule stays: a juror is a fresh sub-agent that never saw the fix, the gate runs in full, and
each row is written as the skill says.

**A rule never bends to the machine.** A tool you lack is a reason to report it and stop, not to skip
a gate or a juror. Write a `signal` (`rule: environment_broken`) naming what is missing.

## Choosing one

This part is for `setting-up-the-factory`.

**Standards** needs no key and no setup, and is the recommendation for a first setup. A run installs
what a repository declares. A custom Standards environment is only for what cannot be installed on
each run (a service such as Docker or a database) or takes too long.

A **harness** runs a routine with the person's own coding agent and provider account:

| Harness | Variable to set | Where to get it |
|---|---|---|
| Claude Code | `CLAUDE_CODE_OAUTH_TOKEN`, or `ANTHROPIC_API_KEY` | `claude setup-token`, or the Anthropic console |
| Codex | `OPENAI_API_KEY` | the OpenAI platform |
| Cursor | `CURSOR_API_KEY` | a Cursor user API key |

- The person sets it in **Settings → Execution → Secrets**, never in the chat. Never ask for its value.
- A turn refused with `ENVIRONMENT_MODEL_ACCESS_MISSING` names the variable this instance needs: set
  that one. An instance may not accept `CLAUDE_CODE_OAUTH_TOKEN` yet, and then needs
  `ANTHROPIC_API_KEY`.
- The harness is chosen per routine, in its **Environment** row. That confirmation clears what a
  harness cannot honour: tools other than memory, GitHub, Slack and trusted MCP servers, delegation,
  the budget. The model is then picked in the prompt's footer, among that harness's models.
- Choosing it makes the person the author of the routine's triggers and schedule.
- **Intake** stays on Standards: it reads no code, and it holds no shell on purpose, since anyone in
  the channel can write to it.
- **Review** should use another model than **Build**, so the judge does not share the author's blind
  spots. With a single provider, pick another of its models.
