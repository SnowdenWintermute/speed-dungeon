import { AppStore } from "@/mobx-stores/app-store";
import {
  CONSUMABLE_TYPE_STRINGS,
  ClientToServerEvent,
  Consumable,
  Item,
  getConsumableShardPrice,
} from "@speed-dungeon/common";
import React from "react";
import { websocketConnection } from "@/singletons/websocket-connection";
import { observer } from "mobx-react-lite";
import { ItemButton } from "./ItemButton";
import { PriceDisplay } from "@/app/game/character-sheet/ShardsDisplay";

interface Props {
  item: Item;
  listIndex: number;
}

export const PurchaseItemButton = observer((props: Props) => {
  const { item, listIndex } = props;

  if (!(item instanceof Consumable)) {
    return <div>unhandled purchaseable item type</div>;
  }

  const { gameStore } = AppStore.get();

  const focusedCharacter = gameStore.getExpectedFocusedCharacter();
  const party = gameStore.getExpectedParty();

  const userControlsThisCharacter = gameStore.clientUserControlsFocusedCombatant();

  const { consumableType } = item;
  const price = getConsumableShardPrice(
    party.dungeonExplorationManager.getCurrentFloor(),
    consumableType
  );
  const notEnoughShards = focusedCharacter.combatantProperties.inventory.shards < (price || 0);
  const shouldBeDisabled = !userControlsThisCharacter || notEnoughShards;

  return (
    <ItemButton
      item={item}
      text={CONSUMABLE_TYPE_STRINGS[consumableType]}
      hotkeyLabel={(listIndex + 1).toString()}
      hotkeys={[`Digit${listIndex + 1}`]}
      clickHandler={() => {
        websocketConnection.emit(ClientToServerEvent.PurchaseItem, {
          characterId: focusedCharacter.getEntityId(),
          consumableType,
        });
      }}
      disabled={shouldBeDisabled}
    >
      <PriceDisplay
        extraStyles="absolute right-2 top-1/2 -translate-y-1/2"
        price={price}
        shardsOwned={focusedCharacter.combatantProperties.inventory.shards}
      />
    </ItemButton>
  );
});
