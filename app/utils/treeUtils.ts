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

// 選択中のノードの親子関係を取得
function getNodeHierarchy(root: Node, selectedId: string): { node: Node; parent: Node | null; children: Node[] } | null {
  function findNode(node: Node, parent: Node | null): { node: Node; parent: Node | null; children: Node[] } | null {
    if (node.id === selectedId) {
      return {
        node,
        parent,
        children: node.children || []
      };
    }

    if (node.children) {
      for (const child of node.children) {
        const result = findNode(child, node);
        if (result) return result;
      }
    }
    return null;
  }

  return findNode(root, null);
}

// ツリー情報をプロンプトに組み込む
export function createContextPrompt(treeData: Node | undefined, selectedNodeId: string | null | undefined): string {
  if (!treeData || !selectedNodeId) return "";

  let contextPrompt = "現在のマインドマップの状態:\n\n";

  // 選択中のノードの階層関係を取得
  const hierarchy = getNodeHierarchy(treeData, selectedNodeId);
  if (hierarchy) {
    contextPrompt += "選択中のノード:\n";
    contextPrompt += `👉 ${hierarchy.node.text}\n\n`;

    if (hierarchy.parent) {
      contextPrompt += "親ノード:\n";
      contextPrompt += `- ${hierarchy.parent.text}\n\n`;
    }

    if (hierarchy.children.length > 0) {
      contextPrompt += "子ノード:\n";
      hierarchy.children.forEach(child => {
        contextPrompt += `- ${child.text}\n`;
      });
      contextPrompt += "\n";
    }

    // 兄弟ノードを表示
    if (hierarchy.parent && hierarchy.parent.children) {
      const siblings = hierarchy.parent.children.filter(node => node.id !== selectedNodeId);
      if (siblings.length > 0) {
        contextPrompt += "兄弟ノード:\n";
        siblings.forEach(sibling => {
          contextPrompt += `- ${sibling.text}\n`;
        });
        contextPrompt += "\n";
      }
    }
  }

  const totalNodes = countNodes(treeData);
  if (totalNodes <= 10) {
    contextPrompt += "ツリー全体:\n";
    contextPrompt += nodeToString(treeData, 0, treeData.id === selectedNodeId);
  }

  return contextPrompt;
}
