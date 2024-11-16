import React from "react";
import { useGameStore } from "@/stores/game-store";
import PartyWipeModal from "./PartyWipeModal";
import TopInfoBar from "./TopInfoBar";
import CombatantPlaqueGroup from "./combatant-plaques/CombatantPlaqueGroup";
import MonsterPlaques from "./MonsterPlaques";
import { ERROR_MESSAGES, InputLock } from "@speed-dungeon/common";
import ActionMenu from "./ActionMenu";
import CharacterAutofocusManager from "./CharacterAutofocusManager";
import CharacterSheet from "./character-sheet";
import ItemDetailsWithComparison from "./ItemDetailsWithComparison";
import CharacterSheetItemDetailsViewer from "./character-sheet/CharacterSheetItemDetailsViewer";
import ItemsOnGround from "./ItemsOnGround";
import ReadyUpDisplay from "./ReadyUpDisplay";
import CombatLog from "./combat-log";
import { MenuStateType } from "./ActionMenu/menu-state";
import getFocusedCharacter from "@/utils/getFocusedCharacter";
import shouldShowCharacterSheet from "@/utils/should-show-character-sheet";

export default function Game() {
  const game = useGameStore().game;

  const username = useGameStore().username;
  if (!username)
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        {ERROR_MESSAGES.CLIENT.NO_USERNAME}
      </div>
    );
  if (!game)
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        {ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME}
      </div>
    );
  const focusedCharacterResult = getFocusedCharacter();
  if (focusedCharacterResult instanceof Error)
    return (
      <div>
        <CharacterAutofocusManager />
        <div>Awaiting focused character...</div>
      </div>
    );

  const player = game.players[username];
  if (!player) return <div>Client player not found</div>;
  const partyName = player.partyName;
  if (!partyName) return <div>Client player doesn't know what party they are in</div>;
  const party = game.adventuringParties[partyName];
  if (!party) return <div>Client thinks it is in a party that doesn't exist</div>;

  const currentMenu = useGameStore.getState().getCurrentMenu();
  const viewingCharacterSheet = shouldShowCharacterSheet(currentMenu.type);
  const conditionalStyles = viewingCharacterSheet ? "items-center justify-end" : "";

  const actionMenuAndCharacterSheetContainerConditionalClasses = viewingCharacterSheet
    ? ""
    : "w-full";

  return (
    <main className="h-screen w-screen flex justify-center relative overflow-hidden">
      <CharacterAutofocusManager />
      <PartyWipeModal party={party} />
      <div className="w-full h-full max-h-[calc(0.5625 * 100vw)] text-zinc-300 flex flex-col">
        <TopInfoBar />
        <div className="p-4 flex-grow flex flex-col justify-between">
          <ReadyUpDisplay party={party} />
          <div className="flex justify-end">
            <div className="w-fit">
              <MonsterPlaques game={game} party={party} />
            </div>
          </div>
          <div className="flex flex-wrap justify-between">
            <div className="h-[14rem] min-w-[23rem] max-w-[26rem]  border border-slate-400 bg-slate-700 p-2 pointer-events-auto">
              <CombatLog />
            </div>
            <div className="flex flex-grow justify-end mt-3.5 max-w-full">
              <div className="w-fit max-w-full flex items-end">
                <CombatantPlaqueGroup
                  party={party}
                  combatantIds={party.characterPositions}
                  showExperience={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {
        // ACTION MENU AND INVENTORY/EQUIPMENT/CHARACTER SHEET CONTAINER
      }
      <div
        className={`absolute z-31 top-1/2 -translate-y-1/2 w-full p-4 text-zinc-300 flex flex-row ${conditionalStyles} pointer-events-none`}
      >
        <div
          className={`flex flex-col max-w-full ${actionMenuAndCharacterSheetContainerConditionalClasses} `}
        >
          <div className="flex">
            <div className="flex flex-col flex-grow justify-end max-w-full">
              <div className="flex justify-between overflow-hidden">
                {
                  // !focused_character_is_animating &&
                  <ActionMenu inputLocked={InputLock.isLocked(party.inputLock)} />
                }
                {!viewingCharacterSheet && (
                  <div className="flex ">
                    <div className="max-h-[13.375rem] h-fit flex flex-grow justify-end relative">
                      <div className="absolute w-[50rem] right-[25rem]">
                        {currentMenu.type !== MenuStateType.CombatActionSelected && (
                          <ItemDetailsWithComparison flipDisplayOrder={true} />
                        )}
                      </div>
                      <div className="max-w-[25rem] w-[25rem]">
                        <ItemsOnGround party={party} maxHeightRem={25.0} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <CharacterSheet />
          </div>
          <CharacterSheetItemDetailsViewer
            party={party}
            viewingCharacterSheet={viewingCharacterSheet}
          />
        </div>
      </div>
    </main>
  );
}
