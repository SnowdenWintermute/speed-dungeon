import {
  CharacterAssociatedData,
  ERROR_MESSAGES,
  NextOrPrevious,
  ServerToClientEvent,
  SpeedDungeonGame,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { GameServer } from "..";
import { BrowserTabSession } from "../socket-connection-metadata";
import { Socket } from "socket.io";

export default function cycleTargetsHandler(
  this: GameServer,
  socket: Socket,
  browserTabSession: BrowserTabSession,
  characterAssociatedData: CharacterAssociatedData,
  nextOrPrevious: NextOrPrevious
): Error | void {
  const { game, party, character } = characterAssociatedData;

  const playerOption = game.players[browserTabSession.username];
  if (playerOption === undefined) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);

  const result = SpeedDungeonGame.cycleCharacterTargets(
    game,
    party,
    playerOption,
    character.entityProperties.id,
    nextOrPrevious
  );

  if (result instanceof Error) return result;

  socket.broadcast
    .to(getPartyChannelName(game.name, party.name))
    .emit(
      ServerToClientEvent.CharacterCycledTargets,
      character.entityProperties.id,
      nextOrPrevious,
      browserTabSession.username
    );
}
