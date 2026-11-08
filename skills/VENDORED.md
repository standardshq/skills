# Vendored skills

Source: [mattpocock/skills](https://github.com/mattpocock/skills) at commit `4ae2317`, `skills/engineering/<name>/`. Each folder carries the upstream licence as `LICENSE.mattpocock`. The `agents/openai.yaml` files are not vendored.

## implement

- Removed `disable-model-invocation: true`.
- Ticket reference is read through `working-on-issues` instead of "the issue tracker".
- Commits on the issue's branch; states that `executing-issues` opens the pull request.
- Dropped the `code-review` call.

## tdd

- `GLOSSARY.md` and ADRs read via the repository's rules (`working-on-issues`, `scripts/discover-repository.mjs`).
- Seams come from the `## Seams` section of the issue's agent brief instead of being asked of the user; no brief seam means report and stop.
- Removed the `code-review` reference in "Rules of the loop".
- `tests.md`, `mocking.md` unchanged.

## diagnosing-bugs

- `GLOSSARY.md` and ADRs read via the repository's rules (`working-on-issues`, `scripts/discover-repository.mjs`).
- `scripts/hitl-loop.template.sh` unchanged.

## pr

- `GLOSSARY.md` reference replaced by the repository's rules (`working-on-issues`, `scripts/discover-repository.mjs`).
- `CREDITS.md` kept (Dex Horthy attribution).

## evaluating-changes (excerpt)

- The Fowler smell baseline in `CHARGES.md` § standards is copied from `skills/engineering/code-review/SKILL.md` (step 3, "smell baseline"), each smell's fix shortened; the rule that the repository's documented standards override it is kept. The rest of `code-review` is not vendored: its Spec axis is folded into the `spec` count.
- `LICENSE.mattpocock` sits beside it.
