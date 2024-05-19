import { useGameStore } from "@/stores/game-store";
import { useLobbyStore } from "@/stores/lobby-store";
import React from "react";
import ButtonBasic from "../components/atoms/ButtonBasic";
import getParty from "@/utils/getParty";

export default function PartyWipeModal() {
  const game = useGameStore().game;
  const username = useLobbyStore().username;
  const partyOrErrorMessage = getParty(game, username);
  if (typeof partyOrErrorMessage == "string") return <div>{partyOrErrorMessage}</div>;
  const party = partyOrErrorMessage;

  function leaveGame() {
    //
  }

  if (!party.timeOfWipe) return <></>;
  return (
    <div
      className=" border border-slate-400 bg-slate-700 p-4 pointer-events-auto text-zinc-300
          absolute z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
    >
      <span className="text-lg mb-2">
        {"Time of death: "}
        {party.timeOfWipe}
      </span>
      <ButtonBasic onClick={leaveGame}>{"Leave Game"}</ButtonBasic>
    </div>
  );
}
