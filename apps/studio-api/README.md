# Studio API

The brain behind the studio (`/studio/` on the site). One Cloudflare Worker,
one route: the studio POSTs the conversation, the worker adds the
wobnimo-mascot skill as the system prompt, asks the model, and streams the
reply back as plain text. The model key lives here and never reaches a
browser. The checker runs in the studio page, which sends its report back
here until the mascot is clean.

```
studio page ──POST { messages }──▶ worker ──▶ brain (DeepSeek today)
     ▲  runs checkCharacter,             │
     └──── streams text ◀────────────────┘
```

## Changing the brain

A brain is one file in `src/brains/` that implements `Brain` (`src/brain.ts`).
Pick it in `src/index.ts`, on the line marked "the one line to change".
Nothing in the studio changes.

- `deepseek.ts`: DeepSeek, today's brain.
- `openai-compatible.ts`: anything that speaks OpenAI chat completions with
  streaming (OpenAI, OpenRouter, Groq, Together, a local server). A new
  provider of that kind is a few lines, like `deepseek.ts`.
- For another API shape (Anthropic, Gemini), write a file that turns
  `ThinkRequest` into its request and yields the text of its stream.

## Deploy

```sh
cd apps/studio-api
npx wrangler@4 login
npx wrangler@4 secret put DEEPSEEK_API_KEY
npm run deploy
```

Then set the repository variable `STUDIO_API_URL` (Settings → Secrets and
variables → Actions → Variables) to the worker's URL. The Pages build bakes
it into the studio; without it the studio runs its demo, which replays the
cast instead of designing anything.

`ALLOWED_ORIGINS` and `DEEPSEEK_MODEL` are in `wrangler.toml`. Requests are
capped at 8 messages and 8,000 reply tokens. Before a public launch, add a
rate limit to the route (Cloudflare's rate limiting binding or a WAF rule),
since anyone on an allowed origin can spend tokens.

## Locally

`npm run dev` serves it on `localhost:8787` (put the key in `.dev.vars` as
`DEEPSEEK_API_KEY=...`). Build the site against it with
`STUDIO_API_URL=http://localhost:8787 npm run build` and serve `dist/site`
on port 8765, the local origin `ALLOWED_ORIGINS` already allows.
