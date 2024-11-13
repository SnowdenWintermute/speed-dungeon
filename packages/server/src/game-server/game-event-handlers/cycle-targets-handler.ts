import {
  CharacterAssociatedData,
  ERROR_MESSAGES,
  NextOrPrevious,
  ServerToClientEvent,
  SpeedDungeonGame,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../singletons.js";

export default function cycleTargetsHandler(
  eventData: { characterId: string; direction: NextOrPrevious },
  characterAssociatedData: CharacterAssociatedData
): Error | void {
  const { game, party, character } = characterAssociatedData;
  const { username } = characterAssociatedData.player;

  const playerOption = game.players[username];
  if (playerOption === undefined) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);

  const result = SpeedDungeonGame.cycleCharacterTargets(
    game,
    party,
    playerOption,
    character.entityProperties.id,
    eventData.direction
  );

  if (result instanceof Error) return result;

  getGameServer()
    .io.to(getPartyChannelName(game.name, party.name))
    .emit(
      ServerToClientEvent.CharacterCycledTargets,
      character.entityProperties.id,
      eventData.direction,
      username
    );
}
