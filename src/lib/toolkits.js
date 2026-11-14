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
    plugsIn: "8 · Pressure-test it",
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
    plugsIn: "before 8 · Pressure-test it",
    usedFor:
      "A read-only index of a public tooling catalog, so a pressure test can name the tool a technique assumes without installing anything.",
    licenseNote: "Catalog only: each listed tool carries its own licence, which is worth checking before any of it is used.",
    capabilities: []
  }
};

export const TOOLKIT_LIST = Object.values(TOOLKITS);