import { websocketConnection } from "@/singletons/websocket-connection";
import { ClientToServerEvent } from "@speed-dungeon/common";
import { takeItem } from "../../ItemsOnGround/ItemOnGround";
import { MenuStateType } from "./menu-state-type";
import { AppStore } from "@/mobx-stores/app-store";
import { ActionMenuState } from ".";
import GoBackButton from "./common-buttons/GoBackButton";
import ActionMenuTopButton from "./common-buttons/ActionMenuTopButton";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";
import ToggleInventoryButton from "./common-buttons/ToggleInventory";
import makeAutoObservable from "mobx-store-inheritance";

export class ItemsOnGroundMenuState extends ActionMenuState {
  constructor() {
    super(MenuStateType.ItemsOnGround);
    makeAutoObservable(this);
  }

  getTopSection() {
    const { hotkeysStore } = AppStore.get();
    const buttonType = HotkeyButtonTypes.TakeAllItems;
    const takeAllKeys = hotkeysStore.getKeybind(buttonType);
    const takeAllKeyString = hotkeysStore.getKeybindString(buttonType);

    return (
      <ul className="flex">
        <GoBackButton />
        <ToggleInventoryButton />
        <ActionMenuTopButton
          hotkeys={takeAllKeys}
          handleClick={() => {
            const { gameStore, actionMenuStore } = AppStore.get();
            const focusedCharacterId = gameStore.getExpectedFocusedCharacterId();
            const party = gameStore.getExpectedParty();
            const itemIds = party.currentRoom.inventory
              .getItems()
              .map((item) => item.entityProperties.id);

            websocketConnection.emit(ClientToServerEvent.PickUpItems, {
              characterId: focusedCharacterId,
              itemIds,
            });

            actionMenuStore.popStack();
          }}
        >
          Take All ({takeAllKeyString})
        </ActionMenuTopButton>
      </ul>
    );
  }

  getNumberedButtons() {
    const party = AppStore.get().gameStore.getExpectedParty();
    const itemsOnGround = party.currentRoom.inventory.getItems();

    const ownsFocusedCharacter = AppStore.get().gameStore.clientUserControlsFocusedCombatant();

    const newNumberedButtons = ActionMenuState.getItemButtonsFromList(
      itemsOnGround,
      takeItem,
      () => ownsFocusedCharacter
    );

    return newNumberedButtons;
  }
}
