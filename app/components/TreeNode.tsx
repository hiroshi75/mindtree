"use client";

import { TreeNode as TreeNodeType } from "../types/node";
import { Card } from "@/components/ui/card";
import { useState, useRef, KeyboardEvent } from "react";

interface TreeNodeProps {
  node: TreeNodeType;
  level?: number;
  onUpdate?: (id: string, text: string) => void;
}

export function TreeNode({ node, level = 0, onUpdate }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(node.text);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasChildren = node.children && node.children.length > 0;

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditText(node.text);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (onUpdate) {
        onUpdate(node.id, editText);
      }
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditText(node.text);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    setEditText(node.text);
  };

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
          className={`p-3 w-full hover:bg-accent cursor-text transition-colors ${
            node.color ? "bg-opacity-10" : ""
          }`}
          style={{ backgroundColor: node.color }}
          onDoubleClick={handleDoubleClick}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="w-full bg-transparent outline-none"
              autoFocus
            />
          ) : (
            <span>{node.text}</span>
          )}
        </Card>
      </div>
      {isExpanded && node.children?.map((child) => (
        <TreeNode key={child.id} node={child} level={level + 1} onUpdate={onUpdate} />
      ))}
    </div>
  );
}
