import { Node as TreeNodeType } from "./node";

export interface TreeNodeProps {
  node: TreeNodeType;
  treeData?: TreeNodeType;
  level?: number;
  isSelected?: boolean;
  selectedNodeId?: string | null;
  onUpdate?: (id: string, text: string) => void;
  onAddSibling?: (id: string) => void;
  onAddChild?: (id: string) => void;
  onSelect?: (id: string | null) => void;
  onDelete?: (id: string) => void;
  onMove?: (sourceId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
  searchResults?: string[];
  onColorChange?: (id: string, color: string | null) => void;
}
