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

  const handleAddChild = async (parentId: string): Promise<string | undefined> => {
    console.log('handleAddChild', parentId);

    let treeId = currentTreeId;

    // ツリーIDがない場合は新しいツリーを作成
    if (!treeId) {
      treeId = await createTree("新規ツリー");
      setCurrentTreeId(treeId);
      setCurrentTreeName("新規ツリー");

      // ルートノードを作成
      const rootNodeId = await createNode(treeId, null, "新規ツリー", 0);
      const stringRootId = rootNodeId.toString();

      // ツリーデータを更新
      setTreeData({
        id: stringRootId,
        text: "新規ツリー",
        children: [],
        isExpanded: true
      });

      // 作成したルートノードを親として使用
      parentId = stringRootId;
    }

    console.log('currentTreeId', treeId);

    try {
      const newId = await createNode(treeId, Number(parentId), "", 0);
      const stringId = newId.toString();

      const parentNode = findNodeById(treeData, parentId);
      if (parentNode) {
        addToHistory({
          type: 'ADD_NODE',
          treeId: treeId.toString(),
          data: {
            parentId,
            node: { id: stringId, text: "", children: [], isExpanded: true }
          }
        });
      }

      const addChildById = (node: Node): Node => {
        if (node.id === parentId) {
          return {
            ...node,
            children: [
              ...(node.children || []),
              { id: stringId, text: "", children: [], isExpanded: true }
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
      const stringId = newId.toString();

      if (parentNode) {
        addToHistory({
          type: 'ADD_NODE',
          treeId: currentTreeId.toString(),
          data: {
            parentId: parentNode.id,
            prevSiblingId: siblingId,
            node: { id: stringId, text: "", children: [], isExpanded: true }
          }
        });
      }

      const addSiblingById = (node: Node): Node => {
        if (node.children) {
          const siblingIndex = node.children.findIndex(child => child.id === siblingId);
          if (siblingIndex !== -1) {
            const newChildren = [...node.children];
            newChildren.splice(siblingIndex + 1, 0, { id: stringId, text: "", children: [], isExpanded: true });
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
      setSelectedNodeId(stringId);
    } catch (error) {
      console.error('Failed to add sibling node:', error);
    }
  };

  const handleDeleteNode = async (id: string) => {
    try {
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

        await deleteNode(Number(id));

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
          return result || emptyNode;
        });
        setSelectedNodeId(null);
        setNodeToDelete(null);
        setDeleteDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to delete node:', error);
    }
  };

  const handleDeleteRequest = (id: string) => {
    setNodeToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleColorChange = async (id: string, color: string | null) => {
    try {
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

        await updateNodeColor(Number(id), color);

        const updateNodeColorInTree = (node: Node): Node => {
          if (node.id === id) {
            return { ...node, backgroundColor: color };
          }
          if (node.children) {
            return {
              ...node,
              children: node.children.map(updateNodeColorInTree)
            };
          }
          return node;
        };

        setTreeData(prevData => updateNodeColorInTree(prevData));
      }
    } catch (error) {
      console.error('Failed to update node color:', error);
    }
  };

  const handleMoveNode = async (sourceId: string, targetId: string, position: 'before' | 'after' | 'inside') => {
    try {
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

        const targetNode = findNodeById(treeData, targetId);
        if (!sourceNode || !targetNode) return;

        // 新しい親ノードIDを決定
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

        // UIを更新
        const moveNodeInTree = (node: Node): Node => {
          let updatedNode = { ...node };

          const deepCloneNode = (node: Node): Node => ({
            ...node,
            children: node.children ? node.children.map(deepCloneNode) : []
          });

          const clonedSourceNode = sourceNode ? deepCloneNode(sourceNode) : null;

          if (updatedNode.children) {
            updatedNode = {
              ...updatedNode,
              children: updatedNode.children
                .filter(child => child.id !== sourceId)
                .map(moveNodeInTree)
            };
          }

          if (clonedSourceNode) {
            if (position === 'inside' && node.id === targetId) {
              updatedNode = {
                ...updatedNode,
                children: [...(updatedNode.children || []), clonedSourceNode]
              };
            } else if ((position === 'before' || position === 'after') && node.id === findParentNode(treeData, targetId)?.id) {
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
            onNodesGenerated={(nodes: string[]) => {
              if (selectedNodeId) {
                nodes.forEach((nodeText: string) => {
                  handleAddChild(selectedNodeId).then((newId) => {
                    if (newId) {
                      handleUpdateNode(newId, nodeText);
                    }
                  });
                });
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
