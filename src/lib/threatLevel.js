/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

// Automatic threat categorization for lab findings.
// Every discovery is graded from its skill's risk class, then adjusted by what the
// evidence actually says: a probe that observed nothing demotes, and an unobserved
// inference can never reach the rupture tier.

export const THREAT_LEVELS = [
  { key: "rupture", label: "Critical Architectural Rupture", rank: 3 },
  { key: "exposure", label: "Data Exposure Risk", rank: 2 },
  { key: "flaw", label: "Minor Logic Flaw", rank: 1 },
  { key: "clear", label: "No Exposure Observed", rank: 0 }
];

const BASE_BY_SKILL = {
  "Ghost Write Hunter": 3,
  "Orphaned Read Path": 1,
  "Type Drift Sniper": 3,
  "Retry Entropy Sniff": 1,
  "Clock Skew Forensics": 1,
  "Cascade Cartography": 3,
  "Silence Mapper": 3,
  "Contract Erosion Scan": 1,
  "Cache Poison Surface": 3,
  "Framework Archaeology": 1,
  "Validator Integrity Check": 1,
  "Variance Key Audit": 2,
  "Boundary Posture Read": 1,
  "Bundle Exposure Scan": 2
};

const CLEAR_SIGNALS = [
  /not observable/i,
  /could not be (read|observed)/i,
  /no credential-shaped/i,
  /zero pattern matches/i,
  /not shareable/i,
  /not silently empty/i,
  /populated payload/i,
  /identical (body|representation|payload)/i,
  /declares the varied header/i,
  /voids? (the|that)/i
];

const EXPOSURE_SIGNALS = [
  /credential/i,
  /secret/i,
  /api key/i,
  /\btoken/i,
  /private key/i,
  /leak/i,
  /each other's/i,
  /per-reader/i,
  /personal/i,
  /\bpii\b/i,
  /exposes? (?:data|credential|reader)/i
];

const RUPTURE_SIGNALS = [
  /silent 200/i,
  /empty (?:payload|body|shell)/i,
  /shell payload/i,
  /poison/i,
  /mask(?:s|ed|ing)? (?:a )?fail/i,
  /stale/i,
  /orphan/i,
  /double write/i,
  /cascade/i,
  /breaks? (?:on|the) migration/i,
  /no read path/i
];

function matches(patterns, text) {
  return patterns.some((pattern) => pattern.test(text));
}

function reasonFor(rank, observed) {
  if (rank === 0) return "The probe observed nothing to flag on this surface.";
  if (rank === 3) return "Observed evidence of a system-wide failure the surface cannot recover from.";
  if (rank === 2) return observed
    ? "Observed evidence that data or credentials can reach the wrong reader."
    : "Inferred exposure. Confirming it needs the next read.";
  return observed
    ? "A contained flaw: real, but not shown to break the wider system."
    : "Inferred and capped at minor until a probe observes it.";
}

export function classifyFinding(finding) {
  const claim = typeof finding.claim === "string" ? finding.claim : "";
  const evidence = Array.isArray(finding.evidence) ? finding.evidence : [];
  const text = [claim, finding.gap || "", finding.next_probe || "", ...evidence].join(" ");
  const observed = Boolean(finding.observed);

  let rank = BASE_BY_SKILL[finding.skill];
  if (typeof rank !== "number") rank = 1;

  if (matches(EXPOSURE_SIGNALS, text)) rank = Math.max(rank, 2);
  if (observed && matches(RUPTURE_SIGNALS, text)) rank = 3;
  if (!observed) rank = Math.min(rank, 2);
  if (matches(CLEAR_SIGNALS, text)) rank = 0;

  const level = THREAT_LEVELS.find((item) => item.rank === rank) || THREAT_LEVELS[2];
  return { ...level, reason: reasonFor(rank, observed) };
}

export function groupFindings(findings) {
  const rows = (Array.isArray(findings) ? findings : []).map((finding) => ({
    finding,
    verdict: classifyFinding(finding)
  }));

  return THREAT_LEVELS.map((level) => ({
    level,
    rows: rows
      .filter((row) => row.verdict.key === level.key)
      .sort((a, b) => (Number(b.finding.confidence) || 0) - (Number(a.finding.confidence) || 0))
  })).filter((group) => group.rows.length > 0);
}