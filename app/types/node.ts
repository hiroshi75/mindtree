export interface TreeNode {
  id: string;
  text: string;
  children?: TreeNode[];
  color?: string;
  isExpanded?: boolean;
}
