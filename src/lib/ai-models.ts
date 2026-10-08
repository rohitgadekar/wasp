export type AIModelProvider = 'gemini' | 'openrouter';
export type AIModelCategory = 'auto' | 'fast' | 'coding' | 'reasoning' | 'general';

export interface AIModelConfig {
  id: string;
  name: string;
  shortName: string;
  provider: AIModelProvider;
  endpoint: 'ai-chat' | 'openrouter-chat';
  modelIdentifier: string;
  badge: string;
  description: string;
  category: AIModelCategory;
  tokenEfficiency: 'Ultra' | 'High' | 'Balanced';
  isFree: boolean;
  recommendedFor: string;
}

export interface AISkill {
  command: string; // '/code' | '/reason' | '/fast' | '/smart'
  name: string;
  description: string;
  iconName: 'code' | 'brain' | 'zap' | 'sparkles';
  targetModelId: string;
  systemDirective: string;
  badge: string;
}

export const AVAILABLE_MODELS: AIModelConfig[] = [
  {
    id: 'auto',
    name: 'Smart Router (Auto-Pilot)',
    shortName: 'Smart Router',
    provider: 'gemini',
    endpoint: 'ai-chat',
    modelIdentifier: 'auto',
    badge: '⚡ SMART',
    description: 'Smart query routing: analyzes prompt complexity and code to save tokens, optimize latency, and prevent hitting rate limits.',
    category: 'auto',
    tokenEfficiency: 'Ultra',
    isFree: true,
    recommendedFor: 'Automatic Token-Saving & Load Balancing'
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    shortName: 'Gemini 1.5 Flash',
    provider: 'gemini',
    endpoint: 'ai-chat',
    modelIdentifier: 'gemini-1.5-flash',
    badge: 'DEFAULT',
    description: 'Fast, high-accuracy multimodal model with massive context. The baseline workhorse for everyday development.',
    category: 'fast',
    tokenEfficiency: 'High',
    isFree: true,
    recommendedFor: 'Fast responses, general coding, and context lookups'
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    shortName: 'Gemini 2.0 Flash',
    provider: 'gemini',
    endpoint: 'ai-chat',
    modelIdentifier: 'gemini-2.0-flash',
    badge: 'FAST',
    description: 'Next-generation low-latency Gemini model built for instant code completion and snappy conversational turns.',
    category: 'fast',
    tokenEfficiency: 'High',
    isFree: true,
    recommendedFor: 'Ultra-fast turnarounds and lightweight prompts'
  },
  {
    id: 'cohere-code',
    name: 'Cohere North Mini Code (Free)',
    shortName: 'Cohere Code',
    provider: 'openrouter',
    endpoint: 'openrouter-chat',
    modelIdentifier: 'cohere/north-mini-code:free',
    badge: 'FREE CODE',
    description: 'Specialized 100% free agentic coding model with 256k context. Tuned specifically for code generation, bug fixing, and refactoring.',
    category: 'coding',
    tokenEfficiency: 'High',
    isFree: true,
    recommendedFor: 'Code generation, debugging, algorithms, and components'
  },
  {
    id: 'poolside-laguna',
    name: 'Poolside Laguna S 2.1 (Free)',
    shortName: 'Laguna S Code',
    provider: 'openrouter',
    endpoint: 'openrouter-chat',
    modelIdentifier: 'poolside/laguna-s-2.1:free',
    badge: 'CODING AGENT',
    description: 'Dedicated coding agent model from Poolside with 262k context. Tailored for full file generation and repository tasks.',
    category: 'coding',
    tokenEfficiency: 'High',
    isFree: true,
    recommendedFor: 'Agentic coding and complex file synthesis'
  },
  {
    id: 'nemotron-ultra-reasoning',
    name: 'NVIDIA Nemotron 3 Ultra (Free)',
    shortName: 'Nemotron Ultra',
    provider: 'openrouter',
    endpoint: 'openrouter-chat',
    modelIdentifier: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    badge: 'FRONTIER REASON',
    description: 'Open frontier-reasoning & orchestration model by NVIDIA with 55B active parameters and 1,000,000 context tokens. Deep chain-of-thought.',
    category: 'reasoning',
    tokenEfficiency: 'Ultra',
    isFree: true,
    recommendedFor: 'Complex system design, architectural tradeoffs, and logic proofs'
  },
  {
    id: 'openrouter-free',
    name: 'OpenRouter Free Auto-Router',
    shortName: 'OpenRouter Free',
    provider: 'openrouter',
    endpoint: 'openrouter-chat',
    modelIdentifier: 'openrouter/free',
    badge: '100% FREE',
    description: 'Guaranteed free meta-router. Automatically connects to whichever top-tier model is currently online and free on OpenRouter.',
    category: 'general',
    tokenEfficiency: 'Ultra',
    isFree: true,
    recommendedFor: 'Always available, zero cost, zero quota failure'
  },
  {
    id: 'nemotron-120b',
    name: 'NVIDIA Nemotron 120B (Free)',
    shortName: 'Nemotron 120B',
    provider: 'openrouter',
    endpoint: 'openrouter-chat',
    modelIdentifier: 'nvidia/nemotron-3-super-120b-a12b:free',
    badge: 'FREE 120B',
    description: 'Massive 120B parameter model tuned by NVIDIA for state-of-the-art accuracy, comprehension, and structured synthesis.',
    category: 'general',
    tokenEfficiency: 'Balanced',
    isFree: true,
    recommendedFor: 'High-capability developer inquiries & knowledge work'
  },
  {
    id: 'gemma-4-31b',
    name: 'Google Gemma 4 31B (Free)',
    shortName: 'Gemma 4 31B',
    provider: 'openrouter',
    endpoint: 'openrouter-chat',
    modelIdentifier: 'google/gemma-4-31b-it:free',
    badge: 'FREE 31B',
    description: 'Google open weights instruction-tuned 31B model with 262k context. Versatile, articulate, and completely free.',
    category: 'general',
    tokenEfficiency: 'Balanced',
    isFree: true,
    recommendedFor: 'Explanations, documentation, and structured writing'
  }
];

export const DEFAULT_MODEL_ID = 'auto';
export const DEFAULT_MODEL = AVAILABLE_MODELS.find(m => m.id === 'gemini-1.5-flash')!;

export const AI_SKILLS: AISkill[] = [
  {
    command: '/code',
    name: 'Code Specialist',
    description: 'Routes directly to Cohere North Mini Code for error-free production code, refactoring & AST syntax.',
    iconName: 'code',
    targetModelId: 'cohere-code',
    systemDirective: '',
    badge: 'CODE'
  },
  {
    command: '/reason',
    name: 'Deep Reasoning',
    description: 'Routes directly to NVIDIA Nemotron 3 Ultra (1M Context) for chain-of-thought analysis & architectural tradeoffs.',
    iconName: 'brain',
    targetModelId: 'nemotron-ultra-reasoning',
    systemDirective: '',
    badge: 'REASONING'
  },
  {
    command: '/fast',
    name: 'Ultra Fast Q&A',
    description: 'Routes directly to Gemini 2.0 Flash for instant, token-minimized turnarounds.',
    iconName: 'zap',
    targetModelId: 'gemini-2.0-flash',
    systemDirective: '',
    badge: 'FAST'
  },
  {
    command: '/smart',
    name: 'Smart Router (Auto-Pilot)',
    description: 'Dynamically classifies your prompt to pick the best free model and balance token overhead.',
    iconName: 'sparkles',
    targetModelId: 'auto',
    systemDirective: '',
    badge: 'SMART'
  }
];

export function parseSkillCommand(input: string): { skill: AISkill | null; cleanedInput: string } {
  const trimmed = input.trim();
  for (const skill of AI_SKILLS) {
    const pattern = new RegExp(`^\\${skill.command}(?:\\s+|:\\s*|-\\s*|$)`, 'i');
    if (pattern.test(trimmed)) {
      const rest = trimmed.replace(pattern, '').trim();
      return { skill, cleanedInput: rest };
    }
  }
  return { skill: null, cleanedInput: trimmed };
}

export interface RoutingDecision {
  targetModel: AIModelConfig;
  fallbackModel: AIModelConfig;
  reason: string;
  category: AIModelCategory;
  estimatedTokensSaved: string;
}

/**
 * Heuristic router: examines prompt keywords, length, and code blocks
 * to pick the most token-efficient and accurate 100% free model.
 */
export function routeQuery(
  prompt: string,
  history: Array<{ role: string; content: string }> = []
): RoutingDecision {
  const text = prompt.toLowerCase();
  const trimmed = prompt.trim();

  // Active 100% free helper models
  const cohereCode = AVAILABLE_MODELS.find(m => m.id === 'cohere-code') || DEFAULT_MODEL;
  const nemotronUltra = AVAILABLE_MODELS.find(m => m.id === 'nemotron-ultra-reasoning') || DEFAULT_MODEL;
  const openrouterFree = AVAILABLE_MODELS.find(m => m.id === 'openrouter-free') || DEFAULT_MODEL;
  const geminiFlash = AVAILABLE_MODELS.find(m => m.id === 'gemini-1.5-flash') || DEFAULT_MODEL;

  // 1. Code-specific detection
  const hasCodeBlock = prompt.includes('```') || prompt.includes('`');
  const codeKeywords = [
    /\b(function|def|class|const|let|var|import|export|interface|type)\b/,
    /\b(sql|query|select|insert|update|delete|where|join|table)\b/,
    /\b(react|component|hook|usestate|useeffect|props|jsx|tsx)\b/,
    /\b(bug|error|exception|debug|fix|trace|syntax|nullpointer|undefined)\b/,
    /\b(refactor|optimize code|algorithm|regex|git|docker|api|endpoint)\b/,
    /\b(python|javascript|typescript|golang|rust|html|css|tailwind)\b/
  ];

  const isCodeRelated = hasCodeBlock || codeKeywords.some(pattern => pattern.test(text));

  if (isCodeRelated) {
    return {
      targetModel: cohereCode,
      fallbackModel: geminiFlash,
      reason: 'Routed to Cohere North Mini Code (Free coding specialist with 256k context)',
      category: 'coding',
      estimatedTokensSaved: '~30-40% via code-specialized tokens'
    };
  }

  // 2. Complex Reasoning & Architecture detection
  const reasoningKeywords = [
    /\b(why does|explain the tradeoff|compare and contrast|difference between)\b/,
    /\b(architecture|system design|scalability|pros and cons|evaluate)\b/,
    /\b(step by step|prove that|mathematical|logic puzzle|deduce)\b/,
    /\b(deep analysis|in-depth|detailed breakdown|comprehensive analysis)\b/
  ];

  const isReasoningRelated = reasoningKeywords.some(pattern => pattern.test(text)) || prompt.length > 500;

  if (isReasoningRelated) {
    return {
      targetModel: nemotronUltra,
      fallbackModel: openrouterFree,
      reason: 'Routed to Nemotron 3 Ultra (Frontier-reasoning model with 1M context)',
      category: 'reasoning',
      estimatedTokensSaved: '~25% on complex reasoning turns'
    };
  }

  // 3. Short & Fast queries (greetings, quick definitions, brief questions) -> Token saving!
  const isShortPrompt = trimmed.length < 80 && !trimmed.includes('\n');
  const greetingOrShort = /^(hi|hello|hey|yo|help|who are you|what is|how do i|thanks|thank you|ok|okay)\b/i.test(trimmed);

  if (isShortPrompt || greetingOrShort) {
    return {
      targetModel: geminiFlash,
      fallbackModel: openrouterFree,
      reason: 'Routed to Gemini 1.5 Flash (Ultra-fast, lowest token overhead for quick answers)',
      category: 'fast',
      estimatedTokensSaved: '~50-60% minimal token overhead'
    };
  }

  // 4. Balanced general development: Load balance between Gemini and OpenRouter Free
  const historyTurn = history.length;
  if (historyTurn % 2 === 0) {
    return {
      targetModel: geminiFlash,
      fallbackModel: openrouterFree,
      reason: 'Routed to Gemini 1.5 Flash (Balanced general development)',
      category: 'general',
      estimatedTokensSaved: '~25% standard flash baseline'
    };
  } else {
    return {
      targetModel: openrouterFree,
      fallbackModel: geminiFlash,
      reason: 'Routed to OpenRouter Free (Auto-routed across healthy free models)',
      category: 'general',
      estimatedTokensSaved: '~25% distributed quota usage'
    };
  }
}
