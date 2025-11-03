import { CharacterAssociatedData, Consumable, EntityId } from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { plainToInstance } from "class-transformer";
import { setAlert } from "@/app/components/alerts";

export function characterPurchasedItemHandler(eventData: {
  characterId: EntityId;
  item: Consumable;
  price: number;
}) {
  const { item, characterId, price } = eventData;
  characterAssociatedDataProvider(characterId, ({ character }: CharacterAssociatedData) => {
    const asClassInstance = plainToInstance(Consumable, item);
    const { inventory } = character.combatantProperties;
    inventory.changeShards(price * -1);
    inventory.insertItem(asClassInstance);
    setAlert(`Purchased ${item.entityProperties.name}`, true);
  });
}
