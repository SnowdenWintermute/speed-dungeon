import { useGameStore } from "@/stores/game-store";
import {
  AdventuringParty,
  BASE_SCREEN_SIZE,
  ClientToServerEvent,
  CombatantClass,
  ERROR_MESSAGES,
  GOLDEN_RATIO,
  MAX_PARTY_SIZE,
  SpeedDungeonGame,
  formatCombatantClassName,
  iterateNumericEnum,
} from "@speed-dungeon/common";
import React, { FormEvent, useState } from "react";
import GameLobby from "./GameLobby";
import HotkeyButton from "@/app/components/atoms/HotkeyButton";
import { websocketConnection } from "@/singletons/websocket-connection";
import TextInput from "@/app/components/atoms/TextInput";
import SelectDropdown from "@/app/components/atoms/SelectDropdown";

export default function RaceGameLobby({ game }: { game: SpeedDungeonGame }) {
  const username = useGameStore().username;
  const menuWidth = Math.floor(BASE_SCREEN_SIZE * Math.pow(GOLDEN_RATIO, 3));

  return (
    <GameLobby game={game}>
      <div className="h-full max-h-full overflow-y-auto ">
        <div>
          <h3 className="text-xl mb-2">Adventuring Parties</h3>
        </div>
        <ul>
          {Object.values(game.adventuringParties).map((party) => (
            <li key={party.name}>
              <PartySetupCard party={party} />
            </li>
          ))}
          <li key="create-party-card">
            <CreatePartyCard />
          </li>
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
      <HotkeyButton className="h-full w-full text-lg" onClick={createParty}>
        CREATE PARTY
      </HotkeyButton>
    </section>
  );
}

function PartySetupCard({ party }: { party: AdventuringParty }) {
  const menuWidth = Math.floor(BASE_SCREEN_SIZE * Math.pow(GOLDEN_RATIO, 3));
  const numCharacters = party.characterPositions.length;
  const username = useGameStore().username;
  if (username === null) return <div>{ERROR_MESSAGES.CLIENT.NO_USERNAME}</div>;
  const userIsInThisParty = party.playerUsernames.includes(username);
  const [combatantClassSelection, setCombatantClassSelection] = useState(CombatantClass.Mage);
  const [characterName, setCharacterName] = useState("");

  function handleCreateCharacter(e: FormEvent<HTMLElement>) {
    e.preventDefault();
    websocketConnection.emit(ClientToServerEvent.CreateCharacter, {
      name: characterName,
      combatantClass: combatantClassSelection,
    });

    setCharacterName("");
  }

  return (
    <section
      className="mb-4 border border-slate-400 bg-slate-700 pointer-events-auto"
      style={{ width: `${menuWidth}px` }}
    >
      <div className="w-full p-2 flex justify-between">
        <h4 className="text-xl w-full flex justify-between">
          <span>{party.name}</span>
          <span>
            {numCharacters}/{MAX_PARTY_SIZE}
          </span>
        </h4>
      </div>
      <ul className="p-2">
        {new Array(MAX_PARTY_SIZE - numCharacters).fill(null).map((item, i) =>
          i === 0 && userIsInThisParty ? (
            <li key={i}>
              <form
                onSubmit={handleCreateCharacter}
                className="h-20 p-2 border border-slate-400 mb-2 last:mb-0 flex items-center text-lg"
              >
                <TextInput
                  className="h-10 border border-slate-400 bg-transparent pl-2"
                  value={characterName}
                  placeholder={"Character name..."}
                  name={"Character Name"}
                  changeHandler={(e) => setCharacterName(e.target.value)}
                />
                <SelectDropdown
                  title={"Select Combatant Class"}
                  value={combatantClassSelection}
                  setValue={setCombatantClassSelection}
                  options={iterateNumericEnum(CombatantClass).map((combatantClass) => {
                    return {
                      title: formatCombatantClassName(combatantClass),
                      value: combatantClass,
                    };
                  })}
                  disabled={false}
                />
                <HotkeyButton
                  buttonType="submit"
                  className="h-10 pr-2 pl-2 border border-slate-400"
                >
                  CREATE
                </HotkeyButton>
              </form>
            </li>
          ) : (
            <li
              className="h-20 p-2 border border-slate-400 mb-2 last:mb-0 flex items-center text-lg"
              key={i}
            >
              <span>Empty slot</span>
            </li>
          )
        )}
      </ul>
    </section>
  );
}
