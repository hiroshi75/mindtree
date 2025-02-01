import { Node } from "../types/node";

// ツリーのノード数をカウント
function countNodes(node: Node): number {
  let count = 1;
  if (node.children) {
    for (const child of node.children) {
      count += countNodes(child);
    }
  }
  return count;
}

// 選択中ノードの兄弟と祖先を取得
function getRelevantNodes(root: Node, selectedId: string): Node[] {
  const result: Node[] = [];

  function findNode(node: Node, path: Node[] = []): boolean {
    if (node.id === selectedId) {
      // 祖先ノードを追加
      result.push(...path);

      // 親ノードがある場合、兄弟ノードを追加
      const parent = path[path.length - 1];
      if (parent && parent.children) {
        result.push(...parent.children);
      }

      // 選択中ノードの子ノードを追加
      if (node.children) {
        result.push(...node.children);
      }
      return true;
    }

    if (node.children) {
      for (const child of node.children) {
        if (findNode(child, [...path, node])) {
          return true;
        }
      }
    }
    return false;
  }

  findNode(root);
  return result;
}

// ノードをテキスト表現に変換
export function nodeToString(node: Node, level: number = 0, isSelected: boolean = false): string {
  const indent = "  ".repeat(level);
  const marker = isSelected ? "👉 " : "- ";
  let result = `${indent}${marker}${node.text}\n`;

  if (node.children && node.isExpanded) {
    for (const child of node.children) {
      result += nodeToString(child, level + 1);
    }
  }
  return result;
}

// ツリー情報をプロンプトに組み込む
export function createContextPrompt(treeData: Node | undefined, selectedNodeId: string | null | undefined): string {
  if (!treeData) return "";

  let contextPrompt = "現在のマインドマップの状態:\n\n";

  const totalNodes = countNodes(treeData);
  if (totalNodes <= 10) {
    // ツリー全体を表示
    contextPrompt += nodeToString(treeData, 0, treeData.id === selectedNodeId);
  } else if (selectedNodeId) {
    // 選択中ノードの兄弟と祖先を表示
    const relevantNodes = getRelevantNodes(treeData, selectedNodeId);
    for (const node of relevantNodes) {
      contextPrompt += nodeToString(node, 0, node.id === selectedNodeId);
    }
  }

  return contextPrompt;
}
