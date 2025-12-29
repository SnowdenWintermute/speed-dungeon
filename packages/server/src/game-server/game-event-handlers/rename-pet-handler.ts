import SocketIO from "socket.io";
import {
  ClientToServerEventTypes,
  ERROR_MESSAGES,
  EntityId,
  EntityName,
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
    return new Error(ERROR_MESSAGES.PLAYER.NOT_IN_PARTY);
  }

  const pet = partyOption.combatantManager.getExpectedCombatant(petId);

  const isPetOfThisPlayer =
    pet.combatantProperties.controlledBy.wasSummonedByCharacterControlledByPlayer(
      player.username,
      partyOption
    );
  if (!isPetOfThisPlayer) {
    return new Error("Can't rename a pet of a character you do not control");
  }

  pet.entityProperties.name = newName as EntityName;

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
