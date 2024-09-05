import { useGameStore } from "@/stores/game-store";
import React from "react";
import ButtonBasic from "../components/atoms/ButtonBasic";
import { useWebsocketStore } from "@/stores/websocket-store";
import { AdventuringParty, ClientToServerEvent } from "@speed-dungeon/common";

export default function PartyWipeModal({ party }: { party: AdventuringParty }) {
  const mutateGameState = useGameStore().mutateState;
  const socketOption = useWebsocketStore().socketOption;

  function leaveGame() {
    socketOption?.emit(ClientToServerEvent.LeaveGame);
    mutateGameState((state) => {
      state.game = null;
    });
  }

  if (party.timeOfWipe === null) return <></>;
  return (
    <div
      id="party-wipe-modal"
      className=" border border-slate-400 bg-slate-700 p-4 pointer-events-auto text-zinc-300
          absolute z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
    >
      <div>{party.name} was defeated</div>
      <span className="text-lg mb-2">
        {"Time of death: "}
        {party.timeOfWipe}
      </span>
      <ButtonBasic onClick={leaveGame}>{"Leave Game"}</ButtonBasic>
    </div>
  );
}
