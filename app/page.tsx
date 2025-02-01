"use client";

import { Header } from "./components/Header";
import { TreeNode } from "./components/TreeNode";
import { Node } from "./types/node";
import { useState, useEffect, useCallback } from "react";
import { useHistoryStore } from "./store/history";
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
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const { past, future, addToHistory, undo: undoHistory, redo: redoHistory } = useHistoryStore();

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
    }
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
    const parentNode = findNodeById(treeData, parentId);
    if (parentNode) {
      addToHistory({
        type: 'ADD_NODE',
        treeId: currentTreeId?.toString() || '',
        data: {
          parentId,
          node: { id: newId, text: "", children: [], isExpanded: true }
        }
      });
    }
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
    const parentNode = findParentNode(treeData, siblingId);
    if (parentNode) {
      addToHistory({
        type: 'ADD_NODE',
        treeId: currentTreeId?.toString() || '',
        data: {
          parentId: parentNode.id,
          prevSiblingId: siblingId,
          node: { id: newId, text: "", children: [], isExpanded: true }
        }
      });
    }
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
    const node = findNodeById(treeData, id);
    const parentNode = findParentNode(treeData, id);
    if (node) {
      addToHistory({
        type: 'DELETE_NODE',
        treeId: currentTreeId?.toString() || '',
        data: {
          node,
          parentId: parentNode?.id
        }
      });
    }
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

  const handleColorChange = (id: string, color: string | null) => {
    const node = findNodeById(treeData, id);
    if (node) {
      addToHistory({
        type: 'CHANGE_COLOR',
        treeId: currentTreeId?.toString() || '',
        data: {
          node,
          oldColor: node.backgroundColor || null,
          newColor: color
        }
      });
    }
    const updateNodeColor = (node: Node): Node => {
      if (node.id === id) {
        return { ...node, backgroundColor: color };
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(updateNodeColor)
        };
      }
      return node;
    };

    setTreeData(prevData => updateNodeColor(prevData));
  };

  const handleMoveNode = async (sourceId: string, targetId: string, position: 'before' | 'after' | 'inside') => {
    const sourceNode = findNodeById(treeData, sourceId);
    const oldParentNode = findParentNode(treeData, sourceId);
    if (sourceNode && oldParentNode) {
      const oldSiblings = oldParentNode.children || [];
      const sourceIndex = oldSiblings.findIndex(node => node.id === sourceId);
      const oldPrevSiblingId = sourceIndex > 0 ? oldSiblings[sourceIndex - 1].id : null;

      addToHistory({
        type: 'MOVE_NODE',
        treeId: currentTreeId?.toString() || '',
        data: {
          node: sourceNode,
          oldParentId: oldParentNode.id,
          oldPrevSiblingId
        }
      });
    }
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

      // 子孫ノードの順序を更新
      const updateDescendantOrders = async (node: Node, startOrder: number): Promise<number> => {
        let currentOrder = startOrder;
        if (node.children) {
          for (const child of node.children) {
            await updateNodeOrder(Number(child.id), currentOrder);
            currentOrder = await updateDescendantOrders(child, currentOrder + 1);
          }
        }
        return currentOrder;
      };

      // 移動したノードの子孫の順序を更新
      if (sourceNode.children && sourceNode.children.length > 0) {
        await updateDescendantOrders(sourceNode, newOrderIndex + 1);
      }

      // UIを更新
      const moveNodeInTree = (node: Node): Node => {
        let updatedNode = { ...node };

        // sourceNodeを深いコピーで複製
        const deepCloneNode = (node: Node): Node => ({
          ...node,
          children: node.children ? node.children.map(deepCloneNode) : []
        });

        const clonedSourceNode = sourceNode ? deepCloneNode(sourceNode) : null;

        // 移動元のノードを削除
        if (updatedNode.children) {
          updatedNode = {
            ...updatedNode,
            children: updatedNode.children
              .filter(child => child.id !== sourceId)
              .map(moveNodeInTree)
          };
        }

        // 移動先の処理
        if (clonedSourceNode) {
          if (position === 'inside' && node.id === targetId) {
            // 子として追加
            updatedNode = {
              ...updatedNode,
              children: [...(updatedNode.children || []), clonedSourceNode]
            };
          } else if ((position === 'before' || position === 'after') && node.id === findParentNode(treeData, targetId)?.id) {
            // 前後に追加
            const newChildren = [...(updatedNode.children || [])];
            const targetIndex = newChildren.findIndex(child => child.id === targetId);
            if (targetIndex !== -1) {
              const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
              newChildren.splice(insertIndex, 0, clonedSourceNode);
              updatedNode = {
                ...updatedNode,
                children: newChildren
              };
            }
          }
        }

        return updatedNode;
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
        // 削除を元に戻す処理
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
        // 移動を元に戻す処理
        handleMoveNode(
          action.data.node!.id,
          action.data.oldParentId!,
          action.data.oldPrevSiblingId ? 'after' : 'inside'
        );
        break;
      case 'CHANGE_COLOR':
        // 色変更を元に戻す処理
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
        // 移動をやり直す処理
        handleMoveNode(
          action.data.node!.id,
          action.data.parentId!,
          'inside'
        );
        break;
      case 'CHANGE_COLOR':
        // 色変更をやり直す処理
        handleColorChange(action.data.node!.id, action.data.newColor || null);
        break;
    }
  }, [redoHistory]);

  return (
    <div>
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
      <div className="p-4">
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
