import {
  Battle,
  BattleConclusion,
  CleanupMode,
  ClientSequentialEventHandlers,
  ClientSequentialEventType,
  CombatantId,
  Consumable,
  Equipment,
} from "@speed-dungeon/common";
import { ActionMenuScreenType } from "../action-menu/screen-types";
import { ImageGenerationRequestType } from "@/game-world-view/images/image-generator-requests";
import { ClientApplication } from "..";

export function createClientSequentialEventHandlers(
  clientApplication: ClientApplication
): ClientSequentialEventHandlers {
  return {
    [ClientSequentialEventType.ClearAllModels]: () => {
      return clientApplication.gameWorldView?.sceneEntityService.clearAll();
    },
    [ClientSequentialEventType.SynchronizeCombatantEquipmentModels]: async (event) => {
      console.log("sync equ models for event:", event);
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
    [ClientSequentialEventType.ProcessBattleResult]: (event) => {
      const { conclusion, timestamp, actionEntitiesRemoved, experiencePointChanges, loot } = event;
      const { gameWorldView, actionMenu, eventLogMessageService, combatantFocus } =
        clientApplication;

      if (loot) {
        loot.equipment = loot.equipment.map((item) => Equipment.fromSerialized(item));
        loot.consumables = loot.consumables.map((item) => Consumable.fromSerialized(item));

        for (const item of loot.equipment) {
          gameWorldView?.imageGenerator.enqueueMessage({
            type: ImageGenerationRequestType.ItemCreation,
            data: { item },
          });
        }

        if (actionMenu.currentMenuIsType(ActionMenuScreenType.Root)) {
          actionMenu.pushFromPool(ActionMenuScreenType.ItemsOnGround);
        }
      }

      const { game, party } = combatantFocus.requireFocusedCharacterContext();

      switch (conclusion) {
        case BattleConclusion.Defeat:
          party.timeOfWipe = timestamp;
          eventLogMessageService.postWipeMessage();
          break;
        case BattleConclusion.Victory: {
          combatantFocus.focusFirstOwnedCharacter();

          party.inputLock.unlockInput();

          const levelups = Battle.handleVictory(game, party, event.experiencePointChanges, loot);

          for (const [characterId, expChange] of Object.entries(experiencePointChanges)) {
            const characterResult = game.getCombatantById(characterId);
            if (characterResult instanceof Error) return console.error(characterResult);
            eventLogMessageService.postExperienceGained(characterResult.getName(), expChange);
          }
          for (const [characterId, levelup] of Object.entries(levelups)) {
            const characterResult = game.getCombatantById(characterId);
            if (characterResult instanceof Error) return console.error(characterResult);
            eventLogMessageService.postLevelup(characterResult.getName(), levelup);
          }
          break;
        }
      }

      const { actionEntityManager } = party;
      for (const entityId of actionEntitiesRemoved) {
        actionEntityManager.unregisterActionEntity(entityId);
        gameWorldView?.sceneEntityService.actionEntityManager.unregister(
          entityId,
          CleanupMode.Soft
        );
      }
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
  };
}
