/** Shared types for AI generation and checklist output. */

export interface NavigationChecklist {
  scenarioSummary: string;
  isEmergency: boolean;
  immediateNextStep: string;
  possibleBenefitCategory: string;
  askYourScheme: string[];
  askYourProvider: string[];
  documentsToRequest: string[];
  riskAreas: string[];
  whatNotToDo: string[];
  escalationSteps: string[];
  /** Appended by the server, not the model */
  disclaimer?: string;
  /** Internal flags from output validation — not necessarily shown raw */
  _validationFlags?: { severity: string; note: string }[];
}

export type AnswerValue = string | boolean | string[];

export interface NavigateRequest {
  scenarioId: string;
  freeText?: string;
  answers?: Record<string, AnswerValue>;
  schemeName?: string; // optional, scheme-neutral by default
  planName?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GenerateOptions {
  systemPrompt: string;
  messages: ChatMessage[];
  /** Force JSON-only output */
  jsonMode?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export interface AIProvider {
  name: 'anthropic' | 'openai';
  generate(opts: GenerateOptions): Promise<string>;
}
