import React, { ReactNode } from "react";
import { DataTableColumnSort } from "./column";
import { DATA_TABLE_CELL_CLASSES } from "./styles";

export function DataTableHeaderCell({
  header,
  widthPercentOption,
  sortOption,
  renderSortIndicator,
}: {
  header: string;
  widthPercentOption: number | undefined;
  sortOption: DataTableColumnSort | undefined;
  // the icon comes from the consuming app's registry rather than this package's own assets
  renderSortIndicator: ((isDescending: boolean) => ReactNode) | undefined;
}) {
  const style = widthPercentOption === undefined ? {} : { width: `${widthPercentOption}%` };

  if (sortOption === undefined) {
    return (
      <th scope="col" className={DATA_TABLE_CELL_CLASSES} style={style}>
        {header}
      </th>
    );
  }

  return (
    <th scope="col" className={DATA_TABLE_CELL_CLASSES} style={style}>
      <button
        className="h-full w-full flex hover:underline cursor-pointer"
        onClick={sortOption.onSort}
        aria-label={`sort by ${header}`}
      >
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">{header}</span>
        {sortOption.isSortedBy && renderSortIndicator !== undefined && (
          <span className="h-3 w-3 ml-1 flex ">{renderSortIndicator(sortOption.isDescending)}</span>
        )}
      </button>
    </th>
  );
}
