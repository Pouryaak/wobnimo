/* The brain: the model that writes the spec, behind one small interface.

   The studio never talks to a model provider. It talks to the studio API
   (apps/studio-api), a tiny server that holds the provider key and the
   design skill, and streams back plain text. Which model answers is
   decided there, in one line, so changing the brain changes nothing here. */

export interface BrainMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Brain {
  /** Streams the reply to the conversation, as pieces of text. */
  think(messages: BrainMessage[], signal: AbortSignal): AsyncIterable<string>;
}

/** The studio API over HTTP: POST the conversation, read back a text stream. */
export class RemoteBrain implements Brain {
  constructor(private readonly endpoint: string) {}

  async *think(messages: BrainMessage[], signal: AbortSignal): AsyncGenerator<string> {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages }),
      signal,
    });
    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => '');
      throw new Error(res.status === 429 ? 'The studio is busy right now. Try again in a minute.' : `The studio API answered ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`);
    }
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) return;
        if (value) yield value;
      }
    } finally {
      reader.releaseLock();
    }
  }
}
