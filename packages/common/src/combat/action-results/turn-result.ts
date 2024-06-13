import { ActionResult } from "./action-result";

export interface CombatTurnResult {
  combatantId: string;
  actionResults: ActionResult[];
}
