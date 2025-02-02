"use client";

import { Header } from "./components/Header";
import { TreeNode } from "./components/TreeNode/index";
import { LLMPanel } from "./components/LLMPanel";
import { Node } from "./types/node";
import { useState, useEffect, useCallback } from "react";
import { useHistoryStore } from "./store/history";
import {
  createTree,
  updateTreeName,
  deleteTree,
  getTree,
  getTreeNodes,
  getAllTrees,
  updateNodeParent,
  updateNodeOrder,
  updateNodeText,
  createNode,
  deleteNode,
  updateNodeColor
} from "@/app/actions/tree";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const emptyNode: Node = {
  id: "0",
  text: "新規ツリー",
  isExpanded: true,
  children: []
};

export default function Home() {
  const [treeData, setTreeData] = useState<Node>(emptyNode);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<string | null>(null);
  const [currentTreeId, setCurrentTreeId] = useState<number | undefined>();
  const [currentTreeName, setCurrentTreeName] = useState<string>("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const { past, future, addToHistory, undo: undoHistory, redo: redoHistory } = useHistoryStore();

  // DBからデータを読み込む
  useEffect(() => {
    const loadTreeData = async () => {
      try {
        const trees = await getAllTrees();
        if (trees.length > 0) {
          // 最後にアクセスした時刻でソート
          const lastTree = trees.sort((a, b) =>
            new Date(b.last_accessed_at).getTime() - new Date(a.last_accessed_at).getTime()
          )[0];
          await handleTreeSelect(lastTree.id);
        }
      } catch (error) {
        console.error('Failed to load tree data:', error);
      }
    };
    loadTreeData();
  }, []);

  // ツリーの選択
  const handleTreeSelect = async (id: number) => {
    try {
      const tree = await getTree(id);
      if (tree) {
        const nodes = await getTreeNodes(id);
        if (nodes && nodes.length > 0) {
          setTreeData(nodes[0]);
          setCurrentTreeId(id);
          setCurrentTreeName(tree.name);
        }
      }
    } catch (error) {
      console.error('Failed to load tree:', error);
    }
  };

  // 新規ツリーの作成
  const handleTreeCreate = async (name: string) => {
    try {
      const id = await createTree(name);
      await createNode(id, null, "新規ツリー", 0);
      setCurrentTreeId(id);
      setCurrentTreeName(name);
      await handleTreeSelect(id);
    } catch (error) {
      console.error('Failed to create tree:', error);
    }
  };

  // ツリー名の変更
  const handleTreeRename = async (id: number, name: string) => {
    try {
      await updateTreeName(id, name);
      if (id === currentTreeId) {
        setCurrentTreeName(name);
      }
    } catch (error) {
      console.error('Failed to rename tree:', error);
    }
  };

  // ツリーの削除
  const handleTreeDelete = async (id: number) => {
    try {
      await deleteTree(id);
      if (id === currentTreeId) {
        setCurrentTreeId(undefined);
        setCurrentTreeName("");
        setTreeData(emptyNode);
      }
    } catch (error) {
      console.error('Failed to delete tree:', error);
    }
  };

  const handleSelectNode = (id: string | null) => {
    setSelectedNodeId(id);
  };

  const handleUpdateNode = async (id: string, newText: string) => {
    const node = findNodeById(treeData, id);
    if (node) {
      addToHistory({
        type: 'EDIT_NODE',
        treeId: currentTreeId?.toString() || '',
        data: {
          node,
          oldText: node.text,
          newText
        }
      });

      try {
        // データベースを更新
        await updateNodeText(Number(id), newText);

        // UIを更新
        const updateNodeById = (node: Node): Node => {
          if (node.id === id) {
            return { ...node, text: newText };
          }
          if (node.children) {
            return {
              ...node,
              children: node.children.map(updateNodeById)
            };
          }
          return node;
        };

        setTreeData(prevData => updateNodeById(prevData));
      } catch (error) {
        console.error('Failed to update node text:', error);
      }
    }
  };

  const handleAddChild = async (parentId: string, initialText: string = ""): Promise<string | undefined> => {
    if (!currentTreeId) {
      try {
        // 新規ツリーを作成
        const treeId = await createTree("新規ツリー");
        setCurrentTreeId(treeId);
        setCurrentTreeName("新規ツリー");

        // ルートノードを作成
        const rootNodeId = await createNode(treeId, null, "新規ツリー", 0);

        // DBから最新のデータを取得して表示を更新
        const updatedNodes = await getTreeNodes(treeId);
        if (updatedNodes.length > 0) {
          setTreeData(updatedNodes[0]);
        }

        return rootNodeId.toString();
      } catch (error) {
        console.error('Failed to create new tree:', error);
        return undefined;
      }
    }

    try {
      // 新しいノードを作成
      const newId = await createNode(currentTreeId, Number(parentId), initialText, 0);

      // DBから最新のデータを取得して表示を更新
      const updatedNodes = await getTreeNodes(currentTreeId);
      if (updatedNodes.length > 0) {
        setTreeData(updatedNodes[0]);
      }

      const stringId = newId.toString();
      setSelectedNodeId(stringId);
      return stringId;
    } catch (error) {
      console.error('Failed to add child node:', error);
      return undefined;
    }
  };

  const handleAddSibling = async (siblingId: string) => {
    if (!currentTreeId) return;

    try {
      const parentNode = findParentNode(treeData, siblingId);
      const newId = await createNode(
        currentTreeId,
        parentNode ? Number(parentNode.id) : null,
        "",
        0
      );

      // DBから最新のデータを取得して表示を更新
      const updatedNodes = await getTreeNodes(currentTreeId);
      if (updatedNodes.length > 0) {
        setTreeData(updatedNodes[0]);
      }

      const stringId = newId.toString();
      setSelectedNodeId(stringId);
    } catch (error) {
      console.error('Failed to add sibling node:', error);
    }
  };

  const handleDeleteNode = async (id: string) => {
    if (!currentTreeId) return;

    try {
      await deleteNode(Number(id));

      // DBから最新のデータを取得して表示を更新
      const updatedNodes = await getTreeNodes(currentTreeId);
      if (updatedNodes.length > 0) {
        setTreeData(updatedNodes[0]);
      } else {
        setTreeData(emptyNode);
      }

      setSelectedNodeId(null);
      setNodeToDelete(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete node:', error);
    }
  };

  const handleDeleteRequest = (id: string) => {
    // 空のノードの場合は確認ダイアログを表示せずに直接削除
    const node = findNodeById(treeData, id);
    if (node && node.text.trim() === '') {
      handleDeleteNode(id);
    } else {
      setNodeToDelete(id);
      setDeleteDialogOpen(true);
    }
  };

  const handleColorChange = async (id: string, color: string | null) => {
    if (!currentTreeId) return;

    try {
      await updateNodeColor(Number(id), color);

      // DBから最新のデータを取得して表示を更新
      const updatedNodes = await getTreeNodes(currentTreeId);
      if (updatedNodes.length > 0) {
        setTreeData(updatedNodes[0]);
      }
    } catch (error) {
      console.error('Failed to update node color:', error);
    }
  };

  const handleMoveNode = async (sourceId: string, targetId: string, position: 'before' | 'after' | 'inside') => {
    if (!currentTreeId) return;

    try {
      const targetNode = findNodeById(treeData, targetId);
      if (!targetNode) return;

      // 新しい親ノードIDと順序を決定
      let newParentId: number | null = null;
      let newOrderIndex: number = 0;

      if (position === 'inside') {
        newParentId = Number(targetId);
        newOrderIndex = targetNode.children?.length || 0;
      } else {
        const targetParentNode = findParentNode(treeData, targetId);
        if (targetParentNode) {
          newParentId = Number(targetParentNode.id);
          const siblings = targetParentNode.children || [];
          const targetIndex = siblings.findIndex(node => node.id === targetId);
          newOrderIndex = position === 'before' ? targetIndex : targetIndex + 1;
        } else {
          newOrderIndex = position === 'before' ? 0 : 1;
        }
      }

      // データベースを更新
      await updateNodeParent(Number(sourceId), newParentId);
      await updateNodeOrder(Number(sourceId), newOrderIndex);

      // DBから最新のデータを取得して表示を更新
      const updatedNodes = await getTreeNodes(currentTreeId);
      if (updatedNodes.length > 0) {
        setTreeData(updatedNodes[0]);
      }
    } catch (error) {
      console.error('Failed to move node:', error);
    }
  };

  // ノードを検索するヘルパー関数
  const findNodeById = (node: Node, id: string): Node | null => {
    if (node.id === id) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findNodeById(child, id);
        if (found) return found;
      }
    }
    return null;
  };

  // 親ノードを検索するヘルパー関数
  const findParentNode = (node: Node, childId: string): Node | null => {
    if (node.children) {
      if (node.children.some(child => child.id === childId)) return node;
      for (const child of node.children) {
        const found = findParentNode(child, childId);
        if (found) return found;
      }
    }
    return null;
  };

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    const action = undoHistory();
    if (!action) return;

    switch (action.type) {
      case 'ADD_NODE':
        handleDeleteNode(action.data.node!.id);
        break;
      case 'EDIT_NODE':
        handleUpdateNode(action.data.node!.id, action.data.oldText!);
        break;
      case 'DELETE_NODE':
        setTreeData(prevData => {
          const parent = findNodeById(prevData, action.data.parentId!);
          if (parent) {
            return {
              ...prevData,
              children: [...(parent.children || []), action.data.node!]
            };
          }
          return prevData;
        });
        break;
      case 'MOVE_NODE':
        handleMoveNode(
          action.data.node!.id,
          action.data.oldParentId!,
          action.data.oldPrevSiblingId ? 'after' : 'inside'
        );
        break;
      case 'CHANGE_COLOR':
        handleColorChange(action.data.node!.id, action.data.oldColor || null);
        break;
    }
  }, [undoHistory]);

  const handleRedo = useCallback(() => {
    const action = redoHistory();
    if (!action) return;

    switch (action.type) {
      case 'ADD_NODE':
        if (action.data.prevSiblingId) {
          handleAddSibling(action.data.prevSiblingId);
        } else {
          handleAddChild(action.data.parentId!);
        }
        break;
      case 'EDIT_NODE':
        handleUpdateNode(action.data.node!.id, action.data.newText!);
        break;
      case 'DELETE_NODE':
        handleDeleteNode(action.data.node!.id);
        break;
      case 'MOVE_NODE':
        handleMoveNode(
          action.data.node!.id,
          action.data.parentId!,
          'inside'
        );
        break;
      case 'CHANGE_COLOR':
        handleColorChange(action.data.node!.id, action.data.newColor || null);
        break;
    }
  }, [redoHistory]);

  return (
    <div className="flex flex-col h-screen">
      <div className="h-16">
        <Header
          treeData={treeData}
          onImport={setTreeData}
          currentTreeName={currentTreeName}
          onTreeSelect={handleTreeSelect}
          onTreeCreate={handleTreeCreate}
          onTreeRename={handleTreeRename}
          onTreeDelete={handleTreeDelete}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={past.length > 0}
          canRedo={future.length > 0}
          onSearch={(query) => {
            const results: string[] = [];
            const searchNode = (node: Node) => {
              if (node.text.toLowerCase().includes(query.toLowerCase())) {
                results.push(node.id);
              }
              node.children?.forEach(searchNode);
            };
            searchNode(treeData);
            setSearchResults(results);
          }}
        />
      </div>
      <div className="flex">
        <div className="flex-1 h-[calc(100vh-64px)] p-4 overflow-y-auto">
          {currentTreeId ? (
            <TreeNode
              node={treeData}
              treeData={treeData}
              onUpdate={handleUpdateNode}
              onSelect={handleSelectNode}
              onAddChild={handleAddChild}
              onAddSibling={handleAddSibling}
              onDelete={handleDeleteRequest}
              onMove={handleMoveNode}
              isSelected={treeData.id === selectedNodeId}
              selectedNodeId={selectedNodeId}
              searchResults={searchResults}
              onColorChange={handleColorChange}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <p className="text-lg">ツリー一覧から新規ツリーを作成してください</p>
              </div>
            </div>
          )}

          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ノードの削除</DialogTitle>
                <DialogDescription>
                  このノードと、すべての子ノードが削除されます。この操作は取り消せません。
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button variant="destructive" onClick={() => nodeToDelete && handleDeleteNode(nodeToDelete)}>
                  削除
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="w-64 h-[calc(100vh-64px)] overflow-y-auto">
          <LLMPanel
            selectedNodeId={selectedNodeId}
            selectedNodeText={selectedNodeId ? findNodeById(treeData, selectedNodeId)?.text : undefined}
            treeData={treeData}
            onNodesGenerated={async (nodes: string[]) => {
              if (selectedNodeId && currentTreeId) {
                // 各ノードを直接DBに保存
                await Promise.all(nodes.map(async (nodeText: string) => {
                  await createNode(currentTreeId, Number(selectedNodeId), nodeText, 0);
                }));
                // DBから最新のデータを取得して表示を更新
                const updatedNodes = await getTreeNodes(currentTreeId);
                if (updatedNodes.length > 0) {
                  setTreeData(updatedNodes[0]);
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
