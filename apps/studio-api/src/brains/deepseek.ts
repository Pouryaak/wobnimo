/* DeepSeek: OpenAI-compatible, and it caches the long, unchanging system
   prompt (the skill) between requests, which keeps each build cheap. */

import type { Brain } from '../brain';
import { openAICompatible } from './openai-compatible';

export interface DeepSeekEnv {
  DEEPSEEK_API_KEY: string;
  /** `deepseek-chat` by default. */
  DEEPSEEK_MODEL?: string;
}

export function deepseek(env: DeepSeekEnv): Brain {
  return openAICompatible({
    name: 'deepseek',
    url: 'https://api.deepseek.com/chat/completions',
    apiKey: env.DEEPSEEK_API_KEY,
    model: env.DEEPSEEK_MODEL || 'deepseek-chat',
  });
}
