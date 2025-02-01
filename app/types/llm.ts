export interface LLMConfig {
  model: string;
  count: number;
}

export interface LLMRequest {
  prompt: string;
  model: string;
  count: number;
}

export interface LLMResponse {
  nodes: string[];
}
