import React from "react";
import { LadderTableCellLayout, LadderTableColumn } from "./column";
import { LadderTableHeaderCell } from "./LadderTableHeaderCell";
import { LADDER_TABLE_CELL_CLASSES, LADDER_TABLE_STACKED_CELL_CLASSES } from "./styles";

// every board's rows hold different fields, so a board describes its columns and this owns all the
// markup. no board writes a td, which is what keeps them from drifting apart visually
// the two are complete strings rather than a base plus overrides: tailwind resolves conflicting
// utilities by their order in the stylesheet, not the order they appear in a className
function cellClassesFor<TEntry>(column: LadderTableColumn<TEntry>): string {
  if (column.cellLayoutOption === LadderTableCellLayout.Stacked) {
    return LADDER_TABLE_STACKED_CELL_CLASSES;
  }
  return LADDER_TABLE_CELL_CLASSES;
}

export function LadderTable<TEntry>({
  columns,
  entries,
  keyOf,
  emptyMessage,
}: {
  columns: LadderTableColumn<TEntry>[];
  entries: TEntry[];
  keyOf: (entry: TEntry) => string;
  emptyMessage: string;
}) {
  return (
    <table className="w-full table-fixed border-collapse">
      <thead>
        <tr className="border-b border-slate-400 font-bold">
          {columns.map((column) => (
            <LadderTableHeaderCell
              key={column.header}
              header={column.header}
              widthPercentOption={column.widthPercentOption}
              sortOption={column.sortOption}
            />
          ))}
        </tr>
      </thead>
      <tbody>
        {entries.length === 0 && (
          <tr className="border-b border-slate-400">
            <td className={`${LADDER_TABLE_CELL_CLASSES} text-slate-400`} colSpan={columns.length}>
              {emptyMessage}
            </td>
          </tr>
        )}
        {entries.map((entry) => (
          <tr key={keyOf(entry)} className="border-b border-slate-400">
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
