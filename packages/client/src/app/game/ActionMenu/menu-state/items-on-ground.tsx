import { ClientIntentType } from "@speed-dungeon/common";
import { takeItem } from "../../ItemsOnGround/ItemOnGround";
import { ActionMenuScreenType } from "./menu-state-type";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { ActionMenuScreen } from ".";
import GoBackButton from "./common-buttons/GoBackButton";
import ActionMenuTopButton from "./common-buttons/ActionMenuTopButton";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";
import ToggleInventoryButton from "./common-buttons/ToggleInventory";
import makeAutoObservable from "mobx-store-inheritance";
import { gameClientSingleton } from "@/singletons/lobby-client";

export class ItemsOnGroundActionMenuScreen extends ActionMenuScreen {
  constructor() {
    super(ActionMenuScreenType.ItemsOnGround);
    makeAutoObservable(this);
  }

  getTopSection() {
    const { hotkeysStore } = AppStore.get();
    const buttonType = HotkeyButtonTypes.TakeAllItems;
    const takeAllKeys = hotkeysStore.getKeybind(buttonType);
    const takeAllKeyString = hotkeysStore.getKeybindString(buttonType);

    const ownsFocusedCharacter = AppStore.get().gameStore.clientUserControlsFocusedCombatant({
      includePets: true,
    });

    return (
      <ul className="flex">
        <GoBackButton
          extraFn={() => {
            const { focusStore } = AppStore.get();
            focusStore.detailables.clear();
          }}
        />
        <ToggleInventoryButton />
        <ActionMenuTopButton
          hotkeys={takeAllKeys}
          disabled={!ownsFocusedCharacter}
          handleClick={() => {
            const { gameStore, actionMenuStore } = AppStore.get();
            const focusedCharacterId = gameStore.getExpectedFocusedCharacterId();
            const party = gameStore.getExpectedParty();
            const itemIds = party.currentRoom.inventory
              .getItems()
              .map((item) => item.entityProperties.id);

            gameClientSingleton.get().dispatchIntent({
              type: ClientIntentType.PickUpItems,
              data: {
                characterId: focusedCharacterId,
                itemIds,
              },
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

    const ownsFocusedCharacter = AppStore.get().gameStore.clientUserControlsFocusedCombatant({
      includePets: true,
    });

    const newNumberedButtons = ActionMenuScreen.getItemButtonsFromList(
      itemsOnGround,
      takeItem,
      () => !ownsFocusedCharacter
    );

    return newNumberedButtons;
  }
}
