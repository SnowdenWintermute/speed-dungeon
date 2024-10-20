import { Socket } from "socket.io";
import {
  CharacterAssociatedData,
  ERROR_MESSAGES,
  ServerToClientEvent,
  SpeedDungeonGame,
  getPartyChannelName,
} from "@speed-dungeon/common";

export default function cycleTargetingSchemesHandler(
  _eventData: { characterId: string },
  characterAssociatedData: CharacterAssociatedData,
  socket?: Socket
) {
  if (!socket) return console.error(ERROR_MESSAGES.SERVER.SOCKET_NOT_FOUND);
  const { game, party, character } = characterAssociatedData;
  const { username } = characterAssociatedData.player;
  const playerOption = game.players[username];
  if (playerOption === undefined) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);

  SpeedDungeonGame.cycleCharacterTargetingSchemes(
    game,
    party,
    playerOption,
    character.entityProperties.id
  );

  // @perf - don't really need to send the username since we can ask the client
  // to just trust the server and find the username for this character on their own
  // for now we'll send it since we need the username for the cycleTargetingSchemesHandler on the client
  socket.broadcast
    .to(getPartyChannelName(game.name, party.name))
    .emit(
      ServerToClientEvent.CharacterCycledTargetingSchemes,
      character.entityProperties.id,
      username
    );
}
