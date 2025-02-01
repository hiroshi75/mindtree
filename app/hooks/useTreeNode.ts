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
  onSelect?: (id: string) => void,
  onDelete?: (id: string) => void,
  onMove?: (sourceId: string, targetId: string, position: 'before' | 'after' | 'inside') => void,
) {
  const [isExpanded, setIsExpanded] = React.useState(node.isExpanded);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(node.text);
  const [isHovered, setIsHovered] = React.useState(false);
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
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
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

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing) {
      onSelect?.(node.id);
    }
  };

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

  return {
    isExpanded,
    setIsExpanded,
    isEditing,
    setIsEditing,
    editText,
    setEditText,
    isHovered,
    setIsHovered,
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
