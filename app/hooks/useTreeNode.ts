import * as React from "react";
import { Node as TreeNodeType } from "../types/node";
import { createDragDropHandlers } from "../components/TreeNode/DragDropHandlers";
import { onKeyDown } from "../components/TreeNode/KeyboardHandlers";

export function useTreeNode(
  node: TreeNodeType,
  isSelected: boolean,
  treeData?: TreeNodeType,
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
  const [isHovered, setIsHovered] = React.useState(false);
  // Removed childNodes and setChildNodes as they are not used.

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
    setIsDragging,
    setIsDragOver,
    isDragOver,
    treeData,
    onMove
  );

  const keyboardHandlers = {
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === 'Tab') {
        if (onAddChild) {
          console.log("onAddChild called with", node.id);
          onAddChild(node.id);
        }
      }
    },
    handleNodeKeyDown: (event: React.KeyboardEvent) => {
      onKeyDown(event);
      if (event.key === 'Enter' || event.key === 'Tab') {
        if (onAddChild) {
          console.log("onAddChild called with", node.id);
          onAddChild(node.id);
        }
      }
    },
    handleEditKeyDown: (event: React.KeyboardEvent<HTMLInputElement | HTMLSpanElement>) => {
      console.log("handleEditKeyDown called with", event);
      const target = event.currentTarget as HTMLInputElement;
      setEditText(target.value);
    },
    handleTextChange: (text: string) => {
      console.log("handleTextChange called with", text);
      setEditText(text);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    console.log('[useTreeNode] handleClick', {
      nodeId: node.id,
      isEditing,
      isSelected
    });
    e.stopPropagation();
    if (!isEditing) {
      onSelect?.(node.id);
    }
  };

  const handleTextClick = (e: React.MouseEvent) => {
    console.log('[useTreeNode] handleTextClick', {
      nodeId: node.id,
      isEditing,
      isSelected
    });
    e.stopPropagation();
    if (!isEditing) {
      onSelect?.(node.id);
      setIsEditing(true);
      setEditText(node.text);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 0);
    }
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  return {
    isExpanded,
    setIsExpanded,
    isEditing,
    setIsEditing,
    editText,
    setEditText,
    isDragging,
    isDragOver,
    isHovered,
    inputRef,
    nodeRef,
    handleClick,
    handleTextClick,
    handleMouseEnter,
    handleMouseLeave,
    ...dragDropHandlers,
    ...keyboardHandlers,
  };
}
