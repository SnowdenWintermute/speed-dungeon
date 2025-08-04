import { AiType, Combatant } from "../../../combatants/index.js";
import { CombatActionIntent } from "../../combat-actions/combat-action-intent.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorNode, BehaviorNodeState, SelectorNode } from "../behavior-tree.js";
import { SelectActionToHealLowestHpAlly } from "./select-action-to-heal-lowest-hp-ally-node.js";
import { SelectTopThreatTargetAndAction } from "./select-highest-threat-target.js";

export class RootAIBehaviorNode implements BehaviorNode {
  private root: BehaviorNode;
  constructor(
    private behaviorContext: AIBehaviorContext,
    private combatant: Combatant
  ) {
    const targetSelectionSchemes: BehaviorNode[] = [];

    if (combatant.combatantProperties.aiTypes?.includes(AiType.Healer)) {
      console.log("ai is healer:");
      targetSelectionSchemes.push(
        new SelectActionToHealLowestHpAlly(this.behaviorContext, this.combatant, 0.7)
      );
    }

    targetSelectionSchemes.push(
      new SelectTopThreatTargetAndAction(this.behaviorContext, this.combatant, [
        CombatActionIntent.Malicious,
      ])
    );

    this.root = new SelectorNode(targetSelectionSchemes);
  }
  execute(): BehaviorNodeState {
    return this.root.execute();
  }
}
