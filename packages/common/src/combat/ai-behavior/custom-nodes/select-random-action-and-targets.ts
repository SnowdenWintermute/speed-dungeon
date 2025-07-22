import { Combatant } from "../../../combatants/index.js";
import { COMBAT_ACTIONS } from "../../combat-actions/action-implementations/index.js";
import {
  CombatActionExecutionIntent,
  CombatActionIntent,
  CombatActionName,
} from "../../combat-actions/index.js";
import { CombatActionTarget } from "../../targeting/combat-action-targets.js";
import { AIBehaviorContext } from "../ai-context.js";
import {
  BehaviorNode,
  BehaviorNodeState,
  PopFromStackNode,
  RandomizerNode,
  SequenceNode,
  UntilSuccessNode,
} from "../behavior-tree.js";
import { CollectPotentialTargetsForActionIfUsable } from "./add-to-considered-actions-with-targets-if-usable.js";
import { CollectAllOwnedActionsByIntent } from "./collect-all-owned-action-by-intent.js";

export class SelectRandomActionAndTargets implements BehaviorNode {
  private root: BehaviorNode;
  constructor(
    private behaviorContext: AIBehaviorContext,
    private combatant: Combatant,
    private permittedIntents: CombatActionIntent[]
  ) {
    this.root = new SequenceNode([
      new CollectAllOwnedActionsByIntent(
        this.behaviorContext,
        this.combatant,
        this.permittedIntents
      ),
      // randomize the possible actions now so we don't calculate all the conditional
      // stuff for each one, just the first random one
      new RandomizerNode(this.behaviorContext.consideredActionNamesFilteredByIntents),
      new UntilSuccessNode(
        new SequenceNode([
          // pop from stack next possible action
          new PopFromStackNode(
            this.behaviorContext.consideredActionNamesFilteredByIntents,
            this.behaviorContext.setCurrentActionNameConsidering
          ),
          // check if action is useable
          new CollectPotentialTargetsForActionIfUsable(this.behaviorContext, this.combatant),
        ]),
        {
          maxAttempts: this.behaviorContext.consideredActionNamesFilteredByIntents.length,
        }
      ),
      // the name we're considering should be the one we just picked as the first
      // in the random list of actions that passed all the previous checks
      new SelectActionWithPotentialTargets(this.behaviorContext, this.combatant),
      new RandomizerNode(
        this.behaviorContext.selectedActionWithPotentialValidTargets?.potentialValidTargets
      ),
      new SelectActionExecutionIntent(
        this.behaviorContext,
        this.combatant,
        this.behaviorContext.selectedActionWithPotentialValidTargets?.potentialValidTargets[0]
      ),
    ]);
  }
  execute(): BehaviorNodeState {
    return this.root.execute();
  }
}

class SelectActionWithPotentialTargets implements BehaviorNode {
  constructor(
    private behaviorContext: AIBehaviorContext,
    private combatant: Combatant
  ) {}
  execute(): BehaviorNodeState {
    const actionNameOption = this.behaviorContext.currentActionNameConsidering;
    if (actionNameOption === null) return BehaviorNodeState.Failure;
    const { combatantProperties } = this.combatant;

    const potentialValidTargets =
      this.behaviorContext.usableActionsWithPotentialValidTargets[actionNameOption];

    if (potentialValidTargets === undefined) {
      throw new Error(
        "expected usableActionsWithPotentialValidTargets to contain the action name passed to this node"
      );
    }

    this.behaviorContext.selectedActionWithPotentialValidTargets = {
      actionName: actionNameOption,
      potentialValidTargets,
    };

    return BehaviorNodeState.Success;
  }
}

class SelectActionExecutionIntent implements BehaviorNode {
  constructor(
    private behaviorContext: AIBehaviorContext,
    private combatant: Combatant,
    private targetsOption: undefined | CombatActionTarget
  ) {}

  execute(): BehaviorNodeState {
    const actionNameOption = this.behaviorContext.currentActionNameConsidering;
    if (actionNameOption === null || this.targetsOption === undefined)
      return BehaviorNodeState.Failure;

    const action = COMBAT_ACTIONS[actionNameOption];
    const actionUseIsValid = action.useIsValid(
      this.targetsOption,
      this.behaviorContext.combatantContext
    );
    if (!actionUseIsValid) {
      throw new Error("expected to select a valid usable action");
    }

    this.behaviorContext.selectedActionIntent = new CombatActionExecutionIntent(
      actionNameOption,
      this.targetsOption
    );
    this.combatant.combatantProperties.selectedCombatAction = actionNameOption;
    this.combatant.combatantProperties.combatActionTarget = this.targetsOption;

    return BehaviorNodeState.Success;
  }
}
