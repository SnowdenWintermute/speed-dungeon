import { EntityId } from "../../primatives/index.js";

export class ThreatManager {
  private threatScoresByCombatantId: Record<EntityId, number> = {};
  constructor() {}

  changeThreat(combatantId: EntityId, value: number) {
    const currentThreat = this.threatScoresByCombatantId[combatantId] || 0;
    const newThreat = Math.max(0, currentThreat + value);
    this.threatScoresByCombatantId[combatantId] = newThreat;
  }

  getHighestThreatCombatantId(): EntityId | null {
    const entries = Object.entries(this.threatScoresByCombatantId);
    if (entries.length === 0) return null;
    return entries.reduce((a, b) => (a[1] > b[1] ? a : b))[0];
  }
}

// on action use
// const threatChanges =  action.getThreatGeneratedOnUse(actionResolutionStepContext);
// threatChanges.applyToGame()
// threatChanges.addToUpdate()
// on action hit outcomes
// - action.getThreatGeneratedOnHitOutcomes(actionResolutionStepContext, hitOutcomes);
