import { useClientApplication } from "@/hooks/create-client-application-context";
import {
  getActionMenuSlotHotkeys,
  getActionMenuSlotLabel,
} from "@/client-application/action-menu/slot-keybinds";
import {
  CONSUMABLE_TYPE_STRINGS,
  ClientIntentType,
  Consumable,
  Item,
  PlayerShardPool,
  getConsumableShardPrice,
} from "@speed-dungeon/common";
import React from "react";
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

  const clientApplication = useClientApplication();
  const { gameContext, combatantFocus, gameClientRef } = clientApplication;
  const { keybinds } = clientApplication.uiStore;
  const party = gameContext.requireParty();
  const focusedCharacter = combatantFocus.requireFocusedCharacter();
  const shardPool = PlayerShardPool.forCharacter(gameContext.requireGame(), party, focusedCharacter);

  const userControlsThisCharacter = combatantFocus.clientUserControlsFocusedCombatant();

  const { consumableType } = item;
  const price = getConsumableShardPrice(
    party.dungeonExplorationManager.getCurrentFloor(),
    consumableType
  );
  const notEnoughShards = !shardPool.canAffordShardPrice(price || 0);
  const shouldBeDisabled = !userControlsThisCharacter || notEnoughShards;

  return (
    <ItemButton
      item={item}
      text={CONSUMABLE_TYPE_STRINGS[consumableType]}
      hotkeyLabel={getActionMenuSlotLabel(keybinds, listIndex + 1)}
      hotkeys={getActionMenuSlotHotkeys(keybinds, listIndex + 1)}
      clickHandler={() => {
        gameClientRef.get().dispatchIntent({
          type: ClientIntentType.PurchaseItem,
          data: {
            characterId: focusedCharacter.getEntityId(),
            consumableType,
          },
        });
      }}
      disabled={shouldBeDisabled}
    >
      <PriceDisplay
        extraStyles="absolute right-2 top-1/2 -translate-y-1/2"
        price={price}
        shardsOwned={shardPool.getTotalShards()}
      />
    </ItemButton>
  );
});
