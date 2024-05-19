import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import Divider from "@/app/components/atoms/Divider";
import { useGameStore } from "@/stores/game-store";
import { useLobbyStore } from "@/stores/lobby-store";
import { AdventuringParty, ClientToServerEvent, PlayerCharacter } from "@speed-dungeon/common";
import React from "react";
import CharacterLobbyCard from "./CharacterLobbyCard";
import { useWebsocketStore } from "@/stores/websocket-store";
import CharacterCreationMenu from "./CharacterCreationMenu";
import getCurrentPartyName from "@/utils/getCurrentPartyName";

interface Props {
  party: AdventuringParty;
}

export default function AdventuringPartyLobbyCard(props: Props) {
  const mainSocketOption = useWebsocketStore().mainSocketOption;
  const username = useLobbyStore().username;
  const game = useGameStore().game;
  if (!username) return <div>Client has no username</div>;
  if (!game) return <div>No game found</div>;
  const currentPartyName = getCurrentPartyName(game, username);

  function leaveParty() {
    mainSocketOption?.emit(ClientToServerEvent.LeaveParty);
  }
  function joinParty() {
    mainSocketOption?.emit(ClientToServerEvent.JoinParty, props.party.name);
  }

  const charactersByUsername: [string, PlayerCharacter[]][] = [];
  props.party.playerUsernames.forEach((username) => {
    const characters: PlayerCharacter[] = [];
    Object.values(props.party.characters).forEach((character) => {
      if (username === character.nameOfControllingUser) {
        characters.push(character);
      }
    });
    charactersByUsername.push([username, characters]);
  });

  const inPartyMenu = (
    <>
      <div className="mb-2">
        <ButtonBasic onClick={leaveParty}> Leave Party </ButtonBasic>
      </div>
      <Divider extraStyles={"mt-4 mb-4"} />
      <CharacterCreationMenu />
    </>
  );

  return (
    <div className="p-3 border border-slate-400 w-full mb-2">
      <h3 className="mb-2">
        {"Party: "}
        {props.party.name}
      </h3>
      {currentPartyName !== null ? (
        currentPartyName == props.party.name && inPartyMenu
      ) : (
        <div className="mb-2">
          <ButtonBasic onClick={joinParty}>{"Join Party"}</ButtonBasic>
        </div>
      )}
      <Divider extraStyles={"mt-4 mb-4"} />
      {charactersByUsername.map(([username, characters]) => (
        <UserCharacters key={username} username={username} characters={characters} />
      ))}
    </div>
  );
}

interface UserCharactersProps {
  username: string;
  characters: PlayerCharacter[];
}

function UserCharacters(props: UserCharactersProps) {
  const clientUsername = useLobbyStore().username;
  const game = useGameStore().game;
  let isReady = game?.playersReadied.includes(props.username);
  let readyStyle = isReady ? "bg-green-800" : "";

  return (
    <div className={readyStyle}>
      {`username: ${props.username}`}
      {props.characters.length < 1 && <div>No characters yet...</div>}
      {props.characters.map((character) => (
        <CharacterLobbyCard
          key={character.entityProperties.id}
          character={character}
          ownedBySelf={props.username === clientUsername}
        />
      ))}
    </div>
  );
}
