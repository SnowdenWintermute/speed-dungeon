import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import Divider from "@/app/components/atoms/Divider";
import { useGameStore } from "@/stores/game-store";
import { useLobbyStore } from "@/stores/lobby-store";
import { AdventuringParty, PlayerCharacter } from "@speed-dungeon/common";
import React from "react";

interface Props {
  party: AdventuringParty;
}

export default function AdventuringPartyLobbyCard(props: Props) {
  const currentPartyName = useGameStore().currentPartyName;
  const clientUsername = useLobbyStore().username;
  const game = useGameStore().game;

  function leaveParty() {
    //
  }
  function joinParty() {
    //
  }

  const charactersByUsername: [string, PlayerCharacter[]][] = [];
  props.party.playerUsernames.forEach((username) => {
    const characters: PlayerCharacter[] = [];
    Object.entries(props.party.characters).forEach(([characterId, character]) => {
      if (username === character.nameOfControllingUser) {
        characters.push(character);
      }
    });
    charactersByUsername.push([username, characters]);
  });

  return (
    <div className="p-3 border border-slate-400 w-full mb-2">
      <h3 className="mb-2">
        {"Party: "}
        {props.party.name}
      </h3>
      {currentPartyName !== null ? (
        currentPartyName == props.party.name && (
          <>
            <div className="mb-2">
              <ButtonBasic onClick={leaveParty}> Leave Party </ButtonBasic>
            </div>
            <Divider extraStyles={"mt-4 mb-4"} />
            {
              // <CharacterCreationMenu />
            }
          </>
        )
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
      {props.characters.length < 1 && "No characters yet..."}
      {props.characters.map((character) => (
        <div key={character.nameOfControllingUser}>character placheolder</div>
      ))}
    </div>
  );
}

// <CharacterLobbyCard character={character}
// ownedBySelf={username === clientUsername} />)
