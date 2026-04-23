import React from "react";
import { PartyWipeModal } from "./PartyWipeModal";
import { TopInfoBar } from "./TopInfoBar";
import CombatantPlaqueGroup from "./combatant-plaques/CombatantPlaqueGroup";
import { MonsterPlaques } from "./MonsterPlaques";
import { ReadyUpDisplay } from "./ReadyUpDisplay";
import { GameLog } from "./combat-log";
import { ActionMenuAndCharacterSheetLayer } from "./ActionMenuAndCharacterSheetLayer";
import { ZIndexLayers } from "../z-index-layers";
import { PersistentActionEntityDisplay } from "./persistent-action-entity-display";
import { observer } from "mobx-react-lite";
import { NeutralCombatantPlaques } from "./NeutralCombatantPlaques";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { DialogElementName } from "@/client-application/ui/dialogs";
import { ReconnectionAwaitingReplayDisplay } from "./ReconnectionAwaitingReplayDisplay";

export const Game = observer(() => {
  const clientApplication = useClientApplication();
  const { actionMenu, combatantFocus, uiStore } = clientApplication;
  const viewingCharacterSheet = actionMenu.shouldShowCharacterSheet();

  const viewingLeaveGameModal = uiStore.dialogs.isOpen(DialogElementName.LeaveGame);

  const { focusedCharacterOption } = combatantFocus;

  if (focusedCharacterOption === undefined) {
    return (
      <div>
        <div>Awaiting focused character...</div>
      </div>
    );
  }

  const { game, party } = combatantFocus.requireFocusedCharacterContext();

  return (
    <>
      <ReconnectionAwaitingReplayDisplay />
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
              <div className="flex flex-col">
                <PersistentActionEntityDisplay />
                <NeutralCombatantPlaques />
              </div>
            </div>
            <div className="flex flex-wrap justify-between items-end">
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
