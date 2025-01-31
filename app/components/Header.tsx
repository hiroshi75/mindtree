import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu } from "lucide-react";
import { TreeNode } from "../types/node";
import { useState, useRef } from "react";

interface HeaderProps {
  treeData: TreeNode;
  onImport: (data: TreeNode) => void;
}

export function Header({ treeData, onImport }: HeaderProps) {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const jsonString = JSON.stringify(treeData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mindtree.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(`エクスポート中にエラーが発生しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as TreeNode;

        // 基本的な検証
        if (!data.id || typeof data.text !== "string") {
          throw new Error("無効なJSONフォーマットです。");
        }

        onImport(data);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (err) {
        setError(`インポート中にエラーが発生しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <h1 className="text-2xl font-bold">MindTree</h1>
      <div>
        <input
          type="file"
          accept=".json"
          onChange={handleImport}
          ref={fileInputRef}
          className="hidden"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              インポート
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExport}>
              エクスポート
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={!!error} onOpenChange={() => setError(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>エラー</DialogTitle>
            <DialogDescription>{error}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setError(null)}>閉じる</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
