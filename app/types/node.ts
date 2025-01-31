export interface Node {
  id: string;
  text: string;
  children: Node[];
  isExpanded: boolean;
  backgroundColor?: string;
}

export interface DbNode {
  id: number;
  tree_id: number;
  parent_id: number | null;
  text: string;
  order_index: number;
  is_expanded: boolean;
  background_color: string | null;
  created_at: string;
  updated_at: string;
}
