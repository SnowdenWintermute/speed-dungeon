import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import React from "react";
import { ShardsDisplay } from "../character-sheet/ShardsDisplay";
import { DropShardsModal } from "../character-sheet/DropShardsModal";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { DialogElementName } from "@/client-application/ui/dialogs";
import { HOTKEYS } from "@/client-application/ui/keybind-config";

export const VendingMachineShardDisplay = observer(() => {
  const clientApplication = useClientApplication();
  const { actionMenu, uiStore } = clientApplication;
  const viewingCharacterSheet = actionMenu.shouldShowCharacterSheet();

  const viewingDropShardsModal = uiStore.dialogs.isOpen(DialogElementName.DropShards);

  const focusedCharacter = clientApplication.combatantFocus.requireFocusedCharacter();
  const totalShards = focusedCharacter.combatantProperties.inventory.shards;

  return (
    <li className="ml-auto pointer-events-auto">
      <HoverableTooltipWrapper tooltipText="Click to drop shards (A)">
        <HotkeyButton
          className="disabled:opacity-50"
          hotkeys={[HOTKEYS.MAIN_2]}
          onClick={() => {
            uiStore.dialogs.toggle(DialogElementName.DropShards);
          }}
        >
          <ShardsDisplay extraStyles="h-10" numShards={totalShards} />
        </HotkeyButton>
      </HoverableTooltipWrapper>
      {/* for better tab indexing, character sheet has it's own placement of the modal */}
      {viewingDropShardsModal === true && !viewingCharacterSheet && (
        <DropShardsModal
          className="absolute bottom-0 right-0 border border-slate-400"
          min={0}
          max={totalShards}
        />
      )}
    </li>
  );
});
