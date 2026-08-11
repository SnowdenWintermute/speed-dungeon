import { CombatAttribute, COMBAT_ATTRIBUTE_STRINGS } from "@speed-dungeon/common";
import { DataTableCellLayout, DataTableColumn } from "@speed-dungeon/ui/atoms/DataTable/column";
import { ComboRoomDamage, WeaponUsage } from "@/analysis/available-damage/combo-samples";
import { AvailableDamageResults, RoomAvailableDamage } from "@/analysis/available-damage/index";
import { SpecialtyComboKey } from "@/analysis/available-damage/specialty-combo";
import { DAMAGE_CHANNELS, DAMAGE_CHANNEL_NAMES } from "@/analysis/equipment-damage-sources";
import { formatOptionalNumber, NOTHING_TO_SHOW, topWeaponUsage } from "@/utils/format";

export interface ComboRoomRow {
  ordinal: number;
  floor: number;
  roomNumberOnFloor: number;
  combo: undefined | ComboRoomDamage;
}

export function comboRowsOf(rooms: RoomAvailableDamage[], key: SpecialtyComboKey): ComboRoomRow[] {
  return AvailableDamageResults.withLootDropped(rooms).map(
    ({ ordinal, floor, roomNumberOnFloor, byCombo }) => ({
      ordinal,
      floor,
      roomNumberOnFloor,
      combo: byCombo[key],
    })
  );
}

export function roomKey(row: ComboRoomRow) {
  return `${row.ordinal}`;
}

/** A line each, so three base items stay readable in one cell. */
function stacked(weapons: undefined | WeaponUsage[]) {
  const top = topWeaponUsage(weapons);
  if (top.length === 0) {
    return NOTHING_TO_SHOW;
  }
  return top.map(({ name, percent }) => (
    <div key={name}>{`${name} ${percent.toFixed(0)}%`}</div>
  ));
}

export const AVAILABLE_DAMAGE_COLUMNS: DataTableColumn<ComboRoomRow>[] = [
  { header: "rm", renderCell: (row) => `${row.floor}-${row.roomNumberOnFloor}` },
  {
    header: "p10",
    renderCell: (row) => formatOptionalNumber(row.combo?.damagePerTurn?.tenthPercentile),
  },
  {
    header: "med",
    renderCell: (row) => formatOptionalNumber(row.combo?.damagePerTurn?.median),
  },
  {
    header: "p90",
    renderCell: (row) => formatOptionalNumber(row.combo?.damagePerTurn?.ninetiethPercentile),
  },
  { header: "Excluded", renderCell: (row) => `${row.combo?.unavailableCount ?? 0}` },
  // availability beside the share of it spent, so a channel the character ignored reads differently
  // from one the loot pool never offered
  ...DAMAGE_CHANNELS.map((channel) => ({
    header: `${DAMAGE_CHANNEL_NAMES[channel]} avail / %`,
    renderCell: (row: ComboRoomRow) =>
      `${formatOptionalNumber(row.combo?.meanAvailability?.[channel])} / ${formatOptionalNumber(
        row.combo?.meanPercentOfAvailabilityAllocated?.[channel],
        0
      )}%`,
  })),
  ...[CombatAttribute.Strength, CombatAttribute.Dexterity].map((attribute) => ({
    header: `Pts ${COMBAT_ATTRIBUTE_STRINGS[attribute]}`,
    renderCell: (row: ComboRoomRow) =>
      formatOptionalNumber(row.combo?.meanAllocation?.fromDiscretionaryPoints[attribute]),
  })),
  {
    header: "Pts spent %",
    renderCell: (row) => `${formatOptionalNumber(row.combo?.meanPercentOfPointsAllocated, 0)}%`,
  },
  {
    header: "str inh",
    renderCell: (row) => formatOptionalNumber(row.combo?.meanInherentStrength),
  },
  {
    header: "dex inh",
    renderCell: (row) => formatOptionalNumber(row.combo?.meanInherentDexterity),
  },
  {
    header: "Used",
    renderCell: (row) => stacked(row.combo?.selectedWeapons),
    cellLayoutOption: DataTableCellLayout.Stacked,
  },
  {
    header: "Avail",
    renderCell: (row) => stacked(row.combo?.availableWeapons),
    cellLayoutOption: DataTableCellLayout.Stacked,
  },
];
