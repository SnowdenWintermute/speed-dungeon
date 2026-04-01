import cloneDeep from "lodash.clonedeep";
import {
  CharacterAndItems,
  GameStateUpdate,
  GameStateUpdateType,
} from "../../../../packets/game-state-updates.js";
import { UserSession } from "../../../sessions/user-session.js";
import { MessageDispatchFactory } from "../../../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../../update-delivery/outbox.js";
import { getPartyChannelName } from "../../../../packets/channels.js";
import { BookConsumableType, Consumable } from "../../../../items/consumables/index.js";
import { ConsumableType } from "../../../../items/consumables/consumable-types.js";
import { CombatantId, ItemId } from "../../../../aliases.js";
import { IdGenerator } from "../../../../utility-classes/index.js";
import { DungeonRoomType } from "../../../../adventuring-party/dungeon-room.js";
import { ERROR_MESSAGES } from "../../../../errors/index.js";
import { ItemType } from "../../../../items/index.js";
import {
  getConsumableShardPrice,
  getCraftingActionPrice,
} from "../../../../items/crafting/craft-action-prices.js";
import { ItemBuilder } from "../../../../items/item-creation/item-builder/index.js";
import { EquipmentRandomizer } from "../../../../items/item-creation/item-builder/equipment-randomizer.js";
import { AffixGenerator } from "../../../../items/item-creation/affix-generator.js";
import { CraftingAction } from "../../../../items/crafting/crafting-actions.js";
import { Equipment } from "../../../../items/equipment/index.js";
import { ItemCrafter } from "./craft-actions.js";
import { CombatantProperties } from "../../../../combatants/combatant-properties.js";
import { getBookLevelForTrade } from "../../../../items/trading/index.js";

export class CraftingController {
  itemCrafter: ItemCrafter;
  constructor(
    private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>,
    private readonly idGenerator: IdGenerator,
    private readonly itemBuilder: ItemBuilder,
    equipmentRandomizer: EquipmentRandomizer,
    affixGenerator: AffixGenerator
  ) {
    this.itemCrafter = new ItemCrafter(equipmentRandomizer, affixGenerator);
  }

  convertItemsToShardsHandler(session: UserSession, data: CharacterAndItems) {
    const { characterId, itemIds } = data;
    const { game, party, character } = session.requireCharacterContext(characterId, {
      requireOwned: true,
      requireAlive: true,
    });

    character.combatantProperties.abilityProperties.requireShardConversionPermitted(
      party.currentRoom.roomType
    );

    // clone the itemIds so we can send unmodified original to clients
    character.convertOwnedItemsToShards(cloneDeep(itemIds));

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.CharacterConvertedItemsToShards,
      data,
    });

    return outbox;
  }

  dropShardsHandler(session: UserSession, data: { characterId: CombatantId; shardCount: number }) {
    const { characterId, shardCount } = data;
    const { game, party, character } = session.requireCharacterContext(characterId, {
      requireOwned: true,
      requireAlive: true,
    });
    const { inventory } = character.combatantProperties;

    inventory.requireShardCount(shardCount);
    inventory.changeShards(shardCount * -1);
    const shardStack = Consumable.createShardStack(shardCount, this.idGenerator);
    party.currentRoom.inventory.insertItem(shardStack);
    party.itemsOnGroundNotYetReceivedByAllClients.set(shardStack.entityProperties.id, []);

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.CharacterDroppedShards,
      data: { characterId, shardStack },
    });

    return outbox;
  }

  purchaseItemHandler(
    session: UserSession,
    data: { characterId: CombatantId; consumableType: ConsumableType }
  ) {
    const { characterId, consumableType } = data;
    const { game, party, character } = session.requireCharacterContext(characterId, {
      requireOwned: true,
      requireAlive: true,
    });

    party.currentRoom.requireType(DungeonRoomType.VendingMachine);

    const { inventory } = character.combatantProperties;
    if (!inventory.canPickUpItem(ItemType.Consumable)) {
      throw new Error(ERROR_MESSAGES.COMBATANT.MAX_INVENTORY_CAPACITY);
    }

    if (consumableType === ConsumableType.StackOfShards) {
      throw new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);
    }

    const floorNumber = party.dungeonExplorationManager.getCurrentFloor();
    const priceOption = getConsumableShardPrice(floorNumber, consumableType);
    if (priceOption === null) {
      throw new Error(ERROR_MESSAGES.ITEM.NOT_PURCHASEABLE);
    }
    inventory.requireShardCount(priceOption);

    inventory.changeShards(priceOption * -1);
    const purchasedItem = this.itemBuilder.consumable(consumableType).build(this.idGenerator);
    inventory.consumables.push(purchasedItem);

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.CharacterPurchasedItem,
      data: {
        characterId,
        item: purchasedItem,
        price: priceOption,
      },
    });

    return outbox;
  }

  craftItemHandler(
    session: UserSession,
    data: { characterId: CombatantId; itemId: ItemId; craftingAction: CraftingAction }
  ) {
    const { characterId, itemId, craftingAction } = data;
    const { game, party, character } = session.requireCharacterContext(characterId, {
      requireOwned: true,
      requireAlive: true,
    });
    party.currentRoom.requireType(DungeonRoomType.VendingMachine);

    const { inventory } = character.combatantProperties;

    const itemResult = character.combatantProperties.inventory.getStoredOrEquipped(itemId);
    if (itemResult instanceof Error) {
      throw itemResult;
    }

    if (!(itemResult instanceof Equipment)) {
      throw new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);
    }

    const price = getCraftingActionPrice(craftingAction, itemResult);
    inventory.requireShardCount(price);

    let percentRepairedBeforeModification = 1;
    const durabilityOption = itemResult.getDurability();
    if (durabilityOption) {
      percentRepairedBeforeModification = durabilityOption.current / durabilityOption.max;
    }

    character.combatantProperties.resources.maintainResourcePercentagesAfterEffect(() => {
      const actionHandler = this.itemCrafter.craftingActionHandlers[craftingAction];
      const floorNumber = party.dungeonExplorationManager.getCurrentFloor();
      actionHandler(itemResult, floorNumber);
    });

    // if max durability increased, make current durability proportional
    if (craftingAction !== CraftingAction.Repair) {
      const durabilityOptionAfter = itemResult.getDurability();
      if (durabilityOptionAfter && itemResult.durability) {
        itemResult.durability.current = Math.round(
          durabilityOptionAfter.max * percentRepairedBeforeModification
        );
      }
    }

    // do this after in case action was aborted earlier
    inventory.changeShards(price * -1);

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.CharacterPerformedCraftingAction,
      data: {
        characterId,
        item: itemResult,
        craftingAction,
      },
    });

    return outbox;
  }

  tradeItemForBookHandler(
    session: UserSession,
    data: { characterId: CombatantId; itemId: ItemId; bookType: BookConsumableType }
  ) {
    const { characterId, itemId, bookType } = data;
    const { game, party, character } = session.requireCharacterContext(characterId, {
      requireOwned: true,
      requireAlive: true,
    });

    const { combatantProperties } = character;
    party.currentRoom.requireType(DungeonRoomType.VendingMachine);

    const inventoryFull = combatantProperties.inventory.isAtCapacity();
    if (inventoryFull) {
      throw new Error(ERROR_MESSAGES.COMBATANT.MAX_INVENTORY_CAPACITY);
    }

    const floorNumber = party.dungeonExplorationManager.getCurrentFloor();

    const book = this.tradeItemForBook(
      itemId,
      character.combatantProperties,
      bookType,
      floorNumber
    );

    combatantProperties.inventory.insertItem(book);

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.CharacterTradedItemForBook,
      data: {
        characterId,
        itemIdTraded: itemId,
        book,
      },
    });

    return outbox;
  }

  private tradeItemForBook(
    itemToTradeId: ItemId,
    combatantProperties: CombatantProperties,
    bookType: BookConsumableType,
    vendingMachineLevel: number
  ) {
    const removedItemResult = combatantProperties.inventory.removeStoredOrEquipped(itemToTradeId);
    if (removedItemResult instanceof Error) {
      throw removedItemResult;
    }

    const bookToReturn = this.itemBuilder.consumable(bookType).build(this.idGenerator);

    bookToReturn.itemLevel = getBookLevelForTrade(removedItemResult.itemLevel, vendingMachineLevel);

    return bookToReturn;
  }
}
