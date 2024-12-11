import { useGameStore } from "@/stores/game-store";
import React from "react";
import ButtonBasic from "../components/atoms/ButtonBasic";
import { AdventuringParty, ClientToServerEvent } from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import Divider from "../components/atoms/Divider";
import { ZIndexLayers } from "../z-index-layers";

export default function PartyWipeModal({ party }: { party: AdventuringParty }) {
  const mutateGameState = useGameStore().mutateState;

  function leaveGame() {
    websocketConnection.emit(ClientToServerEvent.LeaveGame);
    mutateGameState((state) => {
      state.game = null;
      state.combatLogMessages = [];
    });
  }

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
      <ButtonBasic extraStyles="w-full bg-slate-950" onClick={leaveGame}>
        Leave Game
      </ButtonBasic>
    </div>
  );
}
