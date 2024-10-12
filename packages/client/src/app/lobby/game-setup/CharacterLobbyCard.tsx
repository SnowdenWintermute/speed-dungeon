import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import { websocketConnection } from "@/singletons/websocket-connection";
import { ClientToServerEvent, Combatant } from "@speed-dungeon/common";
import { formatCombatantClassName } from "@speed-dungeon/common";
import React from "react";

interface Props {
  character: Combatant;
  ownedBySelf: boolean;
}

export default function CharacterLobbyCard(props: Props) {
  const { character, ownedBySelf } = props;
  function deleteCharacter() {
    websocketConnection.emit(ClientToServerEvent.DeleteCharacter, character.entityProperties.id);
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
