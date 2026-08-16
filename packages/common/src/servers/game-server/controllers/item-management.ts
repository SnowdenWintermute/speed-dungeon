import { ActionRank, CombatantId, ItemId } from "../../../aliases.js";
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
import { UserSession } from "../../sessions/user-session.js";
import { MessageDispatchFactory } from "../../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../update-delivery/outbox.js";
import { CombatActionController } from "./combat-action/index.js";
import { EquipmentSlotId } from "../../../combatants/combatant-equipment/types.js";

export class ItemManagementController {
  constructor(
    private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>,
    private readonly combatActionController: CombatActionController
  ) {}

  dropItemHandler(session: UserSession, data: CharacterAndItem) {
    const { characterId, itemId } = data;
    const { game, party, character } = session.requireCharacterContext(characterId);

    if (party.isInCombat()) {
      throw new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NOT_USABLE_IN_COMBAT);
    }

    const itemDroppedIdResult = character.combatantProperties.inventory.dropItem(party, itemId);

    if (itemDroppedIdResult instanceof Error) {
      throw itemDroppedIdResult;
    }

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.CharacterDroppedItem,
      data,
    });

    return outbox;
  }

  dropEquippedItemHandler(session: UserSession, data: CharacterAndSlot) {
    const { characterId, slotId } = data;
    const { game, party, character } = session.requireCharacterContext(characterId);

    if (party.isInCombat()) {
      throw new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NOT_USABLE_IN_COMBAT);
    }

    const { inventory } = character.combatantProperties;
    const itemDroppedIdResult = inventory.dropEquippedItem(party, slotId);
    if (itemDroppedIdResult instanceof Error) {
      throw itemDroppedIdResult;
    }

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.CharacterDroppedEquippedItem,
      data,
    });

    return outbox;
  }

  pickUpItemsHandler(session: UserSession, data: CharacterAndItems) {
    const { characterId, itemIds } = data;
    const { game, party, character } = session.requireCharacterContext(characterId);

    let reachedMaxCapacity = false;

    const idsPickedUp: string[] = [];
    const errors: Error[] = [];

    for (const itemId of itemIds) {
      // handle shard stacks uniquely
      const itemInInventory = party.currentRoom.inventory.requireItem(itemId);
      const itemIsShardStack = itemInInventory.isShardStack();

      if (itemIsShardStack) {
        character.combatantProperties.inventory.pickUpShardStack(
          itemId,
          party.currentRoom.inventory
        );
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
        errors.push(itemResult);
        continue;
      }

      character.combatantProperties.inventory.insertItem(itemResult);

      idsPickedUp.push(itemResult.entityProperties.id);
    }

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.CharacterPickedUpItems,
      data: { characterId, itemIds: idsPickedUp },
    });

    for (const error of errors) {
      outbox.pushToConnection(session.connectionId, {
        type: GameStateUpdateType.ErrorMessage,
        // since we normally send one error per intent id and don't pass the intent id to handlers
        // we don't know the id, and we don't have a way to associate multiple errors with a single
        // intent yet, this is a stopgap measure
        data: { message: error.message, clientIntentSequenceId: -1 },
      });
    }

    if (reachedMaxCapacity) {
      throw new Error(ERROR_MESSAGES.COMBATANT.MAX_INVENTORY_CAPACITY);
    }

    return outbox;
  }

  unequipSlotHandler(session: UserSession, data: CharacterAndSlot) {
    const { characterId, slotId } = data;
    const { game, party, character } = session.requireCharacterContext(characterId);

    if (party.isInCombat()) {
      throw new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NOT_USABLE_IN_COMBAT);
    }

    character.combatantProperties.equipment.unequipSlots([slotId]);

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

    equipment.hotswapSlotsManager.changeSelectedHotswapSlot(slotIndex);

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

    if (party.isInCombat()) {
      throw new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NOT_USABLE_IN_COMBAT);
    }

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

  moveEquippedItemToSlotHandler(
    session: UserSession,
    data: {
      characterId: CombatantId;
      sourceSlotId: EquipmentSlotId;
      destinationSlotId: EquipmentSlotId;
    }
  ) {
    const { characterId, sourceSlotId, destinationSlotId } = data;
    const { game, party, character } = session.requireCharacterContext(characterId);

    if (party.isInCombat()) {
      throw new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NOT_USABLE_IN_COMBAT);
    }

    const { equipment } = character.combatantProperties;

    const sourceSlot = equipment.getSlotById(sourceSlotId);
    const destinationSlot = equipment.getSlotById(destinationSlotId);

    character.combatantProperties.equipment.moveEquippedItemToSlot(sourceSlot, destinationSlot);

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.CharacterMovedEquippedItemToSlot,
      data,
    });

    return outbox;
  }

  equipItemFromGroundHandler(
    session: UserSession,
    data: {
      characterId: CombatantId;
      itemId: ItemId;
      equipToAlternateSlot: boolean;
    }
  ) {
    const { characterId, itemId, equipToAlternateSlot } = data;
    const { game, party, character } = session.requireCharacterContext(characterId);

    if (party.isInCombat()) {
      throw new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NOT_USABLE_IN_COMBAT);
    }

    const equipItemResult = character.combatantProperties.equipment.equipItemFromGround(
      itemId,
      party.currentRoom.inventory,
      equipToAlternateSlot
    );
    if (equipItemResult instanceof Error) {
      throw equipItemResult;
    }

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.CharacterEquippedItemFromGround,
      data,
    });

    return outbox;
  }
}
