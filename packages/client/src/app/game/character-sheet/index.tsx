import {
  BUTTON_HEIGHT_SMALL,
  SPACING_REM,
  SPACING_REM_SMALL,
  UNMET_REQUIREMENT_TEXT_COLOR,
} from "@/client_consts";
import { useGameStore } from "@/stores/game-store";
import { ERROR_MESSAGES, INVENTORY_DEFAULT_CAPACITY, Inventory } from "@speed-dungeon/common";
import React from "react";
import CharacterSheetCharacterSelectionButton from "./CharacterSheetCharacterSelectionButton";
import CharacterAttributes from "./CharacterAttributes";
import PaperDoll from "./PaperDoll";
import XShape from "../../../../public/img/basic-shapes/x-shape.svg";
import HotkeyButton from "@/app/components/atoms/HotkeyButton";
import { HOTKEYS } from "@/hotkeys";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { MenuStateType } from "../ActionMenu/menu-state";
import DropShardsModal from "./DropShardsModal";
import { ShardsDisplay } from "./ShardsDisplay";

export default function CharacterSheet({ showCharacterSheet }: { showCharacterSheet: boolean }) {
  const partyResult = useGameStore().getParty();
  const mutateGameState = useGameStore().mutateState;
  const viewingDropShardsModal = useGameStore((state) => state.viewingDropShardsModal);
  const currentMenu = useGameStore().getCurrentMenu();
  if (partyResult instanceof Error) return <div>{partyResult.message}</div>;
  const focusedCharacterResult = useGameStore().getFocusedCharacter();
  const focusedCharacterOption =
    focusedCharacterResult instanceof Error ? null : focusedCharacterResult;
  if (!focusedCharacterOption) return <div>{ERROR_MESSAGES.COMBATANT.NOT_FOUND}</div>;
  const { combatantProperties } = focusedCharacterOption;

  const partyCharacterIds = partyResult.characterPositions;

  let conditionalStyles = showCharacterSheet
    ? "overflow-auto pointer-events-auto w-fit "
    : "opacity-0 overflow-hidden pointer-events-none";

  const numItemsInInventory = Inventory.getTotalNumberOfItems(combatantProperties.inventory);

  return (
    <section className={`${conditionalStyles}`}>
      <div className="flex justify-between">
        <ul className="flex list-none" style={{ marginBottom: `${SPACING_REM_SMALL}rem ` }}>
          {partyCharacterIds.map((id) => (
            <CharacterSheetCharacterSelectionButton key={id} characterId={id} />
          ))}
        </ul>

        <button
          className="p-2 border border-slate-400 cursor-pointer bg-slate-700"
          style={{ height: `${BUTTON_HEIGHT_SMALL}rem` }}
          aria-label="close inventory"
          onClick={() => {
            mutateGameState((state) => {
              state.stackedMenuStates = [];
            });
          }}
        >
          <XShape className="h-full w-full fill-zinc-300" />
        </button>
      </div>
      <div
        className={`border border-slate-400 bg-slate-700 overflow-y-auto flex ${showCharacterSheet && "pointer-events-auto"}`}
        style={{ padding: `${SPACING_REM}rem` }}
      >
        <div className="flex flex-col justify-between mr-5">
          <PaperDoll combatant={focusedCharacterOption} />
          <div className={"flex justify-between items-end"}>
            <div
              className={`${numItemsInInventory > INVENTORY_DEFAULT_CAPACITY ? UNMET_REQUIREMENT_TEXT_COLOR : ""}`}
            >
              Inventory Capacity: {numItemsInInventory}/{INVENTORY_DEFAULT_CAPACITY}
            </div>
            <div className="relative">
              <HoverableTooltipWrapper tooltipText="Drop shards (A)">
                <HotkeyButton
                  className="disabled:opacity-50"
                  hotkeys={[HOTKEYS.MAIN_2]}
                  disabled={currentMenu.type !== MenuStateType.InventoryItems}
                  onClick={() => {
                    mutateGameState((state) => {
                      state.viewingDropShardsModal = true;
                    });
                  }}
                >
                  <ShardsDisplay
                    numShards={focusedCharacterOption.combatantProperties.inventory.shards}
                  />
                </HotkeyButton>
              </HoverableTooltipWrapper>
              {viewingDropShardsModal === true && (
                <DropShardsModal
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
    </section>
  );
}
