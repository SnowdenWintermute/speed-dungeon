import { CombatAttribute } from "@speed-dungeon/common";
import { DataTableColumn } from "@speed-dungeon/ui/atoms/DataTable/column";
import { AttributeSourceSplit } from "../../components/attribute-source-split.tsx";
import { MaxAgilityTableRow } from "./row.ts";

export const MAX_AGILITY_TABLE_COLUMNS: DataTableColumn<MaxAgilityTableRow>[] = [
  { header: "Room", renderCell: (row) => `${row.floor}-${row.room}` },
  { header: "lvlMain", renderCell: (row) => Math.floor(row.averageMainClassLevel) },
  {
    header: "lvlSupp",
    renderCell: (row) =>
      row.averageSupportClassLevel === null ? "-" : Math.floor(row.averageSupportClassLevel),
  },
  {
    header: "agiLow",
    renderCell: (row) =>
      Math.floor(row.totalAttributes[CombatAttribute.Agility].tenthPercentileAverage),
  },
  {
    header: "agiMed",
    renderCell: (row) => Math.floor(row.totalAttributes[CombatAttribute.Agility].median),
  },
  {
    header: "agiHigh",
    renderCell: (row) =>
      Math.floor(row.totalAttributes[CombatAttribute.Agility].ninetiethPercentileAverage),
  },
  {
    header: "agi g/a/i",
    renderCell: (row) => <AttributeSourceSplit split={row.averageAgilityBySource} />,
  },
];
