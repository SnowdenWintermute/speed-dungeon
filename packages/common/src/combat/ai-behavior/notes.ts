// Attack Randomly
// Sequence (all must succeed)
// - CollectAllOwnedActionsByIntent(ActionIntent.Malicious)
//   - if no owned actions by that intent, return State.Failure
//   - write owned malicious actions on blackboard.consideredActions
//   - return State.Success
// - ChooseRandomValidAction(blackboard.consideredActions)
//   - Randomizer(blackboard.consideredActions)
//   - UntilFail
//
//     - Inverter
//      - Sequence
//         - Selector (first successful)
//           - PopFromStack(blackboard.consideredActions, currentActionNameConsidered)
//           - Succeeder (stack has finished)
//         - CheckIfActionUsable(currentActionNameConsidered)
//         - CollectPotentialTargetsForAction(currentActionNameConsidered)
//             - CollectPotentialTargets(currentActionNameConsidered)
//               - blackboard.usableActionsWithValidTargets[actionName].push(target)
//    - SetSelectedActionName(Object.values( blackboard.usableActionsWithValidTargets )[0])
// - ChooseRandomTargets(blackboard.selectedActionName)
//  - Randomizer(blackboard.usableActionsWithValidTargets[blackboard.selectedActionName].validTargets)
//  - UntilFail
//   - Inverter
//     - Sequence (all must succeed)
//       - PopFromStack(blackboard.validTargets)
//       - set blackboard.selectedTargets

import { Combatant, CombatantProperties } from "../../combatants/index.js";
import { iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import { COMBAT_ACTIONS } from "../combat-actions/action-implementations/index.js";
import { CombatActionIntent, CombatActionName } from "../combat-actions/index.js";
import { AIBehaviorContext } from "./ai-context.js";
import {
  BehaviorNode,
  BehaviorNodeState,
  InverterNode,
  PopFromStackNode,
  RandomizerNode,
  SelectorNode,
  SequenceNode,
  SucceederNode,
  UntilFailNode,
} from "./behavior-tree.js";

//  - return State.Success
class SelectRandomAction implements BehaviorNode {
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
      new RandomizerNode(this.behaviorContext.consideredActionNamesFilteredByIntents),
      new UntilFailNode(
        new InverterNode(
          new SequenceNode([
            new SelectorNode([
              new PopFromStackNode(
                this.behaviorContext.consideredActionNamesFilteredByIntents,
                this.behaviorContext.setCurrentActionNameConsidering
              ),
              new SucceederNode(),
            ]),
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
            // collect potential targets
          ])
        )
      ),
    ]);
  }
  execute(): BehaviorNodeState {
    return this.root.execute();
  }
}

class CollectAllOwnedActionsByIntent implements BehaviorNode {
  constructor(
    private behaviorContext: AIBehaviorContext,
    private combatant: Combatant,
    private actionIntents: CombatActionIntent[]
  ) {}
  execute(): BehaviorNodeState {
    const { ownedActions } = this.combatant.combatantProperties;
    const collected: CombatActionName[] = [];
    for (const [actionName, _actionState] of iterateNumericEnumKeyedRecord(ownedActions)) {
      const action = COMBAT_ACTIONS[actionName];
      if (this.actionIntents.includes(action.targetingProperties.intent))
        collected.push(actionName);
    }
    if (collected.length === 0) return BehaviorNodeState.Failure;

    this.behaviorContext.consideredActionNamesFilteredByIntents = collected;

    return BehaviorNodeState.Success;
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
