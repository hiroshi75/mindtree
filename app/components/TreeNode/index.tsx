import * as React from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { TreeNodeProps } from "@/app/types/TreeNodeProps";
import { useTreeNode } from "@/app/hooks/useTreeNode";
import { NodeContent } from "./NodeContent";

export function TreeNode({
  node,
  treeData,
  level = 0,
  isSelected = false,
  selectedNodeId = null,
  onUpdate,
  onAddSibling,
  onAddChild,
  onSelect,
  onDelete,
  onMove,
  searchResults,
  onColorChange
}: TreeNodeProps) {
  const {
    isExpanded,
    setIsExpanded,
    isEditing,
    editText,
    isHovered,
    isDragging,
    isDragOver,
    inputRef,
    nodeRef,
    handleClick,
    handleTextClick,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleNodeKeyDown: baseHandleNodeKeyDown,
    handleTextChange,
    handleMouseEnter,
    handleMouseLeave,
  } = useTreeNode(
    node,
    isSelected,
    treeData,
    onUpdate,
    onAddSibling,
    onAddChild,
    onSelect,
    onDelete,
    onMove
  );

  // キーボードイベントのラッパー関数を作成
  const handleNodeKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    console.log('[TreeNode] handleNodeKeyDown', {
      nodeId: node.id,
      key: e.key,
      ctrlKey: e.ctrlKey,
      isSelected,
      isEditing,
      target: e.currentTarget.tagName,
    });

    // 選択されていない場合は何もしない
    if (!isSelected) {
      console.log('[TreeNode] Node is not selected, ignoring keydown');
      return;
    }

    // KeyboardHandlers.tsのonKeyDownを実行し、その後useTreeNodeのhandleNodeKeyDownを実行
    baseHandleNodeKeyDown(e);
  };

  const hasChildren = node.children && node.children.length > 0;

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
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      tabIndex={isSelected ? 0 : -1}
      role="treeitem"
      aria-selected={isSelected}
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-label={`${node.text} ${hasChildren ? isExpanded ? '展開中' : '折りたたみ中' : ''}`}
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
          <NodeContent
            text={node.text}
            isEditing={isEditing}
            isSelected={isSelected}
            isHovered={isHovered}
            backgroundColor={node.backgroundColor}
            editText={editText}
            nodeId={node.id}
            searchResults={searchResults}
            inputRef={inputRef}
            onTextChange={handleTextChange}
            onTextClick={handleTextClick}
            onDelete={onDelete}
            onColorChange={onColorChange}
          />
        </div>
      </div>
      <div className={`overflow-hidden transition-all duration-200 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        {node.children?.map((child) => (
          <TreeNode
            key={child.id}
            node={child}
            treeData={treeData}
            level={level + 1}
            onUpdate={onUpdate}
            onAddSibling={onAddSibling}
            onAddChild={onAddChild}
            onSelect={onSelect}
            onDelete={onDelete}
            selectedNodeId={selectedNodeId}
            isSelected={child.id === selectedNodeId}
            onMove={onMove}
            searchResults={searchResults}
            onColorChange={onColorChange}
          />
        ))}
      </div>
    </div>
  );
}
