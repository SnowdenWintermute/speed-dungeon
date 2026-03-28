import React from "react";
import { PaperDoll } from "./PaperDoll";
import { InventoryCapacityDisplay } from "./InventoryCapacityDisplay";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { ShardsDisplay } from "./ShardsDisplay";
import { DropShardsModal } from "./DropShardsModal";
import { CharacterAttributes } from "./CharacterAttributes";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { DialogElementName } from "@/client-application/ui/dialogs";
import { HOTKEYS } from "@/client-application/ui/keybind-config";
import { ActionMenuScreenType } from "@/client-application/action-menu/screen-types";

export const PaperDollAndAttributes = observer(() => {
  const clientApplication = useClientApplication();
  const { uiStore, actionMenu, combatantFocus } = clientApplication;
  const { dialogs } = uiStore;
  const viewingDropShardsModal = dialogs.isOpen(DialogElementName.DropShards);
  const currentMenu = actionMenu.getCurrentMenu();

  const { combatant } = combatantFocus.requireFocusedCharacterContext();

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
                disabled={currentMenu.type !== ActionMenuScreenType.InventoryItems}
                onClick={() => {
                  dialogs.toggle(DialogElementName.DropShards);
                }}
              >
                <ShardsDisplay numShards={combatant.combatantProperties.inventory.shards} />
              </HotkeyButton>
            </HoverableTooltipWrapper>
            {viewingDropShardsModal === true && actionMenu.shouldShowCharacterSheet() && (
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
