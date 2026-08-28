import { CombatAttribute } from "@speed-dungeon/common";
import { DataTableCellLayout, DataTableColumn } from "@speed-dungeon/ui/atoms/DataTable/column";
import { AttackDamageContributingAttribute } from "./run-reporter";
import { AttackDamageTableRow } from "./row";
import { AttributeSourceSplit } from "./attribute-source-split";
import { HoldablePercentList } from "@/components/holdable-percent-list";

/**
 * What the combatant actually had, read off the combatant. Summing the per-source attribution
 * instead would not give this: the total is floored once at the end, broken and requirement-failing
 * equipment is excluded from it, and it counts equipment attributes the affix-only attribution misses.
 */
function totalAttributeColumn(
  header: string,
  attribute: CombatAttribute
): DataTableColumn<AttackDamageTableRow> {
  return {
    header,
    renderCell: (row) => `${Math.round(row.totalAttributes[attribute].mean)}`,
  };
}

/** gear / allocated / inherent, so a total can be read as loot luck versus levelling */
function sourceSplitColumn(
  header: string,
  attribute: AttackDamageContributingAttribute
): DataTableColumn<AttackDamageTableRow> {
  return {
    header,
    renderCell: (row) => (
      <AttributeSourceSplit split={row.averageContributingAttributes[attribute]} />
    ),
  };
}

/** flat damage is not a CombatAttribute, so it has no combatant total and stays attributed */
const FLAT_DAMAGE_COLUMN: DataTableColumn<AttackDamageTableRow> = {
  header: "Flat",
  renderCell: (row) =>
    `${Math.round(
      row.averageContributingAttributes[AttackDamageContributingAttribute.FlatDamage].total
    )}`,
};

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
  totalAttributeColumn("Str", CombatAttribute.Strength),
  sourceSplitColumn("Str g/a/i", AttackDamageContributingAttribute.Strength),
  totalAttributeColumn("Dex", CombatAttribute.Dexterity),
  sourceSplitColumn("Dex g/a/i", AttackDamageContributingAttribute.Dexterity),
  totalAttributeColumn("Acc", CombatAttribute.Accuracy),
  sourceSplitColumn("Acc g/a/i", AttackDamageContributingAttribute.Accuracy),
  FLAT_DAMAGE_COLUMN,
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
