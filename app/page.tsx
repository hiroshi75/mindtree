"use client";

import { Header } from "./components/Header";
import { TreeNode } from "./components/TreeNode";
import { Node } from "./types/node";
import { useState, useEffect } from "react";
import { createTree, updateTreeName, deleteTree, getTree, getTreeNodes, getAllTrees, updateNodeParent, updateNodeOrder } from "@/app/actions/tree";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const initialData: Node = {
  id: "1",
  text: "プロジェクト計画",
  isExpanded: true,
  children: [
    {
      id: "2",
      text: "要件定義",
      isExpanded: true,
      children: [
        {
          id: "3",
          text: "機能要件",
          children: [],
          isExpanded: true
        },
        {
          id: "4",
          text: "非機能要件",
          children: [],
          isExpanded: true
        }
      ]
    },
    {
      id: "5",
      text: "設計",
      isExpanded: true,
      children: [
        {
          id: "6",
          text: "UI設計",
          backgroundColor: "#e6f3ff",
          children: [],
          isExpanded: true
        },
        {
          id: "7",
          text: "データベース設計",
          backgroundColor: "#fff3e6",
          children: [],
          isExpanded: true
        }
      ]
    },
    {
      id: "8",
      text: "開発",
      isExpanded: true,
      children: [
        {
          id: "9",
          text: "フロントエンド",
          children: [],
          isExpanded: true
        },
        {
          id: "10",
          text: "バックエンド",
          children: [],
          isExpanded: true
        }
      ]
    }
  ]
};

export default function Home() {
  const [treeData, setTreeData] = useState<Node>(initialData);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<string | null>(null);
  const [currentTreeId, setCurrentTreeId] = useState<number | undefined>();
  const [currentTreeName, setCurrentTreeName] = useState<string>("");

  // 最後に編集したツリーを自動的に表示
  useEffect(() => {
    const loadLastAccessedTree = async () => {
      try {
        const trees = await getAllTrees();
        if (trees.length > 0) {
          // 最後にアクセスした時刻でソート
          const lastTree = trees.sort((a: { last_accessed_at: string }, b: { last_accessed_at: string }) =>
            new Date(b.last_accessed_at).getTime() - new Date(a.last_accessed_at).getTime()
          )[0];
          await handleTreeSelect(lastTree.id);
        }
      } catch (error) {
        console.error('Failed to load last accessed tree:', error);
      }
    };
    loadLastAccessedTree();
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
        setTreeData(initialData);
      }
    } catch (error) {
      console.error('Failed to delete tree:', error);
    }
  };

  const handleSelectNode = (id: string) => {
    setSelectedNodeId(id);
  };

  const handleUpdateNode = (id: string, newText: string) => {
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
  };

  const handleAddChild = (parentId: string) => {
    const newId = Date.now().toString();
    const addChildById = (node: Node): Node => {
      if (node.id === parentId) {
        return {
          ...node,
          children: [
            ...(node.children || []),
            { id: newId, text: "", children: [], isExpanded: true }
          ]
        };
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(addChildById)
        };
      }
      return node;
    };

    setTreeData(prevData => addChildById(prevData));
    setSelectedNodeId(newId);
  };

  const handleAddSibling = (siblingId: string) => {
    const newId = Date.now().toString();
    const addSiblingById = (node: Node): Node => {
      if (node.children) {
        const siblingIndex = node.children.findIndex(child => child.id === siblingId);
        if (siblingIndex !== -1) {
          const newChildren = [...node.children];
          newChildren.splice(siblingIndex + 1, 0, { id: newId, text: "", children: [], isExpanded: true });
          return { ...node, children: newChildren };
        }
        return {
          ...node,
          children: node.children.map(addSiblingById)
        };
      }
      return node;
    };

    setTreeData(prevData => addSiblingById(prevData));
    setSelectedNodeId(newId);
  };

  const handleDeleteNode = (id: string) => {
    const deleteNodeById = (node: Node): Node | null => {
      if (node.id === id) {
        return null;
      }
      if (node.children) {
        const newChildren = node.children
          .map(deleteNodeById)
          .filter((child): child is Node => child !== null);
        return {
          ...node,
          children: newChildren
        };
      }
      return node;
    };

    setTreeData(prevData => {
      const result = deleteNodeById(prevData);
      return result || initialData; // ルートノードが削除された場合は初期データに戻す
    });
    setSelectedNodeId(null);
    setNodeToDelete(null);
    setDeleteDialogOpen(false);
  };

  const handleDeleteRequest = (id: string) => {
    setNodeToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleMoveNode = async (sourceId: string, targetId: string, position: 'before' | 'after' | 'inside') => {
    try {
      const sourceNode = findNodeById(treeData, sourceId);
      const targetNode = findNodeById(treeData, targetId);

      if (!sourceNode || !targetNode) return;

      // 新しい親ノードIDを決定
      let newParentId: number | null = null;
      let newOrderIndex: number = 0;

      if (position === 'inside') {
        // 対象ノードの子として移動
        newParentId = Number(targetId);
        newOrderIndex = targetNode.children?.length || 0;
      } else {
        // 対象ノードの前後に移動
        const targetParentNode = findParentNode(treeData, targetId);
        if (targetParentNode) {
          newParentId = Number(targetParentNode.id);
          const siblings = targetParentNode.children || [];
          const targetIndex = siblings.findIndex(node => node.id === targetId);
          newOrderIndex = position === 'before' ? targetIndex : targetIndex + 1;
        } else {
          // ルートレベルでの移動
          newOrderIndex = position === 'before' ? 0 : 1;
        }
      }

      // データベースを更新
      await updateNodeParent(Number(sourceId), newParentId);
      await updateNodeOrder(Number(sourceId), newOrderIndex);

      // UIを更新
      const moveNodeInTree = (node: Node): Node => {
        if (node.id === targetId) {
          if (position === 'inside') {
            return {
              ...node,
              children: [...(node.children || []), { ...sourceNode, children: [] }]
            };
          }
        }
        if (node.children) {
          return {
            ...node,
            children: node.children
              .filter(child => child.id !== sourceId)
              .map(moveNodeInTree)
          };
        }
        return node;
      };

      setTreeData(prevData => moveNodeInTree(prevData));
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

  return (
    <div>
      <Header
        treeData={treeData}
        onImport={setTreeData}
        currentTreeId={currentTreeId}
        currentTreeName={currentTreeName}
        onTreeSelect={handleTreeSelect}
        onTreeCreate={handleTreeCreate}
        onTreeRename={handleTreeRename}
        onTreeDelete={handleTreeDelete}
      />
      <div className="p-4">
        <TreeNode
          node={treeData}
          onUpdate={handleUpdateNode}
          onSelect={handleSelectNode}
          onAddChild={handleAddChild}
          onAddSibling={handleAddSibling}
          onDelete={handleDeleteRequest}
          onMove={handleMoveNode}
          isSelected={treeData.id === selectedNodeId}
          selectedNodeId={selectedNodeId}
        />

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
    </div>
  );
}
