import React from "react";
import ButtonBasic from "../components/atoms/ButtonBasic";
import { AdventuringParty, ClientIntentType } from "@speed-dungeon/common";
import Divider from "../components/atoms/Divider";
import { ZIndexLayers } from "../z-index-layers";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { observer } from "mobx-react-lite";
import { gameClientSingleton } from "@/singletons/lobby-client";

export const PartyWipeModal = observer(({ party }: { party: AdventuringParty }) => {
  function leaveGame() {
    gameClientSingleton.get().dispatchIntent({
      type: ClientIntentType.LeaveGame,
      data: undefined,
    });
    AppStore.get().gameStore.clearGame();
    AppStore.get().gameEventNotificationStore.clearGameLog();
  }

  const leaveGameHotkey = HOTKEYS.SIDE_1;

  if (party.timeOfWipe === null) return <></>;
  return (
    <div
      id="party-wipe-modal"
      className=" border border-slate-400 bg-slate-700 p-4 pointer-events-auto text-zinc-300
          absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col"
      style={{ zIndex: ZIndexLayers.GameModal }}
    >
      <div className="text-lg">{party.name} was defeated</div>
      <span className="text-lg mb-2">at {new Date(party.timeOfWipe).toLocaleString()}</span>
      <Divider extraStyles="mb-4" />
      <ButtonBasic extraStyles="w-full bg-slate-950" onClick={leaveGame} hotkey={leaveGameHotkey}>
        Leave Game ({letterFromKeyCode(leaveGameHotkey)})
      </ButtonBasic>
    </div>
  );
});
