import { DataTableCellLayout, DataTableColumn } from "@speed-dungeon/ui/atoms/DataTable/column";
import { AttackDamageContributingAttribute } from "./run-reporter";
import { AttackDamageTableRow } from "./row";
import { HoldablePercentList } from "@/components/holdable-percent-list";

function totalContributionColumn(
  header: string,
  attribute: AttackDamageContributingAttribute
): DataTableColumn<AttackDamageTableRow> {
  return {
    header,
    renderCell: (row) => `${Math.round(row.averageContributingAttributes[attribute].total)}`,
  };
}

function percentCell(normalizedRate: number) {
  return `${Math.round(normalizedRate * 100)}%`;
}

export const ATTACK_DAMAGE_TABLE_COLUMNS: DataTableColumn<AttackDamageTableRow>[] = [
  { header: "Room", renderCell: (row) => `${row.floor}-${row.room}` },
  { header: "lvlMain", renderCell: (row) => row.averageMainClassLevel },
  {
    header: "lvlSupp",
    renderCell: (row) =>
      row.averageSupportClassLevel === null ? "-" : row.averageSupportClassLevel,
  },
  {
    header: "p10",
    renderCell: (row) => Math.floor(row.damageOnDummy.tenthPercentileAverage),
  },
  { header: "Med", renderCell: (row) => Math.floor(row.damageOnDummy.median) },
  // { header: "Mean", renderCell: (row) => row.damageOnDummy.mean.toFixed(2) },
  {
    header: "p90",
    renderCell: (row) => Math.floor(row.damageOnDummy.ninetiethPercentileAverage),
  },
  {
    header: "hit",
    renderCell: (row) => percentCell(row.mainHandHitRate),
  },
  {
    header: "crit",
    renderCell: (row) => percentCell(row.mainHandCriticalHitRate),
  },
  {
    header: "mhTooltip",
    renderCell: (row) => row.averageTooltipDamage.mainHand.toString(),
  },
  {
    header: "ohTooltip",
    renderCell: (row) => row.averageTooltipDamage.offHand?.toString() ?? "-",
  },
  totalContributionColumn("Str", AttackDamageContributingAttribute.Strength),
  totalContributionColumn("Dex", AttackDamageContributingAttribute.Dexterity),
  totalContributionColumn("Acc", AttackDamageContributingAttribute.Accuracy),
  totalContributionColumn("Flat", AttackDamageContributingAttribute.FlatDamage),
  {
    header: "worn",
    cellLayoutOption: DataTableCellLayout.Stacked,
    renderCell: (row) => <HoldablePercentList holdables={row.wornHoldablePercentages} />,
  },
  {
    header: "available",
    cellLayoutOption: DataTableCellLayout.Stacked,
    renderCell: (row) => <HoldablePercentList holdables={row.availableHoldablePercentages} />,
  },
];
