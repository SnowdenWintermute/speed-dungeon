import { AdventuringParty } from "../../../adventuring-party/index.js";
import { CombatantContext } from "../../../combatant-context/index.js";
import { CombatantProperties } from "../../../combatants/index.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { EntityId } from "../../../primatives/index.js";
import { HpChange } from "../../hp-change-source-types.js";

export class HitPointChanges {
  private changes: Record<EntityId, HpChange> = {};
  constructor() {}
  addRecord(entityId: string, change: HpChange) {
    this.changes[entityId] = change;
  }

  getRecord(entityId: EntityId) {
    return this.changes[entityId];
  }
  getRecords() {
    return Object.entries(this.changes);
  }

  applyToGame(combatantContext: CombatantContext) {
    const { game, party } = combatantContext;

    for (const [targetId, hpChange] of Object.entries(this.changes)) {
      const targetResult = AdventuringParty.getCombatant(party, targetId);
      if (targetResult instanceof Error) throw targetResult;
      const { combatantProperties: targetCombatantProperties } = targetResult;
      const combatantWasAliveBeforeHpChange = targetCombatantProperties.hitPoints > 0;
      CombatantProperties.changeHitPoints(targetCombatantProperties, hpChange.value);

      if (targetCombatantProperties.hitPoints <= 0) {
        SpeedDungeonGame.handleCombatantDeath(game, party.battleId, targetId);
      }

      // - @todo - handle any ressurection by adding the affected combatant's turn tracker back into the battle
      if (!combatantWasAliveBeforeHpChange && targetCombatantProperties.hitPoints > 0) {
      }
    }
  }
}
