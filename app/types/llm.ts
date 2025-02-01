import { Node } from "./node";

export interface LLMRequest {
  prompt: string;
  count: number;
  treeData?: Node;  // ツリー全体のデータ
  selectedNodeId?: string | null;  // 選択中のノードID
}

export interface LLMResponse {
  nodes: string[];
}
