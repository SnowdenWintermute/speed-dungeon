import { CombatActionExecutionIntent } from "../combat/index.js";
import { CombatantContext } from "../combatant-context/index.js";
import { EntityId } from "../primatives/index.js";
import { IdGenerator } from "../utility-classes/index.js";
import { SequentialIdGenerator } from "../utils/index.js";
import { ActionExecutionTracker } from "./action-execution-tracker.js";
import { ReplayEventNode } from "./replay-events.js";
import { SequentialActionExecutionManager } from "./sequential-action-execution-manager.js";

export class SequentialActionExecutionManagerRegistry {
  private actionManagers: { [id: string]: SequentialActionExecutionManager } = {};
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
    previousTrackerInSequenceOption: null | ActionExecutionTracker
  ) {
    const id = this.idGenerator.generate();
    const manager = new SequentialActionExecutionManager(
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
  unRegisterAction(id: string) {
    delete this.actionManagers[id];
  }
  getManagers() {
    return Object.entries(this.actionManagers);
  }
}
