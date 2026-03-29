import { Item, getItemSellPrice } from "@speed-dungeon/common";
import { ActionMenuScreen } from ".";
import makeAutoObservable from "mobx-store-inheritance";
import { ClientApplication } from "../../";
import { ActionMenuScreenType } from "../screen-types";
import { ConfirmConvertToShardsActionMenuScreen } from "./convert-to-shards-confirm";
import {
  ActionMenuTopSectionItem,
  ActionMenuTopSectionItemType,
  ActionMenuNumberedButtonDescriptor,
} from "../action-menu-display-data";

export class ConvertToShardItemSelectionActionMenuScreen extends ActionMenuScreen {
  constructor(clientApplication: ClientApplication) {
    super(clientApplication, ActionMenuScreenType.ShardItemSelection);
    makeAutoObservable(this);
  }

  getTopSection(): ActionMenuTopSectionItem[] {
    return [
      { type: ActionMenuTopSectionItemType.GoBack, data: {} },
      { type: ActionMenuTopSectionItemType.ToggleInventory, data: undefined },
      { type: ActionMenuTopSectionItemType.VendingMachineShards, data: undefined },
    ];
  }

  getNumberedButtons(): ActionMenuNumberedButtonDescriptor[] {
    const { combatantFocus, detailableEntityFocus, actionMenu } = this.clientApplication;
    const focusedCharacter = combatantFocus.requireFocusedCharacter();
    const { combatantProperties } = focusedCharacter;
    const allOwnedItems = combatantProperties.inventory.getAllOwned();
    const clientApplication = this.clientApplication;

    function clickHandler(item: Item) {
      detailableEntityFocus.detailables.setDetailed(item);
      detailableEntityFocus.detailables.setHovered(item);
      actionMenu.pushStack(
        new ConfirmConvertToShardsActionMenuScreen(
          clientApplication,
          item,
          ActionMenuScreenType.ConfimConvertToShards
        )
      );
    }

    return ActionMenuScreen.getItemButtonsFromList(
      allOwnedItems,
      clickHandler,
      () => false,
      {
        getShowEquippedStatus: (item) =>
          combatantProperties.equipment.isWearingItemWithId(item.entityProperties.id),
        getPrice: (item) => getItemSellPrice(item),
      }
    );
  }
}
