import { ClientIntentType } from "@speed-dungeon/common";
import { ActionMenuScreen } from ".";
import makeAutoObservable from "mobx-store-inheritance";
import { gameClientSingleton } from "@/singletons/lobby-client";
import { ClientApplication } from "@/client-application";
import { HotkeyButtonTypes } from "@/client-application/inputs/keybind-config";
import GoBackButton from "@/app/game/ActionMenu/menu-state/common-buttons/GoBackButton";
import { ActionMenuScreenType } from "../screen-types";
import ToggleInventoryButton from "@/app/game/ActionMenu/menu-state/common-buttons/ToggleInventory";
import ActionMenuTopButton from "@/app/game/ActionMenu/menu-state/common-buttons/ActionMenuTopButton";

export class ItemsOnGroundActionMenuScreen extends ActionMenuScreen {
  constructor(clientApplication: ClientApplication) {
    super(clientApplication, ActionMenuScreenType.ItemsOnGround);
    makeAutoObservable(this);
  }

  getTopSection() {
    const buttonType = HotkeyButtonTypes.TakeAllItems;
    const { keybindConfig, combatantFocus } = this.clientApplication;
    const takeAllKeys = keybindConfig.getKeybind(buttonType);
    const takeAllKeyString = keybindConfig.getKeybindString(buttonType);

    const ownsFocusedCharacter = combatantFocus.clientUserControlsFocusedCombatant({
      includePets: true,
    });

    return (
      <ul className="flex">
        <GoBackButton
          extraFn={() => {
            this.clientApplication.detailableEntityFocus.detailables.clear();
          }}
        />
        <ToggleInventoryButton />
        <ActionMenuTopButton
          hotkeys={takeAllKeys}
          disabled={!ownsFocusedCharacter}
          handleClick={() => {
            const focusedCharacterId =
              this.clientApplication.combatantFocus.requireFocusedCharacterId();
            const party = this.clientApplication.gameContext.requireParty();
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

            this.clientApplication.actionMenu.popStack();
          }}
        >
          Take All ({takeAllKeyString})
        </ActionMenuTopButton>
      </ul>
    );
  }

  getNumberedButtons() {
    const party = this.clientApplication.gameContext.requireParty();
    const itemsOnGround = party.currentRoom.inventory.getItems();

    const ownsFocusedCharacter =
      this.clientApplication.combatantFocus.clientUserControlsFocusedCombatant({
        includePets: true,
      });

    const newNumberedButtons = ActionMenuScreen.getItemButtonsFromList(
      itemsOnGround,
      (item) => {
        this.clientApplication.detailableEntityFocus.detailables.clear();

        this.clientApplication.gameClientRef.get().dispatchIntent({
          type: ClientIntentType.PickUpItems,
          data: {
            characterId: this.clientApplication.combatantFocus.requireFocusedCharacterId(),
            itemIds: [item.entityProperties.id],
          },
        });
      },
      () => !ownsFocusedCharacter
    );

    return newNumberedButtons;
  }
}
