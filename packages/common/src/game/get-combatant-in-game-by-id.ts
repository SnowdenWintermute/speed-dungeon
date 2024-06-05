import { SpeedDungeonGame } from ".";
import getCombatantInParty from "../adventuring_party/get-combatant-in-party";
import { CombatantDetails } from "../combatants";
import { ERROR_MESSAGES } from "../errors";

export default function getCombatantInGameById(
  game: SpeedDungeonGame,
  entityId: string
): Error | CombatantDetails {
  for (let party of Object.values(game.adventuringParties)) {
    const combatantResult = getCombatantInParty(party, entityId);
    if (!(combatantResult instanceof Error)) return combatantResult;
  }

  return new Error(ERROR_MESSAGES.COMBATANT.NOT_FOUND);
}
