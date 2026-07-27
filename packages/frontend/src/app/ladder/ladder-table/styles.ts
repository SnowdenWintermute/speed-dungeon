// the one thing a component can't own: th and td are separate elements that have to look identical.
// everything else about a table's look lives in LadderTable's own jsx.
// h-10 is a minimum on a table cell, so a stacked cell grows its row rather than being clipped.
// the alignment is stated rather than left to the defaults, which disagree: th centers, td starts.
// align-top is what keeps the short cells beside a stacked one from floating to the middle of a
// grown row, since a table cell's default vertical-align is middle
const CELL_BOX_CLASSES = "h-10 p-1 text-left align-top";

export const LADDER_TABLE_CELL_CLASSES = `${CELL_BOX_CLASSES} overflow-hidden text-ellipsis whitespace-nowrap`;
export const LADDER_TABLE_STACKED_CELL_CLASSES = CELL_BOX_CLASSES;
