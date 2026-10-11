import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { analysis_id } = await req.json();
    if (!analysis_id || typeof analysis_id !== 'string') {
      return Response.json({ error: 'analysis_id is required.' }, { status: 400 });
    }

    const record = await base44.entities.SiteAnalysis.get(analysis_id);
    if (!record) return Response.json({ error: 'Analysis not found.' }, { status: 404 });

    if (record.rebuild_prompt) {
      return Response.json({ prompt: record.rebuild_prompt });
    }

    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        'You are a systems architect writing a single, self-contained prompt that a developer will paste into Claude Code (the terminal coding agent) to fully reconstruct an application from scratch.\n\n' +
        'You are given a reverse-engineered logic map of an existing app (from its live site). Using ONLY what the map establishes, write the complete reconstruction prompt.\n\n' +
        'The prompt you write must contain these sections, in this order:\n' +
        '1. Role: "Act as a senior full-stack engineer and systems architect." plus a one-line description of the app being rebuilt.\n' +
        '2. Tech Stack: concrete stack recommendation (framework, styling, database, auth) sized to the app — simple apps get simple stacks; do not force heavyweight tooling.\n' +
        '3. Data Model: every inferred entity with its fields and relationships, as concrete schema definitions.\n' +
        '4. Core Features: numbered, implementation-ready feature list derived from the page structure and user flows, each with acceptance criteria.\n' +
        '5. Architecture Notes: the inferred API integrations and how to re-implement them, plus how to avoid the bottlenecks and UX issues found in the audit.\n' +
        '6. Build Phases: milestone order (data model → backend → core UI → polish) with what "done" means per phase.\n' +
        '7. Deliverables: working app, clean code, and a developer changelog mapping each feature back to the original app.\n\n' +
        'Rules: write the prompt in second person addressed to Claude Code; be specific and unambiguous (real field names, real routes, real component names); where the map marked something as inferred, phrase it as a requirement decision, not a guess; output ONLY the prompt text itself with no preamble, no commentary, and no markdown code fences around the whole thing.\n\n' +
        'LOGIC MAP (JSON):\n' + JSON.stringify(record.logic_map || {}, null, 2) +
        '\n\nORIGINAL URL: ' + record.url
    });

    const promptText = typeof llm === 'string' ? llm : (llm && llm.prompt) || String(llm);

    await base44.entities.SiteAnalysis.update(record.id, { rebuild_prompt: promptText });

    return Response.json({ prompt: promptText });
  } catch (error) {
    return Response.json({ error: 'Generation failed: ' + (error && error.message ? error.message : 'Unknown error') }, { status: 500 });
  }
}