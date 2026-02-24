import { EntityId } from "../../../aliases.js";
import { ERROR_MESSAGES } from "../../../errors/index.js";
import { Consumable } from "../../../items/consumables/index.js";
import { ItemType } from "../../../items/index.js";
import { getPartyChannelName } from "../../../packets/channels.js";
import {
  CharacterAndItem,
  CharacterAndItems,
  CharacterAndSlot,
  GameStateUpdate,
  GameStateUpdateType,
} from "../../../packets/game-state-updates.js";
import { GameMode } from "../../../types.js";
import { invariant } from "../../../utils/index.js";
import { SavedCharactersService } from "../../services/saved-characters.js";
import { UserSession } from "../../sessions/user-session.js";
import { MessageDispatchFactory } from "../../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../update-delivery/outbox.js";

export class ItemManagementController {
  constructor(
    private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>,
    private readonly savedCharactersService: SavedCharactersService
  ) {}

  async dropItemHandler(session: UserSession, data: CharacterAndItem) {
    const { characterId, itemId } = data;
    const { game, party, character } = session.requireCharacterContext(characterId, {
      requireOwned: true,
      requireAlive: true,
    });

    const itemDroppedIdResult = character.combatantProperties.inventory.dropItem(party, itemId);

    if (itemDroppedIdResult instanceof Error) {
      throw itemDroppedIdResult;
    }

    if (game.mode === GameMode.Progression) {
      await this.savedCharactersService.updateAllInParty(game, party);
    }

    party.itemsOnGroundNotYetReceivedByAllClients[itemDroppedIdResult] = [];

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.CharacterDroppedItem,
      data,
    });

    return outbox;
  }

  async dropEquippedItemHandler(session: UserSession, data: CharacterAndSlot) {
    const { characterId, slot } = data;
    const { game, party, character } = session.requireCharacterContext(characterId, {
      requireOwned: true,
      requireAlive: true,
    });

    const { inventory } = character.combatantProperties;
    const itemDroppedIdResult = inventory.dropEquippedItem(party, slot);
    if (itemDroppedIdResult instanceof Error) {
      throw itemDroppedIdResult;
    }

    if (game.mode === GameMode.Progression) {
      await this.savedCharactersService.updateAllInParty(game, party);
    }

    party.itemsOnGroundNotYetReceivedByAllClients[itemDroppedIdResult] = [];

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

    const usersThatHaveReceivedThisItem = party.itemsOnGroundNotYetReceivedByAllClients[itemId];

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
      delete party.itemsOnGroundNotYetReceivedByAllClients[itemId];
    }

    // no messages should be sent, but this is a rare case of an event handler sending no messsage
    // and the interface of an event handler mandates that it must return an outbox
    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    return outbox;
  }

  pickUpItemsHandler(session: UserSession, data: CharacterAndItems) {
    const { characterId, itemIds } = data;
    const { game, party, character } = session.requireCharacterContext(characterId, {
      requireOwned: true,
      requireAlive: true,
    });

    let reachedMaxCapacity = false;

    const idsPickedUp: string[] = [];

    for (const itemId of itemIds) {
      // make sure all players know about the item or else desync will occur
      if (party.itemsOnGroundNotYetReceivedByAllClients[itemId] !== undefined) {
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
      outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
        type: GameStateUpdateType.ErrorMessage,
        data: { message: ERROR_MESSAGES.COMBATANT.MAX_INVENTORY_CAPACITY },
      });
    }

    return outbox;
  }
}
