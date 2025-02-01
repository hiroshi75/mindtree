'use server';

import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { LLMRequest, LLMResponse } from "../types/llm";
import { Node } from "../types/node";
import { z } from "zod";

// ツリーのノード数をカウント
function countNodes(node: Node): number {
  let count = 1;
  if (node.children) {
    for (const child of node.children) {
      count += countNodes(child);
    }
  }
  return count;
}

// 選択中ノードの兄弟と祖先を取得
function getRelevantNodes(root: Node, selectedId: string): Node[] {
  const result: Node[] = [];

  function findNode(node: Node, path: Node[] = []): boolean {
    if (node.id === selectedId) {
      // 祖先ノードを追加
      result.push(...path);

      // 親ノードがある場合、兄弟ノードを追加
      const parent = path[path.length - 1];
      if (parent && parent.children) {
        result.push(...parent.children);
      }

      // 選択中ノードの子ノードを追加
      if (node.children) {
        result.push(...node.children);
      }
      return true;
    }

    if (node.children) {
      for (const child of node.children) {
        if (findNode(child, [...path, node])) {
          return true;
        }
      }
    }
    return false;
  }

  findNode(root);
  return result;
}

// ノードをテキスト表現に変換
function nodeToString(node: Node, level: number = 0, isSelected: boolean = false): string {
  const indent = "  ".repeat(level);
  const marker = isSelected ? "👉 " : "- ";
  let result = `${indent}${marker}${node.text}\n`;

  if (node.children && node.isExpanded) {
    for (const child of node.children) {
      result += nodeToString(child, level + 1);
    }
  }
  return result;
}

// ツリー情報をプロンプトに組み込む
function createContextPrompt(treeData: Node | undefined, selectedNodeId: string | null | undefined): string {
  if (!treeData) return "";

  let contextPrompt = "現在のマインドマップの状態:\n\n";

  const totalNodes = countNodes(treeData);
  if (totalNodes <= 10) {
    // ツリー全体を表示
    contextPrompt += nodeToString(treeData, 0, treeData.id === selectedNodeId);
  } else if (selectedNodeId) {
    // 選択中ノードの兄弟と祖先を表示
    const relevantNodes = getRelevantNodes(treeData, selectedNodeId);
    for (const node of relevantNodes) {
      contextPrompt += nodeToString(node, 0, node.id === selectedNodeId);
    }
  }

  return contextPrompt;
}

// ノードの構造をzodスキーマで定義
const NodeSchema = z.object({
  nodes: z.array(z.string().describe("マインドマップのノードの内容"))
    .describe("生成されたノードの配列")
});

export async function generateNodes(request: LLMRequest): Promise<LLMResponse> {
  try {
    const { prompt, count, treeData, selectedNodeId } = request;

    // ツリー情報を含むコンテキストを生成
    const contextPrompt = createContextPrompt(treeData, selectedNodeId);

    // Anthropicのインスタンスを作成
    const llm = new ChatAnthropic({
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      model: "claude-3-haiku-20240307",
      temperature: 0.7,
      maxRetries: 2,
    });

    // Structured Output用のLLMを作成
    const structuredLlm = llm.withStructuredOutput(NodeSchema, {
      name: "MindMapNodes",
    });

    // プロンプトテンプレートを作成
    const template = ChatPromptTemplate.fromMessages([
      ["system", `あなたはマインドマップの作成を支援するAIアシスタントです。
与えられたトピックに関連する${count}個のノードを生成してください。
各ノードは簡潔で具体的な内容にしてください。
出力は配列形式で、各要素が1つのノードを表します。

${contextPrompt}`],
      ["human", prompt],
    ]);

    // LLMチェーンを構築して実行
    const chain = template.pipe(structuredLlm);
    const result = await chain.invoke({});

    // 指定された数のノードを返す
    return {
      nodes: result.nodes.slice(0, count)
    };
  } catch (error) {
    console.error('LLM generation error:', error);
    throw new Error('Failed to generate nodes');
  }
}
