import HotkeyButton from "@/app/components/atoms/HotkeyButton";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { HOTKEYS } from "@/hotkeys";
import React from "react";
import { ShardsDisplay } from "../character-sheet/ShardsDisplay";
import DropShardsModal from "../character-sheet/DropShardsModal";
import { useGameStore } from "@/stores/game-store";
import shouldShowCharacterSheet from "@/utils/should-show-character-sheet";

export default function VendingMachineShardDisplay() {
  const mutateGameState = useGameStore().mutateState;
  const currentMenu = useGameStore.getState().getCurrentMenu();
  const viewingCharacterSheet = shouldShowCharacterSheet(currentMenu.type);
  const viewingDropShardsModal = useGameStore().viewingDropShardsModal;

  const focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
  if (focusedCharacterResult instanceof Error) return <></>;

  return (
    <li className="ml-auto pointer-events-auto">
      <HoverableTooltipWrapper tooltipText="The machine seems to want these...">
        <HotkeyButton
          className="disabled:opacity-50"
          hotkeys={[HOTKEYS.MAIN_2]}
          onClick={() => {
            mutateGameState((state) => {
              state.viewingDropShardsModal = true;
            });
          }}
        >
          <ShardsDisplay
            extraStyles="h-10"
            numShards={focusedCharacterResult.combatantProperties.inventory.shards}
          />
        </HotkeyButton>
      </HoverableTooltipWrapper>
      {/* for better tab indexing, character sheet has it's own placement of the modal */}
      {viewingDropShardsModal === true && !viewingCharacterSheet && (
        <DropShardsModal
          className="absolute bottom-0 right-0 border border-slate-400"
          min={0}
          max={focusedCharacterResult.combatantProperties.inventory.shards}
        />
      )}
    </li>
  );
}
