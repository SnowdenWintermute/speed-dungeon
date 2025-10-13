import { useGameStore } from "@/stores/game-store";
import { ActionButtonCategory, ActionButtonsByCategory, ActionMenuState, MenuStateType } from ".";
import {
  BookConsumableType,
  CONSUMABLE_TYPE_STRINGS,
  ClientToServerEvent,
  EntityId,
  INFO_UNICODE_SYMBOL,
  Item,
  getBookLevelForTrade,
} from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import { setAlert } from "@/app/components/alerts";
import { clientUserControlsCombatant } from "@/utils/client-user-controls-combatant";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { createCancelButton } from "./common-buttons/cancel";
import Divider from "@/app/components/atoms/Divider";
import { IconName, SVG_ICONS } from "@/app/icons";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { AppStore } from "@/mobx-stores/app-store";
import { ActionMenuButtonProperties } from "./action-menu-button-properties";

const confirmHotkey = HOTKEYS.MAIN_1;
const confirmLetter = letterFromKeyCode(confirmHotkey);
export const CONFIRM_SHARD_TEXT = `Confirm trade (${confirmLetter})`;

function handleConfirmTrade(characterId: EntityId, itemId: EntityId, bookType: BookConsumableType) {
  websocketConnection.emit(ClientToServerEvent.TradeItemForBook, {
    characterId,
    itemId,
    bookType,
  });
  // need to pop twice so we're not showing the item consideration screen of this item that may no longer exist
  AppStore.get().actionMenuStore.popStack();
  AppStore.get().actionMenuStore.popStack();

  AppStore.get().focusStore.clearItemComparison();
}

export class ConfirmTradeForBookMenuState extends ActionMenuState {
  constructor(
    public item: Item,
    public bookType: BookConsumableType
  ) {
    super(MenuStateType.ConfirmTradeForBook, 1);
  }

  getCenterInfoDisplayOption() {
    const focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
    if (focusedCharacterResult instanceof Error) return;

    const partyResult = useGameStore.getState().getParty();
    if (partyResult instanceof Error) {
      setAlert(partyResult);
      return;
    }
    const vendingMachineLevel = partyResult.dungeonExplorationManager.getCurrentFloor();
    const bookLevel = getBookLevelForTrade(this.item.itemLevel, vendingMachineLevel);

    return (
      <div className="h-fit bg-slate-700 p-2 border border-slate-400 flex flex-col items-center pointer-events-auto">
        <div className="">{this.item.entityProperties.name}</div>
        <Divider extraStyles="w-full" />
        <p className="mb-1">
          {INFO_UNICODE_SYMBOL} You will recieve a skill book of item level equal to the lower value
          between the item's level ({this.item.itemLevel}) and HALF your current floor level (
          {vendingMachineLevel / 2}).{" "}
        </p>
        <Divider />
        <div className="text-lg bg-slate-700 mb-1 flex justify-center">
          Trade for {CONSUMABLE_TYPE_STRINGS[this.bookType]} V{bookLevel}?
        </div>
        <p className="text-yellow-400 mb-2">This will PERMANENTLY DESTROY the item!</p>
        <HotkeyButton
          onClick={() =>
            handleConfirmTrade(
              focusedCharacterResult.entityProperties.id,
              this.item.entityProperties.id,
              this.bookType
            )
          }
          className="border border-slate-400 bg-slate-800 h-10 px-2 hover:bg-slate-950"
        >
          <div className="flex items-center">
            <div>Confirm</div>
            <div className="relative">{SVG_ICONS[IconName.Book]("fill-yellow-400 h-6")}</div>
          </div>
        </HotkeyButton>{" "}
      </div>
    );
  }

  getButtonProperties(): ActionButtonsByCategory {
    const toReturn = new ActionButtonsByCategory();

    toReturn[ActionButtonCategory.Top].push(
      createCancelButton([], () => {
        const { focusStore } = AppStore.get();
        focusStore.detailable.clearDetailed();
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

    const confirmButton = new ActionMenuButtonProperties(
      () => CONFIRM_SHARD_TEXT,
      CONFIRM_SHARD_TEXT,
      () => handleConfirmTrade(focusedCharacterResult.entityProperties.id, itemId, this.bookType)
    );

    confirmButton.dedicatedKeys = ["Enter", confirmHotkey];
    confirmButton.shouldBeDisabled = !userControlsThisCharacter;
    toReturn[ActionButtonCategory.Top].push(confirmButton);

    return toReturn;
  }
}
