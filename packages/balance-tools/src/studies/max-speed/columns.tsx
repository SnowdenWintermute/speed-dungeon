import { BASE_ACTION_DELAY_MULTIPLIER, CombatAttribute, TurnOrderManager } from "@speed-dungeon/common";
import { DataTableColumn } from "@speed-dungeon/ui/atoms/DataTable/column";
import { AttributeSourceSplit } from "../../components/attribute-source-split.tsx";
import { MaxSpeedTableRow } from "./row.ts";

function medianSpeedOf(row: MaxSpeedTableRow) {
  return Math.floor(row.totalAttributes[CombatAttribute.Speed].median);
}

export const MAX_SPEED_TABLE_COLUMNS: DataTableColumn<MaxSpeedTableRow>[] = [
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
  {
    header: "spdLow",
    renderCell: (row) =>
      Math.floor(row.totalAttributes[CombatAttribute.Speed].tenthPercentileAverage),
  },
  { header: "spdMed", renderCell: medianSpeedOf },
  {
    header: "spdHigh",
    renderCell: (row) =>
      Math.floor(row.totalAttributes[CombatAttribute.Speed].ninetiethPercentileAverage),
  },
  {
    header: "dly",
    renderCell: (row) =>
      TurnOrderManager.getActionDelayCost(medianSpeedOf(row), BASE_ACTION_DELAY_MULTIPLIER),
  },
];
