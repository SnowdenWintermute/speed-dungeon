import { DataTableColumn } from "@speed-dungeon/ui/atoms/DataTable/column";
import { FloorEvasionTargets } from "@/analysis/monster-evasion-targets";
import {
  MONSTER_ATTRIBUTE_INTENSITIES,
  MONSTER_ATTRIBUTE_INTENSITY_NAMES,
} from "@/analysis/monster-attribute-intensity";

export const MONSTER_EVASION_COLUMNS: DataTableColumn<FloorEvasionTargets>[] = [
  {
    header: "Floor",
    widthPercentOption: 10,
    renderCell: (floor) => `${floor.floorNumber}`,
  },
  ...MONSTER_ATTRIBUTE_INTENSITIES.map((intensity) => ({
    header: `${intensity} ${MONSTER_ATTRIBUTE_INTENSITY_NAMES[intensity]}`,
    renderCell: (floor: FloorEvasionTargets) =>
      floor.evasionByIntensity[intensity].toFixed(1),
  })),
];

export function floorKey(floor: FloorEvasionTargets) {
  return `${floor.floorNumber}`;
}
