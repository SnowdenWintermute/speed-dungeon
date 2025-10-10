import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { COMBATANT_CLASS_NAME_STRINGS, iterateNumericEnum } from "@speed-dungeon/common";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import SelectDropdown from "@/app/components/atoms/SelectDropdown";
import TextInput from "@/app/components/atoms/TextInput";
import { websocketConnection } from "@/singletons/websocket-connection";
import { useGameStore } from "@/stores/game-store";
import {
  AdventuringParty,
  BASE_SCREEN_SIZE,
  ClientToServerEvent,
  CombatantClass,
  ERROR_MESSAGES,
  GOLDEN_RATIO,
  MAX_PARTY_SIZE,
  SpeedDungeonPlayer,
} from "@speed-dungeon/common";
import { FormEvent, ReactNode, useState } from "react";
import CharacterCard from "./CharacterCard";

export default function PartySetupCard({
  party,
  playerOption,
}: {
  party: AdventuringParty;
  playerOption: null | undefined | SpeedDungeonPlayer;
}) {
  const menuWidth = Math.floor(BASE_SCREEN_SIZE * Math.pow(GOLDEN_RATIO, 3));
  const characters = party.combatantManager.getPartyMemberCharacters();
  const characterCount = characters.length;
  const username = useGameStore().username;
  if (username === null) return <div>{ERROR_MESSAGES.CLIENT.NO_USERNAME}</div>;
  const userIsInThisParty = party.playerUsernames.includes(username);

  function leaveParty() {
    websocketConnection.emit(ClientToServerEvent.LeaveParty);
  }

  const characterCards = characters.map((character) => {
    return (
      <CharacterCard character={character} username={username} key={character.getEntityId()} />
    );
  });

  return (
    <section className="flex mb-4">
      <div
        className="border border-slate-400 bg-slate-700 pointer-events-auto mr-2"
        style={{ width: `${menuWidth}px` }}
      >
        <div className="w-full p-2  flex justify-between">
          <h4 className="text-xl w-full flex justify-between">
            <span>
              {party.name}
              {userIsInThisParty && (
                <HotkeyButton
                  className="border border-slate-400 text-base pl-2 pr-2 ml-2"
                  onClick={leaveParty}
                >
                  LEAVE PARTY
                </HotkeyButton>
              )}
            </span>
            <span>
              {characterCount}/{MAX_PARTY_SIZE}
            </span>
          </h4>
        </div>
        <ul className="p-2">
          {characterCards}
          {new Array(MAX_PARTY_SIZE - characterCount).fill(null).map((item, i) => (
            <EmptyCharacterSlot key={i} i={i} party={party} playerOption={playerOption} />
          ))}
        </ul>
      </div>
      <ul>
        {party.playerUsernames.map((username) => (
          <HoverableTooltipWrapper
            tooltipText={username}
            extraStyles="mb-2 last:mb-0"
            key={username}
          >
            <li className="pointer-events-auto h-10 w-10 flex items-center justify-center border border-slate-400 rounded-full bg-slate-700 p-2 text-lg">
              {username.charAt(0).toUpperCase()}
            </li>
          </HoverableTooltipWrapper>
        ))}
      </ul>
    </section>
  );
}

function EmptyCharacterSlot({
  i,
  party,
  playerOption,
}: {
  i: number;
  party: AdventuringParty;
  playerOption: null | undefined | SpeedDungeonPlayer;
}) {
  function joinParty() {
    websocketConnection.emit(ClientToServerEvent.JoinParty, party.name);
  }
  if (!playerOption) return <div>{ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST}</div>;

  const userIsInThisParty = party.playerUsernames.includes(playerOption.username);
  const userIsInAnotherParty = !userIsInThisParty && playerOption.partyName;

  if (i !== 0 || userIsInAnotherParty)
    return (
      <PartyCardListItem key={i}>
        <span>Empty slot</span>
      </PartyCardListItem>
    );

  if (userIsInThisParty) return <CreateCharacterForm i={i} />;

  return (
    <PartyCardListItem key={i}>
      <HotkeyButton className="h-full w-full" onClick={joinParty}>
        JOIN PARTY
      </HotkeyButton>
    </PartyCardListItem>
  );
}

function PartyCardListItem({ children }: { children: ReactNode }) {
  return (
    <li className="h-20 p-2 border border-slate-400 mb-2 last:mb-0 flex items-center text-lg">
      {children}
    </li>
  );
}

function CreateCharacterForm({ i }: { i: number }) {
  const [combatantClassSelection, setCombatantClassSelection] = useState(CombatantClass.Warrior);
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
    <li key={i}>
      <form
        onSubmit={handleCreateCharacter}
        className="h-20 mb-2 last:mb-0 flex items-center text-lg relative"
      >
        <div className="absolute top-0 text-sm">New Character:</div>
        <TextInput
          className="h-10 w-48 flex-grow border border-slate-400 bg-transparent pl-2 mr-2"
          value={characterName}
          placeholder={"Character name..."}
          name={"Character Name"}
          onChange={(e) => setCharacterName(e.target.value)}
        />
        <SelectDropdown
          extraStyles="flex-grow mr-2"
          title={"Select Combatant Class"}
          value={combatantClassSelection}
          setValue={setCombatantClassSelection}
          options={iterateNumericEnum(CombatantClass).map((combatantClass) => {
            return {
              title: COMBATANT_CLASS_NAME_STRINGS[combatantClass],
              value: combatantClass,
            };
          })}
          disabled={false}
        />
        <HotkeyButton
          hotkeys={[]}
          buttonType="button"
          onClick={handleCreateCharacter}
          className="h-10 pr-4 pl-4 border border-slate-400"
        >
          CREATE
        </HotkeyButton>
      </form>
    </li>
  );
}
