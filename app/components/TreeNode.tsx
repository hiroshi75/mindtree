"use client";

import { TreeNode as TreeNodeType } from "../types/node";
import { Card } from "@/components/ui/card";
import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { Trash2 } from "lucide-react";

interface TreeNodeProps {
  node: TreeNodeType;
  level?: number;
  isSelected?: boolean;
  selectedNodeId?: string | null;
  onUpdate?: (id: string, text: string) => void;
  onAddSibling?: (id: string) => void;
  onAddChild?: (id: string) => void;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function TreeNode({
  node,
  level = 0,
  isSelected = false,
  selectedNodeId = null,
  onUpdate,
  onAddSibling,
  onAddChild,
  onSelect,
  onDelete
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(node.text);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const hasChildren = node.children && node.children.length > 0;

  // 新規ノード作成時の処理
  useEffect(() => {
    if (node.text === '' && isSelected) {
      setIsEditing(true);
      setEditText('');
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }
  }, [node.text, isSelected, selectedNodeId]);

  // 選択状態が変更されたときの処理
  useEffect(() => {
    if (isSelected && !isEditing && nodeRef.current && node.text !== '') {
      nodeRef.current.focus();
    }
  }, [isSelected, isEditing, node.text]);

  // キーボードイベントハンドラ
  const handleNodeKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // 選択状態でのみキーボードイベントを処理
    if (!isSelected) return;

    if (e.key === 'Delete' && onDelete) {
      e.preventDefault();
      e.stopPropagation();
      onDelete(node.id);
    }
    else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();

      // Ctrl+Enter: 子ノード追加
      if (e.ctrlKey && onAddChild) {
        onAddChild(node.id);
      }
      // Enter: 兄弟ノード追加
      else if (!e.ctrlKey && onAddSibling) {
        onAddSibling(node.id);
      }
    }
  };

  // 編集モード時のキーボードイベントハンドラ
  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();

      if (editText.trim() && onUpdate) {
        onUpdate(node.id, editText);
      }
      setIsEditing(false);

      // Ctrl+Enter: 子ノード追加
      if (e.ctrlKey && onAddChild) {
        onAddChild(node.id);
      }
      // Enter: 兄弟ノード追加
      else if (!e.ctrlKey && onAddSibling) {
        onAddSibling(node.id);
      }
    }
    else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setIsEditing(false);
      setEditText(node.text);
    }
  };

  // クリックイベントハンドラ
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing) {
      onSelect?.(node.id);
    }
  };

  // テキストクリックで編集モード開始
  const handleTextClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing) {
      onSelect?.(node.id);
      setIsEditing(true);
      setEditText(node.text);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }
  };

  return (
    <div
      ref={nodeRef}
      className="my-2 outline-none"
      onClick={handleClick}
      onKeyDown={handleNodeKeyDown}
      tabIndex={isSelected ? 0 : -1}
      role="treeitem"
      aria-selected={isSelected}
      aria-expanded={hasChildren ? isExpanded : undefined}
    >
      <div
        className="flex items-center gap-1"
        style={{ marginLeft: `${level * 2}rem` }}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="w-6 h-6 flex items-center justify-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label={isExpanded ? "折りたたむ" : "展開する"}
          >
            {isExpanded ? "▼" : "▶"}
          </button>
        )}
        {!hasChildren && <div className="w-6" />}
        <div className={`w-full rounded-lg transition-shadow ${isSelected ? "ring-2 ring-primary ring-offset-2" : ""}`}>
          <Card
            className={`p-3 w-full hover:bg-accent cursor-pointer transition-colors group ${node.color ? "bg-opacity-10" : ""
              }`}
            style={{ backgroundColor: node.color }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleEditKeyDown}
                onBlur={() => {
                  setIsEditing(false);
                  setEditText(node.text);
                }}
                className="w-full bg-transparent outline-none"
                autoFocus
              />
            ) : (
              <div className="flex items-center justify-between">
                <span
                  onClick={handleTextClick}
                  className="cursor-text"
                >
                  {node.text}
                </span>
                {isHovered && !isEditing && (
                  <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Trash2
                      className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.(node.id);
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
      {isExpanded && node.children?.map((child) => (
        <TreeNode
          key={child.id}
          node={child}
          level={level + 1}
          onUpdate={onUpdate}
          onAddSibling={onAddSibling}
          onAddChild={onAddChild}
          onSelect={onSelect}
          onDelete={onDelete}
          selectedNodeId={selectedNodeId}
          isSelected={child.id === selectedNodeId}
        />
      ))}
    </div>
  );
}
