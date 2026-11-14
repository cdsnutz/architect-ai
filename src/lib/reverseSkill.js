/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

/**
 * The scenarios reverse-skill routes to, transcribed from its README (v1.0.1)
 * and mapped onto the stages of this lab. The indexed repository tree is the
 * source of truth for the paths; this file only records which stage can use
 * each playbook and whether it sits inside the read-only contract.
 */
export const REVERSE_ROUTES = [
  { goal: "APK / Android analysis", skill: "skills/apk-reverse/", stage: "3 · Read the evidence", lane: "in_contract" },
  { goal: "iOS / mobile", skill: "skills/mobile-reverse/", stage: "3 · Read the evidence", lane: "in_contract" },
  { goal: "Binary reverse (exe / dll / so / elf)", skill: "skills/ida-reverse/ · skills/radare2/", stage: "3 · Read the evidence", lane: "in_contract" },
  { goal: "Binary Ninja / HLIL / MLIL / MCP", skill: "skills/binary-ninja-reverse/", stage: "3 · Read the evidence", lane: "in_contract" },
  { goal: ".NET / C#", skill: "skills/dotnet-reverse/", stage: "3 · Read the evidence", lane: "in_contract" },
  { goal: "Frontend JS / encrypted params", skill: "skills/js-reverse/", stage: "3 · Read the evidence", lane: "in_contract" },
  { goal: "DSL VM / custom JS opcode VM", skill: "skills/reverse-engineering/dsl-vm-reverse/", stage: "3 · Read the evidence", lane: "in_contract" },
  { goal: "OLLVM deobfuscation", skill: "skills/reverse-engineering/references/ollvm-deobfuscation.md", stage: "3 · Read the evidence", lane: "in_contract" },
  { goal: "Malware / YARA", skill: "skills/malware-analysis/", stage: "3 · Read the evidence", lane: "in_contract" },
  { goal: "Supply chain / SBOM", skill: "skills/supply-chain-security/", stage: "3 · Read the evidence", lane: "in_contract" },
  { goal: "Case evidence review / report handoff", skill: "skills/case-review/", stage: "6 · Compile the rebuild", lane: "in_contract" },
  { goal: "Diagrams / reports", skill: "skills/diagram-generator/ · skills/docs-generator/", stage: "6 · Compile the rebuild", lane: "in_contract" },
  { goal: "HTTP capture / request replay", skill: "skills/js-reverse/ + Reqable MCP", stage: "4 · Measure the graph", lane: "authorized" },
  { goal: "API / GraphQL contracts", skill: "skills/api-security/", stage: "4 · Measure the graph", lane: "authorized" },
  { goal: "LLM / AI security", skill: "skills/llm-security/", stage: "9 · Pressure-test it", lane: "authorized" },
  { goal: "Penetration testing / scanning", skill: "skills/pentest-tools/", stage: "9 · Pressure-test it", lane: "off_contract" },
  { goal: "Firmware / IoT", skill: "skills/firmware-pentest/", stage: "9 · Pressure-test it", lane: "off_contract" },
  { goal: "Attack chain / red-team orchestration", skill: "skills/attack-chain/", stage: "9 · Pressure-test it", lane: "off_contract" },
  { goal: "CTF competition", skill: "CTF-Sandbox-Orchestrator/", stage: "9 · Pressure-test it", lane: "off_contract" },
  { goal: "Patch diff / N-day", skill: "skills/patch-diff-exploit/", stage: "9 · Pressure-test it", lane: "off_contract" },
  { goal: "Pwn / exploit development", skill: "skills/pwn-chain/", stage: "9 · Pressure-test it", lane: "off_contract" },
  { goal: "EDR bypass", skill: "skills/edr-bypass-re/", stage: "9 · Pressure-test it", lane: "off_contract" }
];

/**
 * The command families the contract names and refuses. They are written here so
 * the boundary is enumerated rather than implied: a request for any of these is
 * answered no by name, with the reason, instead of being quietly unsupported.
 * Nothing in this list is reachable from the app.
 */
export const CONTRACT_REFUSALS = [
  {
    key: "scanning",
    label: "Scanning",
    detail:
      "Port, service, directory and vulnerability sweeps, fuzzing and brute force all send traffic a third party never agreed to receive. Unauthenticated probing of a host is outside the contract even where a scan would be lawful."
  },
  {
    key: "exploitation",
    label: "Exploitation",
    detail:
      "Exploit development, pwn chains and N-day weaponisation exist to make a target fail. A read-only pass proves what a surface is, never what breaks it."
  },
  {
    key: "edr_bypass",
    label: "EDR / AV bypass",
    detail:
      "Evading endpoint detection is built to defeat a defender's controls on a machine you did not instrument. It is refused in every mode and under every authorization."
  },
  {
    key: "payloads_c2",
    label: "Payloads and command channels",
    detail:
      "Implants, staged loaders, beacons and remote control channels turn evidence into access. The lab produces documents, not code that calls home."
  },
  {
    key: "credential_access",
    label: "Credential access",
    detail:
      "Dumping, harvesting, replaying or intercepting credentials and session tokens is refused outright. State-key names are inventoried; values are never read."
  },
  {
    key: "persistence_escalation",
    label: "Privilege escalation and persistence",
    detail:
      "Local or domain escalation, scheduled-task and service persistence, and rootkit or bootkit installation all write to a live host. The lab writes to its own records only."
  },
  {
    key: "lateral_movement",
    label: "Lateral movement",
    detail:
      "Pivoting from one host to the next, or using a captured session to reach further systems, is refused. A pass reads one surface at a time, by name, with authorization on file."
  },
  {
    key: "defense_tampering",
    label: "Defence tampering",
    detail:
      "Clearing logs, disabling telemetry, or detecting and evading a sandbox destroys the very record a finding would rest on. Refused."
  }
];