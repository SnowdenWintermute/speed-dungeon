import {
  AdventuringParty,
  ERROR_MESSAGES,
  ServerToClientEvent,
  updateCombatantHomePosition,
} from "@speed-dungeon/common";
import { removeFromArray } from "@speed-dungeon/common";
import errorHandler from "../error-handler.js";
import { ServerPlayerAssociatedData } from "../event-middleware";
import { Socket } from "socket.io";
import { getGameServer } from "../../singletons.js";

export default function deleteCharacterHandler(
  characterId: string,
  playerAssociatedData: ServerPlayerAssociatedData,
  socket: Socket
) {
  const { game, partyOption, player, session } = playerAssociatedData;
  if (!partyOption) return errorHandler(socket, ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
  const party = partyOption;

  if (!player.characterIds.includes(characterId.toString()))
    return errorHandler(socket, ERROR_MESSAGES.PLAYER.CHARACTER_NOT_OWNED);

  AdventuringParty.removeCharacter(party, characterId, player);

  for (const character of Object.values(party.characters))
    updateCombatantHomePosition(
      character.entityProperties.id,
      character.combatantProperties,
      party
    );

  const wasReadied = game.playersReadied.includes(session.username);
  removeFromArray(game.playersReadied, session.username);
  const gameServer = getGameServer();

  if (wasReadied)
    gameServer.io
      .of("/")
      .in(game.name)
      .emit(ServerToClientEvent.PlayerToggledReadyToStartGame, session.username);

  gameServer.io
    .of("/")
    .in(game.name)
    .emit(ServerToClientEvent.CharacterDeleted, party.name, session.username, characterId);
}
