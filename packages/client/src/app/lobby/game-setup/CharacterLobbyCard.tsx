import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import { PlayerCharacter } from "@speed-dungeon/common";
import React from "react";

interface Props {
character: PlayerCharacter,
ownedBySelf: boolean
  }

export default function CharacterLobbyCard(props: Props) {
  const {character, ownedBySelf} = props;
  function deleteCharacter() {
      //
    }

  return (            
  <div>
                <div>
                    {character.entity_properties.name}
                </div>
                <div>
                    <div>
                        {`Class: ${character.combatant_properties.combatant_class}`}
                    </div>
                    {
                     ownedBySelf  &&   <div>
                            <ButtonBasic onClick={ deleteCharacter }>
                            {"Delete "}{&character.entity_properties.name}
                            </ButtonBasic>
                        </div>
                    }
                </div>
            </div>
);
}
