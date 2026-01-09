import {
  Combatant,
  CombatantClass,
  EntityName,
  ERROR_MESSAGES,
  MAX_CHARACTER_NAME_LENGTH,
  ServerToClientEvent,
} from "@speed-dungeon/common";
import { ServerPlayerAssociatedData } from "../event-middleware/index.js";
import { getGameServer } from "../../singletons/index.js";

export function createCharacterHandler(
  eventData: { name: EntityName; combatantClass: CombatantClass },
  playerAssociatedData: ServerPlayerAssociatedData
) {
  const { game, partyOption, player, session } = playerAssociatedData;
  if (!player.partyName) return new Error(ERROR_MESSAGES.PLAYER.MISSING_PARTY_NAME);
  if (partyOption === undefined) return new Error(ERROR_MESSAGES.PLAYER.NOT_IN_PARTY);

  const { name, combatantClass } = eventData;

  if (name.length > MAX_CHARACTER_NAME_LENGTH) {
    return new Error(ERROR_MESSAGES.COMBATANT.MAX_NAME_LENGTH_EXCEEDED);
  }

  const newCharacter = getGameServer().characterCreator.createCharacter(
    name,
    combatantClass,
    player.username
  );
  if (newCharacter instanceof Error) return newCharacter;

  // @TESTING - pets
  // @TODO - don't start a new character with any pets
  // const testPet = generateMonster(1, 1, MonsterType.Wolf);
  // delete testPet.combatantProperties.threatManager;
  // testPet.combatantProperties.controlledBy.controllerType = CombatantControllerType.PlayerPetAI;

  // testPet.combatantProperties.classProgressionProperties.experiencePoints.changeExperience(81);
  // testPet.combatantProperties.attributeProperties.changeUnspentPoints(10);

  // const pets: Combatant[] = [testPet];
  const pets: Combatant[] = [];
  const serializedPets = pets.map((pet) => pet.getSerialized());

  game.addCharacterToParty(partyOption, player, newCharacter, pets);

  const serialized = newCharacter.getSerialized();

  getGameServer()
    .io.of("/")
    .in(game.getChannelName())
    .emit(ServerToClientEvent.CharacterAddedToParty, session.username, serialized, serializedPets);
}
