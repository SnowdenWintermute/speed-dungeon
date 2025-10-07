import { immerable } from "immer";
import { ItemsMenuState } from "./items";
import { ActionButtonCategory, ActionMenuButtonProperties, MenuStateType } from ".";
import { useGameStore } from "@/stores/game-store";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { websocketConnection } from "@/singletons/websocket-connection";
import { ClientToServerEvent, Inventory, Item } from "@speed-dungeon/common";
import { takeItem } from "../../ItemsOnGround/ItemOnGround";
import { setInventoryOpen } from "./common-buttons/open-inventory";
import { clientUserControlsCombatant } from "@/utils/client-user-controls-combatant";

const takeAllItemsHotkey = HOTKEYS.MAIN_2;

export class ItemsOnGroundMenuState extends ItemsMenuState {
  [immerable] = true;
  page = 1;
  numPages = 1;
  constructor() {
    const takeAllButton = new ActionMenuButtonProperties(
      () => `Take items (${letterFromKeyCode(takeAllItemsHotkey)})`,
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
        extraButtons: {
          [ActionButtonCategory.Top]: [setInventoryOpen, takeAllButton],
        },
        shouldBeDisabled: (_item: Item) => {
          const focusedCharacterId = useGameStore.getState().focusedCharacterId;
          return !clientUserControlsCombatant(focusedCharacterId);
        },
      }
    );
  }
}
