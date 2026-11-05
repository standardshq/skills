export const meta = {
  name: "landing-dispatch",
  description:
    "One landing sweep: every unverified head through the factory gate, every red head fixed, every green head judged, answered and re-judged, every go with a screen demonstrated five per stack, in parallel, up to three rounds",
  phases: [
    { title: "Verify", detail: "the factory gate on a fresh clone of each unverified head" },
    { title: "Fix", detail: "one fixer per red head" },
    { title: "Judge", detail: "one juror per green head, at its fixed tier" },
    { title: "Answer", detail: "the fixer answers the verdict on the branch" },
    { title: "Re-judge", detail: "the previous entries and the delta, nothing else" },
    { title: "Demo", detail: "five go heads merged on one stack, each gesture on video" },
  ],
};

// args = {
//   skill: 'landing-pull-requests',
//   solo:  '<path of evaluating-changes/SOLO.md>',
//   stack: '<the demo checkout>',
//   repositories: { 'owner/repo': { targetBranch, gate, verify, generated, withheld, sensitiveData, boot, reset, apps } },
//   heads: [{ issue, repo, number, branch, head, tier, round, limit, screen: boolean,
//             ciGreen: boolean,
//             state: 'red' | 'green' | 'unverified' | 'change' | 'demo',
//             failure?: '<failed step + log excerpt, the check-run body, the conflict, or the target that moved>',
//             judged?: '<sha the last juror verdict judged; absent when the PR has none>',
//             previousVerdict?: '<entries of the last verdict, with the fixer's answers>' }],
// }
// `round` counts the PR's juror `verdict` rows and failed `demo` rows (a failed
// `check-run` is not a round); `limit` is three plus one per ruling asking a
// change. `ciGreen`: the required checks are green on `head` now. `state:
// 'change'` is a person's review or ruling asking a change, quoted in
// `previousVerdict`. A head whose latest `check-run` carries a target sha that
// has since moved comes `red`, its failure saying to merge `targetBranch` in and
// re-run `verify`. `state: 'demo'` is a go head with a screen and no `demo`
// row yet. A Sight head comes here red (for its fixer), once a fixer committed
// on its pull request (a `fixing` row on it), or when it touches a `withheld` or
// `generated` path or a `package.json` `scripts` entry: a juror then
// judges it at the Standard counts, never landing alone. An untouched green
// Sight head that touches none of those never comes here: landing writes its
// rows itself. A fixer that returns the head unchanged ends the chain
// `with-maintainer`. Every row is an `evidence`
// row on `issue` whose `subject` is `github:<repo>#<number>@<sha>`; no comment
// on the pull request is state.

const BATCH = 5;

const PUSH = {
  type: "object",
  properties: { head: { type: "string" }, summary: { type: "string" } },
  required: ["head", "summary"],
};
const VERDICT = {
  type: "object",
  properties: { head: { type: "string" }, go: { type: "boolean" }, verdict: { type: "string" } },
  required: ["head", "go", "verdict"],
};
const GATE = {
  type: "object",
  properties: {
    head: { type: "string" },
    gate: { type: "string", enum: ["passed", "failed", "error", "target-red"] },
    report: { type: "string" },
  },
  required: ["head", "gate", "report"],
};
const DEMO = {
  type: "object",
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        properties: {
          repo: { type: "string" },
          number: { type: "number" },
          head: { type: "string" },
          demo: {
            type: "string",
            enum: ["pass", "fail", "interaction", "skipped-model", "skipped-stack", "conflict"],
          },
          note: { type: "string" },
        },
        required: ["repo", "number", "head", "demo", "note"],
      },
    },
  },
  required: ["results"],
};

function subject(pr, head) {
  return `github:${pr.repo}#${pr.number}@${head}`;
}

function rowRule() {
  return `Write rows with your record tools as \`evidence\` on the issue, never as a comment on the pull request. Before writing a \`verdict\`, \`go\` or \`check-run\`, apply "Whose rows count" in the ledger section of the ${args.skill} skill.`;
}

function factoryGate(pr) {
  const gate = args.repositories[pr.repo]?.gate;
  return gate === "verify" || gate === "both";
}

function verifier(pr, head) {
  return agent(
    `You are the verifier of pull request ${pr.repo}#${pr.number}, issue ${
      pr.issue
    }, pinned head \`${head}\`.
Read § 2 of the ${args.skill} skill and obey it: commit status \`Standards Factory / verify\` pending, a fresh clone of that head in the routine's own environment (never another checkout), the \`scripts\` check of § 2 "Paths" (the \`scripts\` block of every \`package.json\` between the merge-base and that head), every \`verify\` line, the \`generated\` path check.
${rowRule()}
Write the \`check-run\` row (subject \`${subject(pr, head)}\`): a \`generated\` path edited (not reproduced by the repository's own generator) or a changed script that a \`verify\` line runs ("verify command redefined") makes it fail, the paths or scripts named in its body. Then the final commit status. A command that cannot start is \`error\`: no \`check-run\`, a \`signal\` with rule environment_broken.
When a command fails, run it on a fresh clone of the repository's \`targetBranch\` too: when every failing command fails there as well, the \`check-run\` is failed with those commands and the target's sha in its body, and you return \`target-red\` (write no signal and no Décision: the landing run does). A command failing only on the head, or a redefined script, is \`failed\`.
Repository facts: ${JSON.stringify(args.repositories[pr.repo])}
Return the head, passed / failed / error / target-red, and the failing output in a few lines.`,
    { label: `verify:${pr.repo}#${pr.number}`, phase: "Verify", schema: GATE },
  );
}

function fixer(pr, brief, phase) {
  return agent(
    `You are the fixer of pull request ${pr.repo}#${pr.number} (branch \`${
      pr.branch
    }\`, pinned head \`${pr.head}\`), issue ${pr.issue}.
Read § 3 of the ${args.skill} skill and obey it: a checkout of the branch, reproduce first, red-proven fix, conflict resolved in a merge commit, \`verify\` before pushing, never a \`generated\` path by hand, nothing \`sensitiveData\` names quoted.
${rowRule()}
Repository facts: ${JSON.stringify(args.repositories[pr.repo])}
Write the \`fixing\` row (subject \`${subject(pr, pr.head)}\`) before touching a line.

Your brief:
${brief}

Answer every entry or refute it in writing: your answers go in the summary you return, one line per entry, and the next juror reads them.
Run \`git cat-file -e <new head>\` before quoting it. Return the new head sha and the summary.`,
    { label: `fix:${pr.repo}#${pr.number}`, phase, schema: PUSH },
  );
}

/** A Sight pull request a fixer touched is judged at the Standard counts; its `tier` row stays. */
function countsOf(pr) {
  return pr.tier === "sight" ? "standard" : pr.tier;
}

function juror(pr, round, judged) {
  // First round: no juror verdict on the PR yet (`judged` absent) and no entries to judge.
  const first = !pr.judged && !pr.previousVerdict;
  const paths = factoryGate(pr)
    ? ""
    : `\nFirst, the \`generated\` path check of § 2 "Paths" on this head (the repository's own generator on a fresh clone): an edited generated path is a \`blocking\` entry.`;
  const brief = first
    ? `Round 1. Run ${args.solo} on pinned head \`${pr.head}\` with the counts of tier **${countsOf(
        pr,
      )}** as § 4 of the ${
        args.skill
      } skill lists them. The dossier adds the issue's acceptance and rulings and every review a person left on the pull request.`
    : `Round ${round}. Judge two things only: the previous verdict's entries with the fixer's answers, and \`git diff ${judged}..${pr.head}\`.
For each entry return **closed** (quote the test or excerpt that proves it) or **open** (what is still missing). Then read the delta alone and return any \`blocking\` it introduces. Nothing else is in scope.

Previous verdict and answers:
${pr.previousVerdict}`;
  return agent(
    `You are the juror of pull request ${pr.repo}#${pr.number}, issue ${pr.issue}, pinned head \`${
      pr.head
    }\`. Read the ${args.skill} skill § 4 first. Never judge a head other than the pinned one.
Repository facts: ${JSON.stringify(args.repositories[pr.repo])}
${brief}${paths}
${rowRule()}
Write the \`verdict\` row (subject \`${subject(pr, pr.head)}\`, outcome go or changes, the entries in the body). On go, write the \`go\` row on the same subject right after.

Return go=true only when ${
      first
        ? "there is no `blocking` and no `to fix`"
        : "every entry is closed and the delta introduces no `blocking`"
    }. Return the verdict text exactly as written in the row.`,
    {
      label: `judge:${pr.repo}#${pr.number} r${round}`,
      phase: first ? "Judge" : "Re-judge",
      schema: VERDICT,
    },
  );
}

function demonstrator(batch, n) {
  const list = batch
    .map(
      (pr) => `- ${pr.repo}#${pr.number} \`${pr.branch}\` head \`${pr.head}\`, issue ${pr.issue}`,
    )
    .join("\n");
  return agent(
    `You are the demonstrator of batch ${n} of this landing sweep. Read § 5 of the ${args.skill} skill and obey it.

The batch:
${list}

Demo checkout: ${args.stack}. Work there and only there. Repository facts: ${JSON.stringify(
      args.repositories,
    )}.

In order:
1. Fetch, a throwaway branch \`landing-demo/${n}\` from the repository's target branch, each head merged in with \`git merge --no-ff\`; a head that conflicts is dropped from the batch and returned as \`conflict\` (abort the merge, continue with the others). Never push this branch.
2. The stack: \`boot\` (bring it up if it does not answer), \`reset\`, rebuild the batch, on seeded or anonymised data only. A stack that stays down after one retry returns every head as \`skipped-stack\` with the failing step's output.
3. For each head, before reading its diff: the gesture from the pull request's title and body and its issue: route, steps, end state a person can check. A surface the project's context marks as model-backed is \`skipped-model\` without a try.
4. One browser spec per head, written and run as the repository's own end-to-end setup says, video on, human pace, asserting the end state; run them together, ${BATCH} workers. Unique data names per spec (suffix \`landing<number>\`), never delete another spec's data.
5. A failing gesture is replayed alone: a second throwaway branch \`landing-demo/${n}-<number>\` = the target branch + that head only, same rebuild, that spec only. Fails again → \`fail\`. Passes alone → \`interaction\`; name the pull request it collided with in the note when you can.
6. Rows (${rowRule()}): attach each video to its issue record, then a \`demo\` row on \`github:<repo>#<number>@<head>\`: outcome pass (the gesture in three lines, the video linked), fail (the spec in a fenced block, expected against observed), or skipped with reason model or stack. Announce each pass as § 5 point 5 says, with the native Slack tools, in the announcement channel the project's context names: the video as mp4, playing inline, the announcement as its comment. A failed upload is a line in the note, not an error.
7. Delete the throwaway branches; keep the stack up for the next batch.

Return one result per head of the batch, with its repository (owner/repo) and number.`,
    { label: `demo:batch ${n}`, phase: "Demo", schema: DEMO },
  );
}

// Go heads with a screen wait here; the demonstrator takes five at a time, one
// batch after another on the single stack, while the other chains keep running.
const pending = [];
const demoOf = new Map();
let batches = Promise.resolve();
let batchNo = 0;
let chainsLeft = args.heads.length;

function flush(force) {
  while (pending.length >= BATCH || (force && pending.length > 0)) {
    const batch = pending.splice(0, BATCH);
    const n = ++batchNo;
    batches = batches
      .then(() => demonstrator(batch, n))
      .then(
        (r) => {
          for (const x of r?.results || []) demoOf.set(`${x.repo}#${x.number}`, x);
        },
        () => {
          for (const pr of batch)
            demoOf.set(`${pr.repo}#${pr.number}`, {
              repo: pr.repo,
              number: pr.number,
              head: pr.head,
              demo: "skipped-stack",
              note: "the demonstrator died",
            });
        },
      );
  }
}

// A `ci` or `both` head is demonstrated only once its required checks are green;
// a head pushed in this run has none yet: the next run offers it.
function offer(pr, original) {
  const gate = args.repositories[pr.repo]?.gate;
  const ciReady = gate === "verify" || gate === "none" || (original.ciGreen && pr.head === original.head);
  if (pr.screen && ciReady) pending.push(pr);
  flush(false);
}

function chainDone() {
  chainsLeft -= 1;
  if (chainsLeft === 0) flush(true);
}

// The factory gate on `head`: null when it passed (or the repository has none),
// else the chain's outcome.
async function gate(pr, head) {
  if (!factoryGate(pr)) return null;
  const g = await verifier(pr, head);
  if (g.gate === "passed") return null;
  if (g.gate === "error") return { number: pr.number, head, outcome: "gate-error", note: g.report };
  if (g.gate === "target-red") return { number: pr.number, head, outcome: "target-red", note: g.report };
  return { number: pr.number, head, outcome: "red", note: g.report };
}

async function chain(given) {
  let pr = given;
  try {
    let state = pr.state;
    if (state === "unverified") {
      const stop = await gate(pr, pr.head);
      if (stop?.outcome === "gate-error" || stop?.outcome === "target-red") return stop;
      state = stop ? "red" : "green";
      if (stop) pr = { ...pr, failure: stop.note };
    }
    if (state === "red") {
      const push = await fixer(pr, pr.failure, "Fix");
      // A head the fixer could not move (a conflict it cannot resolve) must not come back every run.
      if (push.head === pr.head)
        return { number: pr.number, head: push.head, outcome: "with-maintainer", note: push.summary };
      return { number: pr.number, head: push.head, outcome: "fixed", note: push.summary };
    }
    if (state === "demo") {
      offer(pr, given);
      return {
        number: pr.number,
        head: pr.head,
        outcome: "go",
        note: "go already written; demo pending",
      };
    }

    let round = pr.round + 1;
    let head = pr.head;
    let verdict;
    if (state === "change") {
      // A person asked for a change: the fixer answers it first, then a juror judges the answers.
      const push = await fixer(pr, pr.previousVerdict, "Answer");
      head = push.head;
      verdict = await juror(
        { ...pr, head, previousVerdict: `${pr.previousVerdict}\n\nAnswers:\n${push.summary}` },
        round,
        pr.head,
      );
    } else {
      verdict = await juror({ ...pr, head }, round, pr.judged || pr.head);
    }
    while (!verdict.go && round < (pr.limit ?? 3)) {
      const push = await fixer({ ...pr, head }, verdict.verdict, "Answer");
      const judgedSha = head;
      head = push.head;
      round += 1;
      verdict = await juror(
        { ...pr, head, previousVerdict: `${verdict.verdict}\n\nAnswers:\n${push.summary}` },
        round,
        judgedSha,
      );
    }
    if (!verdict.go)
      return { number: pr.number, head, outcome: "with-maintainer", note: verdict.verdict };
    // Rounds ran without waiting for the gate: the go head is verified before it is offered.
    if (head !== pr.head) {
      const stop = await gate(pr, head);
      if (stop) return stop;
    }
    offer({ ...pr, head }, given);
    return { number: pr.number, head, outcome: "go", note: verdict.verdict };
  } finally {
    chainDone();
  }
}

const judged = await pipeline(args.heads, async (pr) => ({ repo: pr.repo, ...(await chain(pr)) }));

flush(true);
await batches;

// A failed demo is a verdict entry: the fixer answers it in this run, and the
// next run re-judges the delta and demonstrates again.
const results = await Promise.all(
  judged.filter(Boolean).map(async (r) => {
    const d = demoOf.get(`${r.repo}#${r.number}`);
    if (!d || r.outcome !== "go") return r;
    const pr = args.heads.find((h) => h.repo === r.repo && h.number === r.number);
    switch (d.demo) {
      case "pass":
        return { ...r, note: d.note };
      case "fail": {
        const push = await fixer({ ...pr, head: d.head }, d.note, "Answer");
        return { ...r, head: push.head, outcome: "fixed", note: push.summary };
      }
      case "interaction":
        return { ...r, outcome: "with-maintainer", note: d.note };
      case "conflict":
        return {
          ...r,
          outcome: "demo-skipped",
          note: `conflicts with the batch, next run; ${d.note}`,
        };
      case "skipped-model":
        return { ...r, outcome: "go", note: d.note };
      default:
        return { ...r, outcome: "demo-skipped", note: d.note };
    }
  }),
);

return results;
