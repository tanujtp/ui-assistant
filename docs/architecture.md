# Architecture

UI Assistant is split into three layers with one-way dependencies:

```
ui/          widget, highlighter, styles      (DOM, Shadow DOM)
  └─ core/   snapshot, prompt, parse, engine  (pure logic, DOM read-only)
       └─ providers/   LLM adapters           (fetch only)
```

## Design principles

1. **Advisory only.** The library tells the user what to do; it never acts for them. A prompt-injected page can at worst show misleading text, never click or submit.
2. **Untrusted in, validated out.** Page text and knowledge go into the prompt as data. The model reply is parsed defensively (`parseAnswer` never throws), capped (8 steps, bounded string lengths) and rendered via `textContent`.
3. **Privacy by construction.** `takeSnapshot` reads labels, never values; skips password and `cc-*` inputs; honours `data-uia-ignore`.
4. **Provider-agnostic.** The engine depends on a single interface:

   ```ts
   interface LLMProvider { name: string; complete(req: CompletionRequest): Promise<string> }
   ```
5. **Graceful degradation.** Unknown element ids, bad selectors, malformed JSON and provider errors all produce a usable UI state instead of an exception.

## Modules

| Module | Responsibility |
|---|---|
| `core/snapshot.ts` | Collect visible interactive elements into ids (`e1…`) + a private id→node map. |
| `core/prompt.ts` | Build the system prompt; bound knowledge length; frame data as untrusted. |
| `core/parse.ts` | Extract the first balanced JSON object and validate it into `AssistantAnswer`. |
| `core/engine.ts` | `ask()` orchestration, bounded history, target resolution. |
| `providers/*` | Anthropic, OpenAI-compatible, proxy, scripted. Errors never echo response bodies. |
| `ui/widget.ts` | Public `createAssistant`; chat log, tour card, keyboard handling, overlap avoidance. |
| `ui/highlighter.ts` | rAF-aligned spotlight ring; `pointer-events: none` so users click the real control. |

## Request flow

1. User submits a question.
2. `takeSnapshot` captures the *current* screen (so answers track SPA navigation).
3. `buildSystemPrompt` assembles knowledge + page data; history is appended.
4. `provider.complete` returns text; `parseAnswer` validates it.
5. `resolveSteps` binds `target` strings to live elements; the widget renders step 1 and highlights it.

## Extending

- **New model/backend:** implement `LLMProvider`.
- **Different UX:** use `AssistantEngine` directly (it is DOM-reading only) and render however you like.
- **Stricter privacy:** pass `snapshot: { ignoreSelector: ".sensitive" }` or add `data-uia-ignore` in markup.
