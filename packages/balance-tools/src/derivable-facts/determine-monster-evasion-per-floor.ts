import { FloorNumber, MapUtils, RoomNumber } from "@speed-dungeon/common";
import { MaxAccuracyTable } from "../studies/max-accuracy/table.ts";
import {
  DESIGNED_ACC_INVESTMENT_PERCENTAGE,
  DESIGNED_HIT_CHANCE_FOR_AVERAGE_CHARACTER,
} from "../tuning-consts.ts";

export function determinePerFloorMonsterEvasion(table: MaxAccuracyTable) {
  const rows = table.selectRows({});
  const expectedCharacterAccuracyByRoom = new Map<FloorNumber, Map<RoomNumber, number>>();

  for (const row of rows) {
    const { floor, room, averageAccuracyBySource, accuracyFromEquipment } = row;
    const { fromInherent, fromAllocated } = averageAccuracyBySource;
    const investable = fromAllocated + accuracyFromEquipment.median;
    const expectedTotalAccuracy = fromInherent + investable * DESIGNED_ACC_INVESTMENT_PERCENTAGE;

    const floorEntries = MapUtils.getOrCreate(
      expectedCharacterAccuracyByRoom,
      floor,
      () => new Map()
    );
    floorEntries.set(room, expectedTotalAccuracy);
  }

  const monsterEvasionByFloor = new Map<FloorNumber, number>();

  for (const [floorNumber, rooms] of expectedCharacterAccuracyByRoom) {
    let floorTotal = 0;
    const floorRoomCount = rooms.size;
    for (const [_roomNumber, roomAccuracy] of rooms) {
      floorTotal += roomAccuracy;
    }
    const floorAverage = floorTotal / floorRoomCount;

    const monsterEvasion = Math.round(
      Math.max(0, floorAverage - DESIGNED_HIT_CHANCE_FOR_AVERAGE_CHARACTER)
    );

    monsterEvasionByFloor.set(floorNumber, monsterEvasion);
  }

  return monsterEvasionByFloor;
}
