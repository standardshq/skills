# Vendored skills

Source: [mattpocock/skills](https://github.com/mattpocock/skills) at commit `4ae2317`, `skills/engineering/<name>/`. Each folder carries the upstream licence as `LICENSE.mattpocock`. The `agents/openai.yaml` files are not vendored.

## implement

- Removed `disable-model-invocation: true`.
- Ticket reference is read through `working-on-issues` instead of "the issue tracker".
- Commits on the issue's branch; states that `executing-issues` opens the pull request.
- Dropped the `code-review` call.

## tdd

- `GLOSSARY.md` and ADRs read via the repository's rules (`working-on-issues`, `scripts/discover-repository.mjs`).
- Seams come from the `## Seams` section of the issue's agent brief instead of being asked of the user; no brief seam means a `decision` checkpoint (`working-on-issues` § Stopping for a person).
- Dropped the pointer to `codebase-design`, which is not vendored.
- Removed the `code-review` reference in "Rules of the loop".
- `tests.md`, `mocking.md` unchanged.

## diagnosing-bugs

- `GLOSSARY.md` and ADRs read via the repository's rules (`working-on-issues`, `scripts/discover-repository.mjs`).
- `scripts/hitl-loop.template.sh` unchanged.

## pr

- `GLOSSARY.md` reference replaced by the repository's rules (`working-on-issues`, `scripts/discover-repository.mjs`).
- `CREDITS.md` kept (Dex Horthy attribution).
