import { gameWorld, getGameWorld } from "@/app/3d-world/SceneManager";
import {
  ENVIRONMENT_MODELS_FOLDER,
  ENVIRONMENT_MODEL_PATHS,
  EnvironmentModelTypes,
} from "@/app/3d-world/scene-entities/environment-models/environment-model-paths";
import { ImageManagerRequestType } from "@/app/3d-world/game-world/image-manager";
import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";
import { Vector3 } from "@babylonjs/core";
import {
  CleanupMode,
  Combatant,
  Consumable,
  DungeonRoom,
  DungeonRoomType,
  EntityId,
  Item,
} from "@speed-dungeon/common";
import { AppStore } from "@/mobx-stores/app-store";

export function newDungeonRoomHandler({
  dungeonRoom: room,
  monsters: newCombatants,
  actionEntitiesToRemove,
}: {
  dungeonRoom: DungeonRoom;
  monsters: Combatant[];
  actionEntitiesToRemove: EntityId[];
}) {
  const deserializedRoom = DungeonRoom.getDeserialized(room);
  const itemIdsOnGroundInPreviousRoom: string[] = [];
  const newItemsOnGround: Item[] = [];
  let previousRoomType;

  const party = AppStore.get().gameStore.getExpectedParty();

  const { actionEntityManager } = party;
  for (const actionEntityId of actionEntitiesToRemove) {
    actionEntityManager.unregisterActionEntity(actionEntityId);
    getGameWorld().actionEntityManager.unregister(actionEntityId, CleanupMode.Soft);
  }

  itemIdsOnGroundInPreviousRoom.push(
    ...party.currentRoom.inventory.getItems().map((item) => item.entityProperties.id)
  );

  const { dungeonExplorationManager } = party;

  dungeonExplorationManager.clearPlayerExplorationActionChoices();

  previousRoomType = party.currentRoom.roomType;
  party.setCurrentRoom(deserializedRoom);

  for (const item of party.currentRoom.inventory.getItems()) {
    newItemsOnGround.push(item);
  }

  const { focusStore } = AppStore.get();
  focusStore.detailables.clearHovered();

  const { combatantManager } = party;

  for (const combatant of newCombatants) {
    const deserialized = Combatant.getDeserialized(combatant);
    combatantManager.addCombatant(deserialized);
  }

  combatantManager.updateHomePositions();

  dungeonExplorationManager.incrementExploredRoomsTrackers();

  const indexOfRoomTypeToReveal = dungeonExplorationManager.getCurrentRoomNumber() - 1;
  dungeonExplorationManager.getClientVisibleRoomExplorationList()[indexOfRoomTypeToReveal] =
    room.roomType;

  const noPreviouslySpawnedVendingMachine = !(previousRoomType === DungeonRoomType.VendingMachine);
  const roomHasVendingMachine = room.roomType === DungeonRoomType.VendingMachine;

  if (roomHasVendingMachine && noPreviouslySpawnedVendingMachine) {
    gameWorld.current?.modelManager.modelActionQueue.enqueueMessage({
      type: ModelActionType.SpawnEnvironmentModel,
      modelType: EnvironmentModelTypes.VendingMachine,
      path:
        ENVIRONMENT_MODELS_FOLDER + ENVIRONMENT_MODEL_PATHS[EnvironmentModelTypes.VendingMachine],
      id: "vending-machine",
      position: Vector3.Forward(),
    });
  } else if (!roomHasVendingMachine) {
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

  for (const item of newItemsOnGround) {
    if (item instanceof Consumable) continue;

    gameWorld.current?.imageManager.enqueueMessage({
      type: ImageManagerRequestType.ItemCreation,
      item,
    });
  }
}
