import { GameWorldView } from "@/game-world-view";
import { ClientEventHandlers, ClientEventType } from "./client-events";
import { EventLogGameMessageService } from "../event-log/event-log-service";
import { ImageManagerRequestType } from "@/game-world-view/image-manager";
import {
  Battle,
  BattleConclusion,
  CleanupMode,
  CombatantId,
  Consumable,
  Equipment,
} from "@speed-dungeon/common";
import { ActionMenuScreenType } from "@/app/game/ActionMenu/menu-state/menu-state-type";
import { ReplayTreeProcessorManager } from "@/replay-tree-manager";
import { ActionMenu } from "../action-menu";
import { ClientApplicationGameContext } from "../client-application-game-context";
import { CombatantFocus } from "../combatant-focus";
import { ClientApplicationLobbyContext } from "../client-application-lobby-context";
import { TargetIndicatorStore } from "../target-indicator-store";

export function createClientEventHandlers(
  replayTreeProcessor: ReplayTreeProcessorManager,
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
      return gameWorldView?.modelManager.clearAllModels();
    },
    [ClientEventType.SynchronizeCombatantEquipmentModels]: async (event) => {
      return gameWorldView?.modelManager.synchronizeCombatantEquipmentModels(event.entityId);
    },
    [ClientEventType.SynchronizeCombatantModels]: async (event) => {
      return gameWorldView?.modelManager.synchronizeCombatantModels(
        gameContext,
        lobbyContext,
        event
      );
    },
    [ClientEventType.SpawnEnvironmentModel]: (event) => {
      return gameWorldView?.modelManager.spawnEnvironmentModel(
        event.id,
        event.path,
        event.position,
        event.modelType,
        event.rotationQuat
      );
    },
    [ClientEventType.DespawnEnvironmentModel]: (event) => {
      gameWorldView?.modelManager.despawnEnvironmentModel(event.id);
    },
    [ClientEventType.ProcessReplayTree]: async (event) => {
      const promise = new Promise((resolve, reject) => {
        const { actionUserId } = event;
        targetIndicatorStore.clearUserTargets(event.actionUserId);

        const player = gameContext.requireClientPlayer();
        if (player.characterIds.includes(actionUserId as CombatantId)) {
          const inventoryIsOpen = actionMenu.stackedMenusIncludeType(ActionMenuScreenType.InventoryItems);
          if (inventoryIsOpen) {
            let currentMenu = actionMenu.getCurrentMenu();
            while (
              currentMenu.type !== ActionMenuScreenType.InventoryItems &&
              currentMenu.type !== ActionMenuScreenType.Base
            ) {
              actionMenu.popStack();
              currentMenu = actionMenu.getCurrentMenu();
            }
          }
        }

        replayTreeProcessor.enqueueTree(event.root, !!event.doNotLockInput, () => resolve(true));
      });

      await promise;
    },
    [ClientEventType.ProcessBattleResult]: (event) => {
      const { conclusion, timestamp, actionEntitiesRemoved, experiencePointChanges, loot } = event;

      if (loot) {
        loot.equipment = loot.equipment.map((item) => Equipment.fromSerialized(item));
        loot.consumables = loot.consumables.map((item) => Consumable.fromSerialized(item));

        for (const item of loot.equipment) {
          gameWorldView?.imageManager.enqueueMessage({
            type: ImageManagerRequestType.ItemCreation,
            item,
          });
        }

        if (actionMenu.currentMenuIsType(ActionMenuScreenType.Base)) {
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
        gameWorldView?.actionEntityManager.unregister(entityId, CleanupMode.Soft);
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

      await gameWorldView?.modelManager.synchronizeCombatantModels(gameContext, lobbyContext, {
        placeInHomePositions: true,
      });

      gameWorldView?.imageManager.enqueueMessage({
        type: ImageManagerRequestType.ItemDeletion,
        itemIds: itemsToRemoveThumbnails,
      });
    },
  };
}
