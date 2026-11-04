#!/usr/bin/env python3
"""Writes index.json from the skills' frontmatter. `--check` fails when it is out of date."""
import json
import pathlib
import sys

import yaml

ROOT = pathlib.Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.json"


def entry(skill_file):
    frontmatter = skill_file.read_text(encoding="utf-8").split("---", 2)[1]
    fields = yaml.safe_load(frontmatter)
    return {"name": fields["name"], "description": fields["description"]}


def rendered():
    entries = [entry(path) for path in sorted(ROOT.glob("skills/*/SKILL.md"))]
    return json.dumps(entries, indent=2, ensure_ascii=False) + "\n"


if "--check" in sys.argv:
    if INDEX.read_text(encoding="utf-8") != rendered():
        sys.exit("index.json is out of date: run python3 scripts/build-index.py")
else:
    INDEX.write_text(rendered(), encoding="utf-8")
