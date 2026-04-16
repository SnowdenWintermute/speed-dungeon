import {
  CleanupMode,
  ClientSequentialEventHandlers,
  ClientSequentialEventType,
  CombatantId,
} from "@speed-dungeon/common";
import { ActionMenuScreenType } from "../action-menu/screen-types";
import { ClientApplication } from "..";
import { ImageGenerationRequestType } from "@/game-world-view/images/image-generator-requests";

export function createClientSequentialEventHandlers(
  clientApplication: ClientApplication
): ClientSequentialEventHandlers {
  return {
    [ClientSequentialEventType.ClearAllModels]: () => {
      return clientApplication.gameWorldView?.sceneEntityService.clearAll();
    },
    [ClientSequentialEventType.SynchronizeCombatantEquipmentModels]: async (event) => {
      return clientApplication.gameWorldView?.sceneEntityService.combatantSceneEntityManager.synchronizeCombatantEquipmentModels(
        event.entityId
      );
    },
    [ClientSequentialEventType.SynchronizeCombatantModels]: async (event) => {
      return clientApplication.gameWorldView?.sceneEntityService.combatantSceneEntityManager.synchronizeCombatantModels(
        event
      );
    },
    [ClientSequentialEventType.SpawnEnvironmentModel]: (event) => {
      return clientApplication.gameWorldView?.sceneEntityService.environmentEntityManager.spawnEnvironmentEntity(
        event.id,
        event.modelType,
        event.position,
        event.rotationQuat
      );
    },
    [ClientSequentialEventType.DespawnEnvironmentModel]: (event) => {
      clientApplication.gameWorldView?.sceneEntityService.environmentEntityManager.unregister(
        event.id,
        CleanupMode.Immediate
      );
    },
    [ClientSequentialEventType.ProcessReplayTree]: async (event) => {
      const promise = new Promise((resolve, reject) => {
        const { actionUserId } = event;
        const { targetIndicatorStore, gameContext, actionMenu, replayTreeScheduler } =
          clientApplication;
        targetIndicatorStore.clearUserTargets(event.actionUserId);

        const player = gameContext.requireClientPlayer();
        if (player.characterIds.includes(actionUserId as CombatantId)) {
          const inventoryIsOpen = actionMenu.stackedMenusIncludeType(
            ActionMenuScreenType.InventoryItems
          );
          if (inventoryIsOpen) {
            let currentMenu = actionMenu.getCurrentMenu();
            while (
              currentMenu.type !== ActionMenuScreenType.InventoryItems &&
              currentMenu.type !== ActionMenuScreenType.Root
            ) {
              actionMenu.popStack();
              currentMenu = actionMenu.getCurrentMenu();
            }
          }
        }

        replayTreeScheduler.enqueueTree(event.root, !!event.doNotLockInput, () => resolve(true));
      });

      await promise;
    },
    [ClientSequentialEventType.PostGameMessages]: (event) => {
      event.messages.forEach((message) => {
        clientApplication.eventLogMessageService.postGameMessage(message);
      });
    },
    [ClientSequentialEventType.RemovePlayerFromGame]: async (event) => {
      const itemsToRemoveThumbnails: string[] = [];

      const { gameOption } = clientApplication.gameContext;
      if (gameOption === null) {
        // maybe could happen if ally quits game, then user quits before they receive the message
        console.info("tried to process RemovePlayerFromGame but client has no game");
        return;
      }

      const { username } = event;
      const removedPlayer = gameOption.removePlayer(event.username);

      for (const character of removedPlayer.charactersRemoved) {
        gameOption.lowestStartingFloorOptionsBySavedCharacter.delete(character.entityProperties.id);

        itemsToRemoveThumbnails.push(
          ...character.combatantProperties.inventory.equipment.map(
            (item) => item.entityProperties.id
          )
        );

        itemsToRemoveThumbnails.push(
          ...Object.values(
            character.combatantProperties.equipment.getAllEquippedItems({
              includeUnselectedHotswapSlots: true,
            })
          ).map((item) => item.entityProperties.id)
        );
      }

      const { gameWorldView, eventLogMessageService, combatantFocus } = clientApplication;
      eventLogMessageService.postUserLeftGame(username);
      combatantFocus.focusFirstOwnedCharacter();

      await gameWorldView?.sceneEntityService.combatantSceneEntityManager.synchronizeCombatantModels(
        {
          placeInHomePositions: true,
        }
      );

      gameWorldView?.imageGenerator.enqueueMessage({
        type: ImageGenerationRequestType.ItemDeletion,
        data: { itemIds: itemsToRemoveThumbnails },
      });
    },
    [ClientSequentialEventType.RecordCombatantActionSelected]: async (data) => {
      const { userId, actionExecutionIntent } = data;
      clientApplication.clientLogRecorder.recordCombatantActionSelected(
        userId,
        actionExecutionIntent
      );
    },
    [ClientSequentialEventType.PostReplayTreeCleanup]: async (data) => {
      if (data.removedCombatantIds) {
        for (const id of data.removedCombatantIds) {
          clientApplication.gameContext
            .requireParty()
            .combatantManager.removeCombatant(id, clientApplication.gameContext.requireGame());
        }
      }
    },
  };
}
