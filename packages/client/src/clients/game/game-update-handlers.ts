import { setAlert } from "@/app/components/alerts";
import { ConsideringCombatActionMenuState } from "@/app/game/ActionMenu/menu-state/considering-combat-action";
import { ConsideringItemMenuState } from "@/app/game/ActionMenu/menu-state/considering-item";
import { GameWorldView } from "@/game-world-view";
import { ImageManagerRequestType } from "@/game-world-view/image-manager";
import { ModelActionType } from "@/game-world-view/model-manager/model-actions";
import {
  ENVIRONMENT_MODEL_PATHS,
  ENVIRONMENT_MODELS_FOLDER,
  EnvironmentModelTypes,
} from "@/game-world-view/scene-entities/environment-models/environment-model-paths";
import { AppStore } from "@/mobx-stores/app-store";
import { GameLogMessageService } from "@/mobx-stores/game-event-notifications/game-log-message-service";
import { CharacterAutoFocusManager } from "@/singletons/character-autofocus-manager";
import { gameClientSingleton } from "@/singletons/lobby-client";
import { Vector3 } from "@babylonjs/core";
import {
  ActionAndRank,
  ActionCommandType,
  ActionUserContext,
  Battle,
  CleanupMode,
  ClientIntentType,
  COMBAT_ACTIONS,
  Combatant,
  Consumable,
  DungeonRoom,
  DungeonRoomType,
  EntityId,
  Equipment,
  EquipmentType,
  ERROR_MESSAGES,
  GameStateUpdateMap,
  GameStateUpdateType,
  getCraftingActionPrice,
  getSkillBookName,
  Item,
  iterateNumericEnumKeyedRecord,
  OneHandedMeleeWeapon,
  TaggedEquipmentSlot,
  TargetingCalculator,
  TwoHandedMeleeWeapon,
} from "@speed-dungeon/common";
import { plainToInstance } from "class-transformer";
import cloneDeep from "lodash.clonedeep";
import { toJS } from "mobx";

export type GameUpdateHandler<K extends keyof GameStateUpdateMap> = (
  data: GameStateUpdateMap[K]
) => void;

export type GameUpdateHandlers = {
  [K in keyof GameStateUpdateMap]: GameUpdateHandler<K>;
};

export function createGameUpdateHandlers(
  appStore: AppStore,
  gameWorldView: {
    current: null | GameWorldView;
  },
  characterAutoFocusManager: CharacterAutoFocusManager
): Partial<GameUpdateHandlers> {
  const { targetIndicatorStore, gameStore, focusStore, actionMenuStore } = appStore;

  return {
    [GameStateUpdateType.ErrorMessage]: (data) => {
      setAlert(data.message);
      console.log("alert:", data.message);
    },
    [GameStateUpdateType.PlayerToggledReadyToDescendOrExplore]: (data) => {
      const { username, explorationAction } = data;
      const party = gameStore.getExpectedParty();
      const { dungeonExplorationManager } = party;
      dungeonExplorationManager.updatePlayerExplorationActionChoice(username, explorationAction);
    },
    [GameStateUpdateType.DungeonRoomTypesOnCurrentFloor]: (data) => {
      const party = gameStore.getExpectedParty();
      const { dungeonExplorationManager } = party;
      dungeonExplorationManager.setClientVisibleRoomExplorationList(data.roomTypes);
      dungeonExplorationManager.clearRoomsExploredOnCurrentFloorCount();
    },
    [GameStateUpdateType.DungeonRoomUpdate]: (data) => {
      const { dungeonRoom, actionEntitiesToRemove, monsters } = data;
      const deserializedRoom = DungeonRoom.getDeserialized(dungeonRoom);
      const itemIdsOnGroundInPreviousRoom: string[] = [];
      const newItemsOnGround: Item[] = [];

      const party = gameStore.getExpectedParty();

      const { actionEntityManager } = party;
      for (const actionEntityId of actionEntitiesToRemove) {
        actionEntityManager.unregisterActionEntity(actionEntityId);
        gameWorldView.current?.actionEntityManager.unregister(actionEntityId, CleanupMode.Soft);
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

      focusStore.detailables.clearHovered();

      const { combatantManager } = party;

      const game = gameStore.getExpectedGame();
      for (const combatant of monsters) {
        const deserialized = Combatant.getDeserialized(combatant);
        combatantManager.addCombatant(deserialized, game);
      }

      combatantManager.updateHomePositions();
      combatantManager.setAllCombatantsToHomePositions();

      dungeonExplorationManager.incrementExploredRoomsTrackers();

      const indexOfRoomTypeToReveal = dungeonExplorationManager.getCurrentRoomNumber() - 1;
      dungeonExplorationManager.getClientVisibleRoomExplorationList()[indexOfRoomTypeToReveal] =
        dungeonRoom.roomType;

      const noPreviouslySpawnedVendingMachine = !(
        previousRoomType === DungeonRoomType.VendingMachine
      );
      const roomHasVendingMachine = dungeonRoom.roomType === DungeonRoomType.VendingMachine;

      if (roomHasVendingMachine && noPreviouslySpawnedVendingMachine) {
        gameWorldView.current?.modelManager.modelActionQueue.enqueueMessage({
          type: ModelActionType.SpawnEnvironmentModel,
          modelType: EnvironmentModelTypes.VendingMachine,
          path:
            ENVIRONMENT_MODELS_FOLDER +
            ENVIRONMENT_MODEL_PATHS[EnvironmentModelTypes.VendingMachine],
          id: "vending-machine",
          position: Vector3.Forward(),
        });
      } else if (!roomHasVendingMachine) {
        gameWorldView.current?.modelManager.modelActionQueue.enqueueMessage({
          type: ModelActionType.DespawnEnvironmentModel,
          id: "vending-machine",
        });
      }

      gameWorldView.current?.modelManager.modelActionQueue.enqueueMessage({
        type: ModelActionType.SynchronizeCombatantModels,
        placeInHomePositions: true,
      });

      // clean up unused screenshots for items left behind
      gameWorldView.current?.imageManager.enqueueMessage({
        type: ImageManagerRequestType.ItemDeletion,
        itemIds: itemIdsOnGroundInPreviousRoom,
      });

      for (const item of newItemsOnGround) {
        if (item instanceof Consumable) continue;

        gameWorldView.current?.imageManager.enqueueMessage({
          type: ImageManagerRequestType.ItemCreation,
          item,
        });
      }
    },
    [GameStateUpdateType.BattleFullUpdate]: (data) => {
      {
        const { battle: battleOption } = data;
        const { game, party } = gameStore.getFocusedCharacterContext();

        if (battleOption === null) {
          game.battles = {};
          return;
        }

        const battle = battleOption;
        party.battleId = battle.id;
        const deserializedBattle = Battle.getDeserialized(battle, game, party);
        game.battles[battle.id] = deserializedBattle;

        const currentActorIsPlayerControlled =
          deserializedBattle.turnOrderManager.currentActorIsPlayerControlled(party);

        const turnTracker = deserializedBattle.turnOrderManager.getFastestActorTurnOrderTracker();
        characterAutoFocusManager.handleBattleStart(turnTracker);

        if (!currentActorIsPlayerControlled) {
          // it is ai controlled so lock input
          party.inputLock.lockInput();
        }
      }
    },
    [GameStateUpdateType.CharacterDroppedItem]: (data) => {
      const { characterId, itemId } = data;

      gameClientSingleton.get().dispatchIntent({
        type: ClientIntentType.AcknowledgeReceiptOfItemOnGroundUpdate,
        data: { itemId },
      });

      const { party, combatant } = gameStore.getExpectedCombatantContext(characterId);

      combatant.combatantProperties.inventory.dropItem(party, itemId);
    },
    [GameStateUpdateType.CharacterDroppedEquippedItem]: (data) => {
      const { characterId, slot } = data;
      const { party, combatant } = gameStore.getExpectedCombatantContext(characterId);
      const itemDroppedIdResult = combatant.combatantProperties.inventory.dropEquippedItem(
        party,
        slot
      );
      if (itemDroppedIdResult instanceof Error) {
        throw itemDroppedIdResult;
      }

      gameClientSingleton.get().dispatchIntent({
        type: ClientIntentType.AcknowledgeReceiptOfItemOnGroundUpdate,
        data: { itemId: itemDroppedIdResult },
      });

      gameWorldView.current?.modelManager.modelActionQueue.enqueueMessage({
        type: ModelActionType.SynchronizeCombatantEquipmentModels,
        entityId: characterId,
      });
    },
    [GameStateUpdateType.CharacterUnequippedItem]: (data) => {
      const { characterId, slot } = data;
      const { combatant } = gameStore.getExpectedCombatantContext(characterId);
      combatant.combatantProperties.equipment.unequipSlots([slot]);

      gameWorldView.current?.modelManager.modelActionQueue.enqueueMessage({
        type: ModelActionType.SynchronizeCombatantEquipmentModels,
        entityId: characterId,
      });
    },
    [GameStateUpdateType.CharacterEquippedItem]: (data) => {
      const { itemId, equipToAlternateSlot, characterId } = data;
      const { combatant, party } = gameStore.getExpectedCombatantContext(characterId);
      const { equipment } = combatant.combatantProperties;

      const unequippedResult = equipment.equipItem(itemId, equipToAlternateSlot);
      if (unequippedResult instanceof Error) {
        throw unequippedResult;
      }
      const { idsOfUnequippedItems } = unequippedResult;

      const slot = equipment.getSlotItemIsEquippedTo(itemId);
      if (slot !== null) {
        const item = equipment.getEquipmentInSlot(slot);
        if (item !== undefined) {
          gameWorldView.current?.modelManager.modelActionQueue.enqueueMessage({
            type: ModelActionType.SynchronizeCombatantEquipmentModels,
            entityId: combatant.getEntityId(),
          });
        }
      }

      if (idsOfUnequippedItems[0] === undefined) {
        return;
      }

      const playerOwnsCharacter = party.combatantManager.playerOwnsCharacter(
        gameStore.getExpectedUsername(),
        characterId
      );

      if (!playerOwnsCharacter) {
        return;
      }

      focusStore.detailables.clearHovered();

      // we want the user to be now selecting the item they just unequipped
      const equipmentInInventory = combatant.combatantProperties.inventory.equipment;
      const itemToSelectOption = equipmentInInventory.find(
        (equipment) => equipment.entityProperties.id === idsOfUnequippedItems[0]
      );
      if (itemToSelectOption === undefined) {
        return;
      }

      const currentMenu = actionMenuStore.getCurrentMenu();
      if (currentMenu instanceof ConsideringItemMenuState) {
        currentMenu.setItem(itemToSelectOption);
        focusStore.detailables.setDetailed(itemToSelectOption);
      }
    },
    [GameStateUpdateType.CharacterPickedUpItems]: (data) => {
      const { combatant, party } = gameStore.getExpectedCombatantContext(data.characterId);
      for (const itemId of data.itemIds) {
        const itemResult = party.currentRoom.inventory.removeItem(itemId);
        if (itemResult instanceof Error) return itemResult;

        // handle shard stacks uniquely
        if (itemResult.isShardStack()) {
          combatant.combatantProperties.inventory.changeShards(itemResult.usesRemaining);
          continue;
        }

        combatant.combatantProperties.inventory.insertItem(itemResult);

        const { focusStore } = AppStore.get();
        // otherwise it is possible that one player is hovering this item, then it "disappears"
        // from under their mouse cursor and they can never trigger a mouseleave event to unhover it
        if (focusStore.entityIsHovered(itemResult.entityProperties.id)) {
          focusStore.detailables.clearHovered();
        }
      }
    },
    [GameStateUpdateType.CharacterSelectedCombatAction]: (data) => {
      const { game, party, combatant } = gameStore.getExpectedCombatantContext(data.characterId);
      const targetingProperties = combatant.getTargetingProperties();
      const { itemIdOption, actionAndRankOption, characterId } = data;
      targetingProperties.setSelectedActionAndRank(actionAndRankOption);

      const itemId = itemIdOption === undefined ? null : itemIdOption;
      targetingProperties.setSelectedItemId(itemId);

      const combatActionOption =
        actionAndRankOption !== null ? COMBAT_ACTIONS[actionAndRankOption.actionName] : null;

      const playerOption = game.getExpectedPlayer(
        combatant.combatantProperties.controlledBy.controllerPlayerName
      );

      const targetingCalculator = new TargetingCalculator(
        new ActionUserContext(game, party, combatant),
        playerOption
      );

      const newTargetsResult =
        targetingProperties.assignInitialTargetsForSelectedAction(targetingCalculator);
      if (newTargetsResult instanceof Error) {
        throw newTargetsResult;
      }

      let targetIds: null | EntityId[] = null;
      if (combatActionOption !== null && newTargetsResult) {
        const targetIdsResult = targetingCalculator.getCombatActionTargetIds(
          combatActionOption,
          newTargetsResult
        );
        if (targetIdsResult instanceof Error) {
          throw targetIdsResult;
        }
        targetIds = targetIdsResult;
      }

      const actionName =
        actionAndRankOption?.actionName === undefined ? null : actionAndRankOption.actionName;

      targetIndicatorStore.synchronize(actionName, combatant.getEntityId(), targetIds || []);

      const playerOwnsCharacter = party.combatantManager.playerOwnsCharacter(
        gameStore.getExpectedUsername(),
        characterId
      );

      if (!playerOwnsCharacter || actionName === null) {
        return;
      }

      actionMenuStore.pushStack(new ConsideringCombatActionMenuState(actionName));
    },
    [GameStateUpdateType.GameMessage]: (data) => {
      const { message } = data;
      if (message.showAfterActionQueueResolution) {
        if (!gameWorldView.current) {
          throw new Error(ERROR_MESSAGES.GAME_WORLD.NOT_FOUND);
        }
        gameWorldView.current.modelManager.modelActionQueue.enqueueMessage({
          type: ModelActionType.ProcessActionCommands,
          actionCommandPayloads: [
            {
              type: ActionCommandType.GameMessages,
              messages: [message],
            },
          ],
        });
      } else {
        GameLogMessageService.postGameMessage(message);
      }
    },
    [GameStateUpdateType.CharacterSelectedHoldableHotswapSlot]: (data) => {
      const { characterId, slotIndex } = data;
      const { combatant } = gameStore.getExpectedCombatantContext(characterId);
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
        if (focusStore.entityIsHovered(equipment.entityProperties.id))
          previouslyHoveredSlotTypeOption = slotType;
      }

      combatant.combatantProperties.equipment.changeSelectedHotswapSlot(slotIndex);

      if (previouslyHoveredSlotTypeOption !== null) {
        focusStore.detailables.clearHovered();
        const newlyEquippedSlotOption = equipment.getActiveHoldableSlot();
        if (newlyEquippedSlotOption) {
          for (const [slotType, holdable] of iterateNumericEnumKeyedRecord(
            newlyEquippedSlotOption.holdables
          )) {
            if (slotType === previouslyHoveredSlotTypeOption)
              focusStore.detailables.setHovered(holdable);
          }
        }
      }

      gameWorldView.current?.modelManager.modelActionQueue.enqueueMessage({
        type: ModelActionType.SynchronizeCombatantEquipmentModels,
        entityId: combatant.entityProperties.id,
      });
    },
    [GameStateUpdateType.CharacterConvertedItemsToShards]: (data) => {
      const slotsUnequipped: TaggedEquipmentSlot[] = [];
      const { characterId, itemIds } = data;
      const { combatant } = gameStore.getExpectedCombatantContext(characterId);

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
      try {
        combatant.convertOwnedItemsToShards(itemIds);
      } catch (error) {
        if (error instanceof Error) {
          setAlert(error);
        }
      }

      gameWorldView.current?.modelManager.modelActionQueue.enqueueMessage({
        type: ModelActionType.SynchronizeCombatantEquipmentModels,
        entityId: characterId,
      });
    },
    [GameStateUpdateType.CharacterDroppedShards]: (data) => {
      const { characterId, shardStack } = data;
      gameClientSingleton.get().dispatchIntent({
        type: ClientIntentType.AcknowledgeReceiptOfItemOnGroundUpdate,
        data: { itemId: shardStack.entityProperties.id },
      });
      const asClassInstance = plainToInstance(Consumable, shardStack);
      const { party, combatant } = gameStore.getExpectedCombatantContext(characterId);
      combatant.combatantProperties.inventory.changeShards(asClassInstance.usesRemaining * -1);
      party.currentRoom.inventory.insertItem(asClassInstance);
    },
    [GameStateUpdateType.CharacterPurchasedItem]: (data) => {
      const { item, characterId, price } = data;
      const { combatant } = gameStore.getExpectedCombatantContext(characterId);
      const asClassInstance = plainToInstance(Consumable, item);
      const { inventory } = combatant.combatantProperties;
      inventory.changeShards(price * -1);
      inventory.insertItem(asClassInstance);
      setAlert(`Purchased ${item.entityProperties.name}`, true);
    },
    [GameStateUpdateType.CharacterPerformedCraftingAction]: (data) => {
      const { characterId, item, craftingAction } = data;
      const { combatant } = gameStore.getExpectedCombatantContext(characterId);

      // used to show loading state so players don't get confused when
      // their craft action produces exact same item as already was
      actionMenuStore.setCharacterCompletedCrafting(combatant.getEntityId());

      const { combatantProperties } = combatant;

      const itemResult = combatantProperties.inventory.getStoredOrEquipped(
        item.entityProperties.id
      );

      if (itemResult instanceof Error) {
        throw itemResult;
      }

      const isEquipment = itemResult instanceof Equipment;
      if (!isEquipment) {
        setAlert("Server sent crafting results of a consumable?");
        return;
      }

      const actionPrice = getCraftingActionPrice(craftingAction, itemResult);
      const itemBeforeModification = cloneDeep(toJS(itemResult));
      // distinguish between the crafted and pre-crafted item. used for selecting the item links in the
      // combat log
      if (itemBeforeModification.craftingIteration !== undefined) {
        itemBeforeModification.craftingIteration += 1;
      } else {
        itemBeforeModification.craftingIteration = 0;
      }

      const asInstance = plainToInstance(Equipment, item);

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
        gameWorldView.current?.modelManager.modelActionQueue.enqueueMessage({
          type: ModelActionType.SynchronizeCombatantEquipmentModels,
          entityId: combatant.getEntityId(),
        });
      }

      if (shouldUpdateThumbnailAfterCraft(itemResult)) {
        gameWorldView.current?.imageManager.enqueueMessage({
          type: ImageManagerRequestType.ItemCreation,
          item: itemResult,
        });
      }

      itemResult.craftingIteration = itemBeforeModification.craftingIteration + 1;
      combatantProperties.inventory.changeShards(actionPrice * -1);

      GameLogMessageService.postCraftActionResult(
        combatant.getName(),
        plainToInstance(Equipment, itemBeforeModification),
        craftingAction,
        itemResult
      );
    },
    [GameStateUpdateType.PlayerPostedItemLink]: (data) => {
      const { username, itemId } = data;
      const { party } = gameStore.getExpectedPlayerContext(username);
      const itemResult = party.getItem(itemId);
      if (itemResult instanceof Error) {
        return setAlert(itemResult);
      }
      GameLogMessageService.postItemLink(username, itemResult);
    },
    [GameStateUpdateType.ActionCommandPayloads]: (data) => {
      if (!gameWorldView.current) {
        return console.error("Got action command payloads but no game world was found");
      }
      gameWorldView.current.modelManager.modelActionQueue.enqueueMessage({
        type: ModelActionType.ProcessActionCommands,
        actionCommandPayloads: data.payloads,
      });
    },
    [GameStateUpdateType.CharacterSelectedCombatActionRank]: (data) => {
      const { characterId, actionRank } = data;
      const { game, party, combatant } = gameStore.getExpectedCombatantContext(characterId);

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
    [GameStateUpdateType.CharacterAllocatedAbilityPoint]: (data) => {
      const { characterId, ability } = data;
      const { combatant } = gameStore.getExpectedCombatantContext(characterId);
      combatant.combatantProperties.abilityProperties.allocateAbilityPoint(ability);
    },
    [GameStateUpdateType.CharacterTradedItemForBook]: (data) => {
      const slotsUnequipped: TaggedEquipmentSlot[] = [];
      const { characterId, itemIdTraded, book } = data;

      const { combatant } = gameStore.getExpectedCombatantContext(characterId);
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
      if (removedItemResult instanceof Error) setAlert(removedItemResult);
      else {
        const asClassInstance = plainToInstance(Consumable, book);
        const { inventory } = combatantProperties;
        inventory.insertItem(asClassInstance);
        setAlert(`Obtained ${getSkillBookName(book.consumableType, book.itemLevel)}`, true);
      }

      gameWorldView.current?.modelManager.modelActionQueue.enqueueMessage({
        type: ModelActionType.SynchronizeCombatantEquipmentModels,
        entityId: characterId,
      });
    },
    [GameStateUpdateType.CharacterRenamedPet]: (data) => {
      const { petId, newName } = data;
      const pet = gameStore.getExpectedCombatant(petId);
      setAlert(`Pet name changed from ${pet.entityProperties.name} to ${newName}`);
      pet.entityProperties.name = newName;
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
