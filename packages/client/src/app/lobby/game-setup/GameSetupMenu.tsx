import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import { useWebsocketStore } from "@/stores/websocket-store";
import { ClientToServerEvent } from "@speed-dungeon/common";
import React from "react";

export default function GameSetupMenu() {
  const mainSocketOption = useWebsocketStore().mainSocketOption;

  function leaveGame() {
    mainSocketOption?.emit(ClientToServerEvent.LeaveGame);
  }
  function toggleReady() {
    mainSocketOption?.emit(ClientToServerEvent.ToggleReadyToStartGame);
  }

  return (
    <section className="w-full bg-slate-700 border border-slate-400 p-4 mb-4 flex justify-between pointer-events-auto">
      <ButtonBasic onClick={leaveGame}>{"Leave Game"}</ButtonBasic>
      <ButtonBasic onClick={toggleReady}>{"Ready"}</ButtonBasic>
    </section>
  );
}
