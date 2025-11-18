import { AppStore } from "@/mobx-stores/app-store";
import {
  CONSUMABLE_TYPE_STRINGS,
  ClientToServerEvent,
  Consumable,
  ConsumableType,
  Item,
  getConsumableShardPrice,
} from "@speed-dungeon/common";
import React from "react";
import { ActionMenuNumberedButton } from "./ActionMenuNumberedButton";
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

  const { focusStore, gameStore, imageStore } = AppStore.get();

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
        extraStyles="absolute right-0 -translate-x-[100%] top-1/2 -translate-y-1/2"
        price={price}
        shardsOwned={focusedCharacter.combatantProperties.inventory.shards}
      />
    </ItemButton>
  );

  // const purchaseItemButton = new ActionMenuButtonProperties(
  //   () => (
  //     <ItemButtonBody
  //       gradientOverride={consumableGradientBg}
  //       thumbnailOption={thumbnailOption}
  //       containerExtraStyles={CONSUMABLE_TEXT_COLOR}
  //       imageExtraStyles="scale-[300%]"
  //       imageHoverStyles="-translate-x-[55px]"
  //     >
  //       <div
  //         className="h-full flex justify-between items-center w-full pr-2"
  //         onMouseEnter={() => {
  //           focusStore.detailables.setHovered(createDummyConsumable(consumableType));
  //         }}
  //         onMouseLeave={() => {
  //           focusStore.detailables.clearHovered();
  //         }}
  //       >
  //         <div className="flex items-center whitespace-nowrap overflow-hidden overflow-ellipsis flex-1">
  //           {CONSUMABLE_TYPE_STRINGS[consumableType]}
  //         </div>
  //         <PriceDisplay
  //           price={price}
  //           shardsOwned={focusedCharacter.combatantProperties.inventory.shards}
  //         />
  //       </div>
  //     </ItemButtonBody>
  //   ),
  //   ,
  // );
});
