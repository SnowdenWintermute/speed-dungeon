import { CombatAttribute, EquipmentSlotId } from "@speed-dungeon/common";
import { DataTableCellLayout, DataTableColumn } from "@speed-dungeon/ui/atoms/DataTable/column";
import { BaseItemPercentList } from "../../components/base-item-percent-list.tsx";
import { ArmorClassSlotId } from "./slots.ts";
import { ArmorClassTableRow } from "./row.ts";

function bySlotColumn(
  header: string,
  slotId: ArmorClassSlotId
): DataTableColumn<ArmorClassTableRow> {
  return {
    header,
    renderCell: (row) => Math.round(row.averageArmorClassBySlot[slotId]),
  };
}

function copiedAttributeColumn(
  header: string,
  attribute: CombatAttribute
): DataTableColumn<ArmorClassTableRow> {
  return {
    header,
    renderCell: (row) => Math.round(row.totalAttributes[attribute].mean),
  };
}

export const ARMOR_CLASS_TABLE_COLUMNS: DataTableColumn<ArmorClassTableRow>[] = [
  { header: "Room", renderCell: (row) => `${row.floor}-${row.room}` },
  { header: "lvlMain", renderCell: (row) => Math.floor(row.averageMainClassLevel) },
  {
    header: "lvlSupp",
    renderCell: (row) =>
      row.averageSupportClassLevel === null ? "-" : row.averageSupportClassLevel,
  },
  { header: "acLow", renderCell: (row) => Math.floor(row.totalArmorClass.tenthPercentileAverage) },
  { header: "acMed", renderCell: (row) => Math.floor(row.totalArmorClass.median) },
  {
    header: "acHigh",
    renderCell: (row) => Math.floor(row.totalArmorClass.ninetiethPercentileAverage),
  },
  bySlotColumn("body", EquipmentSlotId.Body),
  bySlotColumn("head", EquipmentSlotId.Head),
  bySlotColumn("shield", EquipmentSlotId.OffHand),
  copiedAttributeColumn("str", CombatAttribute.Strength),
  copiedAttributeColumn("dex", CombatAttribute.Dexterity),
  copiedAttributeColumn("spr", CombatAttribute.Spirit),
  {
    header: "worn",
    cellLayoutOption: DataTableCellLayout.Stacked,
    renderCell: (row) => <BaseItemPercentList baseItems={row.wornArmorPercentages} />,
  },
  {
    header: "available",
    cellLayoutOption: DataTableCellLayout.Stacked,
    renderCell: (row) => <BaseItemPercentList baseItems={row.availableArmorPercentages} />,
  },
];
