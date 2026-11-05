# Read recipe

Read an issue in this order before acting on it. Stop reading as soon as you know the issue is not
yours to act on (claimed by another live lease, not your stage, not launched).

1. **The issue:** `title`, `status`, `priority`, `type`, `origin`, `closeReason`.
2. **Intent**, then the sections: `problem`, `acceptance`, `context`, `plan`, `handoff`. `handoff`
   is where the last agent stopped; trust it as a lead, verify it as a claim.
3. **The project:** read `project`, then its `context` (purpose, conventions, how to run and
   check it) and `maintainers`. When your stage acts on a repository (Intake never does), read its facts (`SKILL.md` § Repository
   facts) and its own agent rules (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules`) at run time; never
   copy them into the issue.
4. **Open waits:** `evidence` with `kind: wait` and empty `resolvedAt`: `waitKind`, `target`,
   `owner`, `resumeAt`, `data.deadline`. An open wait on an issue that is not `paused` was released
   by a person's move: the Maintenance routine will record it; do not act on it as a hold.
5. **Rulings:** every `ruling` row, newest first. A ruling outranks the sections it contradicts;
   update the sections to match. A ruling older than a person's later status move is superseded:
   history, not a ruling.
6. **What woke it:** the latest `woke` row and the `resolved` rows it lists. For a `task` wait, read
   the Task and what it delivered (its description, comments, attached files, linked records): the
   deliverable is the reason the issue moved.
7. **Pull requests:** each line of `pullRequests`: state (open, merged, closed), current head sha.
   For each, the latest `verdict`, `go` and `check-run` whose `subject` names **that** head. A
   verdict on an older head is history, not a verdict. If the newest `applied` row carrying
   `closeWhenPullRequestsClose: true` has no person-written status move newer than it (a pending
   close, `waking-issues` § 6), the issue is out of landing: no `verdict`, no `go`, no merge; landing leaves it alone except closing its open PRs.
8. **Structure:** `blockedBy` (and the status of each), `parent` (read the umbrella's sections and
   rulings: a task inherits its spec and its approval), `children`.
9. **Failures:** `failedAttempts`, and the `attempt` rows: the last 3 in full, a count for the
   earlier ones.
10. **Who moved it:** the issue's activity for the latest `status` move, and whether a person or an
    agent wrote it (`working-on-issues` § Launch).

Then answer, before acting: what stage is this issue at, who owes the next move, and is that you?
