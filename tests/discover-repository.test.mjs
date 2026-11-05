import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const SCRIPT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "skills",
  "working-on-issues",
  "scripts",
  "discover-repository.mjs",
);
const roots = [];

after(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
});

const git = (cwd, ...args) =>
  execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...args], { cwd, stdio: "pipe" });

function write(root, path, content) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), typeof content === "string" ? content : JSON.stringify(content));
}

const requiredCheck = (context) => [
  { type: "required_status_checks", parameters: { required_status_checks: [{ context }] } },
];
const pull = (base, head = "feature") => ({ baseRefName: base, headRefName: head });

/** A real git clone and a folder of GitHub JSON, then one run of the script. */
function discover({
  files = {},
  repo = { full_name: "org/app", default_branch: "main" },
  rules = [],
  pulls = [],
  branches = ["main"],
  head = "main",
  listed,
  github = {},
  args,
} = {}) {
  const root = mkdtempSync(join(tmpdir(), "discover-"));
  roots.push(root);
  const checkout = join(root, "checkout");
  mkdirSync(checkout);
  git(checkout, "init", "-b", "main");
  write(checkout, "README.md", "# app\n");
  for (const [path, content] of Object.entries(files)) write(checkout, path, content);
  git(checkout, "add", ".");
  git(checkout, "commit", "-m", "init");
  if (head !== "main") git(checkout, "checkout", "-b", head);
  const folder = join(root, "github");
  mkdirSync(folder);
  write(folder, "repo.json", repo);
  write(folder, "branches.json", branches.map((name) => ({ name })));
  write(folder, "rules.json", rules);
  write(folder, "pulls.json", pulls);
  for (const [name, content] of Object.entries(github)) write(folder, name, content);
  const flags = args ?? ["--checkout", checkout, "--github", folder];
  if (listed) {
    write(root, "listed.json", listed);
    flags.push("--listed", join(root, "listed.json"));
  }
  const result = spawnSync("node", [SCRIPT, ...flags], { encoding: "utf8" });
  return {
    status: result.status,
    stdout: result.stdout,
    facts: result.status === 0 ? JSON.parse(result.stdout) : null,
    root,
  };
}

const developPulls = [pull("develop"), pull("develop"), pull("develop"), pull("main")];
const developRepo = { branches: ["main", "develop"], pulls: developPulls, head: "develop" };

describe("merge", () => {
  test("a merge queue rule gives queue", () => {
    assert.equal(discover({ rules: [{ type: "merge_queue", parameters: {} }] }).facts.mode, "queue");
  });
  test("no merge queue gives a person", () => {
    assert.equal(discover().facts.mode, "human");
  });
  test("the queue's merge method wins", () => {
    const { facts } = discover({
      rules: [{ type: "merge_queue", parameters: { merge_method: "MERGE" } }],
    });
    assert.equal(facts.method, "merge");
  });
});

describe("gate", () => {
  test("a required check gives ci", () => {
    const { facts } = discover({ rules: requiredCheck("build") });
    assert.equal(facts.source, "ci");
    assert.equal(facts.gate, "ci");
  });
  test("check and verify give ci", () => {
    const { facts } = discover({
      rules: requiredCheck("build"),
      files: { "package.json": { scripts: { test: "x" } } },
    });
    assert.equal(facts.gate, "ci");
  });
  test("verify alone", () => {
    const { facts } = discover({ files: { "package.json": { scripts: { test: "x" } } } });
    assert.equal(facts.gate, "verify");
    assert.equal(facts.source, "factory");
  });
  test("no check and no verify still produces facts", () => {
    const result = discover();
    assert.equal(result.status, 0);
    assert.equal(result.facts.gate, "none");
    assert.equal(result.facts.source, "factory");
    assert.equal(result.facts.verify, "");
  });
});

describe("withheld", () => {
  test("workflows are withheld by default", () => {
    assert.ok(discover().facts.withheld.split("\n").includes(".github/workflows/**"));
  });
  test("CODEOWNERS paths are withheld", () => {
    const { facts } = discover({ files: { CODEOWNERS: "/billing/ @x\n" } });
    assert.ok(facts.withheld.split("\n").includes("billing/**"));
  });
  test("a slash-less CODEOWNERS path covers what is inside it", () => {
    const { facts } = discover({ files: { CODEOWNERS: "/billing @x\n" } });
    const lines = facts.withheld.split("\n");
    assert.ok(lines.includes("billing") && lines.includes("billing/**"));
  });
  test("an unanchored CODEOWNERS folder matches at any depth", () => {
    const { facts } = discover({ files: { CODEOWNERS: "docs/ @x\n" } });
    assert.ok(facts.withheld.split("\n").includes("**/docs/**"));
  });
  test(".github/CODEOWNERS wins over the root one", () => {
    const { facts } = discover({
      files: { ".github/CODEOWNERS": "/a/ @x\n", CODEOWNERS: "/b/ @x\n" },
    });
    const lines = facts.withheld.split("\n");
    assert.ok(lines.includes("a/**"));
    assert.ok(!lines.includes("b/**"));
  });
  test("what judges a pull request is withheld", () => {
    const lines = discover().facts.withheld.split("\n");
    for (const path of [
      "AGENTS.md",
      "CLAUDE.md",
      ".cursor/rules/**",
      "CODEOWNERS",
      ".github/CODEOWNERS",
      "docs/CODEOWNERS",
    ]) {
      assert.ok(lines.includes(path), path);
    }
  });
  test("AGENTS.md adds a withheld path", () => {
    const { facts } = discover({ files: { "AGENTS.md": "## Factory\nwithheld: secrets/**\n" } });
    assert.ok(facts.withheld.split("\n").includes("secrets/**"));
  });
});

describe("target branch", () => {
  test("most pull requests on develop give develop", () => {
    const { facts } = discover(developRepo);
    assert.equal(facts.targetBranch, "develop");
    assert.equal(facts.productionBranch, "main");
  });
  test("a checkout on another branch is refused", () => {
    const result = discover({ head: "feature/x" });
    assert.equal(result.status, 3);
    assert.equal(result.stdout, '{"targetBranch":"main"}');
  });
  test("an override naming an unknown branch is ignored", () => {
    const { facts } = discover({ files: { "AGENTS.md": "## Factory\ntargetBranch: ghost\n" } });
    assert.equal(facts.targetBranch, "main");
  });
  test("a feature branch's AGENTS.md cannot name the target", () => {
    const result = discover({
      ...developRepo,
      head: "feature/x",
      branches: ["main", "develop", "feature/x"],
      files: { "AGENTS.md": "## Factory\ntargetBranch: main\n" },
    });
    assert.equal(result.status, 3);
    assert.equal(result.stdout, '{"targetBranch":"develop"}');
  });
  test("pathGates is empty", () => {
    assert.equal(discover().facts.pathGates, "");
  });
  test("AGENTS.md names the branch", () => {
    const { facts } = discover({
      ...developRepo,
      head: "main",
      files: { "AGENTS.md": "## Factory\ntargetBranch: main\n" },
    });
    assert.equal(facts.targetBranch, "main");
  });
});

describe("AGENTS.md", () => {
  test("removes a command", () => {
    const { facts } = discover({
      files: {
        "pnpm-lock.yaml": "",
        "package.json": { scripts: { lint: "x", test: "y" } },
        "AGENTS.md": "## Factory\nskipVerify: pnpm run test\n",
      },
    });
    assert.equal(facts.verify, "pnpm run lint");
  });
  test("an unknown key is ignored", () => {
    const { facts } = discover({ files: { "AGENTS.md": "## Factory\nmode: direct\n" } });
    assert.equal(facts.mode, "human");
  });
});

describe("repository contents", () => {
  test("consumes reads listed packages", () => {
    const { facts } = discover({
      files: { "package.json": { dependencies: { "@org/lib": "1.0.0" } } },
      listed: [{ fullName: "org/lib", packages: ["@org/lib"] }],
    });
    assert.equal(facts.consumes, "org/lib");
  });
  test("a tracked .env.example is sensitive", () => {
    const { facts } = discover({ files: { ".env.example": "KEY=\n" } });
    assert.ok(facts.sensitiveData.includes(".env.example"));
  });
  test("launch.json gives boot and apps", () => {
    const { facts } = discover({
      files: {
        ".claude/launch.json": {
          configurations: [
            { name: "web", runtimeExecutable: "pnpm", runtimeArgs: ["dev"], port: 3000 },
          ],
        },
      },
    });
    assert.equal(facts.boot, "pnpm dev → :3000");
    assert.equal(facts.apps, "web, 3000, /");
  });
});

describe("bad input", () => {
  test("a bad call exits 2", () => {
    assert.equal(discover({ args: ["--github", "/nowhere"] }).status, 2);
  });
  test("a folder that is not a git clone exits 2", () => {
    const { root } = discover();
    const plain = join(root, "plain");
    mkdirSync(plain);
    const result = spawnSync("node", [SCRIPT, "--checkout", plain, "--github", join(root, "github")]);
    assert.equal(result.status, 2);
  });
  test("repo.json without full_name exits 2", () => {
    assert.equal(discover({ repo: {} }).status, 2);
  });
  test("a malformed rules.json exits 2", () => {
    assert.equal(discover({ github: { "rules.json": "not json" } }).status, 2);
  });
});
