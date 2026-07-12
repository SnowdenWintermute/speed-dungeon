import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import React from "react";
import { ShardsDisplay } from "../character-sheet/ShardsDisplay";
import { DropShardsModal } from "../character-sheet/DropShardsModal";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { DialogElementName } from "@/client-application/ui/dialogs";
import { HOTKEYS } from "@/client-application/ui/keybind-config";
import { PlayerShardPool } from "@speed-dungeon/common";

export const VendingMachineShardDisplay = observer(() => {
  const clientApplication = useClientApplication();
  const { actionMenu, uiStore } = clientApplication;
  const viewingCharacterSheet = actionMenu.shouldShowCharacterSheet();

  const viewingDropShardsModal = uiStore.dialogs.isOpen(DialogElementName.DropShards);

  const { game, party, combatant } = clientApplication.combatantFocus.requireFocusedCharacterContext();
  const characterShards = combatant.combatantProperties.inventory.shards;
  const shardPool = PlayerShardPool.forCharacter(game, party, combatant);
  const playerTotalShards = shardPool.isSharedAmongCharacters()
    ? shardPool.getTotalShards()
    : undefined;

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
          <ShardsDisplay
            extraStyles="h-10"
            numShards={characterShards}
            playerTotalShards={playerTotalShards}
          />
        </HotkeyButton>
      </HoverableTooltipWrapper>
      {/* for better tab indexing, character sheet has it's own placement of the modal */}
      {viewingDropShardsModal === true && !viewingCharacterSheet && (
        <DropShardsModal
          className="absolute bottom-0 right-0 border border-slate-400"
          min={0}
          max={characterShards}
        />
      )}
    </li>
  );
});
