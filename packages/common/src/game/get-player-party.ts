import { SpeedDungeonGame } from "./index.js";
import { AdventuringParty } from "../adventuring-party/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";

export function getPlayerParty(game: SpeedDungeonGame, username: string): Error | AdventuringParty {
  const playerOption = game.players[username];
  if (!playerOption) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
  const partyNameOption = playerOption.partyName;
  if (!partyNameOption) return new Error(ERROR_MESSAGES.GAME.MISSING_PARTY_NAME);
  const partyOption = game.adventuringParties[partyNameOption];
  if (!partyOption) return new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
  return partyOption;
}
