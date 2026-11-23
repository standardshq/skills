# Standards skills

The official skills of [Standards](https://standards.new), in the [Agent Skills](https://agentskills.io) format. Each skill is a folder at `skills/<name>/`, holding a `SKILL.md` and the files it uses.

## The 17 skills

`working-on-issues` is the shared base every routine reads. The stages run on events, with a clock as their net, each working one issue at a time. **Intake** listens on Slack (`curating-requests`, `triaging-issues`). **Screening** (`screening-issues`, `previewing-features`, `designing-issues`) re-checks an issue against the default branch, and holds the design conversation of a large one. **Build** (`executing-issues`, with `implement`, `tdd`, `diagnosing-bugs`, `pr`) turns a screened issue into a pull request. **Land** (`landing-pull-requests`, `evaluate`) takes it to merged. **Pulse** (`watching-the-factory`) tells a person when a stage stops and launches Ready issues under their goals. `deciding-issues` is the human interface: every question for the maintainer is a Decision, and `setting-up-the-factory` installs the whole loop.

## Adding a skill to a workspace

In Standards, open the skills list and choose **Browse**. From the command line:

```bash
standards skills add standardshq/skills@<name>
```

Any tool that reads the Agent Skills format can use these folders as they are.

## How a version is published

`main` takes reviewed pull requests. The `stable` tag is what workspaces follow: moving it publishes, and moving it back rolls back. A workspace that left a skill untouched receives the new version within a day; a skill it modified is never overwritten.

Only organization admins can move `stable`, and it must stay an ancestor of `main`.

## Contributing

1. Add `skills/<name>/SKILL.md`. Its `name` equals the folder's.
2. Run `python3 scripts/build-index.py` to refresh `index.json`.
3. Open a pull request. CI validates each skill with `skills-ref` and checks the index.

## License

MIT
