import { ReactNode } from "react";

// sorting is server-side, so a sortable header asks its board to re-query rather than reordering the
// rows it already has
export interface LadderTableColumnSort {
  isSortedBy: boolean;
  isDescending: boolean;
  onSort: () => void;
}

export interface LadderTableColumn<TEntry> {
  header: string;
  renderCell: (entry: TEntry) => ReactNode;
  widthPercentOption?: number;
  sortOption?: LadderTableColumnSort;
}
