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

// whether the table divides the width it is given or takes the width it needs. FitContainer keeps
// every column on screen and truncates what will not fit, which is what a table read at a glance
// wants. FitContent lets the table grow past its container so nothing is cut, which only helps if
// the caller puts it in something that scrolls
export enum DataTableLayout {
  FitContainer,
  FitContent,
}

export interface DataTableColumn<TEntry> {
  header: string;
  renderCell: (entry: TEntry) => ReactNode;
  widthPercentOption?: number;
  sortOption?: DataTableColumnSort;
  cellLayoutOption?: DataTableCellLayout;
}
