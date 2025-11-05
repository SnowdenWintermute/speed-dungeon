import {
  Combatant,
  CombatantClass,
  CombatantControllerType,
  ERROR_MESSAGES,
  MAX_CHARACTER_NAME_LENGTH,
  MonsterType,
  ServerToClientEvent,
} from "@speed-dungeon/common";
import { createCharacter } from "../character-creation/index.js";
import { ServerPlayerAssociatedData } from "../event-middleware/index.js";
import { getGameServer } from "../../singletons/index.js";
import { generateMonster } from "../monster-generation/index.js";

export function createCharacterHandler(
  eventData: { name: string; combatantClass: CombatantClass },
  playerAssociatedData: ServerPlayerAssociatedData
) {
  const { game, partyOption, player, session } = playerAssociatedData;
  if (!player.partyName) return new Error(ERROR_MESSAGES.PLAYER.MISSING_PARTY_NAME);
  if (partyOption === undefined) return new Error(ERROR_MESSAGES.PLAYER.NOT_IN_PARTY);

  const { name, combatantClass } = eventData;

  if (name.length > MAX_CHARACTER_NAME_LENGTH) {
    return new Error(ERROR_MESSAGES.COMBATANT.MAX_NAME_LENGTH_EXCEEDED);
  }

  const newCharacter = createCharacter(name, combatantClass, player.username);
  if (newCharacter instanceof Error) return newCharacter;

  // @TESTING - pets
  // @TODO - don't start a new character with any pets
  const testPet = generateMonster(1, MonsterType.Wolf);
  testPet.combatantProperties.controlledBy.controllerType = CombatantControllerType.PlayerPetAI;
  const pets: Combatant[] = [testPet];
  const serializedPets = pets.map((pet) => pet.getSerialized());

  game.addCharacterToParty(partyOption, player, newCharacter, pets);

  const serialized = newCharacter.getSerialized();

  getGameServer()
    .io.of("/")
    .in(game.name)
    .emit(ServerToClientEvent.CharacterAddedToParty, session.username, serialized, serializedPets);
}
