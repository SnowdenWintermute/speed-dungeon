import React from "react";
import { IconName, SVG_ICONS } from "@/app/icons";
import { LadderTableColumnSort } from "./column";
import { LADDER_TABLE_CELL_CLASSES } from "./styles";

export function LadderTableHeaderCell({
  header,
  widthPercentOption,
  sortOption,
}: {
  header: string;
  widthPercentOption: number | undefined;
  sortOption: LadderTableColumnSort | undefined;
}) {
  const style = widthPercentOption === undefined ? {} : { width: `${widthPercentOption}%` };

  if (sortOption === undefined) {
    return (
      <th scope="col" className={LADDER_TABLE_CELL_CLASSES} style={style}>
        {header}
      </th>
    );
  }

  return (
    <th scope="col" className={LADDER_TABLE_CELL_CLASSES} style={style}>
      <button
        className="h-full w-full flex items-center justify-center hover:underline cursor-pointer"
        onClick={sortOption.onSort}
        aria-label={`sort by ${header}`}
      >
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">{header}</span>
        {sortOption.isSortedBy && (
          <span className="h-3 w-3 ml-1 flex items-center justify-center">
            {SVG_ICONS[IconName.Chevron](
              `h-full fill-zinc-300 ${sortOption.isDescending ? "-rotate-90" : "rotate-90"}`
            )}
          </span>
        )}
      </button>
    </th>
  );
}
