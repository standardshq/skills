# Charges

One section per count. Try each count you were given under its own section, one at a time.

## What every juror owes

Report each count's findings under that count. **Refute before you report:** for each candidate,
spend a real attempt on the argument that it is wrong: the guard elsewhere that already covers it,
the caller that never reaches that state, the config that makes it moot. A candidate you cannot
refute becomes a finding, reported with the attempt. A candidate you refute is dropped silently.

*Nothing to charge* is a complete answer. Return it rather than promoting the weakest thing you
saw.

Return, per finding:

- `file:line` (or the spec heading): the exact place;
- what breaks, and the input or state that breaks it;
- the refutation you attempted and why it failed;
- the smallest change that answers it;
- its rank, read off the ladder below.

Evidence is an executable command or a quoted excerpt, never a paraphrase.

### The rank ladder

Rank by **who acts wrongly because of it, and how soon**, not by how ugly the code is:

- `blocking`: a person or the system meets wrong or unsafe behaviour on a path this change ships:
  data lost, or leaked across a tenant or a permission; a crash; a flow that no longer completes;
  a gate that turns CI red.
- `to fix`: someone acts wrongly because of it: a caller trusts a doc comment, a type or an error
  class that says something false; a test on a high-risk path cannot go red; a reader rebuilds what
  a helper already does; a resource leaks on a path that repeats; the work claims a scope it does
  not cover.
- `noted`: true, and nobody's next action changes: a name that misleads no one, a style the tooling
  does not enforce, an improvement no caller needs yet.

A **high-risk path** is permissions, tenant isolation, money, data loss or a migration. Torn
between two rungs, take the higher one and write in one line what argued for the lower.

## spec

Try the work against what was asked: the issue's brief (`## Acceptance`, `## Out of scope`), its
rulings, the umbrella's for a task. Quote the line asked for with each finding.

- **Missing or partial:** a criterion the diff leaves unmet, or meets on the happy path alone.
- **Implemented wrong:** a criterion that looks met, where the code does something else.
- **Unasked:** behaviour the diff adds that nothing asked for, or that `## Out of scope` names.
- **The other call sites:** grep the symbol the change altered; every caller still assuming the old
  shape is a charge.
- **The paired direction:** a read changed without its write, a create without its delete, a guard
  on one path and not its sibling.
- **The obligations the repository attaches:** what its rules say must move in the same change (a
  documentation page for public behaviour, a migration for a schema change, a changeset, a version
  bump). Each unmet one is a charge.
- **The state nobody wrote:** the error branch with no handler, the empty list, the tenant or
  account with no row yet.

On a spec: the charge is the unanswered question: a failure mode never named, a path for what
already exists in production, a criterion that stops at the happy path.

Refutation to attempt: the absence is covered elsewhere in the diff, the case is structurally
unreachable, or a ruling asked for it.

## standards

Try the work against the repository's own rules and the code already there. **The repository's
rules win:** a documented standard that endorses what a smell below would flag suppresses the
smell. Style a formatter or linter enforces is the machine's.

- **Rules:** read the repository's agent rules rule by rule, and whatever they point at for the
  surface touched. Their hard rules are the ones to try: the error type to throw, the logger to
  use, the dependency direction between layers, the file naming, the subsystems removed and
  forbidden. Cite the file and the rule.
- **Neighbours:** read the sibling service, the adjacent hook, the module that solves the same
  shape, and name where this one departs from them without a stated reason.
- **Rebuilt:** search the codebase for what the change does, by behaviour, not by reading the diff:
  the helper, hook or query that already does it, named with its path. A near-miss forked rather
  than extended: say which of the two survives.
- **Deletable:** the smaller diff that does the same thing. Name the concrete deletion, "these
  fourteen lines collapse to this call, same behaviour", never a preference.
- **Smells,** the Fowler baseline (*Refactoring*, ch. 3), each a judgement call written "possible
  Feature Envy", with the hunk quoted, then the fix:
  - **Mysterious Name:** a name that does not reveal what it does or holds. Rename it; when no
    honest name comes, the design is murky.
  - **Duplicated Code:** the same logic shape in more than one hunk or file. Extract the shared
    shape, call it from both.
  - **Feature Envy:** a method reaching into another object's data more than its own. Move it onto
    the data it envies.
  - **Data Clumps:** the same few fields or params travelling together. Bundle them into one type.
  - **Primitive Obsession:** a primitive standing in for a domain concept. Give the concept its
    own small type.
  - **Repeated Switches:** the same `switch` or `if` cascade on the same type, recurring. One map
    or polymorphism both sites share.
  - **Shotgun Surgery:** one logical change forcing scattered edits. Gather what changes together.
  - **Divergent Change:** one module edited for several unrelated reasons. Split it.
  - **Speculative Generality:** abstraction, parameters or hooks no requirement has. Inline it back.
  - **Message Chains:** `a.b().c().d()` navigation the caller should not depend on. Hide the walk
    behind one method.
  - **Middle Man:** a function or class that mostly delegates. Call the real target.
  - **Refused Bequest:** an implementer ignoring most of what it inherits. Use composition.

A broken hard rule ranks on the ladder. A rebuild, a deletion or a smell ranks `to fix` at the
highest: this count judges quality, and a verdict that blocks on taste stops being read.

On a spec: the contradiction with a decision already taken (a rule, a ruling, an architecture
revisited without saying so), or a design that describes building what the system already has.

Refutation to attempt: the departure is deliberate and its reason is in the dossier, or the
existing code's contract genuinely differs.

## proof

Judge whether the tests discriminate. Run the suite the change claims, then **revert the change
and require red.** A test that passes both ways proves nothing, and three failure modes all read
as correct while doing it:

- the **complacent mock** ignores the parameter the change adds, so the new path never runs;
- the **blind assertion** reads through a projection that cannot show the repaired state;
- the **incomplete double** omits a method of the interface it claims.

Read the test changes before the source changes: an assertion edited to match newly broken
behaviour is the highest-rank finding this count returns. A guard needs both cases, one that it
refuses and one that it still allows. A behaviour change on a high-risk path with no test going
red when reverted is `blocking`.

Then weigh every test added or deleted. A test earns its place by going **red** on a bug a user
would hit: the regression fixed, a change to stable public behaviour, a high-risk path. Name that
bug for each added test; a test with no bug to name is a `to fix`: delete it.

- **Search first:** an existing case already red on the same bug makes the new one a twin: delete it.
- **Regression in place:** one case in the file that already covers the behaviour, named for it.
- **Public seam, exact values:** the test drives the public seam and asserts the exact value,
  faking only edges the project does not own (network, clock, third-party SDKs). A double of the
  project's own code, a presence-only assertion, and an **echo** (an expected value computed by
  the code under test) each let the bug through: `to fix`.
- **Pruning is progress:** challenge a deletion only when its bug is left with no test going red.

On a spec: try each acceptance criterion for falsifiability. One today's code already satisfies
asserts nothing; one no command can settle cannot be proven.

Refutation to attempt: the test does fail without the change, on a path you had not run.

## risk

Try what the change reaches beyond its own surface. Each part below runs when its trigger, read
from what the target **does**, holds; name the parts that did not run.

### blast-radius

Trigger: every target; a screen-only one when it gates on a permission or a visibility.

- **Tenancy:** a query, cache key, realtime channel or search filter that crosses tenants, or
  ambient context read where it may be absent.
- **Permissions and visibility:** an access predicate applied above the caller's filters, so a
  caller can remove it; a different error for a forbidden resource than a missing one; a new read
  path that never calls the project's single access check.
- **Migrations:** irreversible, locking a large table, assuming a column exists everywhere, or
  destructive at boot without its flag.
- **Compatibility:** a payload, header or exported type changed under callers that ship apart.
- **Rollback:** what happens when this is reverted after it has written data.
- **Observability:** a new failure path that logs nothing.

### surface

Trigger: external input (a route or operation handler, a webhook, an integration client, a parser
of a third-party payload, an upload, a URL fetched server-side); authentication, sessions, tokens,
secrets or crypto; a permission or grant check; a query, shell command, template or path built from
a value; a log line or error carrying user data; a sandbox or code-execution tool.

Untrusted input reaching a query, a shell, a template, a path or a server-side fetch. A secret
written into source, a log, an error or a URL. An endpoint without the guard its neighbours carry.
A check done on the client and trusted by the server. Input validated at one entry and not at the
second that reaches the same code. Rank by what an actor who should not have it can now read or
write.

### concurrency

Trigger: an optimistic update or a mutation hook; a stream or subscription writing into state the
user also edits; a job, retry, queue, lease or lock; a read followed by a write on the same row; a
cache shared across requests; parallel requests whose answers are merged; a submit a person can fire
twice.

Name the two actors (two tabs, a person and a job, a retry and its original) and play their
interleavings until one corrupts, loses or duplicates something: a late response overwriting a
newer one; a stale read written back with no version, condition or lock; a double effect with no
idempotency key, unique constraint or guard; an undo erasing an unrelated update; a lock never
released on the error path, or a lease expiring while its holder writes; a request still in
flight when its screen unmounts. Evidence is the interleaving written out, each step quoting its
line.

### performance

Trigger: a query, repository, migration or index; a job, sweep, loop or batch; code on a request
path; a component, hook, store or context; streaming, polling or realtime; a cache; a new
dependency or a heavy import.

Establish the path first (per request, per record, per render, per streamed chunk, per boot) and
quote its frequency with the finding: a cost paid once at boot is not a charge. On the server: a
query in a loop, unbounded or unindexed; a filter in code over rows the database could exclude; a
cache read removed or keyed per call; a synchronous call on a request path. On the screen: a
component subscribed to more than it reads; a value rebuilt every render that feeds a memo; an
effect that derived state would replace; a long list rendered whole; a request waterfall; a poll
or listener never released; a heavy import on the first route. The strongest finding is work that
should not happen at all.

On a spec, for every part: a surface the document never lists among what it affects; a shared
value written from two places without saying which wins; a cost that grows with something
unbounded.

Refutation to attempt: the reach is gated by a flag that is off, a constraint already serialises
the actors, the path is cold, or the input is already constrained upstream.

## experience

Try what a person meets on the screen the change touches. Walk it the way they would (arrive,
wait, act, fail, come back) and read the code for each moment. The project's UI rules and the
design-system guide they point at are the standard; a finding cites the rule it breaks.

- **States:** loading, empty, error and partial, each shaped like its neighbours'. A write shows
  its result at once and, refused, rolls back with a message the person can act on.
- **Keyboard:** every action reachable without a mouse; Enter, Escape, Tab and arrows do what the
  neighbouring surfaces make them do; a new shortcut collides with none.
- **Focus:** after open, close, submit, delete and undo, focus lands on the next gesture; a dialog
  traps it and gives it back.
- **Names:** every control carries an accessible name; an icon-only button a label and a tooltip
  where its neighbours carry one.
- **Copy:** every string through the project's translations, in every locale, worded by its rules.
- **Theme:** colours, spacing and type from the tokens; holds in dark mode and at the narrowest
  width supported.
- **Shape:** the pattern the project prefers: inline before modal, the existing primitive before a
  new one.

Evidence is the line that renders the moment, beside the neighbour or rule that sets the standard.
Rank by the person's loss: an action they cannot complete or a write they lose is `blocking`; a
state that misleads, a dead key or a missing translation is `to fix`; a drift is `noted`.

On a spec: a screen described without its states, its keyboard path, or its copy.

Refutation to attempt: the state cannot occur on this path, the neighbour does the same, or the rule
does not cover this surface.
