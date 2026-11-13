/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.58';

const MAX_MESSAGES = 40;

// Read-only view of a stage sign-off conversation. The threads are opened with
// the service role, so the app user cannot read them directly; this returns the
// transcript to any signed-in operator and nothing else.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const conversationId = typeof body.conversation_id === 'string' ? body.conversation_id.trim() : '';
    if (!conversationId) return Response.json({ error: 'conversation_id is required' }, { status: 400 });

    const conversation = await base44.asServiceRole.agents
      .getConversation(conversationId)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!conversation) return Response.json({ error: 'That conversation was not found.' }, { status: 404 });

    const messages = (conversation.messages || [])
      .filter((message) => message && typeof message.content === 'string' && message.content.trim())
      .slice(-MAX_MESSAGES)
      .map((message) => ({
        role: message.role === 'assistant' ? 'assistant' : 'user',
        content: message.content.slice(0, 4000)
      }));

    return Response.json({ agent: conversation.agent_name || '', messages });
  } catch (error) {
    console.log('verdictThread failed: ' + (error && error.message ? error.message : 'unknown'));
    return Response.json({ error: 'Could not load that thread.' }, { status: 500 });
  }
}