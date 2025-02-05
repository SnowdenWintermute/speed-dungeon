import { CombatActionExecutionIntent } from "../combat/index.js";
import { CombatantContext } from "../combatant-context/index.js";
import { EntityId } from "../primatives/index.js";
import { IdGenerator } from "../utility-classes/index.js";
import { SequentialIdGenerator } from "../utils/index.js";
import { ActionSequenceManager } from "./action-sequence-manager.js";
import { ActionStepTracker } from "./action-step-tracker.js";
import { ReplayEventNode } from "./replay-events.js";

export class ActionSequenceManagerRegistry {
  private actionManagers: { [id: string]: ActionSequenceManager } = {};
  actionStepIdGenerator = new SequentialIdGenerator();
  constructor(private idGenerator: IdGenerator) {}
  isEmpty() {
    return !Object.values(this.actionManagers).length;
  }
  isNotEmpty() {
    return !this.isEmpty();
  }
  registerAction(
    actionExecutionIntent: CombatActionExecutionIntent,
    replayNode: ReplayEventNode,
    combatantContext: CombatantContext,
    previousTrackerInSequenceOption: null | ActionStepTracker
  ) {
    const id = this.idGenerator.generate();
    const manager = new ActionSequenceManager(
      id,
      actionExecutionIntent,
      replayNode,
      combatantContext,
      this,
      previousTrackerInSequenceOption
    );
    this.actionManagers[id] = manager;
    return manager;
  }
  getManager(id: EntityId) {
    return this.actionManagers[id];
  }
  unRegisterActionManager(id: string) {
    delete this.actionManagers[id];
  }
  getManagers() {
    return Object.entries(this.actionManagers);
  }
}
