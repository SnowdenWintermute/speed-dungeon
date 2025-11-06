import { viewEquipmentHotkey } from "./equipped-items";
import { letterFromKeyCode } from "@/hotkeys";
import {
  CONSUMABLE_TYPE_STRINGS,
  getSkillBookName,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { toggleInventoryHotkey } from "./common-buttons/open-inventory";
import { AppStore } from "@/mobx-stores/app-store";
import { ActionMenuButtonProperties } from "./action-menu-button-properties";
import { MenuStateType } from "./menu-state-type";
import { ActionButtonsByCategory } from "./action-buttons-by-category";
import { MenuStatePool } from "@/mobx-stores/action-menu/menu-state-pool";
import { ActionMenuState } from ".";
import { ReactNode } from "react";
import { ItemButton } from "./common-buttons/ItemButton";
import { ItemUtils } from "@speed-dungeon/common";

export class InventoryItemsMenuState extends ActionMenuState {
  constructor() {
    super(MenuStateType.Base);
    const viewEquipmentButton = new ActionMenuButtonProperties(
      () => `Equipped (${letterFromKeyCode(viewEquipmentHotkey)})`,
      `Equipped (${letterFromKeyCode(viewEquipmentHotkey)})`,
      () => {
        AppStore.get().actionMenuStore.pushStack(
          MenuStatePool.get(MenuStateType.ViewingEquipedItems)
        );
      }
    );
    viewEquipmentButton.dedicatedKeys = [viewEquipmentHotkey];

    const closeButtonAndHotkeys = { text: "Cancel", hotkeys: ["KeyI", toggleInventoryHotkey] };

    // super(
    //   MenuStateType.InventoryItems,
    //   closeButtonAndHotkeys,
    //   (item: Item) => {
    //     AppStore.get().focusStore.selectItem(item);
    //     AppStore.get().actionMenuStore.pushStack(new ConsideringItemMenuState(item));
    //   },
    //   () => {
    //     const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();
    //     return focusedCharacter.combatantProperties.inventory.getItems();
    //   },
    //   {
    //     extraButtons: {
    //       [ActionButtonCategory.Top]: [viewEquipmentButton, setViewingAbilityTreeAsFreshStack],
    //     },
    //   }
    // );
  }

  getButtonProperties(): ActionButtonsByCategory {
    throw new Error("Method not implemented.");
  }

  getTopSection(): ReactNode {
    return <div>top</div>;
  }

  recalculateButtons(): void {
    console.log("calcluated inventory numberedButtons");
    const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();
    const itemsInInventory = focusedCharacter.combatantProperties.inventory.getItems();
    const stackedItems = ItemUtils.sortIntoStacks(itemsInInventory);

    const newNumberedButtons: ReactNode[] = [];

    const { equipmentAndShardStacks, consumablesByTypeAndLevel } = stackedItems;

    for (const [consumableType, consumableStacksByLevel] of iterateNumericEnumKeyedRecord(
      consumablesByTypeAndLevel
    )) {
      const entries = Object.entries(consumableStacksByLevel);
      for (const [itemLevelString, consumableStack] of entries) {
        const itemLevel = parseInt(itemLevelString);

        const firstConsumableOfThisType = consumableStack[0];
        if (!firstConsumableOfThisType) continue;

        let consumableName = getSkillBookName(consumableType, itemLevel);
        if (consumableStack.length > 1) consumableName += ` (${consumableStack.length})`;

        const thumbnailId = CONSUMABLE_TYPE_STRINGS[consumableType];
        const thumbnailOption = AppStore.get().imageStore.getItemThumbnailOption(thumbnailId);

        newNumberedButtons.push(
          <ItemButton
            key={firstConsumableOfThisType.entityProperties.id}
            item={firstConsumableOfThisType}
            thumbnailOption={thumbnailOption}
            imageExtraStyles="scale-[300%]"
            imageHoverStyles="-translate-x-[55px]"
            alternateClickStyle="cursor-alias"
          />
        );

        this.numberedButtons = newNumberedButtons;
        // () => {
        //   this.itemButtonClickHandler(firstConsumableOfThisType);
        // }
        // );
        // button.mouseEnterHandler = () => itemButtonMouseEnterHandler(firstConsumableOfThisType);
        // button.mouseLeaveHandler = () => itemButtonMouseLeaveHandler();
        // button.focusHandler = () => itemButtonMouseEnterHandler(firstConsumableOfThisType);
        // button.blurHandler = () => itemButtonMouseLeaveHandler();
        // button.alternateClickHandler = () => postItemLink(firstConsumableOfThisType);
        // button.shouldBeDisabled = this.options.shouldBeDisabled
        // ? this.options.shouldBeDisabled(firstConsumableOfThisType)
        // : false;
        // toReturn[ActionButtonCategory.Numbered].push(button);
      }
    }

    // for (const item of equipmentAndShardStacks) {
    //   const thumbnailOption = AppStore.get().imageStore.getItemThumbnailOption(
    //     item.entityProperties.id
    //   );

    //   const buttonText = buttonTextPrefix + item.entityProperties.name;
    //   let imageExtraStyles =
    //     item instanceof Equipment && item.isWeapon()
    //       ? "scale-[300%]"
    //       : "scale-[200%] -translate-x-1/2 p-[2px]";

    //   const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();
    //   const requirementsMet =
    //     Item.requirementsMet(
    //       item,
    //       focusedCharacter.combatantProperties.attributeProperties.getTotalAttributes()
    //     ) && !(item instanceof Equipment && item.isBroken());

    //   let containerExtraStyles = "";
    //   if (!requirementsMet) {
    //     containerExtraStyles += ` ${UNMET_REQUIREMENT_TEXT_COLOR}`;

    //     imageExtraStyles += " filter-red";
    //   } else if (item instanceof Equipment && item.isMagical()) {
    //     containerExtraStyles += " text-blue-300";
    //   }
    //   const button = new ActionMenuButtonProperties(
    //     () => (
    //       <ItemButtonBody
    //         containerExtraStyles={containerExtraStyles}
    //         imageExtraStyles={imageExtraStyles}
    //         gradientOverride={!requirementsMet ? unmetRequirementsGradientBg : ""}
    //         thumbnailOption={thumbnailOption}
    //         imageHoverStyles="-translate-x-[55px]"
    //         alternateClickStyle="cursor-alias"
    //         equipmentBaseItem={
    //           item instanceof Equipment
    //             ? item.equipmentBaseItemProperties.taggedBaseEquipment
    //             : undefined
    //         }
    //       >
    //         {buttonText}
    //         {this.options.getItemButtonCustomChildren &&
    //           this.options.getItemButtonCustomChildren(item)}
    //       </ItemButtonBody>
    //     ),
    //     buttonText,
    //     () => {
    //       this.itemButtonClickHandler(item);
    //     }
    //   );

    //   button.mouseEnterHandler = () => itemButtonMouseEnterHandler(item);
    //   button.mouseLeaveHandler = () => itemButtonMouseLeaveHandler();
    //   button.focusHandler = () => itemButtonMouseEnterHandler(item);
    //   button.blurHandler = () => itemButtonMouseLeaveHandler();
    //   button.alternateClickHandler = () => postItemLink(item);
    //   button.shouldBeDisabled = this.options.shouldBeDisabled
    //     ? this.options.shouldBeDisabled(item)
    //     : false;
    //   toReturn[ActionButtonCategory.Numbered].push(button);
    // }

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

  getBottomSection(): ReactNode {
    return <div>bot</div>;
  }
}
