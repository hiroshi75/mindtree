'use client';

import { useState } from "react";
import { generateNodes } from "@/app/actions/llm";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface LLMPanelProps {
  onGenerateNodes: (nodes: string[]) => void;
}

export function LLMPanel({ onGenerateNodes }: LLMPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [nodeCount, setNodeCount] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const response = await generateNodes({
        prompt: prompt.trim(),
        model: selectedModel,
        count: nodeCount
      });
      setPreview(response.nodes);
    } catch (error) {
      console.error("Error generating nodes:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddNodes = () => {
    if (preview.length > 0) {
      onGenerateNodes(preview);
      setPreview([]);
      setPrompt('');
    }
  };

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>LLM</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">プロンプト</label>
          <textarea
            className="w-full min-h-[100px] p-2 border rounded-md"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="LLMへの指示を入力してください"
          />
        </div>

        <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full">
              詳細設定
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">LLMモデル</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">生成数</label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={nodeCount}
                  onChange={(e) => setNodeCount(Number(e.target.value))}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          className="w-full"
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
        >
          {isGenerating ? '生成中...' : '生成'}
        </Button>

        {preview.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">プレビュー</label>
            <div className="border rounded-md p-2 min-h-[100px] space-y-2">
              {preview.map((node, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded">
                  {node}
                </div>
              ))}
            </div>
            <Button
              className="w-full"
              onClick={handleAddNodes}
            >
              ノードを追加
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
