import { useGameStore } from "@/stores/game-store";
import React from "react";
import ButtonBasic from "../components/atoms/ButtonBasic";
import { AdventuringParty, ClientToServerEvent } from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import Divider from "../components/atoms/Divider";
import { ZIndexLayers } from "../z-index-layers";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { AppStore } from "@/mobx-stores/app-store";

export default function PartyWipeModal({ party }: { party: AdventuringParty }) {
  const mutateGameState = useGameStore().mutateState;

  function leaveGame() {
    websocketConnection.emit(ClientToServerEvent.LeaveGame);
    mutateGameState((state) => {
      state.game = null;
    });

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
}
