"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateNodes } from "@/app/actions/llm";
import { createContextPrompt } from "@/app/utils/treeUtils";
import { Node } from "@/app/types/node";
import { Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

interface LLMPanelProps {
  onNodesGenerated?: (nodes: string[]) => void;
  selectedNodeId: string | null;
  selectedNodeText?: string;
  treeData?: Node;
}

export function LLMPanel({ onNodesGenerated, selectedNodeId, selectedNodeText, treeData }: LLMPanelProps) {
  const [prompt, setPrompt] = useState("このノードのアイデアを膨らませてください。");
  const [isGenerating, setIsGenerating] = useState(false);
  const [count, setCount] = useState(3);
  const [preview, setPreview] = useState<string[]>([]);
  const [promptPreview, setPromptPreview] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    try {
      setIsGenerating(true);
      const result = await generateNodes({
        prompt,
        count,
        treeData,
        selectedNodeId,
      });
      setPreview(result.nodes);
    } catch (error) {
      console.error("Failed to generate nodes:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAdd = () => {
    if (preview.length > 0 && onNodesGenerated) {
      onNodesGenerated(preview);
      setPreview([]);
    }
  };

  return (
    <Card className="p-4 space-y-4 mt-12 mr-6">
      <div className="space-y-2 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">LLM</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    const contextPrompt = `システムプロンプト:\nあなたはマインドマップの作成を支援するAIアシスタントです。\n与えられたトピックに関連する${count}個のノードを生成してください。\n各ノードは簡潔で具体的な内容にしてください。\n出力は配列形式で、各要素が1つのノードを表します。\n\n${createContextPrompt(treeData, selectedNodeId)}\nユーザーのプロンプト:\n${prompt}`;
                    setPromptPreview(contextPrompt);
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>プロンプトプレビュー</DialogTitle>
                  <DialogDescription>
                    LLMに送信されるプロンプトの内容を確認できます。
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 p-4 bg-gray-50 rounded-md whitespace-pre-wrap font-mono text-sm">
                  {promptPreview}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {!selectedNodeId && (
            <span className="text-sm text-gray-500">ノードを選択してください</span>
          )}
        </div>
        {selectedNodeId && selectedNodeText && (
          <div className="text-sm text-gray-600">選択中: {selectedNodeText}</div>
        )}
      </div>

      {/* プロンプト入力エリア */}
      <div className="space-y-2 opacity-75">
        <label className="text-sm font-medium">プロンプト</label>
        <textarea
          className="w-full min-h-[100px] p-2 border rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={selectedNodeId ? "LLMへの指示を入力してください" : "ノードを選択してください"}
          disabled={!selectedNodeId}
        />
      </div>

      {/* 生成数設定 */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">生成数</label>
        <input
          type="number"
          min={1}
          max={20}
          value={count}
          onChange={(e) => {
            const value = Number(e.target.value);
            if (value >= 1 && value <= 20) {
              setCount(value);
            }
          }}
          className="w-16 p-1 border rounded"
          disabled={!selectedNodeId}
        />
      </div>

      {/* 生成ボタン */}
      <Button
        className="w-full"
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim() || !selectedNodeId}
      >
        {isGenerating ? "生成中..." : "生成"}
      </Button>

      {/* プレビュー */}
      {preview.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">プレビュー</h3>
          <div className="p-2 border rounded-md bg-gray-50">
            {preview.map((node, index) => (
              <div key={index} className="py-1">
                {node}
              </div>
            ))}
          </div>
          <Button className="w-full" onClick={handleAdd}>
            追加
          </Button>
        </div>
      )}
    </Card>
  );
}
