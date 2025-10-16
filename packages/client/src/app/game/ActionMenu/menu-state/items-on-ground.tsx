import { ItemsMenuState } from "./items";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { websocketConnection } from "@/singletons/websocket-connection";
import { ClientToServerEvent, Inventory, Item } from "@speed-dungeon/common";
import { takeItem } from "../../ItemsOnGround/ItemOnGround";
import { setInventoryOpen } from "./common-buttons/open-inventory";
import { ActionMenuButtonProperties } from "./action-menu-button-properties";
import { MenuStateType } from "./menu-state-type";
import { ActionButtonCategory } from "./action-buttons-by-category";
import { AppStore } from "@/mobx-stores/app-store";

const takeAllItemsHotkey = HOTKEYS.MAIN_2;

export class ItemsOnGroundMenuState extends ItemsMenuState {
  constructor() {
    const takeAllButton = new ActionMenuButtonProperties(
      () => `Take items (${letterFromKeyCode(takeAllItemsHotkey)})`,
      `Take items (${letterFromKeyCode(takeAllItemsHotkey)})`,
      () => {
        const { gameStore } = AppStore.get();
        const focusedCharacterId = gameStore.getExpectedFocusedCharacterId();
        const party = gameStore.getExpectedParty();
        const itemIds = Inventory.getItems(party.currentRoom.inventory).map(
          (item) => item.entityProperties.id
        );
        websocketConnection.emit(ClientToServerEvent.PickUpItems, {
          characterId: focusedCharacterId,
          itemIds,
        });
      }
    );
    takeAllButton.dedicatedKeys = [takeAllItemsHotkey];

    super(
      MenuStateType.ItemsOnGround,
      { text: "Go Back", hotkeys: [] },
      takeItem,
      () => {
        const party = AppStore.get().gameStore.getExpectedParty();
        return Inventory.getItems(party.currentRoom.inventory);
      },
      {
        extraButtons: {
          [ActionButtonCategory.Top]: [setInventoryOpen, takeAllButton],
        },
        shouldBeDisabled: (_item: Item) => {
          return !AppStore.get().gameStore.getExpectedFocusedCharacterId();
        },
      }
    );
  }
}
