import { ReactNode } from "react";

// a sortable header asks its owner to re-sort rather than reordering the rows it already has, so
// the table works the same whether the ordering is done locally or by a server
export interface DataTableColumnSort {
  isSortedBy: boolean;
  isDescending: boolean;
  onSort: () => void;
}

// how much room a column's content is allowed to take, which is the column's own business rather
// than the table's — a list of players wants its own line each, a level does not
export enum DataTableCellLayout {
  SingleLine,
  Stacked,
}

export interface DataTableColumn<TEntry> {
  header: string;
  renderCell: (entry: TEntry) => ReactNode;
  widthPercentOption?: number;
  sortOption?: DataTableColumnSort;
  cellLayoutOption?: DataTableCellLayout;
}
