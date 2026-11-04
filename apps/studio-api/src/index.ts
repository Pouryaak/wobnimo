/* The studio API. One route: POST a conversation, get the brain's reply
   back as a plain text stream. It exists so the model key never reaches a
   browser, and so the studio never needs to know which model it talks to.

   To change the brain, change the one line marked below: everything else,
   here and in the studio, stays as it is. */

import { BrainError, type BrainMessage } from './brain';
import { deepseek, type DeepSeekEnv } from './brains/deepseek';
import { SYSTEM_PROMPT } from './prompt';

interface Env extends DeepSeekEnv {
  /** Origins allowed to call the API, comma separated. */
  ALLOWED_ORIGINS: string;
}

/* limits that keep one visitor from running up the bill */
const MAX_MESSAGES = 8;
const MAX_MESSAGE_CHARS = 48_000;
const MAX_REPLY_TOKENS = 8_000;

/* ---- the brain: the one line to change ---- */
const brainFor = (env: Env) => deepseek(env);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('origin') ?? '';
    const allowed = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
    if (!allowed.includes(origin)) return new Response('Origin not allowed', { status: 403 });
    const cors = { 'access-control-allow-origin': origin, vary: 'origin' };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { ...cors, 'access-control-allow-methods': 'POST', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '86400' } });
    }
    if (request.method !== 'POST') return new Response('POST a conversation', { status: 405, headers: cors });

    const messages = parse(await request.json().catch(() => null));
    if (typeof messages === 'string') return new Response(messages, { status: 400, headers: cors });

    const brain = brainFor(env);
    const replies = brain.think({ system: SYSTEM_PROMPT, messages, maxTokens: MAX_REPLY_TOKENS, signal: request.signal })[Symbol.asyncIterator]();

    /* wait for the first piece, so a refusal from the provider becomes a proper status */
    let first: IteratorResult<string>;
    try {
      first = await replies.next();
    } catch (e) {
      const status = e instanceof BrainError ? e.status : 502;
      console.error(brain.name, e);
      return new Response(status === 429 ? 'Busy, try again shortly' : 'The brain is unavailable', { status, headers: cors });
    }

    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          if (!first.done) controller.enqueue(encoder.encode(first.value));
          for (let next = await replies.next(); !next.done; next = await replies.next()) controller.enqueue(encoder.encode(next.value));
          controller.close();
        } catch (e) {
          console.error(brain.name, e);
          controller.error(e);
        }
      },
      cancel() {
        replies.return?.();
      },
    });
    return new Response(body, { headers: { ...cors, 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-brain': brain.name } });
  },
};

/** The conversation, or why it was refused. */
function parse(body: unknown): BrainMessage[] | string {
  const messages = (body as { messages?: unknown } | null)?.messages;
  if (!Array.isArray(messages) || !messages.length) return 'Expected { messages: [...] }';
  if (messages.length > MAX_MESSAGES) return `At most ${MAX_MESSAGES} messages`;
  for (const [i, m] of messages.entries()) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') return `messages[${i}] needs a role (user or assistant) and text content`;
    if (m.content.length > MAX_MESSAGE_CHARS) return `messages[${i}] is too long`;
  }
  if (messages[messages.length - 1].role !== 'user') return 'The last message must be from the user';
  return messages.map((m) => ({ role: m.role, content: m.content }));
}
