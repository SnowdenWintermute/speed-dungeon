import {
  ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES,
  CharacterAssociatedData,
  CombatAttribute,
  CombatantProperties,
  ERROR_MESSAGES,
  ServerToClientEvent,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { GameServer } from "..";

export default function characterSpentAttributePointHandler(
  this: GameServer,
  characterAssociatedData: CharacterAssociatedData,
  attribute: CombatAttribute
) {
  const { game, party, character } = characterAssociatedData;
  const { combatantProperties } = character;
  if (combatantProperties.unspentAttributePoints <= 0)
    return new Error(ERROR_MESSAGES.COMBATANT.NO_UNSPENT_ATTRIBUTE_POINTS);
  if (!ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES.includes(attribute))
    return new Error(ERROR_MESSAGES.COMBATANT.ATTRIBUTE_IS_NOT_ASSIGNABLE);

  CombatantProperties.incrementAttributePoint(combatantProperties, attribute);

  this.io
    .in(getPartyChannelName(game.name, party.name))
    .emit(
      ServerToClientEvent.CharacterSpentAttributePoint,
      character.entityProperties.id,
      attribute
    );
}
