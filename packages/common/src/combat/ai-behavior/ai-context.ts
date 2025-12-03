import { Battle } from "../../battle/index.js";
import { ActionUserContext } from "../../action-user-context/index.js";
import { CombatActionExecutionIntent } from "../combat-actions/combat-action-execution-intent.js";

export class AIBehaviorContext {
  public selectedActionIntent: null | CombatActionExecutionIntent = null;

  constructor(
    public actionUserContext: ActionUserContext,
    public battleOption: Battle | null // allow for ally AI controlled combatants doing things outside of combat
  ) {}
}
