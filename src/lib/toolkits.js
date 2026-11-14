/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

/**
 * Reference toolkits indexed by the IDE. Everything here is read-only:
 * the module maps each repository, it never downloads or runs it.
 */
export const TOOLKITS = {
  ghidra: {
    key: "ghidra",
    route: "/ghidra",
    name: "Ghidra",
    owner: "NationalSecurityAgency",
    repo: "ghidra",
    crumb: "Ghidra / analysis core",
    note: "reference index · no execution",
    role: "Binary analysis core",
    plugsIn: "3 · Read the evidence",
    usedFor:
      "Ghidra runs on your own host, not here. This module keeps the toolkit's map in the IDE: its licence, current release and how the repository splits into subsystems, so a dossier's binary claims can name the exact component they rest on.",
    licenseNote:
      "Apache-2.0: permissive, so referencing it is straightforward. Redistribution still carries its notice and NOTICE file.",
    capabilities: [
      {
        name: "Decompiler",
        detail: "Turns machine code into C-like output. The layer a dossier cites when it claims what a binary does.",
        lane: "in_contract"
      },
      {
        name: "Headless analyzer",
        detail: "Batch import, auto-analysis and scripting with no UI, so a pass can produce artifacts it points at.",
        lane: "in_contract"
      },
      {
        name: "Processor modules",
        detail: "Per-architecture language definitions under Ghidra/Processors: x86, ARM, MIPS, PowerPC and others.",
        lane: "in_contract"
      },
      {
        name: "Version tracking",
        detail: "Diffs two builds of the same artifact, which is how a claim that a patch landed gets corroborated.",
        lane: "in_contract"
      },
      {
        name: "Debugger",
        detail: "Attaches to a running process, so it needs a live target and stays outside a read-only pass until authorized.",
        lane: "authorized"
      },
      {
        name: "Binary patching",
        detail: "Writes into a process or rewrites an artifact. Documented for awareness; the lab never does this.",
        lane: "off_contract"
      }
    ]
  },

  shannon: {
    key: "shannon",
    route: "/shannon",
    name: "Shannon",
    owner: "KeygraphHQ",
    repo: "shannon",
    crumb: "Shannon / attack surface",
    note: "reference index · no execution",
    role: "Source-level attack surface",
    plugsIn: "9 · Pressure-test it",
    usedFor:
      "Shannon reads application source and reasons about attack vectors. Its analysis half answers a question this lab can ask about code you own; its exploit half does not fit the read-only contract. This module indexes the repository so a pressure-test stage can name the component a finding came from.",
    licenseNote:
      "AGPL-3.0: strong copyleft. Running it as a separate service is a different thing from linking it into code you distribute, so check before embedding any of it.",
    capabilities: [
      {
        name: "Attack surface mapping",
        detail: "Reads the application source and maps entry points it can see, on code you own or are authorized to review.",
        lane: "in_contract"
      },
      {
        name: "Prompt-driven reasoning",
        detail: "apps/worker/prompts carries the reasoning steps the worker runs, so a finding can cite where it reasoned from.",
        lane: "in_contract"
      },
      {
        name: "Findings report",
        detail: "Emits a per-run report with the vectors it proved, which a dossier can reference as a source.",
        lane: "in_contract"
      },
      {
        name: "Exploit execution",
        detail: "Fires real exploits at a running target to prove a finding. Outside this lab's read-only contract, whatever the authorization.",
        lane: "off_contract"
      },
      {
        name: "Agent plugins",
        detail: "Ships .claude-plugin and .cursor-plugin so it can run inside Claude Code or Cursor, on your host, not in this app.",
        lane: "authorized"
      }
    ]
  },

  "bug-hunter": {
    key: "bug-hunter",
    route: "/bug-hunter",
    name: "Bug hunter",
    owner: "paundrapf",
    repo: "BUG-HUNTER-TOOLS",
    indexed: false,
    role: "Arsenal index",
    plugsIn: "before 9 · Pressure-test it",
    usedFor:
      "A read-only index of a public tooling catalog, so a pressure test can name the tool a technique assumes without installing anything.",
    licenseNote: "Catalog only: each listed tool carries its own licence, which is worth checking before any of it is used.",
    capabilities: []
  },

  entropy: {
    key: "entropy",
    route: "/symmetry",
    name: "Shannon entropy",
    source: "symmetry · entropy dimension",
    railed: false,
    role: "Entropy recovery",
    plugsIn: "4 · Measure the graph",
    usedFor:
      "Asset families are ordered by Shannon entropy over their filename shapes: a family that looks machine-generated implies siblings the page never linked. The dimension predicts the missing ones, probes only the survivors, and records what each probe found.",
    licenseNote:
      "A measurement inside this app, not a bundled tool. The estimate is a heuristic over naming, so an unprobed sibling is reported as a prediction, never as an asset.",
    capabilities: [
      {
        name: "Family entropy",
        detail: "Clusters observed assets by their filename pattern and scores how ordered each cluster is.",
        lane: "in_contract"
      },
      {
        name: "Sibling prediction",
        detail: "Extends a cluster toward the names it implies, with the probability the inference carries.",
        lane: "in_contract"
      },
      {
        name: "Bounded probing",
        detail: "Confirms a predicted sibling with a single read of the authorized surface, and records a miss as a miss.",
        lane: "in_contract"
      },
      {
        name: "State-key inventory",
        detail: "Lists storage and cookie key names only. Values are never read, so a state key is named without being captured.",
        lane: "in_contract"
      },
      {
        name: "Path enumeration",
        detail: "Walking a whole keyspace to find unpublished assets sits outside the read-only contract and is never done.",
        lane: "off_contract"
      }
    ]
  },

  replica: {
    key: "replica",
    route: "/spec",
    name: "Replica",
    source: "in-app skill pipeline",
    railed: false,
    role: "1:1 clone gate",
    plugsIn: "8 · Gate the clone 1:1",
    usedFor:
      "The skill that decides whether a rebuild may be called a clone: a parity matrix over the captured contracts, a brand sweep for the original's marks, a contrast check, and one combined verdict. It reads the spec, never the live target.",
    licenseNote:
      "Built in this app. Its verdict is a set of gates, so a pass means each gate held, not that a human signed off on resemblance.",
    capabilities: [
      {
        name: "Parity matrix",
        detail: "Compares captured contracts against the rebuild row by row, and marks an unmatched row instead of rounding it up.",
        lane: "in_contract"
      },
      {
        name: "Brand sweep",
        detail: "Finds the original's names, marks and copy strings still carried in the rebuild, which is the usual reason a clone is not shippable.",
        lane: "in_contract"
      },
      {
        name: "Contrast check",
        detail: "Scores the rebuilt surfaces against accessibility contrast, so the clone is not a visual copy of an unreadable page.",
        lane: "in_contract"
      },
      {
        name: "Combined verdict",
        detail: "Rolls the gates into one verdict that the spec carries, with the failing rows named.",
        lane: "in_contract"
      },
      {
        name: "Live re-capture",
        detail: "Reading the running replica's own surfaces needs that host authorized; the gate itself never re-reads the original.",
        lane: "authorized"
      }
    ]
  },

  "rea-agents": {
    key: "rea-agents",
    route: "/verdict",
    name: "Rea agents",
    source: "in-app pods",
    railed: false,
    role: "Stage owners",
    plugsIn: "10 · Sign it off",
    usedFor:
      "The pods that own a stage each review what the pass produced and record a verdict with its transcript. A decline routes the stage back as needs_input, so nothing closes on silence.",
    licenseNote:
      "Built in this app on the agent runtime. Verdicts are held in the run record, so every closed stage points at the conversation that closed it.",
    capabilities: [
      {
        name: "Stage ownership",
        detail: "Each stage names the pod that answers for it, so a claim always has an owner to route back to.",
        lane: "in_contract"
      },
      {
        name: "Verdict and transcript",
        detail: "Records the verdict with the conversation it was signed in, readable after the fact.",
        lane: "in_contract"
      },
      {
        name: "needs_input routing",
        detail: "A decline or a timeout moves the stage back to needs_input instead of quietly closing it.",
        lane: "in_contract"
      },
      {
        name: "Pod framework",
        detail: "The pod roster and its lanes, mapped in the lab so a finding can name the pod that should own it.",
        lane: "in_contract"
      }
    ]
  },

  graph: {
    key: "graph",
    route: "/structure",
    name: "Graph theory suite",
    source: "topology · degree · SCC · centrality",
    railed: false,
    role: "Structural anomaly audit",
    plugsIn: "5 · Audit the structure",
    usedFor:
      "Runs the graph half of the pass over a captured dependency graph: degree distribution, strongly connected components, chain depth, duplicated edges and origin spread. Every anomaly it finds carries the fix the rebuild needs, and the plan is what the compile stage reads.",
    licenseNote:
      "Implemented in this app over the captured graph. The suites it is modelled on (networkx, igraph, graph-tool, Gephi) are not bundled or executed; their licences differ, so check before embedding any of them.",
    capabilities: [
      {
        name: "Degree and topology audit",
        detail: "In- and out-degree per node, hubs against the median, and orphans nothing reaches.",
        lane: "in_contract"
      },
      {
        name: "Cycle detection",
        detail: "Strongly connected components of size above one, plus self-references, named node by node.",
        lane: "in_contract"
      },
      {
        name: "Chain depth",
        detail: "The longest serial load chain, which is the waterfall depth a replica has to flatten.",
        lane: "in_contract"
      },
      {
        name: "Duplicate and dangling edges",
        detail: "The same load edge firing twice, and references the capture never resolved.",
        lane: "in_contract"
      },
      {
        name: "Origin spread",
        detail: "How much of the critical graph sits off the target origin, so third-party dependency is declared rather than inherited.",
        lane: "in_contract"
      },
      {
        name: "Fix plan",
        detail: "One ordered plan with a concrete fix per anomaly, copyable into the rebuild spec.",
        lane: "in_contract"
      },
      {
        name: "Live graph capture",
        detail: "Recording the graph from a browser session needs that session authorized; the audit itself never re-reads the target.",
        lane: "authorized"
      }
    ]
  }
};

/** Every toolkit, for the pipeline's on-hand list. */
export const TOOLKIT_LIST = Object.values(TOOLKITS);

/** Toolkits with their own page in the rail. */
export const RAIL_TOOLKITS = TOOLKIT_LIST.filter((toolkit) => toolkit.railed !== false);