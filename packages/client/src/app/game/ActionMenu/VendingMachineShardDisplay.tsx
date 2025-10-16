import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { HOTKEYS } from "@/hotkeys";
import React from "react";
import { ShardsDisplay } from "../character-sheet/ShardsDisplay";
import { DropShardsModal } from "../character-sheet/DropShardsModal";
import { observer } from "mobx-react-lite";
import { AppStore } from "@/mobx-stores/app-store";
import { DialogElementName } from "@/mobx-stores/dialogs";

export const VendingMachineShardDisplay = observer(() => {
  const { actionMenuStore } = AppStore.get();
  const viewingCharacterSheet = actionMenuStore.shouldShowCharacterSheet();

  const { dialogStore } = AppStore.get();
  const viewingDropShardsModal = dialogStore.isOpen(DialogElementName.DropShards);

  const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();
  const totalShards = focusedCharacter.combatantProperties.inventory.shards;

  return (
    <li className="ml-auto pointer-events-auto">
      <HoverableTooltipWrapper tooltipText="The machine seems to want these...">
        <HotkeyButton
          className="disabled:opacity-50"
          hotkeys={[HOTKEYS.MAIN_2]}
          onClick={() => {
            dialogStore.close(DialogElementName.DropShards);
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
