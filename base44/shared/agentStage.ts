/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

// Stage ownership. Every replica stage names an owning agent. This module asks
// that agent to sign its stage off from the evidence the stage carries, and
// moves the stage to needs_input when the agent declines or never answers.

export const STAGE_REVIEW_DEADLINE_MS = 40000;
const POLL_MS = 2500;

export interface StageReview {
  stage: string;
  agent: string;
  verdict: 'pass' | 'attention' | 'declined' | 'timeout';
  note: string;
  conversation_id: string;
}

function bullets(details: any): string {
  if (!Array.isArray(details) || !details.length) return '- no evidence lines on this stage';
  return details.filter(Boolean).slice(0, 8).map((line: any) => '- ' + String(line)).join('\n');
}

// The sign-off may only run on a spec that actually captured its surface. A
// stage owner cannot be asked to sign evidence that was never collected.
export function missingCaptureInputs(spec: any): string[] {
  const missing: string[] = [];
  const contracts = (spec && spec.contracts) || {};
  const capture = contracts.capture || {};
  const replica = (spec && spec.replica) || {};
  const pages = Number(capture.page_count || 0);
  const routes = Array.isArray(capture.route_paths) ? capture.route_paths.length : 0;
  const bundle = Array.isArray(spec && spec.deploy_bundle) ? spec.deploy_bundle.length : 0;
  if (!pages) missing.push('captured pages');
  if (!routes) missing.push('captured routes');
  if (!bundle) missing.push('deploy bundle');
  if (!replica.parity) missing.push('parity matrix');
  if (!Array.isArray(replica.stages) || !replica.stages.length) missing.push('stage board');
  return missing;
}

export function reviewSummary(reviews: StageReview[]) {
  return {
    reviewed: reviews.length,
    passed: reviews.filter((review) => review.verdict === 'pass').length,
    attention: reviews.filter((review) => review.verdict === 'attention').length,
    declined: reviews.filter((review) => review.verdict === 'declined').length,
    timed_out: reviews.filter((review) => review.verdict === 'timeout').length,
    verdicts: reviews.map((review) => ({
      stage: review.stage,
      agent: review.agent,
      verdict: review.verdict,
      note: review.note,
      conversation_id: review.conversation_id
    }))
  };
}

export function stageReviewPrompt(spec: any, stage: any): string {
  const lines = [
    'STAGE REVIEW',
    '',
    'You own the ' + (stage.label || stage.key) + ' stage of the clone pipeline. Sign it off or decline it from the evidence below.',
    'Spec: ' + ((spec && spec.title) || 'untitled') + ' · target ' + ((spec && spec.target_url) || 'not stated'),
    'Board status: ' + (stage.status || 'unknown'),
    'Board read: ' + (stage.summary || 'none'),
    '',
    'Evidence:',
    bullets(stage.details),
    '',
    'Answer with one JSON object and nothing else:',
    '{"verdict":"pass"|"attention"|"declined","note":"one sentence citing the evidence"}',
    'Use pass only when the evidence above supports the stage. Use declined when it does not; the stage then moves to needs_input.'
  ];
  return lines.join('\n');
}

function parseVerdict(content: any): { verdict: 'pass' | 'attention' | 'declined'; note: string } | null {
  if (typeof content !== 'string') return null;
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    const verdict = String(parsed.verdict || '').toLowerCase();
    if (verdict !== 'pass' && verdict !== 'attention' && verdict !== 'declined') return null;
    return { verdict, note: String(parsed.note || '').slice(0, 300) };
  } catch (error) {
    return null;
  }
}

export async function requestStageReviews(
  base44: any,
  options: { spec: any; stages: any[]; deadlineMs?: number }
): Promise<StageReview[]> {
  const spec = options.spec || {};
  const deadlineMs = options.deadlineMs || STAGE_REVIEW_DEADLINE_MS;
  const targets = (options.stages || []).filter((stage) => stage && stage.agent && stage.key);
  const open = new Map<string, { agent: string; id: string }>();

  await Promise.all(
    targets.map(async (stage) => {
      try {
        const conversation = await base44.asServiceRole.agents.createConversation({
          agent_name: stage.agent,
          metadata: { kind: 'stage_review', stage: stage.key, spec_id: spec.id }
        });
        const id = conversation && conversation.id;
        if (!id) return;
        open.set(stage.key, { agent: stage.agent, id });
        await base44.asServiceRole.agents.addMessage({ id }, { role: 'user', content: stageReviewPrompt(spec, stage) });
      } catch (error) {
        console.log('stage review could not open for ' + stage.key + ': ' + (error && error.message ? error.message : 'unknown'));
      }
    })
  );

  const resolved = new Map<string, StageReview>();
  const deadline = Date.now() + deadlineMs;

  while (open.size && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    await Promise.all(
      Array.from(open.entries()).map(async ([key, slot]) => {
        try {
          const conversation = await base44.asServiceRole.agents.getConversation(slot.id);
          const messages = (conversation && conversation.messages) || [];
          const reply = messages
            .filter((message: any) => message.role === 'assistant' && typeof message.content === 'string' && message.content.trim())
            .pop();
          if (!reply) return;
          const parsed = parseVerdict(reply.content);
          resolved.set(key, {
            stage: key,
            agent: slot.agent,
            verdict: parsed ? parsed.verdict : 'declined',
            note: parsed ? parsed.note : 'answered without a verdict',
            conversation_id: slot.id
          });
          open.delete(key);
        } catch (error) {
          // A failed poll is not a verdict; keep waiting until the deadline.
        }
      })
    );
  }

  open.forEach((slot, key) => {
    resolved.set(key, {
      stage: key,
      agent: slot.agent,
      verdict: 'timeout',
      note: 'no answer within ' + Math.round(deadlineMs / 1000) + 's',
      conversation_id: slot.id
    });
  });

  return Array.from(resolved.values());
}

export function applyStageReviews(stages: any[], reviews: StageReview[]) {
  const byStage = new Map((reviews || []).map((review) => [review.stage, review]));
  const wired = (stages || []).map((stage) => {
    const review = byStage.get(stage.key);
    if (!review) return stage;
    const blocked = review.verdict === 'declined' || review.verdict === 'timeout';
    const line = 'agent ' + review.agent + ' ' + (review.verdict === 'timeout' ? 'did not answer' : review.verdict) + ': ' + review.note;
    return {
      ...stage,
      status: blocked ? 'needs_input' : stage.status,
      agent_verdict: {
        verdict: review.verdict,
        note: review.note,
        conversation_id: review.conversation_id,
        at: new Date().toISOString()
      },
      details: [...(Array.isArray(stage.details) ? stage.details : []), line].slice(0, 12)
    };
  });

  const stage_counts = {
    pass: wired.filter((stage) => stage.status === 'pass').length,
    attention: wired.filter((stage) => stage.status === 'attention').length,
    needs_input: wired.filter((stage) => stage.status === 'needs_input').length
  };

  return { stages: wired, stage_counts, ready_to_ship: wired.length > 0 && stage_counts.pass === wired.length };
}