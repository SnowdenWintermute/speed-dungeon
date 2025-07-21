import { Combatant, CombatantProperties } from "../../../combatants/index.js";
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
  SelectorNode,
  SequenceNode,
  SucceederNode,
  UntilSuccessNode,
} from "../behavior-tree.js";
import { CollectPotentialTargetsForAction } from "../custom-nodes/collect-potential-target-for-action.js";
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
          new SelectorNode([
            new PopFromStackNode(
              this.behaviorContext.consideredActionNamesFilteredByIntents,
              this.behaviorContext.setCurrentActionNameConsidering
            ),
            new SucceederNode(),
          ]),
          // check if action is useable
          new CheckIfActionUsableInCurrentContext(
            this.behaviorContext,
            this.combatant,
            this.behaviorContext.currentActionNameConsidering
          ),
          new CheckIfHasRequiredResourcesForAction(
            this.behaviorContext,
            this.combatant,
            this.behaviorContext.currentActionNameConsidering
          ),
          new CheckIfHasRequiredConsumablesForAction(
            this.behaviorContext,
            this.combatant,
            this.behaviorContext.currentActionNameConsidering
          ),
          new CheckIfWearingProperEquipmentForAction(
            this.behaviorContext,
            this.combatant,
            this.behaviorContext.currentActionNameConsidering
          ),
          new CollectPotentialTargetsForAction(
            this.behaviorContext,
            this.combatant,
            this.behaviorContext.currentActionNameConsidering
          ),
        ])
      ),
      // the name we're considering should be the one we just picked as the first
      // in the random list of actions that passed all the previous checks
      new SelectActionWithPotentialTargets(
        this.behaviorContext,
        this.combatant,
        this.behaviorContext.currentActionNameConsidering
      ),
      new RandomizerNode(
        this.behaviorContext.selectedActionWithPotentialValidTargets?.potentialValidTargets
      ),
      new SelectActionExecutionIntent(
        this.behaviorContext,
        this.combatant,
        this.behaviorContext.currentActionNameConsidering,
        this.behaviorContext.selectedActionWithPotentialValidTargets?.potentialValidTargets[0]
      ),
    ]);
  }
  execute(): BehaviorNodeState {
    return this.root.execute();
  }
}

class CheckIfActionUsableInCurrentContext implements BehaviorNode {
  constructor(
    private behaviorContext: AIBehaviorContext,
    private _combatant: Combatant,
    private actionNameOption: null | CombatActionName
  ) {}
  execute(): BehaviorNodeState {
    if (this.actionNameOption === null) return BehaviorNodeState.Failure;
    const action = COMBAT_ACTIONS[this.actionNameOption];
    const usable = action.isUsableInThisContext(this.behaviorContext.battleOption);
    if (usable) return BehaviorNodeState.Success;
    return BehaviorNodeState.Failure;
  }
}

class CheckIfHasRequiredResourcesForAction implements BehaviorNode {
  constructor(
    private behaviorContext: AIBehaviorContext,
    private combatant: Combatant,
    private actionNameOption: null | CombatActionName
  ) {}
  execute(): BehaviorNodeState {
    if (this.actionNameOption === null) return BehaviorNodeState.Failure;
    const { combatantProperties } = this.combatant;

    const hasResources = CombatantProperties.hasRequiredResourcesToUseAction(
      combatantProperties,
      this.actionNameOption
    );
    if (hasResources) return BehaviorNodeState.Success;
    return BehaviorNodeState.Failure;
  }
}

class CheckIfHasRequiredConsumablesForAction implements BehaviorNode {
  constructor(
    private behaviorContext: AIBehaviorContext,
    private combatant: Combatant,
    private actionNameOption: null | CombatActionName
  ) {}
  execute(): BehaviorNodeState {
    if (this.actionNameOption === null) return BehaviorNodeState.Failure;
    const { combatantProperties } = this.combatant;

    const hasRequiredConsumables = CombatantProperties.hasRequiredConsumablesToUseAction(
      combatantProperties,
      this.actionNameOption
    );
    if (hasRequiredConsumables) return BehaviorNodeState.Success;
    return BehaviorNodeState.Failure;
  }
}

class CheckIfWearingProperEquipmentForAction implements BehaviorNode {
  constructor(
    private behaviorContext: AIBehaviorContext,
    private combatant: Combatant,
    private actionNameOption: null | CombatActionName
  ) {}
  execute(): BehaviorNodeState {
    if (this.actionNameOption === null) return BehaviorNodeState.Failure;
    const { combatantProperties } = this.combatant;

    const isWearingProperEquipment = CombatantProperties.isWearingRequiredEquipmentToUseAction(
      combatantProperties,
      this.actionNameOption
    );
    if (isWearingProperEquipment) return BehaviorNodeState.Success;
    return BehaviorNodeState.Failure;
  }
}

class SelectActionWithPotentialTargets implements BehaviorNode {
  constructor(
    private behaviorContext: AIBehaviorContext,
    private combatant: Combatant,
    private actionNameOption: null | CombatActionName
  ) {}
  execute(): BehaviorNodeState {
    if (this.actionNameOption === null) return BehaviorNodeState.Failure;
    const { combatantProperties } = this.combatant;

    const potentialValidTargets =
      this.behaviorContext.usableActionsWithPotentialValidTargets[this.actionNameOption];

    if (potentialValidTargets === undefined) {
      throw new Error(
        "expected usableActionsWithPotentialValidTargets to contain the action name passed to this node"
      );
    }

    this.behaviorContext.selectedActionWithPotentialValidTargets = {
      actionName: this.actionNameOption,
      potentialValidTargets,
    };

    return BehaviorNodeState.Success;
  }
}

class SelectActionExecutionIntent implements BehaviorNode {
  constructor(
    private behaviorContext: AIBehaviorContext,
    private combatant: Combatant,
    private actionNameOption: null | CombatActionName,
    private targetsOption: undefined | CombatActionTarget
  ) {}

  execute(): BehaviorNodeState {
    if (this.actionNameOption === null || this.targetsOption === undefined)
      return BehaviorNodeState.Failure;

    const action = COMBAT_ACTIONS[this.actionNameOption];
    const actionUseIsValid = action.useIsValid(
      this.targetsOption,
      this.behaviorContext.combatantContext
    );
    if (!actionUseIsValid) {
      throw new Error("expected to select a valid usable action");
    }

    this.behaviorContext.selectedActionIntent = new CombatActionExecutionIntent(
      this.actionNameOption,
      this.targetsOption
    );
    this.combatant.combatantProperties.selectedCombatAction = this.actionNameOption;
    this.combatant.combatantProperties.combatActionTarget = this.targetsOption;

    return BehaviorNodeState.Success;
  }
}
