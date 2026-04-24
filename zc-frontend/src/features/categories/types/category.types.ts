export interface Category {
  id: string;
  name: string;
  siteCategoryCode: string;
  level: number;
  parentId?: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTreeItem extends Category {
  children?: CategoryTreeItem[];
}
