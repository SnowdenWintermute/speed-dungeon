import { GameWorldView } from "@/game-world-view";
import { ClientEventHandlers, ClientEventType } from "./client-events";
import { GameStore } from "@/mobx-stores/game";
import { LobbyStore } from "@/mobx-stores/lobby";
import { EventLogGameMessageService } from "../event-log/event-log-service";
import { CharacterAutoFocusManager } from "@/singletons/character-autofocus-manager";
import { ImageManagerRequestType } from "@/game-world-view/image-manager";
import {
  Battle,
  BattleConclusion,
  CleanupMode,
  CombatantId,
  Consumable,
  Equipment,
} from "@speed-dungeon/common";
import { ActionMenuStore } from "@/mobx-stores/action-menu";
import { MenuStateType } from "@/app/game/ActionMenu/menu-state/menu-state-type";
import { ActionMenuStatePool } from "../action-menu/action-menu-state-pool";
import { TargetIndicatorStore } from "@/mobx-stores/target-indicators";
import { ReplayTreeProcessorManager } from "@/replay-tree-manager";

export function createClientEventHandlers(
  replayTreeProcessor: ReplayTreeProcessorManager,
  gameStore: GameStore,
  lobbyStore: LobbyStore,
  actionMenuStore: ActionMenuStore,
  targetIndicatorStore: TargetIndicatorStore,
  eventLogMessageService: EventLogGameMessageService,
  characterAutoFocusManager: CharacterAutoFocusManager,
  actionMenuStatePool: ActionMenuStatePool,
  gameWorldView: GameWorldView | null
): ClientEventHandlers {
  return {
    [ClientEventType.ClearAllModels]: () => {
      return gameWorldView?.modelManager.clearAllModels();
    },
    [ClientEventType.SynchronizeCombatantEquipmentModels]: async (event) => {
      return gameWorldView?.modelManager.synchronizeCombatantEquipmentModels(event.entityId);
    },
    [ClientEventType.SynchronizeCombatantModels]: async (event) => {
      return gameWorldView?.modelManager.synchronizeCombatantModels(gameStore, lobbyStore, event);
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

        const player = gameStore.getExpectedClientPlayer();
        if (player.characterIds.includes(actionUserId as CombatantId)) {
          const inventoryIsOpen = actionMenuStore.stackedMenusIncludeType(
            MenuStateType.InventoryItems
          );
          if (inventoryIsOpen) {
            let currentMenu = actionMenuStore.getCurrentMenu();
            while (
              currentMenu.type !== MenuStateType.InventoryItems &&
              currentMenu.type !== MenuStateType.Base
            ) {
              actionMenuStore.popStack();
              currentMenu = actionMenuStore.getCurrentMenu();
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

        if (actionMenuStore.currentMenuIsType(MenuStateType.Base)) {
          actionMenuStore.pushStack(actionMenuStatePool.get(MenuStateType.ItemsOnGround));
        }
      }

      const { game, party } = gameStore.getFocusedCharacterContext();

      switch (conclusion) {
        case BattleConclusion.Defeat:
          party.timeOfWipe = timestamp;
          eventLogMessageService.postWipeMessage();
          break;
        case BattleConclusion.Victory: {
          characterAutoFocusManager.focusFirstOwnedCharacter();

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

      const gameOption = gameStore.getGameOption();
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
        const hotswapSets = character.combatantProperties.equipment.getHoldableHotswapSlots();
        if (hotswapSets) {
          for (const hotswapSet of hotswapSets)
            itemsToRemoveThumbnails.push(
              ...Object.values(hotswapSet.holdables).map((item) => item.entityProperties.id)
            );
        }

        itemsToRemoveThumbnails.push(
          ...Object.values(character.combatantProperties.equipment.getWearables()).map(
            (item) => item.entityProperties.id
          )
        );
      }

      eventLogMessageService.postUserLeftGame(username);
      characterAutoFocusManager.focusFirstOwnedCharacter();

      await gameWorldView?.modelManager.synchronizeCombatantModels(gameStore, lobbyStore, {
        placeInHomePositions: true,
      });

      gameWorldView?.imageManager.enqueueMessage({
        type: ImageManagerRequestType.ItemDeletion,
        itemIds: itemsToRemoveThumbnails,
      });
    },
  };
}
