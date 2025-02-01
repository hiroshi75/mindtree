import * as React from "react";
import { updateNodeText } from "@/app/actions/tree";

export interface KeyboardHandlers {
  handleNodeKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  handleEditKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleTextChange: (text: string) => void;
}

export const createKeyboardHandlers = (
  nodeId: string,
  nodeText: string,
  isSelected: boolean,
  setEditText: (text: string) => void,
  setIsEditing: (value: boolean) => void,
  saveTimeoutRef: { current: NodeJS.Timeout | null },
  onUpdate?: (id: string, text: string) => void,
  onAddSibling?: (id: string) => void,
  onAddChild?: (id: string) => void,
  onDelete?: (id: string) => void,
  onSelect?: (id: string) => void,
): KeyboardHandlers => {

  const handleNodeKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isSelected) return;

    if (e.key === 'Delete' && onDelete) {
      e.preventDefault();
      e.stopPropagation();
      onDelete(nodeId);
    }
    else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();

      if (e.ctrlKey && onAddChild) {
        onAddChild(nodeId);
      }
      else if (!e.ctrlKey && onAddSibling) {
        onAddSibling(nodeId);
      }
    }
  };

  const handleTextChange = (text: string) => {
    setEditText(text);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        if (text.trim() !== nodeText) {
          await updateNodeText(Number(nodeId), text);
        }
      } catch (error) {
        console.error('Failed to save node text:', error);
      }
    }, 500);
  };

  // 編集内容を保存する関数
  const saveEdit = (text: string) => {
    const trimmedText = text.trim();
    const hasChanged = trimmedText !== nodeText;

    if (trimmedText && onUpdate && hasChanged) {
      onUpdate(nodeId, trimmedText);
    }
    setIsEditing(false);
    return hasChanged;
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Tabキーでフォーカスが移動する前に保存
    if (e.key === 'Tab') {
      saveEdit(e.currentTarget.value);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();

      const hasChanged = saveEdit(e.currentTarget.value);

      if (e.ctrlKey && onAddChild) {
        onAddChild(nodeId);
      }
      else if (!e.ctrlKey && !hasChanged && onAddSibling) {
        onAddSibling(nodeId);
      }

      setTimeout(() => {
        if (onSelect) {
          onSelect(nodeId);
        }
      }, 0);
    }
    else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setIsEditing(false);
      setEditText(nodeText);
    }
  };

  return {
    handleNodeKeyDown,
    handleEditKeyDown,
    handleTextChange
  };
};
