"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateNodes } from "@/app/actions/llm";

interface LLMPanelProps {
  onNodesGenerated?: (nodes: string[]) => void;
}

export function LLMPanel({ onNodesGenerated }: LLMPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [count, setCount] = useState(3);
  const [preview, setPreview] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    try {
      setIsGenerating(true);
      const result = await generateNodes({
        prompt,
        model: "claude-3-haiku-20240307",
        count,
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
      setPrompt("");
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">LLM</h2>

      {/* プロンプト入力エリア */}
      <div className="space-y-2">
        <label className="text-sm font-medium">プロンプト</label>
        <textarea
          className="w-full min-h-[100px] p-2 border rounded-md"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="LLMへの指示を入力してください"
        />
      </div>

      {/* 詳細設定 */}
      <div>
        <button
          className="text-sm text-gray-600"
          onClick={() => setShowSettings(!showSettings)}
        >
          詳細設定 {showSettings ? "▼" : "▶"}
        </button>
        {showSettings && (
          <div className="mt-2 space-y-2">
            <div>
              <label className="text-sm font-medium">生成数</label>
              <input
                type="number"
                min={1}
                max={10}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="ml-2 w-16 p-1 border rounded"
              />
            </div>
          </div>
        )}
      </div>

      {/* 生成ボタン */}
      <Button
        className="w-full"
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
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
