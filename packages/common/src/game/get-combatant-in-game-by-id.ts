import { SpeedDungeonGame } from "./index.js";
import getCombatantInParty from "../adventuring-party/get-combatant-in-party.js";
import { Combatant } from "../combatants/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";

export default function getCombatantInGameById(
  game: SpeedDungeonGame,
  entityId: string
): Error | Combatant {
  for (let party of Object.values(game.adventuringParties)) {
    const combatantResult = getCombatantInParty(party, entityId);
    if (!(combatantResult instanceof Error)) return combatantResult;
  }

  return new Error(`${ERROR_MESSAGES.COMBATANT.NOT_FOUND}: Entity Id: ${entityId}`);
}
