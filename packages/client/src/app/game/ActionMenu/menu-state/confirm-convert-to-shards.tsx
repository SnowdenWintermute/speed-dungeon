import { useGameStore } from "@/stores/game-store";
import { ActionButtonCategory, ActionButtonsByCategory, ActionMenuState, MenuStateType } from ".";
import { ClientToServerEvent, Item } from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import { setAlert } from "@/app/components/alerts";
import { clientUserControlsCombatant } from "@/utils/client-user-controls-combatant";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { createCancelButton } from "./common-buttons/cancel";
import { AppStore } from "@/mobx-stores/app-store";
import { ActionMenuButtonProperties } from "./action-menu-button-properties";

const confirmShardHotkey = HOTKEYS.MAIN_1;
const confirmShardLetter = letterFromKeyCode(confirmShardHotkey);
export const CONFIRM_SHARD_TEXT = `Convert (${confirmShardLetter})`;

export class ConfirmConvertToShardsMenuState extends ActionMenuState {
  constructor(
    public item: Item,
    // the reason we take the type as an argument is because of the difference
    // between sharding from the inventory (in which case we want to keep viewing the inventory)
    // or the vending machine menu, in which case we choose MenuStateType.ConfimConvertToShards
    // which doesn't trigger shouldShowCharacterSheet()
    public type: MenuStateType.ItemSelected | MenuStateType.ConfimConvertToShards
  ) {
    super(type, 1);
  }
  getButtonProperties(): ActionButtonsByCategory {
    const toReturn = new ActionButtonsByCategory();

    toReturn[ActionButtonCategory.Top].push(
      createCancelButton([], () => {
        // when operating the vending machine we want to clear the item
        // selection, but not when in inventory
        if (this.type === MenuStateType.ConfimConvertToShards) {
          AppStore.get().focusStore.selectItem(null);
        }
      })
    );

    const focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
    if (focusedCharacterResult instanceof Error) {
      setAlert(focusedCharacterResult.message);
      return toReturn;
    }

    const characterId = focusedCharacterResult.entityProperties.id;
    const userControlsThisCharacter = clientUserControlsCombatant(characterId);
    const itemId = this.item.entityProperties.id;

    const confirmShardButton = new ActionMenuButtonProperties(
      () => `Convert (${confirmShardLetter})`,
      `Convert (${confirmShardLetter})`,
      () => {
        websocketConnection.emit(ClientToServerEvent.ConvertItemsToShards, {
          characterId,
          itemIds: [itemId],
        });
        AppStore.get().actionMenuStore.popStack();
        if (this.type === MenuStateType.ItemSelected) {
          // converting to shards from the inventory nessecitates going back two
          // stacked menus since we go itemSelected -> confirmShard and now that the item is
          // shards it doesn't make sense we would have it selected
          AppStore.get().actionMenuStore.popStack();
        }
        AppStore.get().focusStore.clearItemComparison();
      }
    );

    confirmShardButton.dedicatedKeys = ["Enter", confirmShardHotkey];
    confirmShardButton.shouldBeDisabled = !userControlsThisCharacter;
    toReturn[ActionButtonCategory.Top].push(confirmShardButton);

    return toReturn;
  }
}
