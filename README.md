# Standards skills

The official skills of [Standards](https://standards.new), in the [Agent Skills](https://agentskills.io) format. Each skill is a folder at `skills/<name>/`, holding a `SKILL.md` and the files it uses.

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
