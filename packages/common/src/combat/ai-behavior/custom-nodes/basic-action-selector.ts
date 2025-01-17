import { CombatAction } from "../../index.js";
import { EntityId } from "../../../primatives/index.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorLeaf, BehaviorNode, Selector, Sequence } from "../behavior-tree.js";

export class BasicAIActionSelector {
  private root: BehaviorNode;

  constructor(private context: AIBehaviorContext) {
    // set a selected action and targets
    this.root = new Selector([
      new Selector([
        // HEALING
        new Sequence([
          // collect a list of valid healing targets
          new SetAvailableTargetsAndUsableActions(
            this.context,
            () => {
              throw new Error("Not implemented");
            },
            () => {
              throw new Error("Not implemented");
            }
          ),
          // choose the most effective healing action on the available targets
          new BehaviorLeaf((context: AIBehaviorContext) => {
            const mostEffectiveAction: CombatAction | null = null;
            if (mostEffectiveAction) {
              // set selected action  / targets in context
              return true;
            } else return false;
          }),
        ]),
        // ATTACKS
        new Sequence([
          // collect a list of valid enemy targets
          new SetAvailableTargetsAndUsableActions(
            this.context,
            () => {
              throw new Error("Not implemented");
            },
            () => {
              throw new Error("Not implemented");
            }
          ),
          new BehaviorLeaf((context: AIBehaviorContext) => {
            // choose most effective targed taking into account the AIHostileTargetSelectionScheme
            const mostEffectiveAction: CombatAction | null = null;
            if (mostEffectiveAction) {
              // set selected action  / targets in context
              return true;
            } else return false;
          }),
        ]),
      ]),
    ]);
  }

  execute(): boolean {
    return this.root.execute();
  }
}

class SetAvailableTargetsAndUsableActions implements BehaviorNode {
  constructor(
    private context: AIBehaviorContext,
    isValidTarget: (entityId: EntityId) => boolean,
    isUsableAction: (entityId: EntityId) => boolean
  ) {}
  execute(): boolean {
    return new Sequence([
      // collect a list of valid targets
      new BehaviorLeaf((context: AIBehaviorContext) => {
        const listOfAlliesBelowHpThreshold: EntityId[] = [];
        if (listOfAlliesBelowHpThreshold.length) {
          // set list in context
          return true;
        } else return false;
      }),
      // collect a list of valid actions
      new BehaviorLeaf((context: AIBehaviorContext) => {
        const listOfValidActions: CombatAction[] = [];
        if (listOfValidActions.length) {
          // set list in context
          return true;
        } else return false;
      }),
      // collect a list of usable actions
      new BehaviorLeaf((context: AIBehaviorContext) => {
        const listOfUsableHealingActions: CombatAction[] = [];
        if (listOfUsableHealingActions.length) {
          // set list in context
          return true;
        } else return false;
      }),
    ]).execute();
  }
}
