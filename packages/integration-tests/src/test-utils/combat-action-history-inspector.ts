import { ClientApplication } from "@/client-application";
import {
  ActionIntentAndUserId,
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionTargetType,
  CombatantId,
  EntityId,
  invariant,
} from "@speed-dungeon/common";

export class CombatActionHistoryInspector {
  constructor(private readonly clientApplication: ClientApplication) {}

  private get history(): ActionIntentAndUserId[] {
    return this.clientApplication.clientLogRecorder.combatantActionsHistory;
  }

  private asString(actionIntentAndUserId: ActionIntentAndUserId) {
    const { actionName, rank, targets } = actionIntentAndUserId.actionExecutionIntent;
    const { userId } = actionIntentAndUserId;
    return `user: ${userId}:${COMBAT_ACTION_NAME_STRINGS[actionName]} R:${rank} on ${targets}`;
  }

  getAll(options?: { asStrings: boolean }) {
    if (options?.asStrings) {
      return this.history.map((item) => this.asString(item));
    }
    return this.history;
  }

  getUsedBy(userId: EntityId) {
    return this.history.filter((entry) => entry.userId === userId);
  }

  getLast() {
    return this.history.at(-1);
  }

  getLastUsedBy(userId: EntityId) {
    for (let i = this.history.length - 1; i >= 0; i--) {
      const entry = this.history[i];
      if (entry && entry.userId === userId) return entry;
    }
    return undefined;
  }

  requireLastUsedActionSingleTargetId(userId: EntityId) {
    for (let i = this.history.length - 1; i >= 0; i--) {
      const entry = this.history[i];
      if (entry && entry.userId === userId) {
        invariant(entry.actionExecutionIntent.targets.type === CombatActionTargetType.Single);
        return entry.actionExecutionIntent.targets.targetId as CombatantId;
      }
    }
    throw new Error(`expected user ${userId} to have targeted a single target as last used action`);
  }

  actionUsersHadSameSingleTarget(a: EntityId, b: EntityId) {
    const actionTakenByA = this.getLastUsedBy(a);
    invariant(actionTakenByA?.actionExecutionIntent.targets.type === CombatActionTargetType.Single);
    const actionTakenByB = this.getLastUsedBy(b);
    invariant(actionTakenByB?.actionExecutionIntent.targets.type === CombatActionTargetType.Single);
    return (
      actionTakenByB?.actionExecutionIntent.targets.targetId ===
      actionTakenByA.actionExecutionIntent.targets.targetId
    );
  }

  lastTargetedSingleStillAlive(actionUserId: EntityId) {
    const actionTaken = this.getLastUsedBy(actionUserId);
    invariant(actionTaken?.actionExecutionIntent.targets.type === CombatActionTargetType.Single);
    return !this.clientApplication.gameContext
      .requireParty()
      .combatantManager.getExpectedCombatant(actionTaken.actionExecutionIntent.targets.targetId)
      .combatantProperties.isDead();
  }
}
