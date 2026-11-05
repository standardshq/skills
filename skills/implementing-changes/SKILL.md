---
name: implementing-changes
description: Use when a change is designed and implemented in the same pass (a feature, component, refactor or behaviour change), and whenever the Build routine implements a launched issue. Acceptance assertions stated before any code, independent tasks in parallel, one blocking review of the batch, a green gate, then one final elegance and DRY check on the largest model.
---

# Implementing changes

Design the work through `brainstorming` — its exact pattern, nothing improvised —
specify it with the repository's code DNA, implement against acceptance
assertions stated before any code exists, review the diff for correctness before
it compounds, then run a single **final elegance & DRY check with the largest
model available**.

**Core principle:** rigor comes from *what gets decided and asserted before code
exists*, not from ceremony repeated per task. Every step has a budget. Exceeding
a budget is a defect in how the skill is being run, not thoroughness.

**The load-bearing rule:** every task carries **acceptance assertions written
before the implementation exists** — exact values, exact error codes. That is
the spec, and it becomes the test verbatim. A test written by reading the
implementation proves the code runs, not that it works.

**Where quality gets judged:** correctness, spec compliance, and test honesty
are checked mid-flow (Step 4). Elegance and DRY are checked **exactly once, at
the end, by one big-model pass** (Step 7). No mid-flow lens judges them.

## Modes

Select one at entry. The mode decides which steps run; it never relaxes the
load-bearing rule.

| Mode | Entry | Runs | Stops at |
|---|---|---|---|
| `full` | A person starts design-and-build work | Steps 0-7 | The final check, after the green gate and the real-run pass if it applies |
| `brief` | A decision is owed before any code | Steps 0-1 only | Decision report, before any production edit |
| `execution` | `executing-issues` runs a launched issue | Steps 2-7 | The final check, after the green gate and the real-run pass if it applies |

In `execution` mode the interrogation is already settled: the issue's
reproduction or assessment, its `screening` row, and its rulings carry the
decisions. Re-litigating them is scope creep. If those leave a branch that
genuinely forks the work, **stop and ask**: `executing-issues` pauses the issue
on a `decision` wait with `asking-for-decisions`. Do not guess.

## Dependencies

Every skill this one hands off to is a workspace skill of the factory bundle,
so all three modes run in a routine with no host-specific setup:

| Skill | Used by | When |
|---|---|---|
| `brainstorming` | Step 1 | `full` mode, always — its checklist verbatim |
| `writing-plans` | Step 1 → 2 | `full` mode, as brainstorming's terminal handoff |
| `reproducing-bugs` | Step 2 | any bug fix, before the assertion is written |
| the repository's UI skills, when its agent rules or the project's `context` (read up the tree) name any | Step 3 | any UI task |

`brainstorming` and `writing-plans` are vendored from superpowers (their
`LICENSE.superpowers`). The review lenses are two read-only subagents whose
prompts are this skill's companion files: `verify-lens.md` (Step 4, blocking)
and `design-lens.md` (Step 7, the final check). Dispatch a lens with its file
as the subagent's instructions.

Neither `brainstorming` nor `writing-plans` runs in `execution` or `brief`
mode: `execution` skips Step 1 entirely, and `brief` stops at the decision
report.

## Speed budget

| Step | Budget | Blown when |
|---|---|---|
| Pre-flight | one parallel tool batch | reading files one at a time |
| Design (`full`) | `brainstorming`'s checklist verbatim | the approach comparison, a design-approval round, or the user spec review was skipped |
| Plan (`full`) | `writing-plans`, as brainstorming hands off | implementation started straight from the conversation |
| Brief (`brief`) | one decision report | a person was asked a question of fact |
| Implementation | independent tasks in parallel | task N+1 waits on a review of task N sharing no files |
| Self-review gates | ≤1 read-only subagent per gate, and only when its predicate fires | a gate ran whose predicate did not fire, or a gate fired a panel instead of one agent |
| Review | grep pre-pass + 1 blocking subagent | agents dispatched mid-flow to judge style, or an LLM paid to find `console.log` |
| Green gate | targeted tests + filtered typecheck | the full suite ran locally |
| Real-run pass | one scenario, and only when the predicate in Step 6 holds | a one-package or invisible change was driven through the running app |
| Final check | one big-model agent over the final diff, once | it ran mid-flow, ran twice, or ran on a small/fast model |

## Self-review gates

A self-review agent sits **between** steps, never inside one, and only where a
mistake compounds downstream instead of being caught by the batch review. Each
gate is **one read-only subagent**, scoped to one artifact, dispatched only when
its predicate fires. A gate whose predicate does not fire is skipped in one
line — skipping is the common case.

| Gate | Sits between | Fires when | Reviews |
|---|---|---|---|
| A — assertions | Step 2 and Step 3 | the batch has more than two tasks, or any task touches permissions/RBAC, multi-tenancy, migrations, money, auth, or a public API contract | the acceptance assertions, before any code exists |
| B — load-bearing task | Step 3 and its dependent tasks | one task's output is consumed by another task | that single task's diff against its own assertions |
| C — batch review | Step 3 and Step 5 | always | the whole batch diff (Step 4, one blocking agent) |

Three gates is the ceiling. Never add a fourth, never widen gate A or B beyond
its single agent — only gate C escalates, on the high-risk list in Step 4b — and
never gate a task that nothing downstream reads: that is what Step 4 is for. Verdicts from every gate obey Step 4c: confirmed at their cited `file:line`
in the current tree, or discarded. The Step 7 final check is not a gate — it
runs after everything is green, once.

## Step 0 — Pre-flight

One parallel batch, then one line of findings:

1. The issue's `pullRequests`, and the repository's open pull requests whose
   body says `Issue: <id>`: is this already open?
2. Grep the relevant module on the target branch: is it already done?

## Step 1 — Design

*Skipped in `execution` mode.*

### Full mode — brainstorming's exact pattern

Invoke `brainstorming` and follow its checklist **verbatim** — every item, in
order, regardless of how simple the work looks. "Too simple to need a design"
is that skill's named anti-pattern, and it applies here in full:

1. Explore project context (files, docs, recent commits).
2. Clarifying questions — **one at a time**, multiple choice preferred, each
   with a recommended option first.
3. Propose **2-3 approaches** with trade-offs and a recommendation.
4. Present the design **in sections**, approval after each section.
5. Write the spec to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` and
   commit it.
6. Spec self-review (placeholders, contradictions, scope, ambiguity) — fix
   inline.
7. The person reviews the written spec; proceed only on approval.
8. Hand off to `writing-plans` — brainstorming's only terminal state, and the
   plan Steps 2-3 implement.

Two rules of this skill still apply inside that dialogue:

- **Resolve questions of fact from the codebase, silently.** Anything the code,
  `CLAUDE.md`, the docs, or git history can settle is settled without asking. A
  person only answers questions that genuinely fork the work.
- **Bias:** the simplest design that reuses existing modules beats a clever new
  abstraction.

### Brief mode — the decision report

No dialogue is available; the report **is** the deliverable. Walk the decision
tree in tool calls, resolve every branch the codebase can settle, then write the
report into the `## Plan` section of the issue's `body` (change that section alone, `working-on-issues` § Two layers) (and point a `handoff` row at it) and stop. It
must separate:

1. **Resolved from the codebase** — each with the `file:line` that settled it.
2. **Resolved by default** — the assumption taken and why it is safe.
3. **Open questions that fork the work** — each with options, a recommendation,
   and what changes in the implementation depending on the answer.
4. **Smallest vertical slice** — the first independently shippable behavior.

Ruthlessly exclude anything the codebase already answers. A brief that asks a
person a question of fact has failed. Never edit production code in this mode.

## Step 2 — Code DNA and acceptance assertions

Append an **Implementation conventions** section to the spec with the DNA rules
this work touches. Every implementation subagent receives it verbatim.

Then, per task of the plan, write the **acceptance assertions**: the exact
values and error codes the task must produce, before any implementation exists.
Non-negotiable — it is the entire mechanism this skill relies on.

In `execution` mode the assertions come from the issue: a bug's reproduction
command and its asserted symptom (in `## Problem`), the issue's `## Acceptance`
section, or, for a task of an umbrella, its own `## Acceptance` under the
umbrella's spec. **Copy them verbatim.** Rewriting an assertion at implementation time
is the exact failure this skill exists to prevent.

### Code DNA

**Universal** (the TypeScript, commit and branch lines are defaults: the
repository's own rules win wherever they say otherwise)

- **DRY**: 3+ similar blocks → extract. Reuse before writing new. *(Guidance
  for writing; the check happens once, in Step 7.)*
- **Elegant**: simplicity over cleverness. YAGNI ruthlessly. *(Same: guidance
  here, checked in Step 7.)*
- **TypeScript**: `function` for declarations, arrows for callbacks. Strict.
  `unknown` over `any`.
- **Commits**: conventional. Branches `feat/`, `fix/`, `chore/`.

**Tests — contract-first, not test-first**

- **The assertion precedes the code; the test run does not.** Assertions go into
  the task spec before implementation. The test file is then written to match.
- **Never write a test by reading the implementation.** A task that reaches the
  test step with no pre-stated assertion stops until the assertion is written.
- **A red run is mandatory for exactly one case: bug fixes.** The reproduction
  must fail against current code. Elsewhere, passing on the first run is success.
- **Assert exact behavior**: `toBe('exact-value')`, the exact error code the
  repository's error type carries. Never `toBeDefined()` or
  `not.toThrow()` where an exact assertion is possible.
- **Mock budget: zero by default.** No DB-layer mocks; hit the real path. Each
  mock needs a one-line justification in the PR.
- **Error paths are first-class**: invalid input, unauthorized, not found.

> The DNA is a summary. The repository's agent rules (`AGENTS.md`,
> `CLAUDE.md`, `.cursor/rules`), the project's `context` (read up the tree) and the repository's
> own skills are the source of truth.

### This repository's code rules

Read the repository's agent rules at run time (stack, layers, logger, errors,
UI rules) and apply them to every task and every review. Never copy them into
the issue: they change, the copy would not.

### Gate A — review the assertions before any code exists

Fires on the predicate in the gates table. This is the cheapest gate in the
skill and the only one that can still be acted on for free: every assertion is
copied verbatim into a subagent prompt, so an assertion that is vague here
produces a batch that is wrong everywhere and reviews as clean.

One read-only subagent receives the task list, the assertions, and the issue or
spec. It answers four questions and nothing else:

1. Is each assertion **verifiable as written** — an exact value, an exact
   error code, a named file or endpoint — rather than a restatement of
   the intent?
2. Does any assertion describe an **implementation** instead of a behavior? Such
   an assertion cannot fail.
3. Which stated behavior has **no assertion**, and which error path is missing?
4. Does any assertion contradict the issue, the spec, or `CLAUDE.md`?

Its output is a list of assertions to rewrite. Rewrite them **before** Step 3
starts. Once a subagent holds an assertion, it is frozen: Step 4's spec
compliance lens treats any later change to it as blocking.

## Step 3 — Implement

Execute the plan, each task carrying its acceptance assertions.

**Run independent tasks in parallel** — one subagent each, dispatched in a
single message so they run simultaneously. Serialize only tasks that touch the
same files or consume each other's output. Never set tool-call limits on a
subagent.

Each subagent receives: the task, its acceptance assertions verbatim, and the
Implementation conventions section.

## Step 3b — Gate B, the load-bearing task

Not a review of every task. A batch has **at most one** load-bearing task, and
frequently none: the one whose output another task consumes — a type, a schema,
an endpoint shape, an error code the others were told to code against. If its
assertion is satisfied wrongly, every dependent task is wrong the same way, and
a batch that agrees with itself reviews as clean.

When one exists, gate it **before dispatching the tasks that depend on it**:

1. Run that task's tests alone, with the test command of the repository's
   `verify` narrowed to its files.
2. Dispatch **one** verify-lens subagent (`verify-lens.md`) scoped to that task
   alone — its diff, its assertions, and the contract the dependent tasks were
   handed. Not the batch, never the design lens.
3. Apply only `blocking` verdicts, confirmed at their `file:line` per Step 4c.

Then dispatch the dependents against the contract that now exists in the tree,
not the one that was planned.

When no task feeds another, skip this gate and say so in one line.

## Step 4 — Review the batch diff

Runs once the parallel tasks land, not after every individual task. This review
is **blocking-only**: correctness, spec compliance, and test honesty. Elegance
and DRY are not judged here — they belong to Step 7, once, with a big model.

### 4a. Deterministic pre-pass, no agent

Grep the diff before spending a token on review:

```bash
git diff --cached -U0 | grep -nE 'toBeDefined\(\)|not\.toThrow\(\)'
```

Then grep the diff for every construct the repository's agent rules forbid (an
untyped error, a raw console call, a generic filename…), and run the lint
command of the repository's `verify` on the changed files. Check no path the
repository's facts list as `generated` was edited by hand.

Any hit is a defect. Fix it before dispatching anything.

### 4b. Review lens

**Default: one read-only verify-lens subagent** (blocking), its instructions in
`verify-lens.md`. It receives the batch diff, **the acceptance assertions**,
and the task list. A checker without the assertions cannot judge compliance.

**Escalate to independent parallel subagents, one blocking lens each and blind
to the others** (spec compliance, correctness, tests prove behavior), only when
the batch touches permissions or RBAC, multi-tenancy, schema migrations, money,
auth, or public API contracts.

### 4c. Applying verdicts

Verdicts are `pass` or `{ file, line, severity: blocking|suggestion, problem,
concrete fix }`.

**Confirm each finding at its cited `file:line` in the current tree before
applying the fix.** Reviewers routinely cite stale or hallucinated code; an
unverified fix is a regression waiting to happen. A finding that does not match
the tree is discarded, not adapted.

Only `blocking` gates the batch. Suggestions are applied if cheap, otherwise
listed in the PR body. Re-run only the failing lens.

## Step 5 — Green gate

- Targeted tests for what changed: the test command of the repository's
  `verify`, narrowed to the changed files. Not the full suite — that is CI's
  job, or the Review routine's.
- The other commands of `verify` (typecheck, lint), filtered to the changed
  package when the tool allows it.
- Every acceptance assertion exists in a test and passes.
- Then push and let CI run the rest.

## Step 6 — Prove it in the running system

The green gate proves the assertions inside a test process. On a large change
that is not proof that a person can use the feature: wiring, serialization,
migrations, permissions, and realtime are exactly what unit tests cannot reach.

Run this pass when **both** hold:

- the change is reachable by a person or an API client — a new or altered
  surface, endpoint, or mutation path; **and**
- it crosses more than one package or layer, or the batch ran more than five
  tasks.

Otherwise skip it and say so in one line. A change contained to one package, a
change invisible to users (types, logging, internal refactor), and a bug fix
whose reproduction already drove the real path are all already proven.

When it applies, drive the real system rather than a test double, with the
repository's discovered `boot` (the command and what answers when it is up),
`apps` (name, port, entry) and `reset` (seeded data):

- API-reachable: the app running, then direct calls on the path the change
  opens.
- UI-reachable: the app running, the surface open in the Browser pane, and the
  gesture a person would perform.

**One scenario**: the shortest real path from nothing to the feature's promised
outcome, plus the one error path a person will actually hit. A real run that
only repeats what the unit tests already assert is wasted — drive what they
could not reach. Report what was exercised and what was not.

## Step 7 — Final check: elegance & DRY, one big model

Runs **once**, after the green gate (and the real-run pass when it applied), on
the final diff. This is where elegance and DRY are judged — nowhere earlier.
The rationale: mid-flow style reviews churn code that is still moving; one pass
by a top-tier model over the finished diff catches what matters and nothing
twice.

Dispatch **one read-only design-lens subagent (`design-lens.md`) on the largest
model the harness offers** — never a small or fast tier: this step exists precisely to
buy top-tier judgment. It receives the full final diff, the spec, and the task
list. Two lenses:

| Lens | Job |
|------|-----|
| **DRY** | Does this diff reimplement something the repository already has? **Search the codebase — don't eyeball the diff** — and name the existing code to reuse, with its path. 3+ similar blocks inside the diff → name the extraction. |
| **Elegance** | Over-engineering, YAGNI violations, a clever abstraction where a simple one exists, dead flexibility no caller uses, a simplification that removes code without changing behavior. |

Its findings are **suggestions**, applied per Step 4c (confirmed at `file:line`
in the current tree, or discarded). Apply the cheap ones, re-run the green gate
if code changed, list the rest in the PR body. This check never blocks the
merge on its own and never re-runs after its fixes land.

## Common mistakes

| Mistake | Fix |
|---|---|
| Skipping brainstorming because the work looks scoped | Full mode always runs `brainstorming`'s checklist verbatim. "Too simple to design" is its named anti-pattern. |
| Asking a question the codebase answers | Resolve it. Questions are for decisions, not facts. |
| Asking a question whose answers produce the same code | Take the recommendation, note the assumption, move on. |
| Implementing straight from the conversation | Brainstorming's terminal state is `writing-plans`. The plan is what Step 3 executes. |
| Judging DRY or elegance mid-flow | Step 7 owns them — one big-model pass over the final diff, once. |
| Running the final check on a small/fast model | It exists to buy top-tier judgment. Largest model available, always. |
| Running the final check before the green gate, or twice | Once, on the finished diff, after green (and the real run when it applies). |
| Writing the test after reading the implementation | The assertion must predate the code. |
| Letting a task rewrite its own acceptance assertion | Weakened assertion is blocking. |
| Demanding a red run everywhere | Only for bug fixes. |
| Mocking the thing under test | Mock budget is zero by default. |
| Review panel after every single task | Per batch. Escalate to one agent per blocking lens only on the high-risk list. |
| A self-review agent between every pair of steps | Three gates, each on a predicate. A gate whose predicate does not fire is skipped in one line. |
| Gating a task nothing downstream reads | Gate B is for the contract others code against. Everything else waits for Step 4. |
| Widening gate A or B into a review panel | One read-only subagent each. Only gate C escalates, and only on the high-risk list. |
| Dispatching dependent tasks on an unreviewed contract | Gate B first. A wrong foundation multiplies, and a batch that agrees with itself reviews as clean. |
| Reviewing assertions only after the code exists | Gate A runs before Step 3, when a rewrite is still free. |
| Driving a one-package or invisible change through the running app | Skip the real-run pass and say so. The green gate already proved it. |
| Shipping a cross-package user-facing feature on unit tests alone | One real scenario in the running app, including its error path. |
| Paying an LLM to find `console.log` | Grep pre-pass. Agents are for judgment. |
| Trusting a checker's `file:line` | Confirm against the current tree. Unmatched finding is discarded. |
| Serializing tasks that share nothing | Dispatch them in parallel in one message. |
| Running the full suite locally | Targeted tests plus filtered typecheck. |
| Interrogating in `execution` mode | The issue already settled it. A genuine fork means a `decision` wait, asked with `asking-for-decisions`. |
| Editing production code in `brief` mode | Brief mode stops at the decision report. |

## When not to use

- Trivial one-line changes with no decision — still run the green gate.
- Stress-testing an idea without implementing it.
