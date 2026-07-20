import { ClientApplication } from "../../";
import { ActionMenuScreen } from ".";
import { ActionMenuScreenType } from "../screen-types";
import {
  ActionMenuTopSectionItem,
  ActionMenuTopSectionItemType,
  ActionMenuNumberedButtonDescriptor,
} from "../action-menu-display-data";
import {
  ClientIntentType,
  CraftingAction,
  Equipment,
  Item,
  PlayerShardPool,
  getCraftingActionPrice,
} from "@speed-dungeon/common";

export class RepairItemSelectionActionMenuScreen extends ActionMenuScreen {
  constructor(clientApplication: ClientApplication) {
    super(clientApplication, ActionMenuScreenType.RepairItemSelection);
  }

  getTopSection(): ActionMenuTopSectionItem[] {
    return [
      { type: ActionMenuTopSectionItemType.GoBack, data: {} },
      { type: ActionMenuTopSectionItemType.ToggleInventory, data: undefined },
      { type: ActionMenuTopSectionItemType.VendingMachineShards, data: undefined },
    ];
  }

  getNumberedButtons(): ActionMenuNumberedButtonDescriptor[] {
    const { combatantFocus, gameContext, gameClientRef, uiStore } = this.clientApplication;
    const focusedCharacter = combatantFocus.requireFocusedCharacter();
    const { combatantProperties } = focusedCharacter;
    const damagedEquipment = combatantProperties.inventory
      .getOwnedEquipment()
      .filter((equipment) => !equipment.isFullyRepaired());
    const shardPool = PlayerShardPool.forCharacter(
      gameContext.requireGame(),
      gameContext.requireParty(),
      focusedCharacter
    );

    const userControlsThisCharacter = combatantFocus.clientUserControlsFocusedCombatant();

    function getRepairPrice(item: Item) {
      if (!(item instanceof Equipment)) {
        return null;
      }
      return getCraftingActionPrice(CraftingAction.Repair, item);
    }

    function clickHandler(item: Item) {
      gameClientRef.get().dispatchIntent({
        type: ClientIntentType.PerformCraftingAction,
        data: {
          characterId: focusedCharacter.getEntityId(),
          itemId: item.getEntityId(),
          craftingAction: CraftingAction.Repair,
        },
      });
    }

    return ActionMenuScreen.getItemButtonsFromList(
      uiStore.keybinds,
      damagedEquipment,
      clickHandler,
      (item) => {
        const price = getRepairPrice(item);
        if (price === null) {
          return true;
        }
        return !userControlsThisCharacter || !shardPool.canAffordShardPrice(price);
      },
      {
        getShowEquippedStatus: (item) =>
          combatantProperties.equipment.isWearingItemWithId(item.entityProperties.id),
        getPrice: getRepairPrice,
        getDurability: (item) => (item instanceof Equipment ? item.getDurability() : null),
        shardsOwned: shardPool.getTotalShards(),
      }
    );
  }
}
