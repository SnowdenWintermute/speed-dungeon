import React from "react";
import { PaperDoll } from "./PaperDoll";
import InventoryCapacityDisplay from "./InventoryCapacityDisplay";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { HOTKEYS } from "@/hotkeys";
import { MenuStateType } from "../ActionMenu/menu-state";
import { ShardsDisplay } from "./ShardsDisplay";
import { DropShardsModal } from "./DropShardsModal";
import CharacterAttributes from "./CharacterAttributes";
import { useGameStore } from "@/stores/game-store";
import { ERROR_MESSAGES } from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import { AppStore } from "@/mobx-stores/app-store";
import { DialogElementName } from "@/mobx-stores/dialogs";

export const PaperDollAndAttributes = observer(() => {
  const { dialogStore, actionMenuStore } = AppStore.get();
  const viewingDropShardsModal = dialogStore.isOpen(DialogElementName.DropShards);
  const currentMenu = actionMenuStore.getCurrentMenu();

  const partyResult = useGameStore().getParty();
  if (partyResult instanceof Error) return <div>{partyResult.message}</div>;
  const focusedCharacterResult = useGameStore().getFocusedCharacter();
  const focusedCharacterOption =
    focusedCharacterResult instanceof Error ? null : focusedCharacterResult;
  if (!focusedCharacterOption) return <div>{ERROR_MESSAGES.COMBATANT.NOT_FOUND}</div>;

  return (
    <div className="flex">
      <div className="flex flex-col justify-between mr-5">
        <PaperDoll combatant={focusedCharacterOption} />
        <div className={"flex justify-between items-end"}>
          <InventoryCapacityDisplay />
          <div className="relative">
            <HoverableTooltipWrapper tooltipText="Drop shards (A)">
              <HotkeyButton
                className="disabled:opacity-50"
                hotkeys={[HOTKEYS.MAIN_2]}
                disabled={currentMenu.type !== MenuStateType.InventoryItems}
                onClick={() => {
                  dialogStore.close(DialogElementName.DropShards);
                }}
              >
                <ShardsDisplay
                  numShards={focusedCharacterOption.combatantProperties.inventory.shards}
                />
              </HotkeyButton>
            </HoverableTooltipWrapper>
            {viewingDropShardsModal === true && actionMenuStore.shouldShowCharacterSheet() && (
              <DropShardsModal
                className="absolute bottom-0 right-0 border border-slate-400"
                min={0}
                max={focusedCharacterOption.combatantProperties.inventory.shards}
              />
            )}
          </div>
        </div>
      </div>
      <CharacterAttributes
        combatant={focusedCharacterOption}
        showAttributeAssignmentButtons={true}
      />
    </div>
  );
});
