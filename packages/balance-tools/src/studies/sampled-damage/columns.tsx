import { CombatAttribute } from "@speed-dungeon/common";
import { DataTableCellLayout, DataTableColumn } from "@speed-dungeon/ui/atoms/DataTable/column";
import { SampledDamageContributingAttribute } from "./run-reporter.ts";
import { SampledDamageTableRow } from "./row.ts";
import { AttributeSourceSplit } from "../../components/attribute-source-split.tsx";
import { BaseItemPercentList } from "../../components/base-item-percent-list.tsx";

/**
 * What the combatant actually had, read off the combatant. Summing the per-source attribution
 * instead would not give this: the total is floored once at the end, broken and requirement-failing
 * equipment is excluded from it, and it counts equipment attributes the affix-only attribution misses.
 */
function totalAttributeColumn(
  header: string,
  attribute: CombatAttribute
): DataTableColumn<SampledDamageTableRow> {
  return {
    header,
    renderCell: (row) => `${Math.round(row.totalAttributes[attribute].mean)}`,
  };
}

/** gear / allocated / inherent, so a total can be read as loot luck versus levelling */
function sourceSplitColumn(
  header: string,
  attribute: SampledDamageContributingAttribute
): DataTableColumn<SampledDamageTableRow> {
  return {
    header,
    renderCell: (row) => (
      <AttributeSourceSplit split={row.averageContributingAttributes[attribute]} />
    ),
  };
}

/** flat damage is not a CombatAttribute, so it has no combatant total and stays attributed */
const FLAT_DAMAGE_COLUMN: DataTableColumn<SampledDamageTableRow> = {
  header: "Flat",
  renderCell: (row) =>
    `${Math.round(
      row.averageContributingAttributes[SampledDamageContributingAttribute.FlatDamage].total
    )}`,
};

function percentCell(normalizedRate: number) {
  return `${Math.round(normalizedRate * 100)}%`;
}

export const SAMPLED_DAMAGE_TABLE_COLUMNS: DataTableColumn<SampledDamageTableRow>[] = [
  { header: "Room", renderCell: (row) => `${row.floor}-${row.room}` },
  { header: "lvlMain", renderCell: (row) => Math.floor(row.averageMainClassLevel) },
  {
    header: "lvlSupp",
    renderCell: (row) =>
      row.averageSupportClassLevel === null ? "-" : Math.floor(row.averageSupportClassLevel),
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
    renderCell: (row) => percentCell(row.primaryHitRate),
  },
  {
    header: "crit",
    renderCell: (row) => percentCell(row.primaryCriticalHitRate),
  },
  {
    header: "tooltip",
    renderCell: (row) => row.averageTooltipDamage.primary.toString(),
  },
  {
    header: "+tooltip",
    renderCell: (row) => row.averageTooltipDamage.additional?.toString() ?? "-",
  },
  totalAttributeColumn("Str", CombatAttribute.Strength),
  sourceSplitColumn("Str g/a/i", SampledDamageContributingAttribute.Strength),
  totalAttributeColumn("Dex", CombatAttribute.Dexterity),
  sourceSplitColumn("Dex g/a/i", SampledDamageContributingAttribute.Dexterity),
  totalAttributeColumn("Spr", CombatAttribute.Spirit),
  sourceSplitColumn("Spr g/a/i", SampledDamageContributingAttribute.Spirit),
  totalAttributeColumn("Acc", CombatAttribute.Accuracy),
  sourceSplitColumn("Acc g/a/i", SampledDamageContributingAttribute.Accuracy),
  FLAT_DAMAGE_COLUMN,
  {
    header: "worn",
    cellLayoutOption: DataTableCellLayout.Stacked,
    renderCell: (row) => <BaseItemPercentList baseItems={row.wornHoldablePercentages} />,
  },
  {
    header: "available",
    cellLayoutOption: DataTableCellLayout.Stacked,
    renderCell: (row) => <BaseItemPercentList baseItems={row.availableHoldablePercentages} />,
  },
];
