import { AppStore } from "@/mobx-stores/app-store";
import { DungeonRoomType } from "@speed-dungeon/common";

export function newDungeonRoomTypesOnCurrentFloorHandler(newRoomTypes: (DungeonRoomType | null)[]) {
  const party = AppStore.get().gameStore.getExpectedParty();

  const { dungeonExplorationManager } = party;

  dungeonExplorationManager.setClientVisibleRoomExplorationList(newRoomTypes);
  dungeonExplorationManager.clearRoomsExploredOnCurrentFloorCount();
}
