/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

// Bug hunter arsenal: parses a curated tool catalog (markdown README) into
// sections and tools, and tags each section with the lane it belongs to in this
// lab. Nothing here runs a tool — it only reads a public README and classifies it.

export const DEFAULT_SOURCE = 'https://github.com/paundrapf/BUG-HUNTER-TOOLS';
export const README_MAX_CHARS = 400000;

export const LANE_META: Record<string, { label: string; note: string }> = {
  in_contract: {
    label: 'Read-only',
    note: 'Observation and analysis. Usable as evidence in a dossier.'
  },
  gated: {
    label: 'Authorized only',
    note: 'Active probing. Only ever against a target the operator has authorized.'
  },
  excluded: {
    label: 'Off-contract',
    note: 'Cataloged for awareness. Never executed from this lab.'
  }
};

const EXCLUDED_RX =
  /(exploit|password|crack|red team|privilege escalation|post-?exploitation|reverse shell|webshell|social engineering|phish|wireless|automotive|hardware|bug bounty automation)/i;

const IN_CONTRACT_RX =
  /(recon|osint|forensic|log analysis|siem|threat intel|reporting|ssl|tls|steganograph|malware analysis)/i;

export function laneFor(section: string): string {
  const name = String(section || '');
  if (EXCLUDED_RX.test(name)) return 'excluded';
  if (IN_CONTRACT_RX.test(name)) return 'in_contract';
  return 'gated';
}

function stripSymbols(text: string): string {
  return String(text || '')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2190}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu, '')
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .trim();
}

function plain(text: string): string {
  return String(text || '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstLink(cell: string): { name: string; url: string } {
  const match = String(cell || '').match(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/);
  if (!match) return { name: plain(cell), url: '' };
  return { name: plain(match[1]), url: match[2] };
}

type Tool = { name: string; url: string; description: string; status: string; lane: string };
type Section = { name: string; lane: string; tools: Tool[] };

function addTool(section: Section, nameCell: string, descriptionCell: string, statusCell: string) {
  const link = firstLink(nameCell);
  const name = (link.name || plain(nameCell)).slice(0, 80);
  if (!name) return;
  if (section.tools.some((tool) => tool.name.toLowerCase() === name.toLowerCase())) return;
  section.tools.push({
    name,
    url: link.url.slice(0, 300),
    description: plain(descriptionCell).slice(0, 240),
    status: stripSymbols(plain(statusCell)).slice(0, 40),
    lane: section.lane
  });
}

export function parseCatalog(markdown: string): { sections: Section[]; counts: any } {
  const lines = String(markdown || '').split('\n');
  const sections: Section[] = [];
  const index = new Map<string, Section>();
  let current: Section | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      if (heading[1].length === 2) {
        const name = stripSymbols(heading[2]);
        current = null;
        if (name && !/^(index|criteria|contents|table of contents)$/i.test(name)) {
          const key = name.toLowerCase();
          current = index.get(key) || { name, lane: laneFor(name), tools: [] };
          if (!index.has(key)) {
            index.set(key, current);
            sections.push(current);
          }
        }
      }
      continue;
    }

    if (!current) continue;

    if (line.startsWith('|')) {
      const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
      if (cells.length < 2) continue;
      if (cells.every((cell) => !cell || /^:?-{2,}:?$/.test(cell))) continue;
      if (/^tool$/i.test(plain(cells[0]))) continue;
      addTool(current, cells[0], cells[1] || '', cells[2] || '');
      continue;
    }

    const bullet = line.match(/^[-*+]\s+(.+)$/);
    if (bullet && /\]\(/.test(bullet[1])) {
      const link = firstLink(bullet[1]);
      if (!link.name || !link.url) continue;
      const description = plain(bullet[1].replace(/\[[^\]]+\]\([^)]*\)/, ''));
      addTool(current, '[' + link.name + '](' + link.url + ')', description, '');
    }
  }

  const filled = sections.filter((section) => section.tools.length > 0);
  const counts = {
    sections: filled.length,
    tools: 0,
    in_contract: 0,
    gated: 0,
    excluded: 0
  };
  for (const section of filled) {
    counts.tools += section.tools.length;
    counts[section.lane] += section.tools.length;
  }
  return { sections: filled, counts };
}