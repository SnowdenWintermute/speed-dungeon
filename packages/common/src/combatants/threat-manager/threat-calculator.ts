import { AdventuringParty } from "../../adventuring-party/index.js";
import { COMBATANT_MAX_LEVEL } from "../../app-consts.js";
import { CombatActionHitOutcomes, ThreatChanges } from "../../combat/action-results/index.js";
import { EntityId } from "../../primatives/index.js";
import { Combatant } from "../index.js";
import { ThreatType } from "./index.js";

export const DAMAGE_DEALT_STABLE_THREAT_MODIFIER = 4;
export const DAMAGE_DEALT_VOLATILE_THREAT_MODIFIER = DAMAGE_DEALT_STABLE_THREAT_MODIFIER * 3;

const MINIMUM_THREAT_LEVEL_MODIFIER = 1 - (COMBATANT_MAX_LEVEL - 1) / COMBATANT_MAX_LEVEL;

export const HEALING_STABLE_THREAT_MODIFIER = 1;
export const HEALING_VOLATILE_THREAT_MODIFIER = HEALING_STABLE_THREAT_MODIFIER * 6;

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
        this.addThreatDamageDealtByPlayerCharacter(
          targetCombatantResult,
          this.actionUser,
          hitPointChange.value
        );
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

      this.threatChanges.addOrUpdateEntry(
        this.actionUser.entityProperties.id,
        entityId,
        ThreatType.Stable,
        hitPointChange.value
      );
    }
  }

  addThreatDamageDealtByPlayerCharacter(
    monster: Combatant,
    playerCharacter: Combatant,
    hpChangeValue: number
  ) {
    const targetLevelPercentOfMaxLevel = monster.combatantProperties.level / COMBATANT_MAX_LEVEL;
    const targetLevelThreatModifier = Math.max(
      MINIMUM_THREAT_LEVEL_MODIFIER,
      1 - targetLevelPercentOfMaxLevel
    );
    const stableThreatModifier = DAMAGE_DEALT_STABLE_THREAT_MODIFIER * targetLevelThreatModifier;
    const stableThreatGenerated = Math.floor(hpChangeValue * stableThreatModifier * -1);

    this.threatChanges.addOrUpdateEntry(
      monster.entityProperties.id,
      playerCharacter.entityProperties.id,
      ThreatType.Stable,
      stableThreatGenerated
    );

    const volatileThreatModifier =
      DAMAGE_DEALT_VOLATILE_THREAT_MODIFIER * targetLevelThreatModifier;

    const volatileThreatGenerated = Math.floor(hpChangeValue * volatileThreatModifier * -1);

    this.threatChanges.addOrUpdateEntry(
      monster.entityProperties.id,
      playerCharacter.entityProperties.id,
      ThreatType.Volatile,
      volatileThreatGenerated
    );
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
      this.threatChanges.addOrUpdateEntry(
        monsterId,
        user.entityProperties.id,
        ThreatType.Stable,
        hpChangeValue
      );
    }
  }
}
