import {
  CharacterAssociatedData,
  CraftingAction,
  EntityId,
  Inventory,
  Item,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";

export function characterPerformedCraftingActionHandler(eventData: {
  characterId: EntityId;
  item: Item;
  craftingAction: CraftingAction;
}) {
  const { characterId, item, craftingAction } = eventData;

  characterAssociatedDataProvider(characterId, ({ party, character }: CharacterAssociatedData) => {
    const itemResult = Inventory.getItem(
      character.combatantProperties.inventory,
      item.entityProperties.id
    );
    if (itemResult instanceof Error) return itemResult;

    // implement Item.copyFrom()
    // post combat log message about the crafted result with hoverable item inspection link
  });
}
