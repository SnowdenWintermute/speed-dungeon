import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import { websocketConnection } from "@/singletons/websocket-connection";
import { ClientToServerEvent } from "@speed-dungeon/common";
import React from "react";

export default function GameSetupMenu() {
  function leaveGame() {
    websocketConnection.emit(ClientToServerEvent.LeaveGame);
  }
  function toggleReady() {
    websocketConnection.emit(ClientToServerEvent.ToggleReadyToStartGame);
  }

  return (
    <section className="w-full bg-slate-700 border border-slate-400 p-4 mb-4 flex justify-between pointer-events-auto">
      <ButtonBasic onClick={leaveGame} hotkey="Escape">
        {"Leave Game"}
      </ButtonBasic>
      <ButtonBasic onClick={toggleReady}>{"Ready"}</ButtonBasic>
    </section>
  );
}
