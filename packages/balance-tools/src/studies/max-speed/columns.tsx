import { CombatAttribute } from "@speed-dungeon/common";
import { DataTableColumn } from "@speed-dungeon/ui/atoms/DataTable/column";
import { AttributeSourceSplit } from "../../components/attribute-source-split.tsx";
import { MaxSpeedTableRow } from "./row.ts";
import { TurnComparison } from "./turn-comparison.tsx";
import {
  COMPARISON_SPEED_SHARES,
  actionDelayCostAtSpeed,
  comparisonSpeed,
  turnsPerOpponentTurn,
} from "./turn-frequency.ts";

/** loot drives a good share of agility, so the speed every turn column is read at is the median */
function speedOf(row: MaxSpeedTableRow) {
  return Math.floor(row.totalAttributes[CombatAttribute.Speed].median);
}

function comparisonColumn(share: number): DataTableColumn<MaxSpeedTableRow> {
  return {
    header: `vs${Math.round(share * 100)}%`,
    renderCell: (row) => {
      const speed = speedOf(row);
      const opponentSpeed = comparisonSpeed(speed, share);
      return (
        <TurnComparison
          opponentSpeed={opponentSpeed}
          turnsPerOpponentTurn={turnsPerOpponentTurn(speed, opponentSpeed)}
        />
      );
    },
  };
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
  { header: "spd", renderCell: speedOf },
  // the delay cost is a small integer, so speeds far apart can share one and buy the same turns.
  // quoted beside the ratios rather than left to be inferred from them
  { header: "dly", renderCell: (row) => actionDelayCostAtSpeed(speedOf(row)) },
  ...COMPARISON_SPEED_SHARES.map(comparisonColumn),
];
