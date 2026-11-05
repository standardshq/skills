---
name: releasing-downstream
description: Use when the Maintenance routine runs, on its hourly pass over the repositories other repositories consume. Finds a release not yet recorded, idempotent by sha and tag, and opens one release umbrella, one bump issue per consuming repository under it, and blocker waits on those bumps for the issues waiting on that release.
---

# Releasing downstream

A repository others consume ships a release; the repositories that consume it do not have it yet.
The release is delivered when each consumer has bumped to it, and every issue that was waiting on
the upstream change waits on its consumer's bump, not on the upstream merge.

Read `working-on-issues` first: § Pausing for the waits you write, `evidence-kinds.md` for their
fields, `read-recipe.md` before you touch an issue. You create issues and waits; you never wake an
issue, resolve a wait, claim a lease or write code. Promotion (`develop` → `main`) is not yours:
it is an ordinary issue of the repository.

## 1. Is there a new release?

No event announces a merge to you: you look. **The repositories to check** come from discovery
(`working-on-issues` § Repository facts): run it on every repository of the workspace, with
`--listed` naming each one's packages (the `name` of every `package.json` its manifests hold,
read with the GitHub tools), and read its `consumes`. A repository some other one lists
in `consumes` is released; the repositories listing it are its `consumedBy`. The hourly pass checks
every released repository, one at a time (a failure on one never stops the next: note it in your
report and go on). When any repository's discovery failed, its `consumes` are unknown, so any other repository could
be one it consumes and a bump could be missed: skip every release pass of this run and say so in
your report.

**The last release you recorded** is the sha in the `context` of the newest release umbrella of
that repository (title « Release owner/repo <version> »). It is the only cursor, and the sha (and
its tag, when the repository tags releases) is the key: a release is opened once.

| The repository | Its candidate release |
|---|---|
| has a deploy workflow (its discovered `deployWorkflows`) | the commit of the latest successful run of that workflow on its `productionBranch`, read with the GitHub tools: a merge alone is not its release |
| has none | the head of its `productionBranch`, read with the GitHub tools (the newest tag on it, when the repository tags releases) |

Then stop for that repository, writing nothing, when any holds:

- no `projects` record has that `fullName`, or no other repository lists it in `consumes`;
- the candidate's sha is the last release you recorded, or an ancestor of it;
- a release umbrella for that repository and that sha (or tag) exists: another run already
  opened it;
- every consumer already depends on the candidate's version (read their `package.json` with the
  GitHub tools, before any checkout): nothing to bump, and nothing to record.

**The version** is what consumers bump to: the `version` of each released package at that commit
(`package.json`), or the tag on the commit when the repository tags releases. Read it at that
commit, in a checkout or with the GitHub tools; never infer it from a message.

## 2. What the release carries

In a checkout of the repository, list the commits between the previous release (the sha in the
`context` of the latest release umbrella of this repository; none: the last 50 commits of
`productionBranch`) and this one. Each pull request merged in that range (`(#N)` in a squash or
merge subject) is `owner/repo#N`. **The released issues** are the issues whose `pullRequests` name
one of them.

## 3. The release umbrella

One issue, filed on the released repository's own `projects` record:

| Field | Value |
|---|---|
| `title` | « Release owner/repo <version> » |
| `type` | `chore` |
| `origin` | `release` |
| `problem` | what shipped: the released pull requests and issues, one line each, `issues:<id>` |
| `context` | the commit sha (and tag), the previous release's sha, and what found it (the hourly pass, or its deploy workflow run) |
| `acceptance` | every consuming repository runs <version> |
| `status` | `backlog` |

It is a container (it gets tasks): screening never screens it, nobody launches it, and the
Maintenance routine closes it once every bump is `done` (`waking-issues` § 5).

Create the bumps of § 4 right after it, before anything else. Until it has tasks, screening
leaves it alone (`screening-issues` § The fence: `origin: release`, no `parent`, no task yet).

## 4. One bump issue per consumed package

The released repository may publish several packages. For each repository in `consumedBy`, find its `projects` record by `fullName`: none matches, no record: no bump, name it in your report. Otherwise read
in its checkout the dependencies of every `package.json` it holds, and keep the released
repository's packages it depends on at another version than the released one. None: no bump for
that consumer, and say so in your report.
For each package kept, one bump issue:

| Field | Value |
|---|---|
| `title` | « Bump <package> to <version> in consumer/repo » |
| `type` | `chore` |
| `origin` | `release` |
| `project` | the consuming repository's own `projects` record |
| `parent` | `record:<release umbrella id>`, set on creation: a bump is created with `write`, one per call |
| `problem` | the consumer depends on <the package> at <its current version>; <version> carries the released issues |
| `acceptance` | the consumer's dependency on <the package> is <version>, its lockfile matches, and its `verify` passes on the bump's pull request |
| `context` | the release umbrella, the released pull requests, and every issue § 5 puts behind this bump |
| `status` | `backlog` |

A bump is a task of an umbrella: screening screens it, and a person's drag to `ready` launches it
(`working-on-issues` § Launch). You never move it further. An open bump issue for an older version
of the same package in that consumer, not yet launched: append the new version to its `context`
instead of a second bump, and file it under this umbrella too (`organize`, action `file_under`) only if it has no parent.

## 5. Issues waiting on the release

An issue waits on this release when its work in a consuming repository needs a released change:

- it has a `blocker` wait, open or resolved since the previous release, whose `target` is
  `issues:<id>` of a released issue or `github:owner/repo#N` of a released pull request; or
- one of its `blockedBy` issues is a released issue.

Read each such issue (filed on the consumer's record or under it) with the read recipe, then:

| Its status | Do |
|---|---|
| `paused` | write a `blocker` wait (`target: issues:<bump id>`, `owner` the person who owns its current wait, else the project's first active maintainer, `resumeAt` the hint of its current wait, deadline + 14 days, body naming the release and the bump). It stays `paused`: the Maintenance routine wakes it once every wait of the pause ends |
| `backlog`, or `ready` without a `parent` | pause it on that `blocker` wait (`working-on-issues` § Pausing: the wait first, then `paused`, `handoff` rewritten), `resumeAt: screening` |
| `ready` under an umbrella (it has a `parent`) | never pause it: the person's drag to `ready` was its launch. A `signal` (`rule: awaits_release`, `subject: issues:<bump id>`) on it asking the project's first active maintainer whether to add the bump to its `blockedBy`, saying which bump brings what it needs |
| `mine`, `in_progress`, `in_review` | never pause it: a `signal` (`rule: awaits_release`, `subject: issues:<bump id>`) on it, saying which bump brings what it needs |
| `done` | nothing |

Add each one to the bump's `context`. A wait on a bump that is already `done` is not a wait: carry
on (`working-on-issues` § Pausing, step 1).

## Report

The release (repository, version, sha), the umbrella, one line per bump issue, one line per issue
put behind a bump and how, and every consumer skipped and why. A repository with no new
release: one line saying which rule of § 1 stopped it.

## Red flags

- a release opened on a merge alone for a repository that has a deploy workflow;
- two umbrellas for one release, or two open bumps of one package in one consumer;
- an issue in `mine`, `in_progress` or `in_review` paused for a release;
- a bump moved to `ready` or `in_progress` by you;
- a version read from a commit message instead of the released package or tag;
- a release opened for a sha already recorded, or older than the one recorded.
