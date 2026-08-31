import { DataTableCellLayout, DataTableColumn } from "@speed-dungeon/ui/atoms/DataTable/column";
import { AccuracyBySource } from "./run-reporter.ts";
import { MaxAccuracyTableRow } from "./row.ts";
import { BaseItemPercentList } from "../../components/base-item-percent-list.tsx";

function bySourceColumn(
  header: string,
  source: keyof AccuracyBySource
): DataTableColumn<MaxAccuracyTableRow> {
  return {
    header,
    renderCell: (row) => Math.round(row.averageAccuracyBySource[source]),
  };
}

export const MAX_ACCURACY_TABLE_COLUMNS: DataTableColumn<MaxAccuracyTableRow>[] = [
  { header: "Room", renderCell: (row) => `${row.floor}-${row.room}` },
  { header: "lvlMain", renderCell: (row) => Math.floor(row.averageMainClassLevel) },
  {
    header: "lvlSupp",
    renderCell: (row) =>
      row.averageSupportClassLevel === null ? "-" : row.averageSupportClassLevel,
  },
  { header: "accLow", renderCell: (row) => Math.floor(row.totalAccuracy.tenthPercentileAverage) },
  { header: "accMed", renderCell: (row) => Math.floor(row.totalAccuracy.median) },
  {
    header: "accHigh",
    renderCell: (row) => Math.floor(row.totalAccuracy.ninetiethPercentileAverage),
  },
  { header: "gearMed", renderCell: (row) => Math.floor(row.accuracyFromEquipment.median) },
  bySourceColumn("fromAccGear", "fromAccuracyAffixOnGear"),
  bySourceColumn("fromDexGear", "fromDexterityAffixOnGear"),
  bySourceColumn("fromAlloc", "fromAllocated"),
  bySourceColumn("fromInher", "fromInherent"),
  {
    header: "available",
    cellLayoutOption: DataTableCellLayout.Stacked,
    renderCell: (row) => <BaseItemPercentList baseItems={row.availableHoldablePercentages} />,
  },
];
