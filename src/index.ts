export { createAssistant } from "./ui/widget";
export type { AssistantConfig, AssistantHandle } from "./ui/widget";

export { AssistantEngine, resolveTarget, resolveSteps } from "./core/engine";
export type { EngineOptions } from "./core/engine";
export { takeSnapshot, accessibleLabel, IGNORE_ATTRIBUTE } from "./core/snapshot";
export { buildSystemPrompt } from "./core/prompt";
export { parseAnswer, extractJsonObject, MAX_STEPS } from "./core/parse";

export { createAnthropicProvider } from "./providers/anthropic";
export type { AnthropicOptions } from "./providers/anthropic";
export { createOpenAICompatibleProvider } from "./providers/openai";
export type { OpenAICompatibleOptions } from "./providers/openai";
export { createProxyProvider } from "./providers/proxy";
export type { ProxyOptions } from "./providers/proxy";
export { createScriptedProvider } from "./providers/scripted";
export type { ScriptedRule } from "./providers/scripted";
export { ProviderError } from "./providers/http";

export type {
  AssistantAnswer,
  ChatMessage,
  CompletionRequest,
  Guide,
  GuideStep,
  KnowledgeEntry,
  LLMProvider,
  PageElement,
  PageSnapshot,
  ResolvedAnswer,
  ResolvedStep,
  SnapshotOptions,
} from "./core/types";
