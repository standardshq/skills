#!/usr/bin/env node
/**
 * Prints a map of a project's open issues: the verticals they fall in, and
 * inside each the families of issues that may ship under one plan, so a run
 * judges a short list instead of reading the backlog against itself.
 *
 *   node issue-families.mjs --input <issues.json> --project <id> [--issue <id>] [--json]
 *
 * Exit code 0 when it printed, 1 on a usage or input error.
 *
 * `--issue` prints only the family holding that issue. A family is a
 * candidate, not a verdict: the agent reads its members and keeps, splits or
 * dissolves it.
 *
 * The bar is looser than `issue-duplicates.mjs`: two duplicates describe the
 * same work, two members of a family describe different work under one plan,
 * and what makes them kin is what the duplicate pass refuses to count alone:
 * one citing the other, or both citing a third; an umbrella and its tasks are
 * kin by construction. One shared file still needs a
 * related title. Families are connected components, so a chain of edges joins
 * issues that share nothing directly; that is why the agent rules.
 *
 * A family holding an umbrella (an issue with tasks) is `shaped`: the plan
 * exists already. One whose members already sit under an umbrella or in a
 * blocked-by chain is `sliced`: someone cut it by hand.
 */
import { fileURLToPath } from "node:url";
import { describe, signals } from "./issue-duplicates.mjs";
import { byAge, idsOf, isOpen, parentOf, parseArgs, readIssues, valuesOf } from "./standards.mjs";

const TITLE_FAMILY = 0.5;
const TITLE_SUPPORT = 0.2;
const UNPLACED = "unplaced";

/** The most frequent value, ties broken alphabetically so every run prints the same map. */
function mostFrequent(values, fallback) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  const ranked = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return ranked[0]?.[0] ?? fallback;
}

/**
 * The code area one path points at: `modules/<domain>` wherever it appears
 * (the last one), else the package or app, else the top-level directory.
 */
function areaOf(path) {
  const segments = path.split("/");
  const module = segments.lastIndexOf("modules");
  if (module >= 0 && module + 1 < segments.length - 1) return segments[module + 1];
  const root = segments.findIndex((s) => s === "packages" || s === "apps");
  if (root >= 0 && root + 1 < segments.length - 1) return segments[root + 1];
  return segments[0];
}

export function verticalOf(paths) {
  return mostFrequent([...paths].map(areaOf), UNPLACED);
}

function familyEdge(a, b) {
  const s = signals(a, b);
  const names = [];
  if (a.parent === b.id || b.parent === a.id) names.push("parent");
  if (s.cites) names.push("cites");
  if (s.ref.length > 0) names.push(`ref ${s.ref.join(" ")}`);
  if (s.path.length > 0 && s.title >= TITLE_SUPPORT) names.push("path+title");
  if (s.title >= TITLE_FAMILY) names.push("title");
  return names.length > 0 ? { a: a.id, b: b.id, signals: names } : null;
}

function find(parent, id) {
  let root = id;
  while (parent.get(root) !== root) {
    parent.set(root, parent.get(parent.get(root)));
    root = parent.get(root);
  }
  return root;
}

/** Every family of two or more open issues, oldest member first. */
export function families(issues) {
  // An umbrella is read from its tasks: `childIds` holds six ids at most, so it is never listed from there.
  const umbrellas = new Set(issues.map(parentOf).filter(Boolean));
  const described = issues
    .filter(isOpen)
    .map((issue) => {
      const values = valuesOf(issue);
      return {
        ...describe(issue),
        status: values.status,
        parent: parentOf(issue),
        umbrella: umbrellas.has(String(issue.id)),
        chained:
          parentOf(issue) !== null ||
          umbrellas.has(String(issue.id)) ||
          idsOf(values.blockedBy).length > 0 ||
          idsOf(values.blocks).length > 0,
      };
    })
    .sort(byAge);
  const parent = new Map(described.map((d) => [d.id, d.id]));
  const edges = [];
  described.forEach((a, i) => {
    for (const b of described.slice(i + 1)) {
      const edge = familyEdge(a, b);
      if (!edge) continue;
      edges.push(edge);
      parent.set(find(parent, b.id), find(parent, a.id));
    }
  });
  const groups = new Map();
  for (const d of described) {
    const root = find(parent, d.id);
    groups.set(root, [...(groups.get(root) ?? []), d]);
  }
  return [...groups.values()]
    .filter((members) => members.length >= 2)
    .map((members) => {
      const ids = new Set(members.map((m) => m.id));
      const placed = members.map((m) => verticalOf(m.paths)).filter((v) => v !== UNPLACED);
      return {
        members,
        edges: edges.filter((e) => ids.has(e.a)),
        shaped: members.find((m) => m.umbrella)?.id ?? null,
        sliced: !members.some((m) => m.umbrella) && members.some((m) => m.chained),
        vertical: mostFrequent(placed, UNPLACED),
      };
    });
}

/** The open issues grouped by vertical, busiest first; every issue appears once. */
export function mapBacklog(issues) {
  const grouped = families(issues);
  const inFamily = new Set(grouped.flatMap((f) => f.members.map((m) => m.id)));
  const verticals = new Map();
  function verticalNamed(name) {
    if (!verticals.has(name)) verticals.set(name, { name, count: 0, families: [], singles: [] });
    return verticals.get(name);
  }
  for (const family of grouped) {
    const target = verticalNamed(family.vertical);
    target.families.push(family);
    target.count += family.members.length;
  }
  for (const issue of issues.filter(isOpen)) {
    if (inFamily.has(issue.id)) continue;
    const single = describe(issue);
    const target = verticalNamed(verticalOf(single.paths));
    target.singles.push(single);
    target.count += 1;
  }
  return [...verticals.values()].sort((x, y) => y.count - x.count || x.name.localeCompare(y.name));
}

function formatFamily(family, index) {
  const tag = family.shaped
    ? ` · shaped → issues:${family.shaped}`
    : family.sliced
      ? " · already sliced"
      : "";
  const lines = [`family ${index}${tag}`];
  for (const m of family.members) lines.push(`  issues:${m.id} [${m.status}] ${m.title}`);
  for (const e of family.edges) lines.push(`    ${e.a} ↔ ${e.b}  ${e.signals.join(", ")}`);
  return lines.join("\n");
}

function format(verticals) {
  const lines = [];
  let index = 0;
  for (const vertical of verticals) {
    lines.push(`## ${vertical.name}: ${vertical.count} open issue(s)`);
    for (const family of vertical.families) lines.push(formatFamily(family, ++index));
    if (vertical.singles.length > 0) {
      lines.push(`singles: ${vertical.singles.map((s) => `issues:${s.id}`).join(" ")}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

const toJson = (family) => ({
  members: family.members.map((m) => ({ id: m.id, title: m.title, status: m.status })),
  edges: family.edges,
  shaped: family.shaped,
  sliced: family.sliced,
  vertical: family.vertical,
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const project = typeof args.project === "string" ? args.project : undefined;
  const issues = await readIssues(args.input, project);
  if (typeof args.issue === "string") {
    const family = families(issues).find((f) => f.members.some((m) => m.id === args.issue));
    if (args.json) console.log(JSON.stringify(family ? toJson(family) : null, null, 2));
    else
      console.log(family ? formatFamily(family, 1) : `issues:${args.issue} belongs to no family`);
    return;
  }
  const verticals = mapBacklog(issues);
  if (args.json) {
    console.log(
      JSON.stringify(
        verticals.map((v) => ({
          name: v.name,
          count: v.count,
          families: v.families.map(toJson),
          singles: v.singles.map((s) => s.id),
        })),
        null,
        2,
      ),
    );
    return;
  }
  const count = verticals.reduce((sum, v) => sum + v.families.length, 0);
  console.log(format(verticals));
  console.log(`issue-families: ${count} famil(ies) in ${verticals.length} vertical(s)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await main();
  } catch (error) {
    console.error(`issue-families: ${error.message}`);
    process.exitCode = 1;
  }
}
