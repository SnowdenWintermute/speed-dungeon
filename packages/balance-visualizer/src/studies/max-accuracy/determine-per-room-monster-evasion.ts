import { FloorNumber, MapUtils, RoomNumber } from "@speed-dungeon/common";
import { MaxAccuracyTable } from "./table";

const TARGET_HIT_CHANCE_FOR_AVERAGE_CHARACTER = 90;
const TARGET_ACC_INVESTMENT_PERCENTAGE = 1 / 6;

// target investment percentages
// - damage - 3/5
// - acc - 1/6
// - survivability - 2/5
// - mana - 1/5

export function determinePerFloorMonsterEvasion(table: MaxAccuracyTable) {
  const rows = table.selectRows({});
  const monsterEvasionByRoom = new Map<FloorNumber, Map<RoomNumber, number>>();

  for (const row of rows) {
    const { floor, room, totalAccuracy, averageAccuracyBySource } = row;
    const { fromInherent } = averageAccuracyBySource;
    const nonInherentAccuracy = totalAccuracy.median - fromInherent;
    const expectedAccuracyInvestment = nonInherentAccuracy * TARGET_ACC_INVESTMENT_PERCENTAGE;
    const expectedTotalAccuracy = fromInherent + expectedAccuracyInvestment;
    const floorEntries = MapUtils.getOrCreate(monsterEvasionByRoom, floor, () => new Map());
    floorEntries.set(room, expectedTotalAccuracy);
  }

  const monsterEvasionByFloor = new Map<FloorNumber, number>();

  for (const [floorNumber, rooms] of monsterEvasionByRoom) {
    let floorTotal = 0;
    const floorRoomCount = rooms.size;
    for (const [_roomNumber, roomAccuracy] of rooms) {
      floorTotal += roomAccuracy;
    }
    const floorAverage = floorTotal / floorRoomCount;
    monsterEvasionByFloor.set(floorNumber, floorAverage);
  }

  return monsterEvasionByFloor;
}
