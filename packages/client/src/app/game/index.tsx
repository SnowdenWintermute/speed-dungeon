import React from "react";
import { useGameStore } from "@/stores/game-store";
import PartyWipeModal from "./PartyWipeModal";
import { TopInfoBar } from "./TopInfoBar";
import CombatantPlaqueGroup from "./combatant-plaques/CombatantPlaqueGroup";
import MonsterPlaques from "./MonsterPlaques";
import { ERROR_MESSAGES } from "@speed-dungeon/common";
import { ReadyUpDisplay } from "./ReadyUpDisplay";
import { GameLog } from "./combat-log";
import { ActionMenuAndCharacterSheetLayer } from "./ActionMenuAndCharacterSheetLayer";
import { ZIndexLayers } from "../z-index-layers";
import PersistentActionEntityDisplay from "./persistent-action-entity-display";
import { observer } from "mobx-react-lite";
import { AppStore } from "@/mobx-stores/app-store";
import { DialogElementName } from "@/mobx-stores/dialogs";

export const Game = observer(() => {
  const game = useGameStore().game;
  const { actionMenuStore } = AppStore.get();
  const viewingCharacterSheet = actionMenuStore.shouldShowCharacterSheet();

  const viewingLeaveGameModal = AppStore.get().dialogStore.isOpen(DialogElementName.LeaveGame);

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

  const focusedCharacterOption = AppStore.get().gameStore.getFocusedCharacterOption();

  if (focusedCharacterOption === undefined) {
    return (
      <div>
        <div>Awaiting focused character...</div>
      </div>
    );
  }

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
        <PartyWipeModal party={party} />
        {
          // BASE LAYER
        }
        <div className="w-full h-full max-h-[calc(0.5625 * 100vw)] text-zinc-300 flex flex-col">
          <TopInfoBar />

          <div className="p-4 flex-grow flex flex-col justify-between">
            <ReadyUpDisplay party={party} />
            <div className="flex justify-end">
              <div className="w-full">
                <MonsterPlaques game={game} party={party} />
              </div>
              <div>
                <PersistentActionEntityDisplay />
              </div>
            </div>
            <div className="flex flex-wrap justify-between">
              <div className="h-[14rem] min-w-[23rem] max-w-[26rem]  border border-slate-400 bg-slate-700 p-2 pointer-events-auto">
                <GameLog />
              </div>
              <div className="flex flex-grow justify-end mt-3.5 max-w-full">
                <div className="w-fit max-w-full flex items-end">
                  <CombatantPlaqueGroup
                    party={party}
                    combatantIds={party.combatantManager
                      .getPartyMemberCharacters()
                      .map((combatant) => combatant.getEntityId())}
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
});
