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
  CleanupMode,
  Combatant,
  Consumable,
  DungeonRoom,
  DungeonRoomType,
  EntityId,
  ERROR_MESSAGES,
  Inventory,
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
  const itemIdsOnGroundInPreviousRoom: string[] = [];
  const newItemsOnGround: Item[] = [];
  let previousRoomType;

  useGameStore.getState().mutateState((gameState) => {
    const party = getCurrentParty(gameState, gameState.username || "");
    if (party === undefined) return setAlert(new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY));

    const { actionEntityManager } = party;
    for (const actionEntityId of actionEntitiesToRemove) {
      actionEntityManager.unregisterActionEntity(actionEntityId);
      getGameWorld().actionEntityManager.unregister(actionEntityId, CleanupMode.Soft);
    }

    itemIdsOnGroundInPreviousRoom.push(
      ...Inventory.getItems(party.currentRoom.inventory).map((item) => item.entityProperties.id)
    );

    const { dungeonExplorationManager } = party;

    dungeonExplorationManager.clearPlayerExplorationActionChoices();

    previousRoomType = party.currentRoom.roomType;
    party.currentRoom = room;

    Inventory.instantiateItemClasses(party.currentRoom.inventory);
    for (const item of Inventory.getItems(party.currentRoom.inventory)) {
      newItemsOnGround.push(item);
    }

    const { focusStore } = AppStore.get();
    focusStore.detailable.clearHovered();

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
