"use client";

import { TreeNode as TreeNodeType } from "../types/node";
import { Card } from "@/components/ui/card";
import { useState } from "react";

interface TreeNodeProps {
  node: TreeNodeType;
  level?: number;
}

export function TreeNode({ node, level = 0 }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="my-2">
      <div className="flex items-center gap-1" style={{ marginLeft: `${level * 2}rem` }}>
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-6 h-6 flex items-center justify-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isExpanded ? "▼" : "▶"}
          </button>
        )}
        {!hasChildren && <div className="w-6" />}
        <Card 
          className={`p-3 w-full hover:bg-accent cursor-pointer transition-colors ${
            node.color ? "bg-opacity-10" : ""
          }`}
          style={{ backgroundColor: node.color }}
        >
          <span>{node.text}</span>
        </Card>
      </div>
      {isExpanded && node.children?.map((child) => (
        <TreeNode key={child.id} node={child} level={level + 1} />
      ))}
    </div>
  );
}
