import {
  CombatantClass,
  ERROR_MESSAGES,
  MAX_CHARACTER_NAME_LENGTH,
  ServerToClientEvent,
  SpeedDungeonGame,
  addCharacterToParty,
  isBrowser,
} from "@speed-dungeon/common";
import { createCharacter } from "../character-creation/index.js";
import { ServerPlayerAssociatedData } from "../event-middleware/index.js";
import { getGameServer } from "../../singletons/index.js";

export default function createCharacterHandler(
  eventData: { name: string; combatantClass: CombatantClass },
  playerAssociatedData: ServerPlayerAssociatedData
) {
  const { game, partyOption, player, session } = playerAssociatedData;
  if (!player.partyName) return new Error(ERROR_MESSAGES.PLAYER.MISSING_PARTY_NAME);
  if (partyOption === undefined) return new Error(ERROR_MESSAGES.PLAYER.NOT_IN_PARTY);

  const { name, combatantClass } = eventData;

  if (name.length > MAX_CHARACTER_NAME_LENGTH)
    return new Error(ERROR_MESSAGES.COMBATANT.MAX_NAME_LENGTH_EXCEEDED);
  const newCharacter = createCharacter(name, combatantClass);
  if (newCharacter instanceof Error) return newCharacter;
  addCharacterToParty(game, partyOption, player, newCharacter, isBrowser());

  const newCharacterId = newCharacter.entityProperties.id;

  const characterResult = SpeedDungeonGame.getCharacter(game, player.partyName, newCharacterId);
  if (characterResult instanceof Error) throw characterResult;

  getGameServer()
    .io.of("/")
    .in(game.name)
    .emit(
      ServerToClientEvent.CharacterAddedToParty,
      player.partyName,
      session.username,
      characterResult
    );
}
