import { DataTableCellLayout, DataTableColumn } from "@speed-dungeon/ui/atoms/DataTable/column";
import { HoldablePercentList } from "@/components/HoldablePercentList";
import { MaxAccuracyTableRow } from "./row";

export const MAX_ACCURACY_TABLE_COLUMNS: DataTableColumn<MaxAccuracyTableRow>[] = [
  { header: "Room", renderCell: (row) => `${row.floor}-${row.room}` },
  { header: "lvlMain", renderCell: (row) => row.averageMainClassLevel },
  {
    header: "lvlSupp",
    renderCell: (row) =>
      row.averageSupportClassLevel === null ? "-" : row.averageSupportClassLevel,
  },
  { header: "accLow", renderCell: (row) => Math.floor(row.totalAccuracy.tenthPercentileAverage) },
  { header: "accMed", renderCell: (row) => Math.floor(row.totalAccuracy.median) },
  { header: "accHigh", renderCell: (row) => Math.floor(row.totalAccuracy.ninetiethPercentileAverage) },
  { header: "gearMed", renderCell: (row) => Math.floor(row.accuracyFromEquipment.median) },
  {
    header: "fromAccGear",
    renderCell: (row) => Math.round(row.averageAccuracyBySource.fromAccuracyAffixOnGear),
  },
  {
    header: "fromDexGear",
    renderCell: (row) => Math.round(row.averageAccuracyBySource.fromDexterityAffixOnGear),
  },
  {
    header: "fromAlloc",
    renderCell: (row) => Math.round(row.averageAccuracyBySource.fromAllocated),
  },
  {
    header: "fromInher",
    renderCell: (row) => Math.round(row.averageAccuracyBySource.fromInherent),
  },
  {
    header: "available",
    cellLayoutOption: DataTableCellLayout.Stacked,
    renderCell: (row) => <HoldablePercentList holdables={row.availableHoldablePercentages} />,
  },
];
