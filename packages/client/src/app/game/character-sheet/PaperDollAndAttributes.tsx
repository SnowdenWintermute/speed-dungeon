import React from "react";
import { PaperDoll } from "./PaperDoll";
import { InventoryCapacityDisplay } from "./InventoryCapacityDisplay";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { HOTKEYS } from "@/hotkeys";
import { ShardsDisplay } from "./ShardsDisplay";
import { DropShardsModal } from "./DropShardsModal";
import { CharacterAttributes } from "./CharacterAttributes";
import { observer } from "mobx-react-lite";
import { AppStore } from "@/mobx-stores/app-store";
import { DialogElementName } from "@/mobx-stores/dialogs";
import { MenuStateType } from "../ActionMenu/menu-state/menu-state-type";

export const PaperDollAndAttributes = observer(() => {
  const { dialogStore, actionMenuStore } = AppStore.get();
  const viewingDropShardsModal = dialogStore.isOpen(DialogElementName.DropShards);
  const currentMenu = actionMenuStore.getCurrentMenu();

  const { party, combatant } = AppStore.get().gameStore.getFocusedCharacterContext();

  return (
    <div className="flex">
      <div className="flex flex-col justify-between mr-5">
        <PaperDoll combatant={combatant} />
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
                <ShardsDisplay numShards={combatant.combatantProperties.inventory.shards} />
              </HotkeyButton>
            </HoverableTooltipWrapper>
            {viewingDropShardsModal === true && actionMenuStore.shouldShowCharacterSheet() && (
              <DropShardsModal
                className="absolute bottom-0 right-0 border border-slate-400"
                min={0}
                max={combatant.combatantProperties.inventory.shards}
              />
            )}
          </div>
        </div>
      </div>
      <CharacterAttributes combatant={combatant} showAttributeAssignmentButtons={true} />
    </div>
  );
});
