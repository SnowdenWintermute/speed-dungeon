import { Socket } from "socket.io";
import { GameServer } from "..";
import { BrowserTabSession } from "../socket-connection-metadata";
import {
  CharacterAssociatedData,
  ERROR_MESSAGES,
  ServerToClientEvent,
  SpeedDungeonGame,
  getPartyChannelName,
} from "@speed-dungeon/common";

export default function cycleTargetingSchemesHandler(
  this: GameServer,
  socket: Socket,
  browserTabSession: BrowserTabSession,
  characterAssociatedData: CharacterAssociatedData
) {
  const { game, party, character } = characterAssociatedData;
  const playerOption = game.players[browserTabSession.username];
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
      browserTabSession.username
    );
}
