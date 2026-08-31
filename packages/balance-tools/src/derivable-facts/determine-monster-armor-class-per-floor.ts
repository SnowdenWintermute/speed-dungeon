import {
  ARMOR_CLASS_EQUATION_MODIFIER,
  FloorNumber,
  MapUtils,
  NormalizedPercentage,
  RoomNumber,
} from "@speed-dungeon/common";
import { AVERAGE_MONSTER_ARMOR_CLASS_DAMAGE_REDUCTION_PERCENT } from "../tuning-consts.ts";
import { SampledDamageTable } from "../studies/sampled-damage/table.ts";

function armorClassFromIncomingDamageAndPercentReduction(
  incomingDamage: number,
  percentReduction: NormalizedPercentage
) {
  return (
    (ARMOR_CLASS_EQUATION_MODIFIER * incomingDamage * percentReduction) / (1 - percentReduction)
  );
}

export function determinePerFloorMonsterArmorClass(table: SampledDamageTable) {
  const rows = table.selectRows({});
  const expectedCharacterTooltipDamageByRoom = new Map<FloorNumber, Map<RoomNumber, number>>();

  for (const row of rows) {
    const { floor, room, averageTooltipDamage } = row;

    const floorEntries = MapUtils.getOrCreate<FloorNumber, Map<RoomNumber, number>>(
      expectedCharacterTooltipDamageByRoom,
      floor,
      () => new Map()
    );
    floorEntries.set(room, averageTooltipDamage.primary.getAverage());
  }

  const monsterArmorClassPerFloor = new Map<FloorNumber, number>();

  for (const [floorNumber, rooms] of expectedCharacterTooltipDamageByRoom) {
    let floorTotal = 0;
    const floorRoomCount = rooms.size;
    for (const [_roomNumber, roomAccuracy] of rooms) {
      floorTotal += roomAccuracy;
    }
    const floorAverage = floorTotal / floorRoomCount;

    const monsterArmorClass = Math.round(
      Math.max(
        0,
        armorClassFromIncomingDamageAndPercentReduction(
          floorAverage,
          AVERAGE_MONSTER_ARMOR_CLASS_DAMAGE_REDUCTION_PERCENT
        )
      )
    );

    monsterArmorClassPerFloor.set(floorNumber, monsterArmorClass);
  }

  return monsterArmorClassPerFloor;
}
