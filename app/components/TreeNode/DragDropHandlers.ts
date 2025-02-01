import { Node as TreeNodeType } from "../../types/node";

export interface DragDropHandlers {
  handleDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}

export const createDragDropHandlers = (
  node: TreeNodeType,
  setIsDragging: (value: boolean) => void,
  setIsDragOver: (value: 'before' | 'after' | 'inside' | null) => void,
  isDragOver: 'before' | 'after' | 'inside' | null,
  treeData?: TreeNodeType,
  onMove?: (sourceId: string, targetId: string, position: 'before' | 'after' | 'inside') => void
): DragDropHandlers => {
  const validateDrop = (sourceId: string, targetId: string): boolean => {
    if (sourceId === targetId) return false;

    const isDescendant = (parent: TreeNodeType, childId: string): boolean => {
      if (parent.id === childId) return true;
      return parent.children?.some(child => isDescendant(child, childId)) || false;
    };

    const findSourceNode = (root: TreeNodeType): TreeNodeType | null => {
      if (root.id === sourceId) return root;
      if (root.children) {
        for (const child of root.children) {
          const found = findSourceNode(child);
          if (found) return found;
        }
      }
      return null;
    };

    if (!treeData) return true;
    const sourceNode = findSourceNode(treeData);
    if (sourceNode && isDescendant(sourceNode, targetId)) {
      return false;
    }

    return true;
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', node.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDragging(false);
    setIsDragOver(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseY = e.clientY;
    const threshold = 5;

    const relativeY = mouseY - rect.top;

    if (relativeY < threshold) {
      setIsDragOver('before');
    } else if (relativeY > rect.height - threshold) {
      setIsDragOver('after');
    } else {
      setIsDragOver('inside');
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const sourceId = e.dataTransfer.getData('text/plain');
    if (sourceId === node.id) return;

    const isValidDrop = validateDrop(sourceId, node.id);
    if (!isValidDrop) return;

    if (onMove) {
      onMove(sourceId, node.id, isDragOver || 'inside');
    }

    setIsDragOver(null);
  };

  return {
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop
  };
};
