# Read recipe

Read the issue of your wake in this order. Stop as soon as it is not yours to act on (a neighbour
got there first, not your stage's pipe, not launched): write nothing and end.

1. **The issue:** `title`, `status`, `priority`, `type`, `origin`, `closeReason`, `need`,
   `waitingOn`, `slackThread`.
2. **`body`**, section by section, then `context`.
3. **The project:** `project`, then its `context` and `maintainers`, walking up to the root. When your
   stage acts on a repository, read its facts (`SKILL.md` § Repository facts) and its own agent rules
   (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules`) at run time; leave them out of the issue.
4. **The last checkpoint:** the newest `checkpoint` row, and whether its Decision is open, answered or
   expired.
5. **Rulings:** every `ruling` row, newest first. A ruling outranks the sections it contradicts;
   update them to match. A ruling older than a person's later status move is superseded: history,
   not a ruling.
6. **Pull requests:** each line of `pullRequests`: state (open, merged, closed) and head sha, with the
   `verdict` rows whose `subject` names **that** head. A verdict on an older head is history.
7. **Structure:** `blockedBy` and the status of each, `parent` and its sections and rulings, which a
   task inherits; `links` and each one's `kind` (a `duplicates` link names the issue kept).
8. **Files:** `mockups` (only the `approved` one is built; `rejected` ones are history) and
   `evidence` (`reproduction` before the change, `proof` after).
9. **Failures:** `failedAttempts`, and the `attempt` rows: the last 3 in full, a count for the earlier
   ones.
10. **Who moved it:** the issue's activity for the latest `status` move, and whether a person or an
   agent wrote it (`workflow.md` § Launch).

Then answer, before acting: what stage is this issue at, which exit of that stage does the evidence
lead to, and does any of it need a person?
