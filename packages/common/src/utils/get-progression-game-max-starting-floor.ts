import { EntityId } from "../primatives";

export function getProgressionGameMaxStartingFloor(lowestStartingFloorOptionsBySavedCharacter: {
  [entityId: EntityId]: number;
}) {
  let maxFloor;

  for (const floor of Object.values(lowestStartingFloorOptionsBySavedCharacter)) {
    if (!maxFloor) maxFloor = floor;
    else if (maxFloor > floor) maxFloor = floor;
  }

  return maxFloor || 1;
}
