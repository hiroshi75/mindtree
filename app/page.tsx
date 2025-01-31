"use client";

import { Header } from "./components/Header";
import { TreeNode } from "./components/TreeNode";
import { Node } from "./types/node";
import { useState } from "react";
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

  return (
    <div>
      <Header treeData={treeData} onImport={setTreeData} />
      <div className="p-4">
        <TreeNode
          node={treeData}
          onUpdate={handleUpdateNode}
          onSelect={handleSelectNode}
          onAddChild={handleAddChild}
          onAddSibling={handleAddSibling}
          onDelete={handleDeleteRequest}
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
