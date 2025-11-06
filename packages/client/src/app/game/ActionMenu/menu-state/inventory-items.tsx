import { viewEquipmentHotkey } from "./equipped-items";
import { letterFromKeyCode } from "@/hotkeys";
import {
  Consumable,
  getSkillBookName,
  Item,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { AppStore } from "@/mobx-stores/app-store";
import { MenuStateType } from "./menu-state-type";
import { MenuStatePool } from "@/mobx-stores/action-menu/menu-state-pool";
import { ActionMenuState } from ".";
import { ReactNode } from "react";
import { ItemButton } from "./common-buttons/ItemButton";
import { ItemUtils } from "@speed-dungeon/common";
import { ConsideringItemMenuState } from "./considering-item";
import GoBackButton from "./common-buttons/GoBackButton";
import { toggleInventoryHotkeys } from "./common-buttons/ToggleInventory";
import ActionMenuTopButton from "./common-buttons/ActionMenuTopButton";
import ViewAbilityTreeButton from "./common-buttons/ViewAbilityTreeButton";

export class InventoryItemsMenuState extends ActionMenuState {
  constructor() {
    super(MenuStateType.InventoryItems);
  }

  getTopSection(): ReactNode {
    return (
      <ul className="flex">
        <GoBackButton extraHotkeys={toggleInventoryHotkeys} />
        <ActionMenuTopButton
          hotkeys={[viewEquipmentHotkey]}
          handleClick={() => {
            AppStore.get().actionMenuStore.pushStack(
              MenuStatePool.get(MenuStateType.ViewingEquipedItems)
            );
          }}
        >
          Equipped ({letterFromKeyCode(viewEquipmentHotkey)})
        </ActionMenuTopButton>
        <ViewAbilityTreeButton />
      </ul>
    );
  }

  recalculateButtons(): void {
    const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();
    const itemsInInventory = focusedCharacter.combatantProperties.inventory.getItems();
    const stackedItems = ItemUtils.sortIntoStacks(itemsInInventory);

    const { equipmentAndShardStacks, consumablesByTypeAndLevel } = stackedItems;

    function itemButtonClickHandler(item: Item) {
      AppStore.get().focusStore.selectItem(item);
      AppStore.get().actionMenuStore.pushStack(new ConsideringItemMenuState(item));
      console.log("pushed considering item");
    }

    const itemsToMakeButtonsFor: Item[] = [];

    for (const [consumableType, consumableStacksByLevel] of iterateNumericEnumKeyedRecord(
      consumablesByTypeAndLevel
    )) {
      for (const [itemLevelString, consumableStack] of Object.entries(consumableStacksByLevel)) {
        const firstConsumableOfThisType = consumableStack[0];
        if (!firstConsumableOfThisType) continue;
        itemsToMakeButtonsFor.push(firstConsumableOfThisType);
      }
    }

    itemsToMakeButtonsFor.push(...equipmentAndShardStacks);

    const newNumberedButtons = itemsToMakeButtonsFor.map((item, i) => {
      const itemLevel = item.itemLevel;
      let buttonText = item.entityProperties.name;
      if (item instanceof Consumable) {
        const { consumableType } = item;
        const skillBookNameOption = getSkillBookName(consumableType, itemLevel);
        if (skillBookNameOption) buttonText = skillBookNameOption;
        const stackOption = consumablesByTypeAndLevel[consumableType]?.[itemLevel];
        const stackSize = stackOption?.length || 0;
        if (stackSize > 1) buttonText += ` (${stackSize})`;
      }

      const buttonNumber = i + 1;
      return (
        <ItemButton
          key={item.entityProperties.id}
          item={item}
          text={buttonText}
          hotkeyLabel={buttonNumber.toString()}
          hotkeys={[`Digit${buttonNumber}`]}
          clickHandler={itemButtonClickHandler}
        />
      );
    });

    this.numberedButtons = newNumberedButtons;

    this.recalulatePageCount();

    if (this.numberedButtons.length === 0) {
      // toReturn[ActionButtonCategory.Numbered].push(
      //   new ActionMenuButtonProperties(
      //     () => <div>The list of items is empty...</div>,
      //     itemsToShow.length.toString(),
      //     () => {}
      //   )
      // );
    }
  }
}
