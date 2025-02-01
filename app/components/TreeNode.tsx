"use client";

import { Node as TreeNodeType } from "../types/node";
import { Card } from "@/components/ui/card";
import React, { useState, useRef, KeyboardEvent, DragEvent } from "react";
import { Trash2, ChevronRight, ChevronDown } from "lucide-react";
import { updateNodeText } from "@/app/actions/tree";

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
  onMove?: (sourceId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
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
  onDelete,
  onMove
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(node.isExpanded);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(node.text);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState<'before' | 'after' | 'inside' | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const hasChildren = node.children && node.children.length > 0;

  // isExpandedの更新
  React.useEffect(function useUpdateExpanded() {
    setIsExpanded(node.isExpanded);
  }, [node.isExpanded]);

  // ドラッグ&ドロップ中のスクロール処理
  React.useEffect(function useHandleScroll() {
    if (isDragOver) {
      const element = nodeRef.current;
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [isDragOver]);

  // 新規ノード作成時の処理
  React.useEffect(function useHandleNewNode() {
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
  React.useEffect(function useHandleSelection() {
    if (isSelected && !isEditing && nodeRef.current && node.text !== '') {
      nodeRef.current.focus();
    }
  }, [isSelected, isEditing, node.text]);

  // クリーンアップ
  React.useEffect(function useCleanup() {
    return function cleanup() {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // ドラッグ開始時の処理
  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', node.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  // ドラッグ終了時の処理
  const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDragging(false);
    setIsDragOver(null);
  };

  // ドラッグオーバー時の処理
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseY = e.clientY;
    const threshold = 5; // ピクセル単位での閾値

    // マウス位置に基づいてドロップ位置を決定
    const relativeY = mouseY - rect.top;

    if (relativeY < threshold) {
      setIsDragOver('before');
    } else if (relativeY > rect.height - threshold) {
      setIsDragOver('after');
    } else {
      setIsDragOver('inside');
    }
  };

  // ドラッグリーブ時の処理
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(null);
  };

  // ドロップ時の処理
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const sourceId = e.dataTransfer.getData('text/plain');
    if (sourceId === node.id) return; // 自分自身へのドロップは無視

    // 親子関係のバリデーション
    const isValidDrop = validateDrop(sourceId, node.id);
    if (!isValidDrop) return;

    if (onMove) {
      onMove(sourceId, node.id, isDragOver || 'inside');
    }

    setIsDragOver(null);
  };

  // ドロップ位置のバリデーション
  const validateDrop = (sourceId: string, targetId: string): boolean => {
    // 自分自身の子孫ノードへのドロップを防ぐ
    const isDescendant = (parent: TreeNodeType, childId: string): boolean => {
      if (parent.id === childId) return true;
      return parent.children?.some(child => isDescendant(child, childId)) || false;
    };

    // 自分自身へのドロップを防ぐ
    if (sourceId === targetId) return false;

    // 自分の子孫ノードへのドロップを防ぐ
    if (node.children?.some(child => isDescendant(child, sourceId))) {
      return false;
    }

    return true;
  };

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

  // テキスト変更時のデバウンス保存
  const handleTextChange = (text: string) => {
    setEditText(text);

    // 既存のタイマーをクリア
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // 新しいタイマーをセット（500ms後に保存）
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateNodeText(Number(node.id), text);
      } catch (error) {
        console.error('Failed to save node text:', error);
      }
    }, 500);
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
      className={`my-2 outline-none ${isDragging ? 'opacity-50' : ''}`}
      draggable={!isEditing}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      onKeyDown={handleNodeKeyDown}
      tabIndex={isSelected ? 0 : -1}
      role="treeitem"
      aria-selected={isSelected}
      aria-expanded={hasChildren ? isExpanded : undefined}
    >
      <div
        className={`flex items-center gap-1 relative ${isDragOver === 'before' ? 'before:absolute before:left-0 before:right-0 before:top-0 before:h-0.5 before:bg-primary' :
          isDragOver === 'after' ? 'after:absolute after:left-0 after:right-0 after:bottom-0 after:h-0.5 after:bg-primary' :
            isDragOver === 'inside' ? 'ring-2 ring-primary ring-inset' : ''
          }`}
        style={{ marginLeft: `${level * 2}rem` }}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label={isExpanded ? "折りたたむ" : "展開する"}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-6" />}
        <div className={`w-full rounded-lg transition-shadow ${isSelected ? "ring-2 ring-primary ring-offset-2" : ""}`}>
          <Card
            className={`p-3 w-full hover:bg-accent cursor-pointer transition-colors group ${node.backgroundColor ? "bg-opacity-10" : ""
              }`}
            style={{ backgroundColor: node.backgroundColor }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editText}
                onChange={(e) => handleTextChange(e.target.value)}
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
      <div className={`overflow-hidden transition-all duration-200 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        {node.children?.map((child) => (
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
            onMove={onMove}
          />
        ))}
      </div>
    </div>
  );
}
