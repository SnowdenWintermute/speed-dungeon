import { ClientEventHandlers, ClientEventType } from "./client-events";
import { EventLogGameMessageService } from "../event-log/event-log-service";
import {
  Battle,
  BattleConclusion,
  CleanupMode,
  CombatantId,
  Consumable,
  Equipment,
} from "@speed-dungeon/common";
import { ActionMenu } from "../action-menu";
import { ClientApplicationGameContext } from "../client-application-game-context";
import { CombatantFocus } from "../combatant-focus";
import { ClientApplicationLobbyContext } from "../client-application-lobby-context";
import { TargetIndicatorStore } from "../target-indicator-store";
import { ActionMenuScreenType } from "../action-menu/screen-types";
import { ReplayTreeScheduler } from "../replay-execution/replay-tree-scheduler";
import { GameWorldView } from "@/xxNEW-game-world-view";
import { ImageGenerationRequestType } from "@/xxNEW-game-world-view/images/image-generator-requests";

export function createClientEventHandlers(
  replayScheduler: ReplayTreeScheduler,
  gameWorldView: GameWorldView | null,
  actionMenu: ActionMenu,
  gameContext: ClientApplicationGameContext,
  combatantFocus: CombatantFocus,
  lobbyContext: ClientApplicationLobbyContext,
  targetIndicatorStore: TargetIndicatorStore,
  eventLogMessageService: EventLogGameMessageService
): ClientEventHandlers {
  return {
    [ClientEventType.ClearAllModels]: () => {
      return gameWorldView?.sceneEntityService.clearAll();
    },
    [ClientEventType.SynchronizeCombatantEquipmentModels]: async (event) => {
      return gameWorldView?.sceneEntityService.combatantSceneEntityManager.synchronizeCombatantEquipmentModels(
        event.entityId
      );
    },
    [ClientEventType.SynchronizeCombatantModels]: async (event) => {
      return gameWorldView?.sceneEntityService.combatantSceneEntityManager.synchronizeCombatantModels(
        event
      );
    },
    [ClientEventType.SpawnEnvironmentModel]: (event) => {
      return gameWorldView?.sceneEntityService.environmentEntityManager.spawnEnvironmentEntity(
        event.id,
        event.modelType,
        event.position,
        event.rotationQuat
      );
    },
    [ClientEventType.DespawnEnvironmentModel]: (event) => {
      gameWorldView?.sceneEntityService.environmentEntityManager.unregister(
        event.id,
        CleanupMode.Immediate
      );
    },
    [ClientEventType.ProcessReplayTree]: async (event) => {
      const promise = new Promise((resolve, reject) => {
        const { actionUserId } = event;
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

        replayScheduler.enqueueTree(event.root, !!event.doNotLockInput, () => resolve(true));
      });

      await promise;
    },
    [ClientEventType.ProcessBattleResult]: (event) => {
      const { conclusion, timestamp, actionEntitiesRemoved, experiencePointChanges, loot } = event;

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
    [ClientEventType.PostGameMessages]: (event) => {
      event.messages.forEach((message) => {
        eventLogMessageService.postGameMessage(message);
      });
    },
    [ClientEventType.RemovePlayerFromGame]: async (event) => {
      const itemsToRemoveThumbnails: string[] = [];

      const { gameOption } = gameContext;
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
