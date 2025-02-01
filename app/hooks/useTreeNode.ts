import * as React from "react";
import { Node as TreeNodeType } from "../types/node";
import { createDragDropHandlers } from "../components/TreeNode/DragDropHandlers";
import { createKeyboardHandlers } from "../components/TreeNode/KeyboardHandlers";

export function useTreeNode(
  node: TreeNodeType,
  treeData: TreeNodeType,
  isSelected: boolean,
  onUpdate?: (id: string, text: string) => void,
  onAddSibling?: (id: string) => void,
  onAddChild?: (id: string) => void,
  onSelect?: (id: string | null) => void,
  onDelete?: (id: string) => void,
  onMove?: (sourceId: string, targetId: string, position: 'before' | 'after' | 'inside') => void,
) {
  const [isExpanded, setIsExpanded] = React.useState(node.isExpanded);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(node.text);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState<'before' | 'after' | 'inside' | null>(null);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const nodeRef = React.useRef<HTMLDivElement>(null);
  const saveTimeoutRef = React.useRef<null | NodeJS.Timeout>(null);

  React.useEffect(() => {
    setIsExpanded(Boolean(node.isExpanded));
  }, [node.isExpanded]);

  React.useEffect(() => {
    if (isDragOver) {
      const element = nodeRef.current;
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [isDragOver]);

  React.useEffect(() => {
    if (node.text === '' && isSelected) {
      setIsEditing(true);
      setEditText('');
      // 新規ノード作成時は全選択（空文字なので実質的な効果はない）
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  }, [node.text, isSelected]);

  React.useEffect(() => {
    if (isSelected && !isEditing && nodeRef.current && node.text !== '') {
      nodeRef.current.focus();
    }
  }, [isSelected, isEditing, node.text]);

  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const dragDropHandlers = createDragDropHandlers(
    node,
    treeData,
    setIsDragging,
    setIsDragOver,
    isDragOver,
    onMove
  );

  const keyboardHandlers = createKeyboardHandlers(
    node.id,
    node.text,
    isSelected,
    setEditText,
    setIsEditing,
    saveTimeoutRef,
    onUpdate,
    onAddSibling,
    onAddChild,
    onDelete,
    onSelect
  );

  // 編集内容を保存する共通関数
  const saveCurrentEdit = () => {
    if (isEditing) {
      if (editText !== node.text) {
        onUpdate?.(node.id, editText);
      }
      setIsEditing(false);
    }
    // 選択状態を解除（編集状態に関係なく）
    if (isSelected) {
      onSelect?.(null);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing) {
      // 編集状態でない場合のみ、他のノードの編集内容を保存
      saveCurrentEdit();
      onSelect?.(node.id);
    }
  };

  const handleTextClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isEditing) {
      // 編集状態でない場合は、編集状態に入り全選択する
      saveCurrentEdit(); // 他のノードの編集内容を保存
      onSelect?.(node.id);
      setIsEditing(true);
      setEditText(node.text);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 0);
    } else {
      // 編集状態の場合は、選択状態のみ維持
      onSelect?.(node.id);
    }
  };

  return {
    isExpanded,
    setIsExpanded,
    isEditing,
    setIsEditing,
    editText,
    setEditText,
    isDragging,
    isDragOver,
    inputRef,
    nodeRef,
    handleClick,
    handleTextClick,
    ...dragDropHandlers,
    ...keyboardHandlers,
  };
}
