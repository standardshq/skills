# Charges

One section per count. Read only the section you were convened for.

## What every juror owes

Report your own count. What you notice outside it, you leave to the juror who
holds it — a stray finding is struck on arrival and costs the court the reading
you did not do on your own charge.

**Refute before you report.** For each candidate, spend a real attempt on the
argument that it is wrong: find the guard elsewhere that already covers it, the
caller that never reaches that state, the config that makes it moot. A
candidate you cannot refute becomes a finding, and you report the attempt with
it. A candidate you refute is dropped silently.

*Nothing to charge* is a complete answer. Return it rather than promoting the
weakest thing you saw.

Return, per finding:

- `file:line` (or the spec heading) — the exact place;
- what breaks, and the input or state that breaks it;
- the refutation you attempted and why it failed;
- the smallest change that answers it;
- proposed rank: `blocking`, `to fix`, or `noted`.

Evidence is an executable command or a quoted excerpt. Never a paraphrase.

## coherence

Try the work against the code that already exists. Read the neighbours of every
file the change touches — the sibling service, the adjacent hook, the module
that solves the same shape — and name where this one departs from them without
reason.

Then try it against the project's own agent instructions rule by rule, and
against whatever they point at for the surface touched. Their hard rules are
the ones to prosecute: the error type that must be thrown instead of a bare
one, the logger that must be used instead of `console`, the dependency
direction between layers, the file naming the project insists on, the
subsystems it has removed and forbids reintroducing.

On a spec: the contradiction to hunt is with a decision already taken — a rule
in those instructions, a ruling recorded in an issue, an architecture the spec
assumes it can revisit without saying so.

Refutation to attempt: the departure is deliberate and the reason is stated
somewhere in the dossier.

## omission

Prosecute what is absent. Work from the change outward:

- **The other call sites.** Grep the symbol the change altered; every caller
  that still assumes the old shape is a charge.
- **The paired direction.** A read changed without its write, a create without
  its delete, a guard added on one path and not the sibling path.
- **The obligations the project attaches to this kind of change.** Read its
  agent instructions for what must move in the same commit: a documentation
  page when public behaviour changes, a version stamp or bundle bump, a
  migration for a schema change, a changeset, a consumer bump. Each unmet one
  is a charge.
- **The state nobody wrote.** The error branch with no handler, the empty list,
  the concurrent second call, the tenant or account that has no row yet.

On a spec: the charge is the unanswered question — a failure mode the document
never names, a migration path for what already exists in production, an
acceptance criterion that stops at the happy path.

Refutation to attempt: the absence is covered elsewhere in the diff, or the
case is structurally unreachable.

## proof

Judge whether the tests discriminate. Run the suite the change claims, then
**revert the change and require red.** A test that passes both ways proves
nothing, and three failure modes all read as correct while doing it:

- the **complacent mock** ignores the parameter the change adds, so the new
  path is never exercised;
- the **blind assertion** reads through a projection that cannot show the
  repaired state;
- the **incomplete double** omits a method of the interface it claims.

Read the test changes before the source changes: an assertion edited to match
newly broken behaviour is the highest-rank finding this count can return.

A guard needs both cases — one test that it refuses, one that it still allows.
Without the second, an over-broad guard passes everything.

A behaviour change on a high-risk path — permissions, tenant isolation, money,
data loss — with no test going red when it is reverted is `blocking`.

Then weigh every test the change adds or deletes. A test earns its place by
going **red** on a bug a user would hit: the regression the change fixes, a
change to stable public behaviour, a high-risk path. Name that bug for each
added test; a test with no bug to name is a `to fix` — delete it.

- **Search first.** An existing case that already goes red on the same bug
  makes the new one a twin: `to fix`, delete it.
- **Regression in place.** A regression is one case in the file that already
  covers the behaviour, named for the behaviour it pins.
- **Public seam, exact values.** The test drives the public seam and asserts
  the exact value, faking only the edges the project does not own (network,
  clock, third-party SDKs). A double of the project's own code, an assertion
  that checks only presence or type, and an **echo** — an expected value
  computed by the code under test or pasted from a run of it — each let the
  bug through: `to fix`.
- **Pruning is progress.** A deleted test that could not go red on any
  plausible bug is a gain. Challenge a deletion only when its bug is left with
  no other test going red on it.

On a spec: try each acceptance criterion for falsifiability. A criterion that
today's code already satisfies asserts nothing; a criterion no command can
settle cannot be proven at all. Each planned test case names the bug it goes
red on; a case that names none is struck from the plan.

Refutation to attempt: the test does fail without the change, on a path you had
not run.

## performance

Prosecute the cost the change adds, on the path it actually runs on. Establish
that path first — per request, per record, per render, per boot — because a
cost paid once at boot is not a charge.

Look for: a query inside a loop; a query with no bound and no page; a filter
applied in application code over rows the database could have excluded; a
column filtered or joined with no index; a cache read that was removed or whose
key now varies per call; a synchronous call added to a request path; in React,
a value rebuilt every render that feeds a memo, a context whose value identity
changes on every parent render, an effect that synchronises what derived state
would have given free.

Prefer deletion to addition: the strongest finding this count returns is work
that should not happen at all.

On a spec: the charge is a design whose cost grows with something unbounded —
per-record fan-out, a full scan hidden behind a convenient API, a write
amplified across every tenant.

Refutation to attempt: the path is cold, the set is bounded and small, or the
cost is already paid upstream.

## state-of-the-art

Confront the work with what the upstream projects say **now**. Search only
sources that carry authority: official documentation, release notes and
changelogs, deprecation notices, RFCs and specifications, the repository or
issue tracker of the library itself, and posts written by its maintainers.
Vendor blogs, tutorials, aggregator listicles and content farms are not
evidence and are not cited.

Identify every external API, library and platform feature the change relies on,
then establish for each: is it current, is it deprecated, has the recommended
shape changed since it was written. Read the installed version before charging
an idiom as outdated — check the lockfile, and read the sources or agent guide
shipped in the dependency itself, because a project that pins a prerelease is
holding an idiom on purpose.

A finding here cites a URL and the version or date the source carries. Without
that citation there is no finding.

On a spec: the charge is a design that solves by hand what the platform now
provides, or that builds on something announced as going away.

Refutation to attempt: the pinned version predates the change you found, or the
project deliberately holds the older shape.

## blast-radius

Prosecute what the change reaches beyond its own surface.

- **Tenancy and isolation** — a query, cache key, realtime channel or search
  filter that crosses accounts or tenants, or ambient context read where it may
  be absent.
- **Permissions and visibility** — an access predicate applied above the
  caller's filters instead of below, so a caller can remove it; a path that
  returns a different error for a forbidden resource than for a missing one,
  turning the check into an oracle; a new read path that never calls the
  project's single access check at all.
- **Migrations** — an operation that is not reversible, that locks a large
  table, that assumes a column exists everywhere it will run, or that applies
  destructively at boot without the flag that governs it.
- **Compatibility** — a payload, header or exported type changed under callers
  that ship separately, without a consumer bump.
- **Rollback** — what happens if this is reverted after it has written data.
- **Observability** — a new failure path that logs nothing, so it will be
  invisible in production.

On a spec: the charge is a surface the document never lists among what it
affects.

Refutation to attempt: the reach is gated by a flag that is off, or the surface
has no deployed consumer.

## surface

Prosecute what the change exposes. Untrusted input reaching a query, a shell, a
template, a file path, a URL fetched server-side. A secret, token or key
written into source, a log line, an error message or a URL parameter. An
endpoint added without the guard its neighbours carry, or made public by
omission. A permission check performed on the client and trusted by the server.
Input validated at one entry point and not at the second one that reaches the
same code.

Rank an exposure by what an actor who should not have it can now read or write.

On a spec: the charge is data the design moves or stores without stating who
may read it.

Refutation to attempt: the input is already constrained by the type or guard
upstream, or the value is not secret.

## dry

Prosecute what this rebuilds. **Search the codebase; do not read the diff for
this.** Duplication is invisible from inside the change — the thing already
solved lives in a file the diff never opens, under a name the author did not
know to grep for. Work from the behaviour: name what the change does, then hunt
the module, helper, hook or query that already does it.

Three shapes:

- **Reimplementation** — the repository already has this. Name it with its path
  and say what the diff should call instead.
- **Three and counting** — three or more near-identical blocks, inside the diff
  or between the diff and its neighbours. Name the extraction and where it
  belongs.
- **The near-miss** — something close already exists and this diff forked it
  rather than extending it. Say which of the two survives.

Duplication that is real beats duplication that is speculative: two blocks that
merely rhyme are not a charge, and an extraction that would need a flag
parameter to serve both callers is worse than the repetition.

Rank `to fix` at the highest: this count judges quality, not defect, and a
verdict that blocks on taste stops being read.

On a spec: the charge is a design that describes building what the system
already has.

Refutation to attempt: the existing code is close but its contract genuinely
differs, or coupling the two would bind things that must move separately.

## elegance

Prosecute what could be deleted with nothing lost. The strongest finding this
count returns is a smaller diff that does the same thing.

- **Dead flexibility** — a parameter, option, hook or generic that no caller
  uses. Built for a future nobody has asked for.
- **The clever path** — a construct that takes a second reading, where a plain
  one reads once and behaves identically.
- **Premature abstraction** — an interface, base class or indirection layer
  with exactly one implementation.
- **Ceremony** — state that could be derived, a synchronisation that a
  computed value removes, an intermediate object that only forwards.
- **The unexplained constant** — a number or string that decides behaviour and
  carries no name.

Name the concrete deletion or replacement, not a preference. "This would read
better" is not a finding; "these fourteen lines collapse to this call, same
behaviour" is.

Style already enforced by a formatter or linter is not yours — the machine has
it, and spending attention there costs the counts that need it.

Rank `to fix` at the highest: this count judges quality, not defect, and a
verdict that blocks on taste stops being read.

On a spec: the charge is a design carrying moving parts that its own acceptance
criteria never exercise.

Refutation to attempt: the flexibility has a named caller coming in the same
milestone, or the simple version fails a case the diff handles.
