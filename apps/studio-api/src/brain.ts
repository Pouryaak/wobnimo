/* What every brain does: take the system prompt and the conversation, and
   stream the reply back as text. A provider is one file in ./brains that
   turns this into its own API; nothing else in the studio knows which one
   is in use. */

export interface BrainMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ThinkRequest {
  system: string;
  messages: BrainMessage[];
  /** A cap on the reply, so one request can't run up the bill. */
  maxTokens: number;
  signal: AbortSignal;
}

export interface Brain {
  /** For logs and the response headers. */
  readonly name: string;
  think(request: ThinkRequest): AsyncIterable<string>;
}

/** A provider said no, with the status to pass on. */
export class BrainError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
