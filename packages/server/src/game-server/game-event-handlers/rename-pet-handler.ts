import SocketIO from "socket.io";
import {
  CharacterAssociatedData,
  ClientToServerEventTypes,
  ERROR_MESSAGES,
  EntityId,
  GameMode,
  PlayerAssociatedData,
  ServerToClientEvent,
  ServerToClientEventTypes,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../singletons/index.js";
import { writePlayerCharactersInGameToDb } from "../saved-character-event-handlers/write-player-characters-in-game-to-db.js";

export async function renamePetHandler(
  eventData: { petId: EntityId; newName: string },
  playerAssociatedData: PlayerAssociatedData,
  _socket?: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  const { game, partyOption, player } = playerAssociatedData;
  const gameServer = getGameServer();
  const { petId, newName } = eventData;

  if (partyOption === undefined) {
    throw new Error(ERROR_MESSAGES.PLAYER.NOT_IN_PARTY);
  }

  const pet = partyOption.combatantManager.getExpectedCombatant(petId);

  pet.entityProperties.name = newName;

  // save the character if in progression game
  if (game.mode === GameMode.Progression) {
    const writeResult = await writePlayerCharactersInGameToDb(game, player);
    if (writeResult instanceof Error) return writeResult;
  }

  // emit the message on this party's channel
  gameServer.io
    .to(getPartyChannelName(game.name, partyOption.name))
    .emit(ServerToClientEvent.CharacterRenamedPet, {
      petId,
      newName,
    });
}
