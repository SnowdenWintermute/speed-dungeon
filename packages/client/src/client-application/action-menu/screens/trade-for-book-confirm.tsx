import { ActionMenuScreen } from ".";
import {
  BookConsumableType,
  CONSUMABLE_TYPE_STRINGS,
  ClientIntentType,
  CombatantId,
  INFO_UNICODE_SYMBOL,
  Item,
  ItemId,
  getBookLevelForTrade,
} from "@speed-dungeon/common";
import Divider from "@/app/components/atoms/Divider";
import { IconName, SVG_ICONS } from "@/app/icons";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";
import { gameClientSingleton } from "@/singletons/lobby-client";
import { ClientApplication } from "@/client-application";
import { ActionMenuScreenType } from "../screen-types";
import GoBackButton from "@/app/game/ActionMenu/menu-state/common-buttons/GoBackButton";
import ActionMenuTopButton from "@/app/game/ActionMenu/menu-state/common-buttons/ActionMenuTopButton";

function handleConfirmTrade(
  clientApplication: ClientApplication,
  characterId: CombatantId,
  itemId: ItemId,
  bookType: BookConsumableType
) {
  gameClientSingleton.get().dispatchIntent({
    type: ClientIntentType.TradeItemForBook,
    data: {
      characterId,
      itemId,
      bookType,
    },
  });
  // need to pop twice so we're not showing the item consideration screen of this item that may no longer exist
  clientApplication.actionMenu.popStack();
  clientApplication.actionMenu.popStack();

  clientApplication.detailableEntityFocus.clearItemComparison();
}

export class ConfirmTradeForBookActionMenuScreen extends ActionMenuScreen {
  constructor(
    clientApplication: ClientApplication,
    public item: Item,
    public bookType: BookConsumableType
  ) {
    super(clientApplication, ActionMenuScreenType.ConfirmTradeForBook);
  }

  getTopSection() {
    const { combatantFocus } = this.clientApplication;
    const focusedCharacterId = combatantFocus.requireFocusedCharacterId();
    const userControlsThisCharacter = combatantFocus.clientUserControlsFocusedCombatant();
    const itemId = this.item.getEntityId();

    const shouldBeDisabled = !userControlsThisCharacter;
    const buttonType = HotkeyButtonTypes.Confirm;

    return (
      <ul className="flex w-full">
        <GoBackButton
          extraFn={() => {
            this.clientApplication.detailableEntityFocus.detailables.clear();
          }}
        />
        <ActionMenuTopButton
          hotkeys={this.clientApplication.keybindConfig.getKeybind(buttonType)}
          handleClick={() =>
            handleConfirmTrade(this.clientApplication, focusedCharacterId, itemId, this.bookType)
          }
          disabled={shouldBeDisabled}
        >
          Confirm trade ({this.clientApplication.keybindConfig.getKeybindString(buttonType)})
        </ActionMenuTopButton>
      </ul>
    );
  }

  getCentralSection() {
    const focusedCharacter = this.clientApplication.combatantFocus.requireFocusedCharacter();

    const party = this.clientApplication.gameContext.requireParty();
    const vendingMachineLevel = party.dungeonExplorationManager.getCurrentFloor();
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
              this.clientApplication,
              focusedCharacter.getEntityId(),
              this.item.getEntityId(),
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
}
