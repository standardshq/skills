---
name: importing-github-issues
description: Use once per repository at its cutover to the factory, with the maintainer. Reads the repository's GitHub issues once and maps the legacy pipeline's label vocabulary (factory:*, preview:*, scout:*, intake origins) onto factory issues (open ones, plus closed ones carrying a preview label or an intake origin) with their evidence and draft waits, holds a sitting where the maintainer confirms every pause, and imports only on the maintainer's explicit go.
---

# Importing GitHub issues

A repository moving to the factory brings its open issues, and the closed ones the factory still
reads (preview verdicts, intake history for duplicates and scout precision). Every open GitHub
issue becomes one factory issue; every pause becomes a wait its owner confirmed; old `#N`
references keep resolving through `githubNumber`.

This is the one skill that reads GitHub issues, once, by design. It never writes to GitHub: no
comment, label, close, project field or setting. Read `working-on-issues` (statuses, § Pausing,
the wait shape), `evidence-kinds.md` and `asking-for-decisions` before you apply anything.

**A dry run by default.** § 1 to § 5 write nothing anywhere. § 6 runs only after the maintainer's
explicit go for that repository, in their own words, in this conversation. One repository at a
time.

## 1. Before you start

- The repository is a `projects` record with a `fullName`, its facts read with `working-on-issues`
  § Repository facts, and it serves the project the
  issues go to; the project has an active maintainer: the maintainer you sit with.
- Write the project's issues export (`screening-issues` § Scripts): the plan skips every GitHub
  number already imported into the project, so a second run imports only what is new.

## 2. Read GitHub once

In your scratch directory, one search per set, every page:

```bash
node import.mjs query > query.graphql
search() { gh api graphql --paginate --slurp -F query=@query.graphql -f q="$1"; }
search "repo:<owner/repo> is:issue is:open" > open.json
search "repo:<owner/repo> is:issue is:closed label:preview:candidate" > closed-candidate.json
search "repo:<owner/repo> is:issue is:closed label:preview:parked" > closed-parked.json
search "repo:<owner/repo> is:issue is:closed label:preview:rejected" > closed-rejected.json
search "repo:<owner/repo> is:issue is:closed \"intake channel\" in:body" > closed-intake.json
gh issue list -R <owner/repo> --state open --limit 1000 --json number > open-numbers.json
```

and one more `closed` search per `scout:<kind>` label the repository uses (`scout:refuted` and
`scout:overtaken` are verdicts, not origins). A search stops at 1,000 results: more open issues
than that, split the open search by creation date. GitHub refusing a field of the query is a stop:
report which, and change nothing by hand.

## 3. Plan

```bash
node import.mjs plan --github open.json,closed-candidate.json,… --repository <owner/repo> \
  --project <project id> --maintainer <maintainer's user id> --existing <issues.json> \
  --sha "$(git -C <checkout> rev-parse origin/<targetBranch>)"
```

`--sha` is the target branch the imported `assessment` rows are dated against.

It prints the plan as JSON on stdout and its counts on stderr. Exit 1 means draft waits await the
sitting (§ 4); exit 2 a usage or input error.

How GitHub maps onto the factory (the script applies it; you check it):

| On GitHub | In the factory |
|---|---|
| open, no control label | `status: backlog` |
| `factory:queued`, `factory:active` | `ready` (a worker's claim does not survive the cutover) |
| `factory:human` | `mine` |
| `factory:paused`, `needs-decision`, `needs-design`, `preview:parked` | `paused`, with a draft wait (below) |
| `factory:paused` and no other pause label on a sub-issue (a shaped task waiting for its drag to Ready) | `backlog`: the drag to `ready` is its launch |
| a linked pull request open | `in_review` unless paused; every linked pull request in `pullRequests` |
| closed: completed, not planned, duplicate; `scout:refuted`, `scout:overtaken`; `preview:rejected` | `done` with `closeReason` `done`, `wont_do`, `duplicate`, `refuted`, `overtaken`, `wont_do` |
| `type:bug`, `type:enhancement`, `type:feature` | `type`; none: empty, screening classifies it |
| `scout:<kind>`; a body saying it surfaced in an intake channel; anything else | `origin` `scout:<kind>`, `slack`, `github` |
| the Priority project field | `priority` |
| sub-issue of, blocked by (same repository) | `parent`, `blockedBy`; another repository: a line in `context` |
| `preview:candidate`, `preview:parked`, `preview:rejected` | an `assessment` row, `verdict` `candidate`, `park`, `reject`, `subject: github:owner/repo@<--sha>`: a ranking, never an approval |
| `land:` stamps on an open linked pull request | `tier`, `verdict` (`changes`), `go`, `demo` rows, a short sha expanded to the PR head it prefixes; a `go` whose sha prefixes no current head (unmatched), a withheld go and every other stamp are not carried: landing judges the head again. Every imported row carries `data.imported: true`, which keeps it out of the dashboard's first-round measures |
| `## Decision` comments | quoted in `context` as history. Never a `ruling` row: the Maintenance routine would apply an old « I take it » or « Close it » again. Their effect is the status above |
| the body; the comments | `problem`, verbatim; `context`, quoted with author, date and link, the oldest beyond the budget linked |
| `stage:*`, `factory:needs-human-merge` | nothing (listed in `context`): stages are statuses now; the repository's discovered `mode` says who merges |

**Draft waits** (one per paused issue): `needs-design` is a `task` wait (a Task for the mockup);
`preview:parked` with `Expires: <date>` a `date` wait on that date, without one a `decision`
(revisit, keep parked until a date, or close); an open blocker in the same repository a `blocker`
wait on its import; everything else a `decision`, its draft question the latest comment that is
neither a stamp nor a ruling. Each drafts the project's maintainer as owner.

## 4. The sitting

Present the counts (open, closed by set, by status, evidence rows, draft waits by kind), then one
table of every draft wait, in the maintainer's language: the issue by title and `#N`, what it waits
on (kind, target, the question or the Task in plain words, rewritten as `asking-for-decisions`
§ 2 asks, never a bare id), the proposed owner.

For each row the maintainer either confirms the owner (or names another active person), rewrites
the question, or rules the issue out of the pause: `backlog`, `mine`, or `close` with its
`closeReason`. Write their answers, verbatim, into `confirmations.json`:

```json
{
  "confirmedAt": "<server time of the maintainer's last answer>",
  "confirmedBy": "<their user id>",
  "issues": {
    "<N>": { "owner": "<user id>", "question": "<only when rewritten>" },
    "<M>": { "action": "backlog" },
    "<K>": { "action": "close", "closeReason": "wont_do" }
  }
}
```

Run the plan again with `--confirmations confirmations.json`: it must exit 0. Every wait's
deadline is the confirmation plus 14 days (a `date` wait's, 14 days after its date when that is
later).

## 5. The go

Ask, in one message: « Import <n> issues of owner/repo into <project> now, <p> of them paused on
the waits you confirmed? ». Ask also that the Triage routine be switched off for the import
(their gesture, in the workspace's routine settings): an issue created while it runs is screened
before its import is finished. Wait for both. Anything but a clear yes: stop, write nothing.

## 6. Apply

With your record tools, in this order, re-reading each record after you write it:

1. **Issues,** in plan order (umbrellas before their tasks), with the plan's `values` and
   `createWithStatus`. Keep the map `githubNumber` → record id.
2. **Relations:** `parent` and `blockedBy`, through that map.
3. **Evidence:** each planned row on its issue (`kind`, `subject`, `body`, `data` as JSON).
4. **Waits,** for each issue whose plan `status` is `paused` (`working-on-issues` § Pausing):
   check the target first (a `blocker` whose imported issue is `done` is no wait: leave the issue
   `backlog` and say so); make it exist (`decision`: ask it with `asking-for-decisions`, the
   confirmed question, to the confirmed owner; `task`: the Task to the owner, due at the deadline;
   `blocker`: `issues:<id>` of the imported blocker); write the `wait` row (`target`, `waitKind`,
   `owner`, `resumeAt`, `data` with `deadline` and, for a decision, `question`); then set
   `status: paused`.

A write that fails: note it, go on, and list it in the report; a second run of the plan skips what
exists.

## 7. Check

Write the issues export again, plus every `wait` row of the project, then:

```bash
node import.mjs check --open open-numbers.json --existing <issues.json> --evidence <waits.json> --project <id>
```

It must print `clean: true`: every open GitHub issue imported, no imported issue left open whose
GitHub issue is closed, and no `paused` issue without an open wait (the Maintenance routine's invariant).
Anything else: fix it (an issue missed, a wait not written), then check again.

Then hand back to the maintainer, as theirs to do: switch the Triage routine back on (its
daily pass screens the imported `backlog`); drag every imported task of an umbrella that sits in
`ready` out of it and back, for each they want launched (list them: an issue created in `ready` was never moved there by a
person, and only that move launches a task, `working-on-issues` § Launch); switch the repository's
routines to the factory's; and disable GitHub Issues on the repository once they are satisfied.
You never change a GitHub setting.

## Unverified

Not yet run against GitHub: the issue fields `blockedBy`, `subIssues`, `parent`,
`closedByPullRequestsReferences(includeClosedPrs:)` and the project `Priority` field of
`import.mjs query`. On the first dry run, check that each one comes back filled where GitHub shows
a value; a field refused or always empty is a stop (§ 2), reported before any sitting.

## Report

The counts of § 4, the issues written, the waits opened (and their Décisions and Tasks), every
failed write, the check's output verbatim, and what is left to the maintainer.

## Red flags

- anything written before the maintainer's go, or a second repository imported on the first go;
- a comment, label, close or setting written to GitHub;
- a `ruling` row made from an old `## Decision` comment;
- a `paused` issue whose wait the maintainer did not confirm, or with no open wait;
- a wait whose owner was guessed instead of confirmed;
- an issue created while the Triage routine is on;
- the check run on an export older than the apply.
