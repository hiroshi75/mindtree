"use client";

import { TreeNode } from "./components/TreeNode";
import { TreeNode as TreeNodeType } from "./types/node";
import { useState } from "react";

const initialData: TreeNodeType = {
  id: "1",
  text: "プロジェクト計画",
  children: [
    {
      id: "2",
      text: "要件定義",
      children: [
        {
          id: "3",
          text: "機能要件",
        },
        {
          id: "4",
          text: "非機能要件",
        }
      ]
    },
    {
      id: "5",
      text: "設計",
      children: [
        {
          id: "6",
          text: "UI設計",
          color: "#e6f3ff"
        },
        {
          id: "7",
          text: "データベース設計",
          color: "#fff3e6"
        }
      ]
    },
    {
      id: "8",
      text: "開発",
      children: [
        {
          id: "9",
          text: "フロントエンド",
        },
        {
          id: "10",
          text: "バックエンド",
        }
      ]
    }
  ]
};

export default function Home() {
  const [treeData, setTreeData] = useState<TreeNodeType>(initialData);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const handleSelectNode = (id: string) => {
    setSelectedNodeId(id);
  };

  const handleUpdateNode = (id: string, newText: string) => {
    const updateNodeById = (node: TreeNodeType): TreeNodeType => {
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
    const addChildById = (node: TreeNodeType): TreeNodeType => {
      if (node.id === parentId) {
        return {
          ...node,
          children: [
            ...(node.children || []),
            { id: newId, text: "" }
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
    const addSiblingById = (node: TreeNodeType): TreeNodeType => {
      if (node.children) {
        const siblingIndex = node.children.findIndex(child => child.id === siblingId);
        if (siblingIndex !== -1) {
          const newChildren = [...node.children];
          newChildren.splice(siblingIndex + 1, 0, { id: newId, text: "" });
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

  return (
    <div className="p-4">
      <TreeNode
        node={treeData}
        onUpdate={handleUpdateNode}
        onSelect={handleSelectNode}
        onAddChild={handleAddChild}
        onAddSibling={handleAddSibling}
        isSelected={treeData.id === selectedNodeId}
        selectedNodeId={selectedNodeId}
      />
    </div>
  );
}
