---
name: adding-repositories
description: Use when a maintainer asks to add a repository to the factory, change how one is gated, merged or run, or check that one is healthy. Proposes every repositories field with where it came from, runs the health check, refuses a repository with no gate, and writes the record only after an approval Décision naming the repository.
---

# Adding repositories

A `repositories` record holds only what the repository cannot say about itself: which branch work
targets, who merges, what proves a change, which paths a person approves, how the apps boot.
Required checks, agent rules (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules`) and scripts are read at
run time by every routine, never copied into the record. Once the record exists, the shared
routines serve it on their next pass: landing and waits sweep its pull requests, and release checks
its production branch hourly when others `consume` it. Nothing is bound per repository, so there is
no install step to re-run.

You run on request, in a conversation with a maintainer (the AI panel or Slack), never on a
schedule. Three requests:

| Asked | Do |
|---|---|
| add a repository | § 1 to § 5 |
| change a field of a repository | § 2 for that field, § 4 for the gate, § 5 |
| check a repository (is it healthy, why does the factory skip it) | § 3 only, then report; write nothing |

Read `asking-for-decisions` for the Décision of § 5, and `operating-the-factory` § 3 for why it is
needed: the operator reverts any agent write to `mode`, `method`, `source`, `verify`,
`pathGates`, `withheld`, `generated` or `environment`, and signals any agent-created record,
unless a maintainer of one of the repository's projects answered an approval Décision naming it
within the 24 hours before the write.

## 1. Which repository, which projects

1. List what the GitHub app sees with your GitHub tools. The repository the maintainer named is
   not among them: stop and ask them to grant the app access to it. Never change a GitHub setting,
   an app installation or a ruleset yourself.
2. A `repositories` record with that `fullName` exists: this is a change, not an addition.
3. Ask which projects it serves (`projects`, many). A project that does not exist yet is created
   only when the maintainer says so, with its `maintainers`.

## 2. Detect every field

Clone the repository fresh in your environment, then fetch into one folder, with your GitHub
tools, as JSON:

| File | What |
|---|---|
| `repo.json` | `GET /repos/{owner}/{repo}` |
| `branches.json` | `GET /repos/{owner}/{repo}/branches`, every page |
| `rules.json` | `GET /repos/{owner}/{repo}/rules/branches/{default branch}` |
| `protection.json` | `GET /repos/{owner}/{repo}/branches/{default branch}/protection` (a 404: write `{}`); its required checks join the rulesets' |
| `pulls.json` | the last 50 merged pull requests, with `baseRefName` and `headRefName` |

and `registered.json`: one `{ "fullName", "packages": [...] }` per repository already in the
workspace, the package names read from each one's `package.json` files. Then:

```bash
node detect.mjs --checkout <clone> --github <folder> --registered registered.json --format table
```

It prints every field with its proposed value and its source. Exit 1: the repository has no
required check and no verify command (§ 4). Exit 2: a usage or input error; fix the call.

What the script proposes is a draft; you own each value you put before the maintainer:

| Field | Proposed from | You check |
|---|---|---|
| `targetBranch`, `productionBranch`, `promotion`, `backMerge` | `develop` when it exists and most recent pull requests target it; the default branch otherwise | the repository's own docs say the same |
| `mode`, `method` | `queue` with a merge queue rule, else `human`; the queue's or the repository's merge method | `direct` is never proposed: only a maintainer asks for it |
| `source` | `ci` when the default branch requires checks (rulesets or classic branch protection), else `factory` | `both` only when the maintainer asks |
| `verify` | `package.json` scripts and the single-line `run:` steps of pull-request workflows | keep the commands that prove a change, cheapest first; drop duplicates and the ones that need a secret or a deployed service. Multi-line `run: \|` blocks are not read by the script: its source names the workflows that have them; re-read those yourself |
| `pathGates` | nothing | one line per path a maintainer or the agent rules name, `path: command` |
| `withheld`, `generated` | workflow and migration folders; files marked generated | add what the agent rules say a person approves or a generator owns |
| `sensitiveData` | tracked `.env` example files | ask what must never be quoted |
| `environment` | an Environment on the `standards-code` image holding this checkout | § 3 builds it |
| `boot`, `apps`, `reset` | `.claude/launch.json`, else the `dev` script; reset or seed scripts | § 3 runs them |
| `consumes` | dependencies on a package another registered repository publishes | each one is really consumed, not a stale devDependency |
| `deploySignal` | deploy workflows on the production branch | where production deploys are announced; empty means the dashboard shows « no deploy data » |
| `notes` | empty | only what the repository cannot say |

## 3. Health check

Run it on what you will save, and report each line as passed, failed (with the output that shows
why) or not run (and why):

1. **Access:** the repository, its rules and its pull requests read through the GitHub app.
2. **Environment:** the Environment builds with the repository checked out, from the
   `standards-code` image, with no production secret among its variables.
3. **Boot:** when `boot` is set, it starts in that Environment and every port of `apps` answers
   within three minutes.
4. **Verify:** on a fresh clone of `targetBranch`, every `verify` line passes; with `source` `ci`
   or `both`, the latest commit of `targetBranch` has every required check green.

A failed line does not stop you: it goes into the Décision of § 5 with the change it calls for
(drop a command, fix the setup script, start from another branch), and the maintainer rules. The
operator runs this same check once a day on every repository.

## 4. A gate, or no record

The factory never says a pull request is green without something that proves it:

| `source` | Needs |
|---|---|
| `ci` | at least one required check on the target branch |
| `factory` | at least one `verify` command |
| `both` | both |

A repository with neither required checks nor `verify` is **not saved**: say so to the
maintainer, with what would give it a gate (a command that proves a change, or a required check),
and stop. Never save a record whose `source` its gate cannot back.

## 5. Approval, then the write

1. Ask one approval Décision with `asking-for-decisions` § 3, even when the maintainer is in the
   conversation: the operator accepts the write on that answer only.
   - `to`: the maintainer who asked when they maintain one of the chosen projects, else the
     first active maintainer of the first chosen project;
   - `title`: « Add owner/repo to the factory » (or « Change <fields> of owner/repo »), the
     `fullName` written out;
   - the question: the table of every field you will write, its value and its source, then the
     health check lines, then the options **Save it** (recommended), **Change it** (say what) and
     **Do not add it**;
   - `links`: `record:projects:<id>` of each chosen project, and `record:repositories:<id>` for a
     change.
   It opens no wait and pauses nothing: there is no issue.
2. **Save it:** write the record (or the changed fields) within 24 hours of the answer, exactly
   as the Décision listed them. Past 24 hours, ask again. **Change it:** apply the change, rerun
   § 3 for what it touches and § 4, and ask again. **Do not add it:** write nothing.
3. Re-read the record and check every field you meant to write. Report what is saved, the
   Décision it rests on, and each health line.

## Report

The repository, each field with its value and source, the health check lines, the Décision and its
answer, and what you wrote (or why you wrote nothing).

## Red flags

- a field written before an approval Décision naming the repository was answered, or more than
  24 hours after it;
- a value the Décision did not list;
- a repository saved with no required check and no `verify`, or a `source` its gate cannot back;
- an agent rule, a required check list or a script copied into the record;
- a GitHub setting, ruleset or app installation changed by you;
- `mode: direct` proposed without a maintainer asking.
