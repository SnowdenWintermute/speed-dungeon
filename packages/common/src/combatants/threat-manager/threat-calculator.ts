import { AdventuringParty } from "../../adventuring-party/index.js";
import { CombatActionHitOutcomes, ThreatChanges } from "../../combat/action-results/index.js";
import { EntityId } from "../../primatives/index.js";
import { Combatant } from "../index.js";
import { ThreatType } from "./index.js";

export class ThreatCalculator {
  constructor(
    private threatChanges: ThreatChanges,
    private hitOutcomes: CombatActionHitOutcomes,
    private party: AdventuringParty,
    private actionUser: Combatant,
    private monsters: {
      [entityId: string]: Combatant;
    },
    private players: {
      [entityId: string]: Combatant;
    }
  ) {}

  updateThreatChangesForPlayerControlledCharacterHitOutcomes() {
    if (!this.hitOutcomes.hitPointChanges) return;

    for (const [entityId, hitPointChange] of this.hitOutcomes.hitPointChanges.getRecords()) {
      const targetCombatantResult = AdventuringParty.getCombatant(this.party, entityId);
      if (targetCombatantResult instanceof Error) throw targetCombatantResult;
      const targetIsPlayer = targetCombatantResult.combatantProperties.controllingPlayer;

      if (targetCombatantResult.combatantProperties.threatManager) {
        this.addThreatDamageDealtByPlayerCharacter(entityId, this.actionUser, hitPointChange.value);
      } else if (targetIsPlayer) {
        this.addThreatFromHealingPlayerCharacter(
          this.monsters,
          this.actionUser,
          hitPointChange.value
        );
      }
    }
  }

  updateThreatChangesForMonsterHitOutcomes() {
    console.log("attempting to reduce stable threat from monster damage");
    if (
      !this.hitOutcomes.hitPointChanges ||
      Object.values(this.hitOutcomes.hitPointChanges).length === 0
    )
      return console.log("no hit outcomes to update threat with");
    for (const [entityId, hitPointChange] of this.hitOutcomes.hitPointChanges.getRecords()) {
      console.log("hitPointChange value", hitPointChange.value);
      if (hitPointChange.value > 0) continue; // don't add threat for monsters healing players
      const targetCombatantResult = AdventuringParty.getCombatant(this.party, entityId);
      if (targetCombatantResult instanceof Error) throw targetCombatantResult;
      const targetIsPlayer = targetCombatantResult.combatantProperties.controllingPlayer;
      console.log("target is player:", targetIsPlayer);
      if (!targetIsPlayer) continue;

      this.threatChanges.addRecord(this.actionUser.entityProperties.id, {
        threatTableEntityId: entityId,
        threatType: ThreatType.Stable,
        value: hitPointChange.value,
      });
    }
  }

  addThreatDamageDealtByPlayerCharacter(
    monsterId: EntityId,
    playerCharacter: Combatant,
    hpChangeValue: number
  ) {
    this.threatChanges.addRecord(monsterId, {
      threatTableEntityId: playerCharacter.entityProperties.id,
      threatType: ThreatType.Stable,
      value: hpChangeValue * -1,
    });
  }

  addThreatFromHealingPlayerCharacter(
    monsters: {
      [entityId: string]: Combatant;
    },
    user: Combatant,
    hpChangeValue: number
  ) {
    for (const [monsterId, monster] of Object.entries(monsters)) {
      if (!monster.combatantProperties.threatManager) continue;
      this.threatChanges.addRecord(monsterId, {
        threatTableEntityId: user.entityProperties.id,
        threatType: ThreatType.Stable,
        value: hpChangeValue,
      });
    }
  }
}
