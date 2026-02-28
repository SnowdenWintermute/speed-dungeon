import { CharacterAndItem, CharacterAssociatedData, ClientIntentType } from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { gameClientSingleton } from "@/singletons/lobby-client";

export function characterDroppedItemHandler(characterAndItem: CharacterAndItem) {
  const { characterId, itemId } = characterAndItem;
  gameClientSingleton.get().dispatchIntent({
    type: ClientIntentType.AcknowledgeReceiptOfItemOnGroundUpdate,
    data: {
      itemId,
    },
  });

  characterAssociatedDataProvider(characterId, ({ party, character }: CharacterAssociatedData) => {
    character.combatantProperties.inventory.dropItem(party, itemId);
  });
}
