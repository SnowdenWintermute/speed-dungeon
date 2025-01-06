import { useGameStore } from "@/stores/game-store";
import {
  CRAFTING_ACTION_PAST_TENSE_STRINGS,
  CharacterAssociatedData,
  CombatantProperties,
  CraftingAction,
  EntityId,
  Equipment,
  GameMessageType,
  Inventory,
  Item,
  getCraftingActionPrice,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { plainToInstance } from "class-transformer";
import { setAlert } from "@/app/components/alerts";
import {
  COMBAT_LOG_MESSAGE_STYLES_BY_MESSAGE_TYPE,
  CombatLogMessage,
} from "@/app/game/combat-log/combat-log-message";

export function characterPerformedCraftingActionHandler(eventData: {
  characterId: EntityId;
  item: Item;
  craftingAction: CraftingAction;
}) {
  const { characterId, item, craftingAction } = eventData;
  let combatLogMessage: CombatLogMessage;

  characterAssociatedDataProvider(characterId, ({ party, character }: CharacterAssociatedData) => {
    const itemResult = CombatantProperties.getOwnedItemById(
      character.combatantProperties,
      item.entityProperties.id
    );
    if (itemResult instanceof Error) return itemResult;

    const itemNameBeforeModificaction = itemResult.entityProperties.name;

    if (itemResult instanceof Equipment) {
      const asInstance = plainToInstance(Equipment, item);
      itemResult.copyFrom(asInstance);

      const actionPrice = getCraftingActionPrice(
        craftingAction,
        Math.min(itemResult.itemLevel, party.currentFloor)
      );
      character.combatantProperties.inventory.shards -= actionPrice;

      // post combat log message about the crafted result with hoverable item inspection link
      const style = COMBAT_LOG_MESSAGE_STYLES_BY_MESSAGE_TYPE[GameMessageType.CraftingAction];
      let craftingResultMessage = "";

      switch (craftingAction) {
        case CraftingAction.Repair:
          break;
        case CraftingAction.Reform:
        case CraftingAction.Shake:
          craftingResultMessage = ` resulting in ${item.entityProperties.name}`;
          break;
        case CraftingAction.Imbue:
        case CraftingAction.Augment:
        case CraftingAction.Tumble:
          craftingResultMessage = ` and created ${item.entityProperties.name}`;
      }

      combatLogMessage = new CombatLogMessage(
        `${character.entityProperties.name} ${CRAFTING_ACTION_PAST_TENSE_STRINGS[craftingAction]} ${itemNameBeforeModificaction}${craftingResultMessage}`,
        style
      );
    } else {
      setAlert("Server sent crafting results of a consumable?");
    }
  });

  useGameStore.getState().mutateState((state) => {
    state.combatLogMessages.push(combatLogMessage);
  });
}
