import {
  CharacterSlotIndex,
  ClientToServerEventTypes,
  Combatant,
  CombatantClass,
  EntityName,
  ERROR_MESSAGES,
  MAX_CHARACTER_NAME_LENGTH,
  ServerToClientEvent,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { Socket } from "socket.io";
import { LoggedInUser } from "../event-middleware/get-logged-in-user-from-socket.js";
import { characterSlotsRepo } from "../../database/repos/character-slots.js";
import { playerCharactersRepo } from "../../database/repos/player-characters.js";
import { valkeyManager } from "../../kv-store/index.js";
import { CHARACTER_LEVEL_LADDER } from "../../kv-store/consts.js";
import { getGameServer } from "../../singletons/index.js";

export async function createSavedCharacterHandler(
  eventData: { name: EntityName; combatantClass: CombatantClass; slotNumber: CharacterSlotIndex },
  loggedInUser: LoggedInUser,
  socket: Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  const { userId, profile } = loggedInUser;

  const { name, combatantClass, slotNumber } = eventData;
  if (name.length > MAX_CHARACTER_NAME_LENGTH) {
    return new Error(ERROR_MESSAGES.COMBATANT.MAX_NAME_LENGTH_EXCEEDED);
  }

  const slot = await characterSlotsRepo.getSlot(profile.id, slotNumber);
  if (!slot) {
    return new Error("Character slot missing");
  }

  if (slot.characterId !== null) {
    return new Error(ERROR_MESSAGES.USER.CHARACTER_SLOT_FULL);
  }

  const newCharacter = getGameServer().characterCreator.createCharacter(
    name,
    combatantClass,
    loggedInUser.session.username
  );

  // @TESTING - pets
  // @TODO - don't start a new character with any pets
  // const testPet = generateMonster(1, MonsterType.Wolf);
  // delete testPet.combatantProperties.threatManager;
  // testPet.combatantProperties.controlledBy.controllerType = CombatantControllerType.PlayerPetAI;

  // testPet.combatantProperties.classProgressionProperties.experiencePoints.changeExperience(81);
  // testPet.combatantProperties.attributeProperties.changeUnspentPoints(10);

  // const pets: Combatant[] = [testPet];

  // @TODO - once remove test pet, use this
  const pets: Combatant[] = [];

  await playerCharactersRepo.insert(newCharacter, pets, userId);

  slot.characterId = newCharacter.entityProperties.id;
  await characterSlotsRepo.update(slot);

  await valkeyManager.context.zAdd(CHARACTER_LEVEL_LADDER, [
    {
      value: newCharacter.entityProperties.id,
      score: newCharacter.combatantProperties.classProgressionProperties.getMainClass().level,
    },
  ]);

  const serializedPets = pets.map((pet) => pet.getSerialized());
  socket.emit(
    ServerToClientEvent.SavedCharacter,
    { combatant: newCharacter.getSerialized(), pets: serializedPets },
    slotNumber
  );
}
