import { gameWorld } from "@/app/3d-world/SceneManager";
import { ImageManagerRequestType } from "@/app/3d-world/game-world/image-manager";
import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";
import { setAlert } from "@/app/components/alerts";
import { useGameStore } from "@/stores/game-store";
import getCurrentParty from "@/utils/getCurrentParty";
import {
  DungeonRoom,
  ERROR_MESSAGES,
  Inventory,
  updateCombatantHomePosition,
} from "@speed-dungeon/common";

export default function newDungeonRoomHandler(room: DungeonRoom) {
  const itemIdsOnGround: string[] = [];

  useGameStore.getState().mutateState((gameState) => {
    const party = getCurrentParty(gameState, gameState.username || "");
    if (party === undefined) return setAlert(new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY));

    itemIdsOnGround.push(
      ...Inventory.getItems(party.currentRoom.inventory).map((item) => item.entityProperties.id)
    );

    party.playersReadyToDescend = [];
    party.playersReadyToExplore = [];
    party.currentRoom = room;

    gameState.hoveredEntity = null;

    for (const monster of Object.values(party.currentRoom.monsters))
      updateCombatantHomePosition(monster.entityProperties.id, monster.combatantProperties, party);
    party.roomsExplored.onCurrentFloor += 1;
    party.roomsExplored.total += 1;
    const indexOfRoomTypeToReveal = party.roomsExplored.onCurrentFloor - 1;
    party.clientCurrentFloorRoomsList[indexOfRoomTypeToReveal] = room.roomType;

    if (room.monsterPositions.length) gameState.baseMenuState.inCombat = true;
  });

  gameWorld.current?.modelManager.modelActionQueue.enqueueMessage({
    type: ModelActionType.SynchronizeCombatantModels,
  });

  // clean up unused screenshots for items left behind
  gameWorld.current?.imageManager.enqueueMessage({
    type: ImageManagerRequestType.ItemDeletion,
    itemIds: itemIdsOnGround,
  });
}
