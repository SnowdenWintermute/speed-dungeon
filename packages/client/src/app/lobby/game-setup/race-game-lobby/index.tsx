import { useGameStore } from "@/stores/game-store";
import {
  BASE_SCREEN_SIZE,
  ClientToServerEvent,
  ERROR_MESSAGES,
  GOLDEN_RATIO,
} from "@speed-dungeon/common";
import React from "react";
import GameLobby from "../GameLobby";
import HotkeyButton from "@/app/components/atoms/HotkeyButton";
import { websocketConnection } from "@/singletons/websocket-connection";
import PartySetupCard from "./AdventuringPartySetupCard";

export default function RaceGameLobby() {
  const username = useGameStore().username;
  const game = useGameStore().game;
  if (game === null) return <div>Loading...</div>;
  if (!username) return <div>{ERROR_MESSAGES.CLIENT.NO_USERNAME}</div>;
  const playerOption = game.players[username];

  return (
    <GameLobby>
      <div className="h-full max-h-full overflow-y-auto ">
        <div>
          <h3 className="text-xl mb-2">Adventuring Parties</h3>
        </div>
        <ul>
          {Object.values(game.adventuringParties).map((party) => (
            <li key={party.name}>
              <PartySetupCard party={party} playerOption={playerOption} />
            </li>
          ))}
          {!playerOption?.partyName && (
            <li key="create-party-card">
              <CreatePartyCard />
            </li>
          )}
        </ul>
      </div>
    </GameLobby>
  );
}

function CreatePartyCard() {
  const menuWidth = Math.floor(BASE_SCREEN_SIZE * Math.pow(GOLDEN_RATIO, 3));

  function createParty() {
    websocketConnection.emit(ClientToServerEvent.CreateParty, "");
  }

  return (
    <section
      className="h-32 border border-slate-400 bg-slate-700 flex items-center justify-center pointer-events-auto mb-4"
      style={{ width: `${menuWidth}px` }}
    >
      <HotkeyButton hotkeys={["KeyA"]} className="h-full w-full text-lg" onClick={createParty}>
        CREATE PARTY
      </HotkeyButton>
    </section>
  );
}
