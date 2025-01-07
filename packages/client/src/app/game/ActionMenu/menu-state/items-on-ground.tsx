import { immerable } from "immer";
import { ItemsMenuState } from "./items";
import { ActionButtonCategory, ActionMenuButtonProperties, MenuStateType } from ".";
import { inventoryItemsMenuState, useGameStore } from "@/stores/game-store";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { toggleInventoryHotkey } from "./base";
import { websocketConnection } from "@/singletons/websocket-connection";
import { ClientToServerEvent, Inventory } from "@speed-dungeon/common";
import { takeItem } from "../../ItemsOnGround/ItemOnGround";

const takeAllItemsHotkey = HOTKEYS.MAIN_2;

export class ItemsOnGroundMenuState extends ItemsMenuState {
  [immerable] = true;
  page = 1;
  numPages = 1;
  constructor() {
    const switchToInventoryButton = new ActionMenuButtonProperties(
      `Inventory (${letterFromKeyCode(toggleInventoryHotkey)})`,
      () => {
        useGameStore.getState().mutateState((state) => {
          state.stackedMenuStates.push(inventoryItemsMenuState);
        });
      }
    );
    switchToInventoryButton.dedicatedKeys = [toggleInventoryHotkey];

    const takeAllButton = new ActionMenuButtonProperties(
      `Take items (${letterFromKeyCode(takeAllItemsHotkey)})`,
      () => {
        let itemIds: string[] = [];
        const partyResult = useGameStore.getState().getParty();
        if (!(partyResult instanceof Error)) {
          itemIds = Inventory.getItems(partyResult.currentRoom.inventory).map(
            (item) => item.entityProperties.id
          );
        }
        websocketConnection.emit(ClientToServerEvent.PickUpItems, {
          characterId: useGameStore.getState().focusedCharacterId,
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
        const partyResult = useGameStore.getState().getParty();
        if (partyResult instanceof Error) return [];
        return Inventory.getItems(partyResult.currentRoom.inventory);
      },
      {
        [ActionButtonCategory.Top]: [switchToInventoryButton, takeAllButton],
      }
    );
  }
}
