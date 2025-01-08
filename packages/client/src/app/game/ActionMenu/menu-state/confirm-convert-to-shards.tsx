import { useGameStore } from "@/stores/game-store";
import {
  ActionButtonCategory,
  ActionButtonsByCategory,
  ActionMenuButtonProperties,
  ActionMenuState,
  MenuStateType,
} from ".";
import { ClientToServerEvent, Item } from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import { setAlert } from "@/app/components/alerts";
import clientUserControlsCombatant from "@/utils/client-user-controls-combatant";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { createCancelButton } from "./common-buttons/cancel";

const confirmShardHotkey = HOTKEYS.MAIN_1;
const confirmShardLetter = letterFromKeyCode(confirmShardHotkey);
export const CONFIRM_SHARD_TEXT = `Convert (${confirmShardLetter})`;

export class ConfirmConvertToShardsMenuState implements ActionMenuState {
  page = 1;
  numPages: number = 1;
  type = MenuStateType.ItemSelected;
  constructor(public item: Item) {}
  getButtonProperties(): ActionButtonsByCategory {
    const toReturn = new ActionButtonsByCategory();

    toReturn[ActionButtonCategory.Top].push(createCancelButton([]));

    const focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
    if (focusedCharacterResult instanceof Error) {
      setAlert(focusedCharacterResult.message);
      return toReturn;
    }

    const characterId = focusedCharacterResult.entityProperties.id;
    const userControlsThisCharacter = clientUserControlsCombatant(characterId);
    const itemId = this.item.entityProperties.id;

    const confirmShardButton = new ActionMenuButtonProperties(
      `Convert (${confirmShardLetter})`,
      `Convert (${confirmShardLetter})`,
      () => {
        websocketConnection.emit(ClientToServerEvent.ConvertItemsToShards, {
          characterId,
          itemIds: [itemId],
        });
        useGameStore.getState().mutateState((state) => {
          state.stackedMenuStates.pop();
          state.stackedMenuStates.pop();
          state.comparedItem = null;
          state.detailedEntity = null;
        });
      }
    );

    confirmShardButton.dedicatedKeys = ["Enter", confirmShardHotkey];
    confirmShardButton.shouldBeDisabled = !userControlsThisCharacter;
    toReturn[ActionButtonCategory.Top].push(confirmShardButton);

    return toReturn;
  }
}
