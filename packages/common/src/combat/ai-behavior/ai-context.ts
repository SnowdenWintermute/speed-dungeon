import { Battle } from "../../battle/index.js";
import { ActionUserContext } from "../../action-user-context/index.js";
import { CombatActionExecutionIntent } from "../combat-actions/combat-action-execution-intent.js";
import { RandomNumberGenerationPolicy } from "../../utility-classes/random-number-generation-policy.js";

export class AIBehaviorContext {
  public selectedActionIntent: null | CombatActionExecutionIntent = null;

  constructor(
    readonly actionUserContext: ActionUserContext,
    readonly randomNumberGenerationPolicy: RandomNumberGenerationPolicy,
    readonly battleOption: Battle | null // allow for ally AI controlled combatants doing things outside of combat
  ) {}
}
