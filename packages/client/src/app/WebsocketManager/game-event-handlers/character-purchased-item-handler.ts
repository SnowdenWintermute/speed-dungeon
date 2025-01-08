import { GameState } from "@/stores/game-store";
import { CharacterAssociatedData, Consumable, EntityId, Inventory } from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { plainToInstance } from "class-transformer";
import { setAlert } from "@/app/components/alerts";

export default function characterPurchasedItemHandler(eventData: {
  characterId: EntityId;
  item: Consumable;
  price: number;
}) {
  const { item, characterId, price } = eventData;
  characterAssociatedDataProvider(
    characterId,
    ({ character }: CharacterAssociatedData, _gameState: GameState) => {
      const asClassInstance = plainToInstance(Consumable, item);
      const { inventory } = character.combatantProperties;
      inventory.shards -= price;
      Inventory.insertItem(inventory, asClassInstance);
      setAlert(`Purchased ${item.entityProperties.name}`, true);
    }
  );
}
