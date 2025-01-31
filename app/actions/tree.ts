'use server';

import { treeUtils, nodeUtils } from '@/lib/db';
import { Node, DbNode } from '@/app/types/node';

// ツリーの型定義
interface Tree {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
}

// データベースのノードをフロントエンド用のノードに変換
function convertDbNodeToNode(dbNode: DbNode): Node {
  return {
    id: dbNode.id.toString(),
    text: dbNode.text,
    children: [],
    isExpanded: dbNode.is_expanded,
    backgroundColor: dbNode.background_color || undefined,
  };
}

// ノードの階層構造を構築
function buildNodeTree(nodes: DbNode[]): Node[] {
  const nodeMap = new Map<number, Node>();
  const rootNodes: Node[] = [];

  // まず全てのノードをMapに格納
  nodes.forEach(dbNode => {
    const node = convertDbNodeToNode(dbNode);
    nodeMap.set(dbNode.id, node);
  });

  // 親子関係を構築
  nodes.forEach(dbNode => {
    const node = nodeMap.get(dbNode.id);
    if (node) {
      if (dbNode.parent_id === null) {
        rootNodes.push(node);
      } else {
        const parentNode = nodeMap.get(dbNode.parent_id);
        if (parentNode) {
          parentNode.children.push(node);
        }
      }
    }
  });

  return rootNodes;
}

// 全てのツリーを取得
export async function getAllTrees(): Promise<Tree[]> {
  return treeUtils.getAllTrees() as Tree[];
}

// 特定のツリーを取得
export async function getTree(id: number): Promise<Tree | undefined> {
  return treeUtils.getTree(id) as Tree | undefined;
}

// ツリーの全ノードを取得
export async function getTreeNodes(treeId: number): Promise<Node[]> {
  const nodes = nodeUtils.getTreeNodes(treeId) as DbNode[];
  return buildNodeTree(nodes);
}

// 新規ツリーを作成
export async function createTree(name: string): Promise<number> {
  return Number(treeUtils.createTree(name));
}

// ツリー名を更新
export async function updateTreeName(id: number, name: string): Promise<void> {
  treeUtils.updateTreeName(id, name);
}

// ツリーを削除
export async function deleteTree(id: number): Promise<void> {
  treeUtils.deleteTree(id);
}

// 最後にアクセスした時刻を更新
export async function updateLastAccessed(id: number): Promise<void> {
  treeUtils.updateLastAccessed(id);
}

// 新規ノードを作成
export async function createNode(
  treeId: number,
  parentId: number | null,
  text: string,
  orderIndex: number
): Promise<number> {
  return Number(nodeUtils.createNode(treeId, parentId, text, orderIndex));
}

// ノードのテキストを更新
export async function updateNodeText(id: number, text: string): Promise<void> {
  nodeUtils.updateNodeText(id, text);
}

// ノードの展開状態を更新
export async function updateNodeExpanded(id: number, isExpanded: boolean): Promise<void> {
  nodeUtils.updateNodeExpanded(id, isExpanded);
}

// ノードの背景色を更新
export async function updateNodeColor(id: number, backgroundColor: string | null): Promise<void> {
  nodeUtils.updateNodeColor(id, backgroundColor);
}

// ノードを削除
export async function deleteNode(id: number): Promise<void> {
  nodeUtils.deleteNode(id);
}

// ノードの順序を更新
export async function updateNodeOrder(id: number, newOrderIndex: number): Promise<void> {
  nodeUtils.updateNodeOrder(id, newOrderIndex);
}

// ノードの親を更新
export async function updateNodeParent(id: number, newParentId: number | null): Promise<void> {
  nodeUtils.updateNodeParent(id, newParentId);
}
