import React from "react";
import { useGameStore } from "@/stores/game-store";
import PartyWipeModal from "./PartyWipeModal";
import TopInfoBar from "./TopInfoBar";
import CombatantPlaqueGroup from "./combatant-plaques/CombatantPlaqueGroup";
import MonsterPlaques from "./MonsterPlaques";
import { ERROR_MESSAGES } from "@speed-dungeon/common";
import CharacterAutofocusManager from "./CharacterAutofocusManager";
import ReadyUpDisplay from "./ReadyUpDisplay";
import CombatLog from "./combat-log";
import getFocusedCharacter from "@/utils/getFocusedCharacter";
import shouldShowCharacterSheet from "@/utils/should-show-character-sheet";
import CurrentItemUnmetRequirementsUpdater from "./CurrentItemUnmetRequirementsUpdater";
import ActionMenuAndCharacterSheetLayer from "./ActionMenuAndCharacterSheetLayer";
import { ZIndexLayers } from "../z-index-layers";

export default function Game() {
  const game = useGameStore().game;
  const viewingLeaveGameModal = useGameStore((state) => state.viewingLeaveGameModal);
  const currentMenu = useGameStore.getState().getCurrentMenu();
  const viewingCharacterSheet = shouldShowCharacterSheet(currentMenu.type);
  // const leaveGameModalOpen = useGameStore.getState().leaveGameModalOpen

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

  return (
    <>
      <main
        className={`h-screen w-screen flex justify-center relative overflow-hidden ${viewingCharacterSheet && "opacity-50"}`}
        style={{
          zIndex: viewingLeaveGameModal ? ZIndexLayers.GameModal : ZIndexLayers.MainUI,
        }}
      >
        <CharacterAutofocusManager />
        <CurrentItemUnmetRequirementsUpdater />
        <PartyWipeModal party={party} />
        {
          // BASE LAYER
        }
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
                    isPlayerControlled={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <ActionMenuAndCharacterSheetLayer party={party} />
    </>
  );
}
