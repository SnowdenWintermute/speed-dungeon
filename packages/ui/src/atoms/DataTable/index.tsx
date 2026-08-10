import React, { ReactNode } from "react";
import { DataTableCellLayout, DataTableColumn, DataTableLayout } from "./column";
import { DataTableHeaderCell } from "./DataTableHeaderCell";
import { DATA_TABLE_CELL_CLASSES, DATA_TABLE_STACKED_CELL_CLASSES } from "./styles";

// complete strings for the same reason the cell classes are: tailwind resolves conflicting
// utilities by their order in the stylesheet, not the order they appear in a className
const TABLE_CLASSES: Record<DataTableLayout, string> = {
  [DataTableLayout.FitContainer]: "w-full table-fixed border-collapse",
  [DataTableLayout.FitContent]: "w-max min-w-full table-auto border-collapse",
};

// every table's rows hold different fields, so a caller describes its columns and this owns all the
// markup. no caller writes a td, which is what keeps them from drifting apart visually
// the two are complete strings rather than a base plus overrides: tailwind resolves conflicting
// utilities by their order in the stylesheet, not the order they appear in a className
function cellClassesFor<TEntry>(column: DataTableColumn<TEntry>): string {
  if (column.cellLayoutOption === DataTableCellLayout.Stacked) {
    return DATA_TABLE_STACKED_CELL_CLASSES;
  }
  return DATA_TABLE_CELL_CLASSES;
}

export function DataTable<TEntry>({
  columns,
  entries,
  keyOf,
  emptyMessage,
  renderSortIndicator,
  layoutOption,
}: {
  columns: DataTableColumn<TEntry>[];
  entries: TEntry[];
  keyOf: (entry: TEntry) => string;
  emptyMessage: string;
  renderSortIndicator?: (isDescending: boolean) => ReactNode;
  layoutOption?: DataTableLayout;
}) {
  return (
    <table className={TABLE_CLASSES[layoutOption ?? DataTableLayout.FitContainer]}>
      <thead>
        <tr className="border-b border-theme-muted font-bold">
          {columns.map((column) => (
            <DataTableHeaderCell
              key={column.header}
              header={column.header}
              widthPercentOption={column.widthPercentOption}
              sortOption={column.sortOption}
              renderSortIndicator={renderSortIndicator}
            />
          ))}
        </tr>
      </thead>
      <tbody>
        {entries.length === 0 && (
          <tr className="border-b border-theme-muted">
            <td className={`${DATA_TABLE_CELL_CLASSES} text-theme-muted`} colSpan={columns.length}>
              {emptyMessage}
            </td>
          </tr>
        )}
        {entries.map((entry) => (
          <tr key={keyOf(entry)} className="border-b border-theme-muted">
            {columns.map((column) => (
              <td key={column.header} className={cellClassesFor(column)}>
                {column.renderCell(entry)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
