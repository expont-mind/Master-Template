export interface Category {
  id: string;
  name: string;
  slug?: string;
  parent_id: string | null;
  image?: string | null;
  is_featured?: boolean;
  is_active?: boolean;
  sort_order?: number;
}

export interface CategoryNode extends Category {
  children: CategoryNode[];
  depth: number;
}

export interface CategoryTreeProps {
  categories: Category[];
  onMove: (categoryId: string, newParentId: string | null) => Promise<void>;
  onDelete: (categoryId: string) => void;
}

export interface SortableItemProps {
  node: CategoryNode;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  totalCount: number;
  isDragging?: boolean;
  isOver?: boolean;
}

export interface DragOverlayItemProps {
  node: CategoryNode;
}
