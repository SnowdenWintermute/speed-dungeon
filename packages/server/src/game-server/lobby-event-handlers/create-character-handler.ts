import {
  CombatantClass,
  ERROR_MESSAGES,
  ServerToClientEvent,
  SpeedDungeonGame,
  addCharacterToParty,
} from "@speed-dungeon/common";
import { createCharacter } from "../character-creation/index.js";
import { ServerPlayerAssociatedData } from "../event-middleware/index.js";
import { getGameServer } from "../../index.js";

export default function createCharacterHandler(
  eventData: { name: string; combatantClass: CombatantClass },
  playerAssociatedData: ServerPlayerAssociatedData
) {
  const { game, player, session } = playerAssociatedData;
  if (!player.partyName) return new Error(ERROR_MESSAGES.PLAYER.MISSING_PARTY_NAME);

  const { name, combatantClass } = eventData;

  const newCharacter = createCharacter(name, combatantClass);
  addCharacterToParty(game, player, newCharacter);

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
