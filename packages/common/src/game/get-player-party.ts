import { SpeedDungeonGame } from "./index.js";
import { AdventuringParty } from "../adventuring-party/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";

export function getPlayerPartyOption(
  game: SpeedDungeonGame,
  username: string
): Error | AdventuringParty | undefined {
  const playerOption = game.players[username];
  if (!playerOption) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
  const partyNameOption = playerOption.partyName;
  if (!partyNameOption) return undefined;
  const partyOption = game.adventuringParties[partyNameOption];
  if (!partyOption) return new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
  return partyOption;
}
