import { SPACING_REM } from "@/client_consts";
import { useGameStore } from "@/stores/game-store";
import { ERROR_MESSAGES } from "@speed-dungeon/common";
import React from "react";
import CharacterAttributes from "./CharacterAttributes";
import PaperDoll from "./PaperDoll";
import HotkeyButton from "@/app/components/atoms/HotkeyButton";
import { HOTKEYS } from "@/hotkeys";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { MenuStateType } from "../ActionMenu/menu-state";
import DropShardsModal from "./DropShardsModal";
import { ShardsDisplay } from "./ShardsDisplay";
import InventoryCapacityDisplay from "./InventoryCapacityDisplay";
import shouldShowCharacterSheet from "@/utils/should-show-character-sheet";
import CharacterSheetTopBar from "./CharacterSheetTopBar";
import PaperDollAndAttributes from "./PaperDollAndAttributes";

export default function CharacterSheet({ showCharacterSheet }: { showCharacterSheet: boolean }) {
  const mutateGameState = useGameStore().mutateState;
  const viewingDropShardsModal = useGameStore((state) => state.viewingDropShardsModal);
  const currentMenu = useGameStore().getCurrentMenu();
  const partyResult = useGameStore().getParty();
  if (partyResult instanceof Error) return <div>{partyResult.message}</div>;
  const focusedCharacterResult = useGameStore().getFocusedCharacter();
  const focusedCharacterOption =
    focusedCharacterResult instanceof Error ? null : focusedCharacterResult;
  if (!focusedCharacterOption) return <div>{ERROR_MESSAGES.COMBATANT.NOT_FOUND}</div>;

  const partyCharacterIds = partyResult.characterPositions;

  let conditionalStyles = showCharacterSheet
    ? "overflow-auto pointer-events-auto w-fit "
    : "opacity-0 overflow-hidden pointer-events-none";

  return (
    <section className={`${conditionalStyles}`}>
      <CharacterSheetTopBar partyCharacterIds={partyCharacterIds} />
      <div
        className={`border border-slate-400 bg-slate-700 overflow-y-auto flex h-[400px] ${showCharacterSheet && "pointer-events-auto"}`}
        style={{ padding: `${SPACING_REM}rem` }}
      >
        <div className="absolute h-[900px] bg-slate-700 border border-slate-400 w-72"></div>
        {
          // <div className="flex">
          // <PaperDollAndAttributes />
          // </div>
        }
      </div>
    </section>
  );
}
