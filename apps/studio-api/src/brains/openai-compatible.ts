/* Any provider that speaks the OpenAI chat-completions API with streaming:
   DeepSeek, OpenAI, Groq, Together, OpenRouter, a local server… */

import { BrainError, type Brain, type ThinkRequest } from '../brain';

export interface OpenAICompatibleOptions {
  name: string;
  /** The full chat-completions URL. */
  url: string;
  apiKey: string;
  model: string;
  temperature?: number;
}

export function openAICompatible(options: OpenAICompatibleOptions): Brain {
  return {
    name: `${options.name}/${options.model}`,
    async *think({ system, messages, maxTokens, signal }: ThinkRequest) {
      const res = await fetch(options.url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${options.apiKey}` },
        body: JSON.stringify({
          model: options.model,
          messages: [{ role: 'system', content: system }, ...messages],
          max_tokens: maxTokens,
          temperature: options.temperature ?? 0.6,
          stream: true,
        }),
        signal,
      });
      if (!res.ok || !res.body) throw new BrainError(`${options.name} answered ${res.status}`, res.status === 429 ? 429 : 502);

      /* server-sent events: `data: {json}` lines, ending with `data: [DONE]` */
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) return;
        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (data === '[DONE]') return;
          const text: string | undefined = JSON.parse(data).choices?.[0]?.delta?.content;
          if (text) yield text;
        }
      }
    },
  };
}
