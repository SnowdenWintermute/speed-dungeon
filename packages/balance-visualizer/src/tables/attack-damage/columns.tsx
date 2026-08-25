import { Equipment } from "@speed-dungeon/common";
import { DataTableCellLayout, DataTableColumn } from "@speed-dungeon/ui/atoms/DataTable/column";
import { AttackDamageContributingAttribute } from "@/analysis-runs/analysis-run-reporter";
import { DamageRange } from "@/analysis-runs/attack-damage/samples";
import { baseItemKey } from "@/analysis-subjects/equipment-base-item-tally";
import { AttackDamageTableRow, HoldableAndPercent } from "./row";

const DECIMAL_PLACES = 1;

function formatNumber(value: number) {
  return value.toFixed(DECIMAL_PLACES);
}

function formatRange(range: DamageRange) {
  return `${formatNumber(range.min)} - ${formatNumber(range.max)}`;
}

function formatPercent(percent: number) {
  return `${Math.round(percent * 100)}%`;
}

function HoldablePercentList({ holdables }: { holdables: HoldableAndPercent[] }) {
  if (holdables.length === 0) {
    return <span className="text-theme-muted">none</span>;
  }

  return (
    <ul>
      {holdables.map(({ baseItem, percent }) => (
        <li key={baseItemKey(baseItem)} className="whitespace-nowrap">
          {formatPercent(percent)} {Equipment.getBaseItemStringName(baseItem)}
        </li>
      ))}
    </ul>
  );
}

function totalContributionColumn(
  header: string,
  attribute: AttackDamageContributingAttribute
): DataTableColumn<AttackDamageTableRow> {
  return {
    header,
    renderCell: (row) => formatNumber(row.averageContributingAttributes[attribute].total),
  };
}

export const ATTACK_DAMAGE_TABLE_COLUMNS: DataTableColumn<AttackDamageTableRow>[] = [
  { header: "Floor", renderCell: (row) => row.floor },
  { header: "Room", renderCell: (row) => row.room },
  { header: "Samples", renderCell: (row) => row.sampleCount },
  { header: "Level", renderCell: (row) => formatNumber(row.averageMainClassLevel) },
  {
    header: "Support level",
    renderCell: (row) =>
      row.averageSupportClassLevel === null
        ? "-"
        : formatNumber(row.averageSupportClassLevel),
  },
  { header: "Damage (median)", renderCell: (row) => formatNumber(row.damageOnDummy.median) },
  { header: "Damage (mean)", renderCell: (row) => formatNumber(row.damageOnDummy.mean) },
  {
    header: "Damage (low decile)",
    renderCell: (row) => formatNumber(row.damageOnDummy.tenthPercentileAverage),
  },
  {
    header: "Damage (high decile)",
    renderCell: (row) => formatNumber(row.damageOnDummy.ninetiethPercentileAverage),
  },
  {
    header: "Tooltip (main hand)",
    renderCell: (row) => formatRange(row.averageTooltipDamage.mainHand),
  },
  {
    header: "Tooltip (off hand)",
    renderCell: (row) =>
      row.averageTooltipDamage.offHand === null
        ? "-"
        : formatRange(row.averageTooltipDamage.offHand),
  },
  totalContributionColumn("Str", AttackDamageContributingAttribute.Strength),
  totalContributionColumn("Dex", AttackDamageContributingAttribute.Dexterity),
  totalContributionColumn("Acc", AttackDamageContributingAttribute.Accuracy),
  totalContributionColumn("Flat dmg", AttackDamageContributingAttribute.FlatDamage),
  {
    header: "Holdables worn",
    cellLayoutOption: DataTableCellLayout.Stacked,
    renderCell: (row) => <HoldablePercentList holdables={row.wornHoldablePercentages} />,
  },
  {
    header: "Holdables available",
    cellLayoutOption: DataTableCellLayout.Stacked,
    renderCell: (row) => <HoldablePercentList holdables={row.availableHoldablePercentages} />,
  },
];
