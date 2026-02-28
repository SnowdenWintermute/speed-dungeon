import { gameClientSingleton } from "@/singletons/lobby-client";
import { ClientIntentType, Item } from "@speed-dungeon/common";

export function postItemLink(item: Item) {
  gameClientSingleton.get().dispatchIntent({
    type: ClientIntentType.PostItemLink,
    data: { itemId: item.getEntityId() },
  });
}
