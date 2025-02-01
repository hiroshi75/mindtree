'use server';

'use server';

import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { LLMRequest, LLMResponse } from "../types/llm";
import { z } from "zod";
import { createContextPrompt } from "../utils/treeUtils";

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
