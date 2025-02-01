import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Menu, Undo2, Redo2, Search } from "lucide-react";
import { Node } from "../types/node";
import { useState, useRef, useEffect } from "react";
import { getAllTrees } from "@/app/actions/tree";

interface HeaderProps {
  treeData: Node;
  onImport: (data: Node) => void;
  currentTreeName?: string;
  onTreeSelect: (id: number) => void;
  onTreeCreate: (name: string) => void;
  onTreeRename: (id: number, name: string) => void;
  onTreeDelete: (id: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSearch: (query: string) => void;
}

interface Tree {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
}

export function Header({
  treeData,
  onImport,
  currentTreeName,
  onTreeSelect,
  onTreeCreate,
  onTreeRename,
  onTreeDelete,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSearch
}: HeaderProps) {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isTreeDialogOpen, setIsTreeDialogOpen] = useState(false);
  const [trees, setTrees] = useState<Tree[]>([]);
  const [isNewTreeDialogOpen, setIsNewTreeDialogOpen] = useState(false);
  const [newTreeName, setNewTreeName] = useState("");
  const [editingTree, setEditingTree] = useState<Tree | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [treeToDelete, setTreeToDelete] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // キーボードショートカットの設定
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          if (canUndo) onUndo();
        } else if (e.key === 'y') {
          e.preventDefault();
          if (canRedo) onRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, onUndo, onRedo]);

  // 検索処理
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(searchQuery);
    }, 300); // 300ms後に検索を実行（デバウンス処理）

    return () => clearTimeout(timeoutId);
  }, [searchQuery, onSearch]);

  // ツリー一覧を取得
  const fetchTrees = async () => {
    try {
      setIsLoading(true);
      const data = await getAllTrees();
      setTrees(data);
    } catch (err) {
      setError(`ツリー一覧の取得に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ダイアログが開かれたときにツリー一覧を取得
  useEffect(() => {
    if (isTreeDialogOpen) {
      fetchTrees();
    }
  }, [isTreeDialogOpen]);

  // 新規ツリーの作成
  const handleCreateTree = async () => {
    if (!newTreeName.trim()) {
      setError("ツリー名を入力してください。");
      return;
    }
    try {
      setIsLoading(true);
      await onTreeCreate(newTreeName);
      setNewTreeName("");
      setIsNewTreeDialogOpen(false);
      await fetchTrees();
    } catch (err) {
      setError(`ツリーの作成に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ツリー名の変更
  const handleRenameTree = async () => {
    if (!editingTree || !editingTree.name.trim()) {
      setError("ツリー名を入力してください。");
      return;
    }
    try {
      setIsLoading(true);
      await onTreeRename(editingTree.id, editingTree.name);
      setEditingTree(null);
      await fetchTrees();
    } catch (err) {
      setError(`ツリー名の変更に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ツリーの削除確認
  const handleDeleteRequest = (id: number) => {
    setTreeToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // ツリーの削除実行
  const handleDeleteTree = async () => {
    if (!treeToDelete) return;
    try {
      setIsLoading(true);
      await onTreeDelete(treeToDelete);
      await fetchTrees();
      setIsDeleteDialogOpen(false);
      setTreeToDelete(null);
    } catch (err) {
      setError(`ツリーの削除に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
    } finally {
      setIsLoading(false);
    }
  };

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
        const data = JSON.parse(content) as Node;

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
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">MindTree</h1>
        {currentTreeName && (
          <span className="text-muted-foreground">
            - {currentTreeName}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative w-64">
          <Input
            type="text"
            placeholder="検索"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onUndo}
                disabled={!canUndo}
              >
                <Undo2 className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>元に戻す (Ctrl+Z)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRedo}
                disabled={!canRedo}
              >
                <Redo2 className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>やり直す (Ctrl+Y)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

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
            <DropdownMenuItem onClick={() => setIsTreeDialogOpen(true)}>
              ツリー一覧
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              インポート
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExport}>
              エクスポート
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ツリー一覧ダイアログ */}
      <Dialog open={isTreeDialogOpen} onOpenChange={setIsTreeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>ツリー一覧</DialogTitle>
            <DialogDescription>
              作成したツリーの一覧です。編集するツリーを選択してください。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center text-muted-foreground">
                  読み込み中...
                </div>
              ) : trees.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  ツリーがありません
                </div>
              ) : (
                trees.map((tree) => (
                  <div key={tree.id} className="flex items-center justify-between">
                    {editingTree?.id === tree.id ? (
                      <input
                        type="text"
                        value={editingTree.name}
                        onChange={(e) => setEditingTree({ ...editingTree, name: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameTree();
                          if (e.key === 'Escape') setEditingTree(null);
                        }}
                        className="flex-1 px-2 py-1 border rounded"
                        autoFocus
                      />
                    ) : (
                      <span
                        className="flex-1 cursor-pointer hover:text-primary"
                        onClick={() => {
                          onTreeSelect(tree.id);
                          setIsTreeDialogOpen(false);
                        }}
                      >
                        {tree.name}
                      </span>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTree(tree)}
                        disabled={isLoading}
                      >
                        名称変更
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRequest(tree.id)}
                        disabled={isLoading}
                      >
                        削除
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Button
              className="mt-4 w-full"
              onClick={() => setIsNewTreeDialogOpen(true)}
              disabled={isLoading}
            >
              新規ツリー作成
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 新規ツリー作成ダイアログ */}
      <Dialog open={isNewTreeDialogOpen} onOpenChange={setIsNewTreeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新規ツリー作成</DialogTitle>
            <DialogDescription>
              新しいツリーの名前を入力してください。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <input
              type="text"
              value={newTreeName}
              onChange={(e) => setNewTreeName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateTree();
                if (e.key === 'Escape') setIsNewTreeDialogOpen(false);
              }}
              className="w-full px-3 py-2 border rounded"
              placeholder="ツリー名"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewTreeDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleCreateTree} disabled={isLoading}>
              作成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* エラーダイアログ */}
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

      {/* 削除確認ダイアログ */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ツリーの削除</DialogTitle>
            <DialogDescription>
              このツリーを削除してもよろしいですか？この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleDeleteTree} disabled={isLoading}>
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
