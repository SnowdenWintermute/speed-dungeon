import { AdventuringParty } from "../../adventuring-party/index.js";
import { COMBATANT_MAX_LEVEL } from "../../app-consts.js";
import { CombatActionHitOutcomes, ThreatChanges } from "../../combat/action-results/index.js";
import { CombatAttribute } from "../attributes/index.js";
import { Combatant, CombatantProperties } from "../index.js";
import { STABLE_THREAT_CAP, ThreatType } from "./index.js";

const DAMAGE_STABLE_THREAT_BASE = 80;
const HEALING_STABLE_THREAT_BASE = DAMAGE_STABLE_THREAT_BASE / 2;
const VOLATILE_THREAT_BASE = DAMAGE_STABLE_THREAT_BASE * 3;
const DAMAGE_THREAT_SCALING_OFFSET = 6;
const HEALING_THREAT_SCALING_OFFSET = 11;
const THREAT_CURVE_TUNING = 31;
const CHARACTER_LEVEL_THREAT_SCALING_SOFT_CAP = 50;

const STABLE_THREAT_REDUCTION_ON_MONSTER_HIT_MODIFIER = 1800;

// damageStableThreat = 80 / (FLOOR( 31 * targetLevel / 50 ) + 6)
// damageVolatileThreat = 240 / (FLOOR( 31 * targetLevel / 50 ) + 6)
// healingStableThreat = 40 / (FLOOR( 31 * targetLevel / 50 ) + 11)
// healingVolatileThreat = 240 / (FLOOR( 31 * targetLevel / 50 ) + 11)

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

  static getThreatGenerated(value: number, targetLevel: number, base: number, offset: number) {
    const modifier =
      base /
      (Math.floor((THREAT_CURVE_TUNING * targetLevel) / CHARACTER_LEVEL_THREAT_SCALING_SOFT_CAP) +
        offset);

    return Math.floor(value * modifier);
  }

  updateThreatChangesForPlayerControlledCharacterHitOutcomes() {
    if (!this.hitOutcomes.hitPointChanges) return;
    const userIsMonster = this.party.currentRoom.monsterPositions.includes(
      this.actionUser.entityProperties.id
    );
    if (userIsMonster)
      return console.log(
        "updateThreatChangesForPlayerControlledCharacterHitOutcomes but user was not on player team"
      );

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
          targetCombatantResult.combatantProperties.level,
          hitPointChange.value
        );
      }
    }
  }

  updateThreatChangesForMonsterHitOutcomes() {
    if (
      !this.hitOutcomes.hitPointChanges ||
      Object.values(this.hitOutcomes.hitPointChanges).length === 0
    )
      return;
    for (const [entityId, hitPointChange] of this.hitOutcomes.hitPointChanges.getRecords()) {
      if (hitPointChange.value > 0) continue; // don't add threat for monsters healing players
      const targetCombatantResult = AdventuringParty.getCombatant(this.party, entityId);
      if (targetCombatantResult instanceof Error) throw targetCombatantResult;
      const targetIsPlayer = targetCombatantResult.combatantProperties.controllingPlayer;
      if (!targetIsPlayer) continue;

      const targetMaxHp = CombatantProperties.getTotalAttributes(
        targetCombatantResult.combatantProperties
      )[CombatAttribute.Hp];

      const stableThreatChange = Math.floor(
        (STABLE_THREAT_REDUCTION_ON_MONSTER_HIT_MODIFIER * hitPointChange.value) / targetMaxHp
      );

      this.threatChanges.addOrUpdateEntry(
        this.actionUser.entityProperties.id,
        entityId,
        ThreatType.Stable,
        Math.min(-1, stableThreatChange) // all monster actions should at least reduce ST by 1
      );
    }
  }

  addThreatDamageDealtByPlayerCharacter(
    monster: Combatant,
    playerCharacter: Combatant,
    hpChangeValue: number
  ) {
    const stableThreatGenerated =
      ThreatCalculator.getThreatGenerated(
        hpChangeValue,
        monster.combatantProperties.level,
        DAMAGE_STABLE_THREAT_BASE,
        DAMAGE_THREAT_SCALING_OFFSET
      ) * -1;

    this.threatChanges.addOrUpdateEntry(
      monster.entityProperties.id,
      playerCharacter.entityProperties.id,
      ThreatType.Stable,
      stableThreatGenerated
    );

    const volatileThreatGenerated =
      ThreatCalculator.getThreatGenerated(
        hpChangeValue,
        monster.combatantProperties.level,
        VOLATILE_THREAT_BASE,
        DAMAGE_THREAT_SCALING_OFFSET
      ) * -1;

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
    targetLevel: number,
    hpChangeValue: number
  ) {
    for (const [monsterId, monster] of Object.entries(monsters)) {
      const stableThreatGenerated = ThreatCalculator.getThreatGenerated(
        hpChangeValue,
        targetLevel,
        HEALING_STABLE_THREAT_BASE,
        HEALING_THREAT_SCALING_OFFSET
      );

      this.threatChanges.addOrUpdateEntry(
        monster.entityProperties.id,
        user.entityProperties.id,
        ThreatType.Stable,
        stableThreatGenerated
      );

      const volatileThreatGenerated = ThreatCalculator.getThreatGenerated(
        hpChangeValue,
        targetLevel,
        VOLATILE_THREAT_BASE,
        HEALING_THREAT_SCALING_OFFSET
      );

      this.threatChanges.addOrUpdateEntry(
        monster.entityProperties.id,
        user.entityProperties.id,
        ThreatType.Volatile,
        volatileThreatGenerated
      );
    }
  }
}
