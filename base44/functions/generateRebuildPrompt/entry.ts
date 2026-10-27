import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getEntitlement } from '../../shared/entitlement.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const entitlement = await getEntitlement(base44, user);
    if (!entitlement.admin && entitlement.granted === 0) {
      return Response.json({ error: 'A paid website analysis is required to generate prompts.' }, { status: 403 });
    }

    const body = await req.json();
    const analysis_id = body.analysis_id;
    const brand_name = typeof body.brand_name === 'string' ? body.brand_name.trim() : '';
    const style = typeof body.style === 'string' ? body.style.trim() : '';

    if (!analysis_id || typeof analysis_id !== 'string') {
      return Response.json({ error: 'analysis_id is required.' }, { status: 400 });
    }

    const record = await base44.entities.SiteAnalysis.get(analysis_id);
    if (!record) return Response.json({ error: 'Analysis not found.' }, { status: 404 });

    if (brand_name) {
      if (record.white_label_prompt && record.white_label_brand === brand_name) {
        return Response.json({ prompt: record.white_label_prompt });
      }

      const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt:
          'You are a lead systems architect and UI/UX designer writing a single, self-contained prompt that a developer will paste into Claude Code (the terminal coding agent) to build a WHITE-LABEL, production-ready functional clone of an existing app.\n\n' +
          'You are given a reverse-engineered logic map of the original app. The clone must be functionally 1:1 with what the map establishes, but a completely unique brand with a premium, modernized UI. Do NOT copy the original app\u2019s CSS or visual identity.\n\n' +
          'The prompt you write must contain these sections, in this order:\n' +
          '1. Role: "Act as a lead systems architect and UI/UX designer." plus the mission: build ' + brand_name + ', a production-ready, functional 1:1 clone of the original app described below, under a new unique brand.\n' +
          '2. Core Functional Modules: numbered, implementation-ready modules with full feature parity, derived from the logic map (its data entities, user flows, page structure, and API integrations). Each module gets acceptance criteria.\n' +
          '3. UI/UX Identity: brand ' + brand_name + ' with a ' + (style || 'premium modern dark') + ' aesthetic. Give a concrete color palette (3-4 exact hex values), typography direction, component library guidance, and micro-interactions / skeleton loaders / smooth transitions for a high-end, app-like feel. The identity must be distinctive, not an imitation of the original.\n' +
          '4. Technical Stack: a concrete stack recommendation sized to the app (framework, styling, database, auth, state management, and real-time updates where the flows need them); simple apps get simple stacks.\n' +
          '5. Seed Data: instruct the builder to populate the database with realistic placeholder records mirroring the original app\u2019s typical content (real names and types, clearly placeholder data).\n' +
          '6. Resolution & Automation Logic: for every decision-like or outcome-like process the map exposes (state transitions, status resolution, external data checks), specify deterministic rules and where automation or admin control decides outcomes.\n' +
          '7. Build Phases: milestone order (data model, backend, core UI, polish) with what "done" means per phase.\n' +
          '8. Deliverables: complete working source code, populated data, and a technical specification mapping each original function to the new implementation.\n\n' +
          'Rules: write the prompt in second person addressed to Claude Code; be specific and unambiguous (real field names, real routes, real component names); where the map marked something as inferred, phrase it as a requirement decision, not a guess; output ONLY the prompt text itself with no preamble, no commentary, and no markdown code fences around the whole thing.\n\n' +
          'LOGIC MAP (JSON):\n' + JSON.stringify(record.logic_map || {}, null, 2) +
          '\n\nORIGINAL URL: ' + record.url
      });

      const promptText = typeof llm === 'string' ? llm : (llm && llm.prompt) || String(llm);

      await base44.entities.SiteAnalysis.update(record.id, {
        white_label_prompt: promptText,
        white_label_brand: brand_name
      });

      return Response.json({ prompt: promptText });
    }

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