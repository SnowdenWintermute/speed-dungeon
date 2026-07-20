import { Vector3 } from "@babylonjs/core";
import {
  ActionAndRank,
  ActionUserContext,
  CleanupMode,
  CLIENT_APP_MESSAGES,
  ClientAppMessageType,
  ClientSequentialEventType,
  COMBAT_ACTIONS,
  CombatActionTarget,
  Combatant,
  Consumable,
  DungeonRoom,
  DungeonRoomType,
  EntityId,
  EnvironmentEntityName,
  Equipment,
  EquipmentType,
  ERROR_MESSAGES,
  GAME_CLOSED_REASON_STRINGS,
  GameStateUpdateMap,
  GameStateUpdateType,
  PlayerShardPool,
  getSkillBookName,
  Item,
  iterateNumericEnumKeyedRecord,
  OneHandedMeleeWeapon,
  TaggedEquipmentSlot,
  TargetingCalculator,
  TwoHandedMeleeWeapon,
} from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";
import { gameFullUpdateHandler } from "../common/game-full-update-handler";
import { ClientApplication } from "@/client-application";
import { ConsideringItemActionMenuScreen } from "@/client-application/action-menu/screens/considering-item";
import { ConsideringCombatActionMenuScreen } from "@/client-application/action-menu/screens/considering-combat-action";
import { toJS } from "mobx";
import { ImageGenerationRequestType } from "@/game-world-view/images/image-generator-requests";
import {
  GameLogMessage,
  GameLogMessageStyle,
} from "@/client-application/event-log/game-log-messages";

export type GameUpdateHandler<K extends keyof GameStateUpdateMap> = (
  data: GameStateUpdateMap[K]
) => void;

export type GameUpdateHandlers = {
  [K in keyof GameStateUpdateMap]: GameUpdateHandler<K>;
};

export function createGameUpdateHandlers(
  clientApplication: ClientApplication
): Partial<GameUpdateHandlers> {
  const {
    targetIndicatorStore,
    gameContext,
    combatantFocus,
    actionMenu,
    eventLogStore,
    eventLogMessageService,
    sequentialEventProcessor,
    alertsService,
    detailableEntityFocus,
    gameClientRef,
  } = clientApplication;

  return {
    [GameStateUpdateType.ErrorMessage]: () => {
      /* handled in BaseClient */
    },
    [GameStateUpdateType.PlayerLeftGame]: (data) => {
      sequentialEventProcessor.scheduleEvent({
        type: ClientSequentialEventType.RemovePlayerFromGame,
        data: { username: data.username },
      });

      const { gameOption } = gameContext;
      if (!gameOption) {
        return;
      }

      const { maxStartingFloor } = gameOption;

      if (gameOption.selectedStartingFloor > maxStartingFloor) {
        gameOption.selectedStartingFloor = maxStartingFloor;
      }
    },
    [GameStateUpdateType.OnConnection]: async (data) => {
      clientApplication.session.setUsername(data.username);

      if (clientApplication.lobbyClientRef.isInitialized) {
        await clientApplication.lobbyClientRef.get().close();
      }
    },
    [GameStateUpdateType.CacheGuestSessionReconnectionToken]: (data) => {
      clientApplication.reconnectionTokenStore.guestGameReconnectionToken = data.token;
    },
    [GameStateUpdateType.GameFullUpdate]: (data) => {
      gameFullUpdateHandler(clientApplication, data.game);

      if (data.game?.clock?.anchor != null) {
        clientApplication.handleGameStartedOrFullUpdateReceived();
      }

      clientApplication.combatantFocus.focusFirstOwnedCharacter();

      if (data.battle) {
        clientApplication.handleBattleFullUpdate(data.battle);
      }

      clientApplication.topologyManager.transitionToGameServer.fire();

      const { partyOption } = clientApplication.gameContext;

      if (!partyOption) {
        return;
      }

      clientApplication.combatantClickHandler.synchronizeReticleClickability();

      if (data.awaitingUnresolvedReplayResolutionDuration) {
        partyOption.inputLock.lockInput();
        clientApplication.uiStore.replayResolutionTimeoutDuration =
          data.awaitingUnresolvedReplayResolutionDuration;
        setTimeout(() => {
          partyOption.inputLock.unlockInput();
          clientApplication.uiStore.replayResolutionTimeoutDuration = 0;
        }, data.awaitingUnresolvedReplayResolutionDuration);
      }

      // if the world view doesn't exist yet, GameWorldView.initialize() enqueues these instead
      clientApplication.gameWorldView?.imageGenerator.enqueueThumbnailsForParty(partyOption);
    },
    [GameStateUpdateType.GameClosed]: (data) => {
      const { reason } = data;
      clientApplication.gameWorldView?.sceneEntityService.clearAll();
      clientApplication.gameContext.clearGame();
      clientApplication.alertsService.setAlert(
        `Game closed: ${GAME_CLOSED_REASON_STRINGS[reason]}`
      );
      clientApplication.gameClientRef.get().close();
      clientApplication.gameClientRef.clearClient();
      clientApplication.topologyManager.connectWithPrefferedMode();
    },
    [GameStateUpdateType.PlayerJoinedGame]: (data) => {
      const party = clientApplication.gameContext.requireParty();
      party.playerUsernamesAwaitingReconnection.delete(data.username);
    },
    [GameStateUpdateType.PlayerDisconnectedWithReconnectionOpportunity]: (data) => {
      const party = clientApplication.gameContext.requireParty();
      party.playerUsernamesAwaitingReconnection.add(data.username);
    },
    [GameStateUpdateType.PlayerReconnectionTimedOut]: (data) => {
      clientApplication.alertsService.setAlert(
        `Reconnection opportunity for player [${data.username}] timed out`
      );
      const party = clientApplication.gameContext.requireParty();
      party.playerUsernamesAwaitingReconnection.delete(data.username);
    },
    [GameStateUpdateType.GameStarted]: (_) => {
      eventLogStore.clear();
      eventLogMessageService.postGameStarted();
      clientApplication.handleGameStartedOrFullUpdateReceived();
    },
    [GameStateUpdateType.PlayerToggledReadyToDescendOrExplore]: (data) => {
      const { username, explorationAction } = data;
      const party = gameContext.requireParty();
      const { dungeonExplorationManager } = party;
      dungeonExplorationManager.updatePlayerExplorationActionChoice(username, explorationAction);
    },
    [GameStateUpdateType.DungeonRoomTypesOnCurrentFloor]: (data) => {
      const party = gameContext.requireParty();
      const { dungeonExplorationManager } = party;
      dungeonExplorationManager.setClientVisibleRoomExplorationList(data.roomTypes);
      dungeonExplorationManager.clearRoomsExploredOnCurrentFloorCount();
    },
    [GameStateUpdateType.DungeonRoomUpdate]: (data) => {
      const { dungeonRoom, actionEntitiesToRemove, monsters } = data;
      const deserializedRoom = DungeonRoom.fromSerialized(dungeonRoom);
      deserializedRoom.makeObservable();
      const itemIdsOnGroundInPreviousRoom: string[] = [];
      const newItemsOnGround: Item[] = [];

      const party = gameContext.requireParty();

      const { actionEntityManager } = party;
      for (const actionEntityId of actionEntitiesToRemove) {
        actionEntityManager.unregisterActionEntity(actionEntityId);
        clientApplication.gameWorldView?.sceneEntityService.actionEntityManager.unregister(
          actionEntityId,
          CleanupMode.Soft
        );
      }

      itemIdsOnGroundInPreviousRoom.push(
        ...party.currentRoom.inventory.getItems().map((item) => item.entityProperties.id)
      );

      const { dungeonExplorationManager } = party;

      dungeonExplorationManager.clearPlayerExplorationActionChoices();

      const previousRoomType = party.currentRoom.roomType;
      party.setCurrentRoom(deserializedRoom);

      for (const item of party.currentRoom.inventory.getItems()) {
        newItemsOnGround.push(item);
      }

      detailableEntityFocus.detailables.clearHovered();

      const { combatantManager } = party;

      const game = gameContext.requireGame();
      for (const combatant of monsters) {
        const deserialized = Combatant.fromSerialized(combatant);
        deserialized.makeObservable();
        combatantManager.addCombatant(deserialized, game);
      }

      combatantManager.updateHomePositions();
      combatantManager.setAllCombatantsToHomePositions();

      clientApplication.combatantClickHandler.synchronizeReticleClickability();

      dungeonExplorationManager.incrementExploredRoomsTrackers();

      const indexOfRoomTypeToReveal = dungeonExplorationManager.getCurrentRoomNumber() - 1;
      dungeonExplorationManager.revealRoom(indexOfRoomTypeToReveal, dungeonRoom.roomType);

      const noPreviouslySpawnedVendingMachine = !(
        previousRoomType === DungeonRoomType.VendingMachine
      );
      const roomHasVendingMachine = dungeonRoom.roomType === DungeonRoomType.VendingMachine;

      if (roomHasVendingMachine && noPreviouslySpawnedVendingMachine) {
        sequentialEventProcessor.scheduleEvent({
          type: ClientSequentialEventType.SpawnEnvironmentModel,
          data: {
            id: "vending-machine",
            modelType: EnvironmentEntityName.VendingMachine,
            position: Vector3.Forward(),
          },
        });
      } else if (!roomHasVendingMachine) {
        sequentialEventProcessor.scheduleEvent({
          type: ClientSequentialEventType.DespawnEnvironmentModel,
          data: { id: "vending-machine" },
        });
      }

      sequentialEventProcessor.scheduleEvent({
        type: ClientSequentialEventType.SynchronizeCombatantModels,
        data: { softCleanup: true, placeInHomePositions: true },
      });

      // clean up unused screenshots for items left behind
      clientApplication.gameWorldView?.imageGenerator.enqueueMessage({
        type: ImageGenerationRequestType.ItemDeletion,
        data: { itemIds: itemIdsOnGroundInPreviousRoom },
      });

      for (const item of newItemsOnGround) {
        if (item instanceof Consumable) continue;

        clientApplication.gameWorldView?.imageGenerator.enqueueMessage({
          type: ImageGenerationRequestType.ItemCreation,
          data: { item },
        });
      }
    },
    [GameStateUpdateType.BattleFullUpdate]: (serializedBattleOption) => {
      clientApplication.handleBattleFullUpdate(serializedBattleOption);
    },
    [GameStateUpdateType.CharacterDroppedItem]: (data) => {
      const { characterId, itemId } = data;

      const { party, combatant } = gameContext.requireCombatantContext(characterId);

      combatant.combatantProperties.inventory.dropItem(party, itemId);
    },
    [GameStateUpdateType.CharacterDroppedEquippedItem]: (data) => {
      const { characterId, slot } = data;
      const { party, combatant } = gameContext.requireCombatantContext(characterId);
      const itemDroppedIdResult = combatant.combatantProperties.inventory.dropEquippedItem(
        party,
        slot
      );
      if (itemDroppedIdResult instanceof Error) {
        throw itemDroppedIdResult;
      }

      sequentialEventProcessor.scheduleEvent({
        type: ClientSequentialEventType.SynchronizeCombatantEquipmentModels,
        data: { entityId: characterId },
      });
    },
    [GameStateUpdateType.CharacterUnequippedItem]: (data) => {
      const { characterId, slot } = data;
      const { combatant } = gameContext.requireCombatantContext(characterId);
      combatant.combatantProperties.equipment.unequipSlots([slot]);

      sequentialEventProcessor.scheduleEvent({
        type: ClientSequentialEventType.SynchronizeCombatantEquipmentModels,
        data: { entityId: characterId },
      });
    },
    [GameStateUpdateType.CharacterEquippedItem]: (data) => {
      const { itemId, equipToAlternateSlot, characterId } = data;
      const { combatant, party } = gameContext.requireCombatantContext(characterId);
      const { equipment } = combatant.combatantProperties;

      const unequippedResult = equipment.equipItem(itemId, equipToAlternateSlot);
      if (unequippedResult instanceof Error) {
        throw unequippedResult;
      }

      const slot = equipment.getSlotItemIsEquippedTo(itemId);
      if (slot !== null) {
        const item = equipment.getEquipmentInSlot(slot);
        if (item !== undefined) {
          sequentialEventProcessor.scheduleEvent({
            type: ClientSequentialEventType.SynchronizeCombatantEquipmentModels,
            data: { entityId: characterId },
          });
        }
      }

      const { idsOfUnequippedItems } = unequippedResult;
      if (idsOfUnequippedItems[0] === undefined) {
        return;
      }

      const playerOwnsCharacter = party.combatantManager.playerOwnsCharacter(
        clientApplication.session.requireUsername(),
        characterId
      );

      if (!playerOwnsCharacter) {
        return;
      }

      detailableEntityFocus.detailables.clearHovered();

      // we want the user to be now selecting the item they just unequipped
      const equipmentInInventory = combatant.combatantProperties.inventory.equipment;
      const itemToSelectOption = equipmentInInventory.find(
        (equipment) => equipment.entityProperties.id === idsOfUnequippedItems[0]
      );
      if (itemToSelectOption === undefined) {
        return;
      }

      const currentMenu = actionMenu.getCurrentMenu();
      if (currentMenu instanceof ConsideringItemActionMenuScreen) {
        currentMenu.setItem(itemToSelectOption);
        detailableEntityFocus.detailables.setDetailed(itemToSelectOption);
      }
    },
    [GameStateUpdateType.CharacterEquippedItemFromGround]: (data) => {
      const { itemId, equipToAlternateSlot, characterId } = data;
      const { combatant, party } = gameContext.requireCombatantContext(characterId);
      const { equipment } = combatant.combatantProperties;

      const equipResult = equipment.equipItemFromGround(
        itemId,
        party.currentRoom.inventory,
        equipToAlternateSlot
      );
      if (equipResult instanceof Error) {
        throw equipResult;
      }

      // the item just vanished from under the pointer, so a mouseleave will never arrive to unhover it
      if (detailableEntityFocus.entityIsHovered(itemId)) {
        detailableEntityFocus.detailables.clearHovered();
      }

      sequentialEventProcessor.scheduleEvent({
        type: ClientSequentialEventType.SynchronizeCombatantEquipmentModels,
        data: { entityId: characterId },
      });
    },
    [GameStateUpdateType.CharacterMovedEquippedItemToSlot]: (data) => {
      const { characterId, sourceSlot, destinationSlot } = data;
      const { combatant } = gameContext.requireCombatantContext(characterId);

      const moveResult = combatant.combatantProperties.equipment.moveEquippedItemToSlot(
        sourceSlot,
        destinationSlot
      );
      if (moveResult instanceof Error) {
        throw moveResult;
      }

      sequentialEventProcessor.scheduleEvent({
        type: ClientSequentialEventType.SynchronizeCombatantEquipmentModels,
        data: { entityId: characterId },
      });
    },
    [GameStateUpdateType.CharacterPickedUpItems]: (data) => {
      const { combatant, party } = gameContext.requireCombatantContext(data.characterId);
      for (const itemId of data.itemIds) {
        const itemResult = party.currentRoom.inventory.removeItem(itemId);
        if (itemResult instanceof Error) {
          throw itemResult;
        }

        // handle shard stacks uniquely
        if (itemResult.isShardStack()) {
          combatant.combatantProperties.inventory.changeShards(itemResult.usesRemaining);
          continue;
        }

        combatant.combatantProperties.inventory.insertItem(itemResult);

        // otherwise it is possible that one player is hovering this item, then it "disappears"
        // from under their mouse cursor and they can never trigger a mouseleave event to unhover it
        if (detailableEntityFocus.entityIsHovered(itemResult.entityProperties.id)) {
          detailableEntityFocus.detailables.clearHovered();
        }
      }
    },
    [GameStateUpdateType.CharacterSelectedCombatAction]: (data) => {
      const { game, party, combatant } = gameContext.requireCombatantContext(data.characterId);
      const targetingProperties = combatant.getTargetingProperties();
      const { itemIdOption, actionAndRankOption, characterId } = data;

      targetingProperties.setSelectedActionWasAutoSelected(data.autoSelected ?? false);
      const deserializedActionAndRankOption = actionAndRankOption
        ? ActionAndRank.fromSerialized(actionAndRankOption)
        : null;
      targetingProperties.setSelectedActionAndRank(deserializedActionAndRankOption);

      const itemId = itemIdOption === undefined ? null : itemIdOption;
      targetingProperties.setSelectedItemId(itemId);

      const combatActionOption =
        deserializedActionAndRankOption !== null
          ? COMBAT_ACTIONS[deserializedActionAndRankOption.actionName]
          : null;

      const playerOption = game.getExpectedPlayer(
        combatant.combatantProperties.controlledBy.controllerPlayerName
      );

      const targetingCalculator = new TargetingCalculator(
        new ActionUserContext(game, party, combatant),
        playerOption
      );

      let selectedTarget: CombatActionTarget | null;
      if (data.targetingSelectionOption !== undefined && deserializedActionAndRankOption !== null) {
        targetingProperties.setSelectedTargetingScheme(
          data.targetingSelectionOption.targetingScheme
        );
        targetingProperties.setSelectedTarget(data.targetingSelectionOption.target);
        selectedTarget = data.targetingSelectionOption.target;
      } else {
        const newTargetsResult =
          targetingProperties.assignInitialTargetsForSelectedAction(targetingCalculator);
        if (newTargetsResult instanceof Error) {
          throw newTargetsResult;
        }
        selectedTarget = newTargetsResult;
      }

      let targetIds: null | EntityId[] = null;
      if (combatActionOption !== null && selectedTarget) {
        const targetIdsResult = targetingCalculator.getCombatActionTargetIds(
          combatActionOption,
          selectedTarget
        );
        if (targetIdsResult instanceof Error) {
          throw targetIdsResult;
        }
        targetIds = targetIdsResult;
      }

      const actionName =
        actionAndRankOption?.actionName === undefined ? null : actionAndRankOption.actionName;

      targetIndicatorStore.synchronize(actionName, combatant.getEntityId(), targetIds || []);

      clientApplication.combatantClickHandler.synchronizeReticleClickability();

      const playerOwnsCharacter = party.combatantManager.playerOwnsCharacter(
        clientApplication.session.requireUsername(),
        characterId
      );

      if (!playerOwnsCharacter || actionName === null) {
        return;
      }

      actionMenu.replaceStack([new ConsideringCombatActionMenuScreen(clientApplication, actionName)]);
    },
    [GameStateUpdateType.GameMessage]: (data) => {
      const { message } = data;
      if (message.showAfterSequentialQueueResolution) {
        sequentialEventProcessor.scheduleEvent({
          type: ClientSequentialEventType.PostGameMessages,
          data: { messages: [message] },
        });
      } else {
        eventLogMessageService.postGameMessage(message);
      }
    },
    [GameStateUpdateType.ClientAppMessage]: (messageType) => {
      const messageText = CLIENT_APP_MESSAGES[messageType];
      clientApplication.alertsService.setAlert(messageText);
      if (messageType === ClientAppMessageType.DisconnectedByPreemption) {
        clientApplication.eventLogStore.postMessage(
          new GameLogMessage(messageText, GameLogMessageStyle.PartyWipe)
        );
        clientApplication.topologyManager.enterOffline();
      } else {
        clientApplication.eventLogStore.postMessage(
          new GameLogMessage(messageText, GameLogMessageStyle.Healing)
        );
      }
    },
    [GameStateUpdateType.CharacterSelectedHoldableHotswapSlot]: (data) => {
      const { characterId, slotIndex } = data;
      const { combatant } = gameContext.requireCombatantContext(characterId);
      const { equipment } = combatant.combatantProperties;

      if (slotIndex >= equipment.getHoldableHotswapSlots().length) {
        throw new Error(ERROR_MESSAGES.EQUIPMENT.SELECTED_SLOT_OUT_OF_BOUNDS);
      }

      const slotSwitchingAwayFrom = equipment.getActiveHoldableSlot();
      if (!slotSwitchingAwayFrom) {
        throw new Error(ERROR_MESSAGES.EQUIPMENT.SELECTED_SLOT_OUT_OF_BOUNDS);
      }

      // if hovering equipped item we don't want to show the previously held item anymore since it is no longer
      // under the cursor, instead mark it such that we want to now hover the new item, if any exists
      let previouslyHoveredSlotTypeOption = null;
      for (const [slotType, equipment] of iterateNumericEnumKeyedRecord(
        slotSwitchingAwayFrom.holdables
      )) {
        if (detailableEntityFocus.entityIsHovered(equipment.entityProperties.id))
          previouslyHoveredSlotTypeOption = slotType;
      }

      combatant.combatantProperties.equipment.changeSelectedHotswapSlot(slotIndex);

      if (previouslyHoveredSlotTypeOption !== null) {
        detailableEntityFocus.detailables.clearHovered();
        const newlyEquippedSlotOption = equipment.getActiveHoldableSlot();
        if (newlyEquippedSlotOption) {
          for (const [slotType, holdable] of iterateNumericEnumKeyedRecord(
            newlyEquippedSlotOption.holdables
          )) {
            if (slotType === previouslyHoveredSlotTypeOption)
              detailableEntityFocus.detailables.setHovered(holdable);
          }
        }
      }

      sequentialEventProcessor.scheduleEvent({
        type: ClientSequentialEventType.SynchronizeCombatantEquipmentModels,
        data: { entityId: characterId },
      });
    },
    [GameStateUpdateType.CharacterConvertedItemsToShards]: (data) => {
      const slotsUnequipped: TaggedEquipmentSlot[] = [];
      const { characterId, itemIds } = data;
      const { combatant } = gameContext.requireCombatantContext(characterId);

      const { combatantProperties } = combatant;
      // unequip it if is equipped
      const equippedItems = combatantProperties.equipment.getAllEquippedItems({
        includeUnselectedHotswapSlots: true,
      });

      for (const item of equippedItems) {
        if (itemIds.includes(item.entityProperties.id)) {
          const slot = combatantProperties.equipment.getSlotItemIsEquippedTo(
            item.entityProperties.id
          );
          if (slot !== null) {
            combatantProperties.equipment.unequipSlots([slot]);
            slotsUnequipped.push(slot);
          }
        }
      }

      combatant.convertOwnedItemsToShards(itemIds);

      sequentialEventProcessor.scheduleEvent({
        type: ClientSequentialEventType.SynchronizeCombatantEquipmentModels,
        data: { entityId: characterId },
      });
    },
    [GameStateUpdateType.CharacterDroppedShards]: (data) => {
      const { characterId, shardStack } = data;
      const asClassInstance = Consumable.fromSerialized(shardStack);
      asClassInstance.makeObservable();
      const { party, combatant } = gameContext.requireCombatantContext(characterId);
      combatant.combatantProperties.inventory.changeShards(asClassInstance.usesRemaining * -1);
      party.currentRoom.inventory.insertItem(asClassInstance);
    },
    [GameStateUpdateType.CharacterPurchasedItem]: (data) => {
      const { item, characterId, payments } = data;
      const { party, combatant } = gameContext.requireCombatantContext(characterId);
      const asClassInstance = Consumable.fromSerialized(item);
      asClassInstance.makeObservable();
      PlayerShardPool.applyPayments(party, payments);
      combatant.combatantProperties.inventory.insertItem(asClassInstance);
      alertsService.setAlert(`Purchased ${item.entityProperties.name}`, true);
    },
    [GameStateUpdateType.CharacterPerformedCraftingAction]: (data) => {
      const { characterId, item, craftingAction, payments } = data;
      const { party, combatant } = gameContext.requireCombatantContext(characterId);

      // used to show loading state so players don't get confused when
      // their craft action produces exact same item as already was
      actionMenu.setCharacterCompletedCrafting(combatant.getEntityId());

      const { combatantProperties } = combatant;

      const itemResult = combatantProperties.inventory.getStoredOrEquipped(
        item.entityProperties.id
      );

      if (itemResult instanceof Error) {
        throw itemResult;
      }

      const isEquipment = itemResult instanceof Equipment;
      if (!isEquipment) {
        alertsService.setAlert("Server sent crafting results of a consumable?");
        return;
      }

      const itemBeforeModification = cloneDeep(toJS(itemResult));
      // distinguish between the crafted and pre-crafted item. used for selecting the item links in the
      // combat log
      if (itemBeforeModification.craftingIteration !== undefined) {
        itemBeforeModification.craftingIteration += 1;
      } else {
        itemBeforeModification.craftingIteration = 0;
      }

      const asInstance = Equipment.fromSerialized(item);

      const wasBrokenBefore = itemResult.isBroken();

      combatantProperties.resources.maintainResourcePercentagesAfterEffect(() => {
        itemResult.copyFrom(asInstance);
      });

      const wasRepaired = wasBrokenBefore && !itemResult.isBroken();
      const slotEquippedToOption = combatantProperties.equipment.getSlotItemIsEquippedTo(
        itemResult.entityProperties.id
      );
      const isEquipped = slotEquippedToOption !== null;

      if (isEquipped && wasRepaired) {
        sequentialEventProcessor.scheduleEvent({
          type: ClientSequentialEventType.SynchronizeCombatantEquipmentModels,
          data: { entityId: characterId },
        });
      }

      if (shouldUpdateThumbnailAfterCraft(itemResult)) {
        clientApplication.gameWorldView?.imageGenerator.enqueueMessage({
          type: ImageGenerationRequestType.ItemCreation,
          data: { item: itemResult },
        });
      }

      itemResult.craftingIteration = itemBeforeModification.craftingIteration + 1;
      PlayerShardPool.applyPayments(party, payments);

      eventLogMessageService.postCraftActionResult(
        combatant.getName(),
        Equipment.fromSerialized(itemBeforeModification),
        craftingAction,
        itemResult
      );
    },
    [GameStateUpdateType.PlayerPostedItemLink]: (data) => {
      const { username, itemId } = data;
      const { party } = gameContext.requirePlayerContext(username);
      const itemResult = party.getItem(itemId);
      if (itemResult instanceof Error) {
        return alertsService.setAlert(itemResult);
      }
      eventLogMessageService.postItemLink(username, itemResult);
    },
    [GameStateUpdateType.ClientSequentialEvents]: (data) => {
      for (const payload of data.sequentialEvents) {
        sequentialEventProcessor.scheduleEvent(payload);
      }
    },
    [GameStateUpdateType.CharacterSelectedCombatActionRank]: (data) => {
      const { characterId, actionRank } = data;
      const { game, party, combatant } = gameContext.requireCombatantContext(characterId);

      const { targetingProperties } = combatant.combatantProperties;

      const selectedActionAndRank = targetingProperties.getSelectedActionAndRank();
      if (selectedActionAndRank === null) {
        throw new Error(ERROR_MESSAGES.COMBATANT.NO_ACTION_SELECTED);
      }

      const { actionName } = selectedActionAndRank;

      targetingProperties.setSelectedActionAndRank(new ActionAndRank(actionName, actionRank));

      const playerOption = game.getExpectedPlayer(
        combatant.combatantProperties.controlledBy.controllerPlayerName
      );

      const targetingCalculator = new TargetingCalculator(
        new ActionUserContext(game, party, combatant),
        playerOption
      );
      const newTargetsResult = targetingCalculator.updateTargetingSchemeAfterSelectingActionLevel();

      clientApplication.combatantClickHandler.synchronizeReticleClickability();

      const action = COMBAT_ACTIONS[actionName];

      if (newTargetsResult instanceof Error) {
        throw newTargetsResult;
      }
      if (newTargetsResult === undefined) {
        return;
      }

      let targetIds: null | EntityId[] = null;
      if (newTargetsResult) {
        const targetIdsResult = targetingCalculator.getCombatActionTargetIds(
          action,
          newTargetsResult
        );
        if (targetIdsResult instanceof Error) {
          throw targetIdsResult;
        }
        targetIds = targetIdsResult;
      }

      targetIndicatorStore.synchronize(actionName, combatant.getEntityId(), targetIds || []);
    },
    [GameStateUpdateType.CharacterCycledTargets]: (data) => {
      const { characterId, direction } = data;
      const { game, party, combatant } = gameContext.requireCombatantContext(characterId);
      const username = combatant.getCombatantProperties().controlledBy.controllerPlayerName;
      const player = game.getExpectedPlayer(username);

      // @REFACTOR - just pass the targeting calculator for this pattern
      const targetingCalculator = new TargetingCalculator(
        new ActionUserContext(game, party, combatant),
        player
      );

      const validTargetsByDisposition = targetingCalculator.getValidTargetsByDisposition();
      const targetingProperties = combatant.getTargetingProperties();
      targetingProperties.cycleTargets(direction, player, validTargetsByDisposition);

      const selectedActionAndRank = targetingProperties.getSelectedActionAndRank();
      const combatActionTarget = targetingProperties.getSelectedTarget();

      if (selectedActionAndRank === null) {
        throw new Error(ERROR_MESSAGES.COMBATANT.NO_ACTION_SELECTED);
      }
      if (combatActionTarget === null) {
        throw new Error(ERROR_MESSAGES.COMBATANT.NO_TARGET_SELECTED);
      }

      const { actionName } = selectedActionAndRank;

      const targetIdsResult = targetingCalculator.getCombatActionTargetIds(
        COMBAT_ACTIONS[actionName],
        combatActionTarget
      );
      if (targetIdsResult instanceof Error) {
        throw targetIdsResult;
      }

      targetIndicatorStore.synchronize(actionName, combatant.getEntityId(), targetIdsResult || []);
    },
    [GameStateUpdateType.CharacterSetCombatActionTarget]: (data) => {
      const { characterId, targetingSelection } = data;
      const { targetingScheme, target } = targetingSelection;
      const { game, party, combatant } = gameContext.requireCombatantContext(characterId);
      const username = combatant.getCombatantProperties().controlledBy.controllerPlayerName;
      const player = game.getExpectedPlayer(username);

      const targetingCalculator = new TargetingCalculator(
        new ActionUserContext(game, party, combatant),
        player
      );

      const targetingProperties = combatant.getTargetingProperties();

      const selectedActionAndRank = targetingProperties.getSelectedActionAndRank();
      if (selectedActionAndRank === null) {
        throw new Error(ERROR_MESSAGES.COMBATANT.NO_ACTION_SELECTED);
      }

      targetingProperties.setSelectedTargetingScheme(targetingScheme);
      targetingProperties.setSelectedTarget(target);

      const { actionName } = selectedActionAndRank;

      const targetIdsResult = targetingCalculator.getCombatActionTargetIds(
        COMBAT_ACTIONS[actionName],
        target
      );
      if (targetIdsResult instanceof Error) {
        throw targetIdsResult;
      }

      targetIndicatorStore.synchronize(actionName, combatant.getEntityId(), targetIdsResult || []);

      clientApplication.combatantClickHandler.synchronizeReticleClickability();
    },
    [GameStateUpdateType.CharacterCycledTargetingSchemes]: (data) => {
      const { characterId } = data;
      const { game, party, combatant } = gameContext.requireCombatantContext(characterId);
      const username = combatant.getCombatantProperties().controlledBy.controllerPlayerName;
      const player = game.getExpectedPlayer(username);
      const combatantContext = new ActionUserContext(game, party, combatant);
      const targetingCalculator = new TargetingCalculator(combatantContext, player);
      const targetingProperties = combatant.getTargetingProperties();
      targetingProperties.cycleTargetingSchemes(targetingCalculator);

      const selectedActionAndRank = targetingProperties.getSelectedActionAndRank();
      const combatActionTarget = targetingProperties.getSelectedTarget();

      if (selectedActionAndRank === null) {
        throw new Error(ERROR_MESSAGES.COMBATANT.NO_ACTION_SELECTED);
      }
      if (combatActionTarget === null) {
        throw new Error(ERROR_MESSAGES.COMBATANT.NO_TARGET_SELECTED);
      }

      const actionNameOption = selectedActionAndRank.actionName;
      const targetIdsResult = targetingCalculator.getCombatActionTargetIds(
        COMBAT_ACTIONS[actionNameOption],
        combatActionTarget
      );
      if (targetIdsResult instanceof Error) {
        throw targetIdsResult;
      }

      targetIndicatorStore.synchronize(actionNameOption, combatant.getEntityId(), targetIdsResult);

      clientApplication.combatantClickHandler.synchronizeReticleClickability();
    },
    [GameStateUpdateType.DungeonFloorNumber]: (data) => {
      const party = gameContext.requireParty();
      party.dungeonExplorationManager.setCurrentFloor(data.floorNumber);
    },
    [GameStateUpdateType.CharacterAllocatedAbilityPoint]: (data) => {
      const { characterId, ability } = data;
      const { combatant } = gameContext.requireCombatantContext(characterId);
      combatant.combatantProperties.abilityProperties.allocateAbilityPoint(ability);
    },
    [GameStateUpdateType.CharacterSpentAttributePoint]: (data) => {
      const { characterId, attribute } = data;
      const { combatant } = gameContext.requireCombatantContext(characterId);
      combatant.combatantProperties.attributeProperties.allocatePoint(attribute);
    },
    [GameStateUpdateType.CharacterTradedItemForBook]: (data) => {
      const slotsUnequipped: TaggedEquipmentSlot[] = [];
      const { characterId, itemIdTraded, book } = data;

      const { combatant } = gameContext.requireCombatantContext(characterId);
      const { combatantProperties } = combatant;
      // unequip it if is equipped
      const equippedItems = combatantProperties.equipment.getAllEquippedItems({
        includeUnselectedHotswapSlots: true,
      });

      for (const item of equippedItems) {
        if (item.entityProperties.id === itemIdTraded) {
          const slot = combatantProperties.equipment.getSlotItemIsEquippedTo(
            item.entityProperties.id
          );
          if (slot !== null) {
            combatantProperties.equipment.unequipSlots([slot]);
            slotsUnequipped.push(slot);
          }
        }
      }

      const removedItemResult = combatantProperties.inventory.removeStoredOrEquipped(itemIdTraded);
      if (removedItemResult instanceof Error) {
        alertsService.setAlert(removedItemResult);
      } else {
        const asClassInstance = Consumable.fromSerialized(book);
        asClassInstance.makeObservable();
        const { inventory } = combatantProperties;
        inventory.insertItem(asClassInstance);
        alertsService.setAlert(
          `Obtained ${getSkillBookName(book.consumableType, book.itemLevel)}`,
          true
        );
      }

      sequentialEventProcessor.scheduleEvent({
        type: ClientSequentialEventType.SynchronizeCombatantEquipmentModels,
        data: { entityId: characterId },
      });
    },
    [GameStateUpdateType.CharacterRenamedPet]: (data) => {
      const { petId, newName } = data;
      const pet = gameContext.requireCombatant(petId);
      alertsService.setAlert(`Pet name changed from ${pet.entityProperties.name} to ${newName}`);
      pet.entityProperties.name = newName;
    },
    [GameStateUpdateType.EndOfUpdateStream]: () => {
      /* handled in BaseClient */
    },
  };
}

function shouldUpdateThumbnailAfterCraft(equipment: Equipment) {
  // @TODO - instead of checking specific types, we could share the generation template
  // code from the server and check if the template allows for more damage classifications
  // than can be rolled at one time
  if (
    equipment.equipmentBaseItemProperties.taggedBaseEquipment.equipmentType ===
      EquipmentType.TwoHandedMeleeWeapon &&
    equipment.equipmentBaseItemProperties.taggedBaseEquipment.baseItemType ===
      TwoHandedMeleeWeapon.ElementalStaff
  ) {
    return true;
  }

  if (
    equipment.equipmentBaseItemProperties.taggedBaseEquipment.equipmentType ===
      EquipmentType.OneHandedMeleeWeapon &&
    equipment.equipmentBaseItemProperties.taggedBaseEquipment.baseItemType ===
      OneHandedMeleeWeapon.RuneSword
  ) {
    return true;
  }

  return false;
}
