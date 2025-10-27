import {
  ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES,
  CharacterAssociatedData,
  CombatAttribute,
  ERROR_MESSAGES,
  ServerToClientEvent,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../singletons/index.js";

export function characterSpentAttributePointHandler(
  eventData: { characterId: string; attribute: CombatAttribute },
  characterAssociatedData: CharacterAssociatedData
) {
  const { attribute } = eventData;
  const { game, party, character } = characterAssociatedData;
  const { combatantProperties } = character;

  if (combatantProperties.attributeProperties.getUnspentPoints() <= 0) {
    return new Error(ERROR_MESSAGES.COMBATANT.NO_UNSPENT_ATTRIBUTE_POINTS);
  }

  if (!ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES.includes(attribute)) {
    return new Error(ERROR_MESSAGES.COMBATANT.ATTRIBUTE_IS_NOT_ASSIGNABLE);
  }

  combatantProperties.attributeProperties.allocatePoint(attribute);

  getGameServer()
    .io.in(getPartyChannelName(game.name, party.name))
    .emit(
      ServerToClientEvent.CharacterSpentAttributePoint,
      character.entityProperties.id,
      attribute
    );
}
