import { gameWorld, getGameWorld } from "@/app/3d-world/SceneManager";
import {
  ENVIRONMENT_MODELS_FOLDER,
  ENVIRONMENT_MODEL_PATHS,
  EnvironmentModelTypes,
} from "@/app/3d-world/scene-entities/environment-models/environment-model-paths";
import { ImageManagerRequestType } from "@/app/3d-world/game-world/image-manager";
import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";
import { setAlert } from "@/app/components/alerts";
import { useGameStore } from "@/stores/game-store";
import getCurrentParty from "@/utils/getCurrentParty";
import { Vector3 } from "@babylonjs/core";
import {
  AdventuringParty,
  Combatant,
  CombatantProperties,
  Consumable,
  DungeonRoom,
  DungeonRoomType,
  EntityId,
  ERROR_MESSAGES,
  Inventory,
  Item,
  updateCombatantHomePosition,
} from "@speed-dungeon/common";

export default function newDungeonRoomHandler({
  dungeonRoom: room,
  actionEntitiesToRemove,
}: {
  dungeonRoom: DungeonRoom;
  actionEntitiesToRemove: EntityId[];
}) {
  const itemIdsOnGroundInPreviousRoom: string[] = [];
  const newItemsOnGround: Item[] = [];
  let previousRoomType;

  useGameStore.getState().mutateState((gameState) => {
    const party = getCurrentParty(gameState, gameState.username || "");
    if (party === undefined) return setAlert(new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY));

    for (const actionEntityId of actionEntitiesToRemove) {
      AdventuringParty.unregisterActionEntity(party, actionEntityId, null);
      getGameWorld().actionEntityManager.unregister(actionEntityId);
    }

    itemIdsOnGroundInPreviousRoom.push(
      ...Inventory.getItems(party.currentRoom.inventory).map((item) => item.entityProperties.id)
    );

    party.playersReadyToDescend = [];
    party.playersReadyToExplore = [];
    previousRoomType = party.currentRoom.roomType;
    party.currentRoom = room;

    Inventory.instantiateItemClasses(party.currentRoom.inventory);
    for (const item of Inventory.getItems(party.currentRoom.inventory)) {
      newItemsOnGround.push(item);
    }

    gameState.hoveredEntity = null;

    for (const monster of Object.values(party.currentRoom.monsters)) {
      updateCombatantHomePosition(monster.entityProperties.id, monster.combatantProperties, party);
      Combatant.rehydrate(monster);
    }

    party.roomsExplored.onCurrentFloor += 1;
    party.roomsExplored.total += 1;
    const indexOfRoomTypeToReveal = party.roomsExplored.onCurrentFloor - 1;
    party.clientCurrentFloorRoomsList[indexOfRoomTypeToReveal] = room.roomType;

    if (room.monsterPositions.length) gameState.baseMenuState.inCombat = true;
  });

  if (
    room.roomType === DungeonRoomType.VendingMachine &&
    !(previousRoomType === DungeonRoomType.VendingMachine)
  )
    gameWorld.current?.modelManager.modelActionQueue.enqueueMessage({
      type: ModelActionType.SpawnEnvironmentModel,
      modelType: EnvironmentModelTypes.VendingMachine,
      path:
        ENVIRONMENT_MODELS_FOLDER + ENVIRONMENT_MODEL_PATHS[EnvironmentModelTypes.VendingMachine],
      id: "vending-machine",
      position: Vector3.Forward(),
    });
  else if (room.roomType !== DungeonRoomType.VendingMachine) {
    gameWorld.current?.modelManager.modelActionQueue.enqueueMessage({
      type: ModelActionType.DespawnEnvironmentModel,
      id: "vending-machine",
    });
  }

  gameWorld.current?.modelManager.modelActionQueue.enqueueMessage({
    type: ModelActionType.SynchronizeCombatantModels,
  });

  // clean up unused screenshots for items left behind
  gameWorld.current?.imageManager.enqueueMessage({
    type: ImageManagerRequestType.ItemDeletion,
    itemIds: itemIdsOnGroundInPreviousRoom,
  });
  for (const item of newItemsOnGround)
    if (!(item instanceof Consumable))
      gameWorld.current?.imageManager.enqueueMessage({
        type: ImageManagerRequestType.ItemCreation,
        item,
      });
}
