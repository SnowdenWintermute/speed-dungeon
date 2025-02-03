import {
  ActionExecutionTracker,
  CombatActionExecutionIntent,
  CombatantContext,
  EntityId,
  ReplayEventNode,
} from "@speed-dungeon/common";
import { SequentialActionExecutionManager } from "./sequential-action-execution-manager.js";
import { idGenerator } from "../../../singletons.js";

export class SequentialActionExecutionManagerRegistry {
  private actionManagers: { [id: string]: SequentialActionExecutionManager } = {};
  constructor() {}
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
    const id = idGenerator.generate();
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
