import Divider from "@/app/components/atoms/Divider";
import TextSubmit from "@/app/components/molocules/TextSubmit";
import { useGameStore } from "@/stores/game-store";
import { useWebsocketStore } from "@/stores/websocket-store";
import { ClientToServerEvent } from "@speed-dungeon/common";
import React from "react";
import AdventuringPartyLobbyCard from "./AdventuringPartyLobbyCard";

export default function CharacterAndPartySelection() {
  const game = useGameStore().game;
  const socketOption = useWebsocketStore().socketOption;

  if (!game) return <div>No game found</div>;

  function createParty(data: string) {
    socketOption?.emit(ClientToServerEvent.CreateParty, data);
  }

  return (
    <section
      className="flex-1 p-4 mr-4 bg-slate-700 border border-slate-400 pointer-events-auto"
      id="game_list"
    >
      <div className="mb-2">
        <h2 className="text-lg mb-2">
          {"Game: "} {game.name}
        </h2>
        <p className="text-ffxipink mb-2">
          Create a party and some characters. For the best chance of survival, a party of three is
          suggested.
        </p>
        <p className="text-ffxipink mb-2">
          Invite friends to party together or compete in a race, or you may control all the
          characters in a party and play solo.
        </p>
        <Divider />
        <TextSubmit
          inputName={"new adventuring party name"}
          inputPlaceholder={"New party name..."}
          buttonTitle={"Create Party"}
          submitDisabled={false}
          submitHandlerCallback={createParty}
        />
      </div>
      <div>
        <h3>{"Players not yet in a party:"}</h3>
        <ul className="list-none">
          {Object.entries(game.players).map(
            ([username, player]) => !player.partyName && <li key={username}>{username}</li>
          )}
        </ul>
      </div>
      <div>
        <h3 className="mb-2">{"Adventuring Parties"}</h3>
        {Object.values(game.adventuringParties).map((party) => (
          <AdventuringPartyLobbyCard key={party.name} party={party} />
        ))}
      </div>
    </section>
  );
}
