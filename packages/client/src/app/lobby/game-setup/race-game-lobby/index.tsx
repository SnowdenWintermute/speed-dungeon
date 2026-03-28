import { BASE_SCREEN_SIZE, ClientIntentType, GOLDEN_RATIO, PartyName } from "@speed-dungeon/common";
import React from "react";
import { GameLobby } from "../GameLobby";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { PartySetupCard } from "./AdventuringPartySetupCard";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";

export const RaceGameLobby = observer(() => {
  const { session, gameContext } = useClientApplication();
  const username = session.requireUsername();
  const game = gameContext.requireGame();
  const playerOption = game.getPlayer(username);

  return (
    <GameLobby>
      <div className="h-full max-h-full overflow-y-auto ">
        <div>
          <h3 className="text-xl mb-2">Adventuring Parties</h3>
        </div>
        <ul>
          {[...game.adventuringParties].map(([partyName, party]) => (
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
});

function CreatePartyCard() {
  const menuWidth = Math.floor(BASE_SCREEN_SIZE * Math.pow(GOLDEN_RATIO, 3));

  const { lobbyClientRef } = useClientApplication();
  function createParty() {
    lobbyClientRef.get().dispatchIntent({
      type: ClientIntentType.CreateParty,
      data: {
        partyName: "" as PartyName,
      },
    });
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
