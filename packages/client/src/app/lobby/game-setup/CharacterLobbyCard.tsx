import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import { useWebsocketStore } from "@/stores/websocket-store";
import { ClientToServerEvent, PlayerCharacter } from "@speed-dungeon/common";
import { formatCombatantClassName } from "@speed-dungeon/common/src/combatants";
import React from "react";

interface Props {
  character: PlayerCharacter;
  ownedBySelf: boolean;
}

export default function CharacterLobbyCard(props: Props) {
  const mainSocketOption = useWebsocketStore().mainSocketOption;
  const { character, ownedBySelf } = props;
  function deleteCharacter() {
    mainSocketOption?.emit(ClientToServerEvent.DeleteCharacter, character.entityProperties.id);
  }

  return (
    <div>
      <div>{character.entityProperties.name}</div>
      <div>
        <div>{`Class: ${formatCombatantClassName(character.combatantProperties.combatantClass)}`}</div>
        {ownedBySelf && (
          <div>
            <ButtonBasic onClick={deleteCharacter}>
              {"Delete "}
              {character.entityProperties.name}
            </ButtonBasic>
          </div>
        )}
      </div>
    </div>
  );
}
