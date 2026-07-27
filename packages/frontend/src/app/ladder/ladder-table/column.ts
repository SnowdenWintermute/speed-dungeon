import { ReactNode } from "react";

// sorting is server-side, so a sortable header asks its board to re-query rather than reordering the
// rows it already has
export interface LadderTableColumnSort {
  isSortedBy: boolean;
  isDescending: boolean;
  onSort: () => void;
}

// how much room a column's content is allowed to take, which is the column's own business rather
// than the table's — a list of players wants its own line each, a level does not
export enum LadderTableCellLayout {
  SingleLine,
  Stacked,
}

export interface LadderTableColumn<TEntry> {
  header: string;
  renderCell: (entry: TEntry) => ReactNode;
  widthPercentOption?: number;
  sortOption?: LadderTableColumnSort;
  cellLayoutOption?: LadderTableCellLayout;
}
