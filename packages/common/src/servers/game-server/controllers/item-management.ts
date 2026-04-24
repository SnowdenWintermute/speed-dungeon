import { ActionRank, CombatantId, EntityId, ItemId } from "../../../aliases.js";
import { HOTSWAP_SLOT_SELECTION_ACTION_POINT_COST } from "../../../app-consts.js";
import { CombatActionExecutionIntent } from "../../../combat/combat-actions/combat-action-execution-intent.js";
import { CombatActionName } from "../../../combat/combat-actions/combat-action-names.js";
import { CombatActionTargetType } from "../../../combat/targeting/combat-action-targets.js";
import { ERROR_MESSAGES } from "../../../errors/index.js";
import { getPartyChannelName } from "../../../packets/channels.js";
import {
  CharacterAndItem,
  CharacterAndItems,
  CharacterAndSlot,
  GameStateUpdate,
  GameStateUpdateType,
} from "../../../packets/game-state-updates.js";
import { invariant } from "../../../utils/index.js";
import { UserSession } from "../../sessions/user-session.js";
import { MessageDispatchFactory } from "../../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../update-delivery/outbox.js";
import { CombatActionController } from "./combat-action/index.js";

export class ItemManagementController {
  constructor(
    private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>,
    private readonly combatActionController: CombatActionController
  ) {}

  dropItemHandler(session: UserSession, data: CharacterAndItem) {
    const { characterId, itemId } = data;
    const { game, party, character } = session.requireCharacterContext(characterId);

    const itemDroppedIdResult = character.combatantProperties.inventory.dropItem(party, itemId);

    if (itemDroppedIdResult instanceof Error) {
      throw itemDroppedIdResult;
    }

    party.itemsOnGroundNotYetReceivedByAllClients.set(itemDroppedIdResult, []);

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.CharacterDroppedItem,
      data,
    });

    return outbox;
  }

  dropEquippedItemHandler(session: UserSession, data: CharacterAndSlot) {
    const { characterId, slot } = data;
    const { game, party, character } = session.requireCharacterContext(characterId);

    const { inventory } = character.combatantProperties;
    const itemDroppedIdResult = inventory.dropEquippedItem(party, slot);
    if (itemDroppedIdResult instanceof Error) {
      throw itemDroppedIdResult;
    }

    party.itemsOnGroundNotYetReceivedByAllClients.set(itemDroppedIdResult, []);

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.CharacterDroppedEquippedItem,
      data,
    });

    return outbox;
  }

  acknowledgeReceiptOfItemOnGroundHandler(session: UserSession, data: { itemId: EntityId }) {
    const { itemId } = data;
    const { party, player } = session.requirePlayerContext();
    console.log("player", player.username, "saw item id:", itemId);

    const usersThatHaveReceivedThisItem = party.itemsOnGroundNotYetReceivedByAllClients.get(itemId);

    invariant(
      usersThatHaveReceivedThisItem !== undefined,
      ERROR_MESSAGES.ITEM.ACKNOWLEDGEMENT_SENT_BEFORE_ITEM_EXISTED
    );

    usersThatHaveReceivedThisItem.push(player.username);

    let allUsersInPartyHaveReceivedItemUpdate = true;

    for (const username of party.playerUsernames) {
      if (!usersThatHaveReceivedThisItem.includes(username)) {
        allUsersInPartyHaveReceivedItemUpdate = false;
        break;
      }
    }

    if (allUsersInPartyHaveReceivedItemUpdate) {
      party.itemsOnGroundNotYetReceivedByAllClients.delete(itemId);
    }

    // no messages should be sent, but this is a rare case of an event handler sending no messsage
    // and the interface of an event handler mandates that it must return an outbox
    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    return outbox;
  }

  pickUpItemsHandler(session: UserSession, data: CharacterAndItems) {
    const { characterId, itemIds } = data;
    const { game, party, character } = session.requireCharacterContext(characterId);

    let reachedMaxCapacity = false;

    const idsPickedUp: string[] = [];

    for (const itemId of itemIds) {
      console.log(session.username, "picking up item", itemId);
      // make sure all players know about the item or else desync will occur
      if (party.itemsOnGroundNotYetReceivedByAllClients.get(itemId) !== undefined) {
        throw new Error(ERROR_MESSAGES.ITEM.NOT_YET_AVAILABLE);
      }

      // handle shard stacks uniquely
      const itemInInventory = party.currentRoom.inventory.requireItem(itemId);
      const itemIsShardStack = itemInInventory.isShardStack();

      if (itemIsShardStack) {
        const mabyeError = character.combatantProperties.inventory.pickUpShardStack(
          itemId,
          party.currentRoom.inventory
        );
        if (mabyeError instanceof Error) {
          throw mabyeError;
        }
        idsPickedUp.push(itemInInventory.entityProperties.id);
        continue;
      }

      // let them pick up to capacity
      const itemType = itemInInventory.getType();
      if (!character.combatantProperties.inventory.canPickUpItem(itemType)) {
        reachedMaxCapacity = true;
        continue;
      } // continue instead of break so they can still pick up shard stacks

      const itemResult = party.currentRoom.inventory.removeItem(itemId);
      if (itemResult instanceof Error) {
        throw itemResult;
      }

      character.combatantProperties.inventory.insertItem(itemResult);

      idsPickedUp.push(itemResult.entityProperties.id);
    }

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.CharacterPickedUpItems,
      data: { characterId, itemIds: idsPickedUp },
    });

    if (reachedMaxCapacity) {
      throw new Error(ERROR_MESSAGES.COMBATANT.MAX_INVENTORY_CAPACITY);
    }

    return outbox;
  }

  unequipSlotHandler(session: UserSession, data: CharacterAndSlot) {
    const { characterId, slot } = data;
    const { game, party, character } = session.requireCharacterContext(characterId);

    character.combatantProperties.equipment.unequipSlots([slot]);

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.CharacterUnequippedItem,
      data,
    });
    return outbox;
  }

  async selectHoldableHotswapSlotHandler(
    session: UserSession,
    data: { characterId: CombatantId; slotIndex: number }
  ) {
    const { characterId, slotIndex } = data;
    const characterContext = session.requireCharacterContext(characterId);
    const { game, party, character } = characterContext;
    const { combatantProperties } = character;

    const battleOption = party.getBattleOption(game);

    if (battleOption) {
      battleOption.turnOrderManager.requireActionUserFirstInTurnOrder(character.getEntityId());
      combatantProperties.resources.requireActionPointCount(
        HOTSWAP_SLOT_SELECTION_ACTION_POINT_COST
      );
    }

    const { equipment } = character.combatantProperties;

    if (slotIndex >= equipment.getHoldableHotswapSlots().length) {
      throw new Error(ERROR_MESSAGES.EQUIPMENT.SELECTED_SLOT_OUT_OF_BOUNDS);
    }

    equipment.changeSelectedHotswapSlot(slotIndex);

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.CharacterSelectedHoldableHotswapSlot,
      data,
    });

    if (battleOption) {
      const actionUseOutbox = await this.combatActionController.executeAction(
        characterContext,
        new CombatActionExecutionIntent(CombatActionName.PayActionPoint, 1 as ActionRank, {
          type: CombatActionTargetType.Single,
          targetId: characterId,
        }),
        false
      );
      outbox.pushFromOther(actionUseOutbox);
    }

    return outbox;
  }

  equipItemHandler(
    session: UserSession,
    data: {
      characterId: CombatantId;
      itemId: ItemId;
      equipToAlternateSlot: boolean;
    }
  ) {
    const { characterId, itemId, equipToAlternateSlot } = data;
    const { game, party, character } = session.requireCharacterContext(characterId);

    const equipItemResult = character.combatantProperties.equipment.equipItem(
      itemId,
      equipToAlternateSlot
    );
    if (equipItemResult instanceof Error) {
      throw equipItemResult;
    }

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.CharacterEquippedItem,
      data,
    });

    return outbox;
  }
}
