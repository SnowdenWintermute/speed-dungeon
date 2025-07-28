import { AdventuringParty } from "../../adventuring-party/index.js";
import { CombatActionHitOutcomes, ThreatChanges } from "../../combat/action-results/index.js";
import { COMBAT_ACTIONS } from "../../combat/combat-actions/action-implementations/index.js";
import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import { HitOutcome } from "../../hit-outcome.js";
import { iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import { CombatAttribute } from "../attributes/index.js";
import { Combatant, CombatantProperties } from "../index.js";
import { ThreatType } from "./index.js";

const DAMAGE_STABLE_THREAT_BASE = 80;
const HEALING_STABLE_THREAT_BASE = DAMAGE_STABLE_THREAT_BASE / 2;
const VOLATILE_THREAT_BASE = DAMAGE_STABLE_THREAT_BASE * 3;
const DAMAGE_THREAT_SCALING_OFFSET = 6;
const HEALING_THREAT_SCALING_OFFSET = 11;
const THREAT_CURVE_TUNING = 31;
const CHARACTER_LEVEL_THREAT_SCALING_SOFT_CAP = 50;
const VOLATILE_THREAT_DECAY_PER_SECOND = -60;
const AVERAGE_EXPECTED_TURN_TIME_SECONDS = 1;
const VOLATILE_THREAT_DECAY_PER_TURN =
  VOLATILE_THREAT_DECAY_PER_SECOND * AVERAGE_EXPECTED_TURN_TIME_SECONDS;

const STABLE_THREAT_REDUCTION_ON_MONSTER_HIT_MODIFIER = 1800;
export const STABLE_THREAT_REDUCTION_ON_MONSTER_DEBUFFING_PLAYER = 80;

export class ThreatCalculator {
  private monsters: {
    [entityId: string]: Combatant;
  };
  private players: {
    [entityId: string]: Combatant;
  };
  constructor(
    private threatChanges: ThreatChanges,
    private hitOutcomes: CombatActionHitOutcomes,
    private party: AdventuringParty,
    private actionUser: Combatant,
    private actionName: CombatActionName
  ) {
    const allCombatantsResult = AdventuringParty.getAllCombatants(party);
    if (allCombatantsResult instanceof Error) throw allCombatantsResult;
    const { monsters, characters } = allCombatantsResult;
    this.monsters = monsters;
    this.players = characters;
  }

  static getThreatGeneratedOnHpChange(
    value: number,
    targetLevel: number,
    base: number,
    offset: number
  ) {
    const modifier =
      base /
      (Math.floor((THREAT_CURVE_TUNING * targetLevel) / CHARACTER_LEVEL_THREAT_SCALING_SOFT_CAP) +
        offset);

    return Math.floor(value * modifier);
  }

  static getThreatChangeOnDamageTaken(hpChangeValue: number, targetMaxHp: number) {
    return Math.floor(
      (STABLE_THREAT_REDUCTION_ON_MONSTER_HIT_MODIFIER * hpChangeValue) / targetMaxHp
    );
  }

  updateThreatChangesForPlayerControlledCharacterHitOutcomes() {
    const action = COMBAT_ACTIONS[this.actionName];

    if (action.hitOutcomeProperties.flatThreatGeneratedOnHit) {
      const entitiesHit = this.hitOutcomes.outcomeFlags[HitOutcome.Hit] || [];
      for (const entityId of entitiesHit) {
        const targetCombatantResult = AdventuringParty.getCombatant(this.party, entityId);
        if (targetCombatantResult instanceof Error) throw targetCombatantResult;
        const targetIsPlayer = targetCombatantResult.combatantProperties.controllingPlayer;

        if (targetCombatantResult.combatantProperties.threatManager) {
          // add flat threat to monster for user
          this.addThreatFromDebuffingMonster(
            targetCombatantResult,
            this.actionUser,
            action.hitOutcomeProperties.flatThreatGeneratedOnHit
          );
        } else if (targetIsPlayer) {
          // add threat to all monsters for user
          this.addThreatFromBuffingPlayerCharacter(
            this.monsters,
            this.actionUser,
            action.hitOutcomeProperties.flatThreatGeneratedOnHit
          );
        }
      }
    }

    const userIsMonster = this.party.currentRoom.monsterPositions.includes(
      this.actionUser.entityProperties.id
    );
    if (userIsMonster)
      return console.log(
        "updateThreatChangesForPlayerControlledCharacterHitOutcomes but user was not on player team"
      );

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

      const stableThreatChange = ThreatCalculator.getThreatChangeOnDamageTaken(
        hitPointChange.value,
        targetMaxHp
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
      ThreatCalculator.getThreatGeneratedOnHpChange(
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
      ThreatCalculator.getThreatGeneratedOnHpChange(
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
      const stableThreatGenerated = ThreatCalculator.getThreatGeneratedOnHpChange(
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

      const volatileThreatGenerated = ThreatCalculator.getThreatGeneratedOnHpChange(
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

  addThreatFromBuffingPlayerCharacter(
    monsters: {
      [entityId: string]: Combatant;
    },
    user: Combatant,
    values: Record<ThreatType, number>
  ) {
    for (const [monsterId, monster] of Object.entries(monsters)) {
      this.threatChanges.addOrUpdateEntry(
        monster.entityProperties.id,
        user.entityProperties.id,
        ThreatType.Stable,
        values[ThreatType.Stable]
      );

      this.threatChanges.addOrUpdateEntry(
        monster.entityProperties.id,
        user.entityProperties.id,
        ThreatType.Volatile,
        values[ThreatType.Volatile]
      );
    }
  }

  addThreatFromDebuffingMonster(
    monster: Combatant,
    playerCharacter: Combatant,
    threatToAdd: Record<ThreatType, number>
  ) {
    this.threatChanges.addOrUpdateEntry(
      monster.entityProperties.id,
      playerCharacter.entityProperties.id,
      ThreatType.Stable,
      threatToAdd[ThreatType.Stable]
    );

    this.threatChanges.addOrUpdateEntry(
      monster.entityProperties.id,
      playerCharacter.entityProperties.id,
      ThreatType.Volatile,
      threatToAdd[ThreatType.Volatile]
    );
  }

  addVolatileThreatDecay() {
    const monsters = this.party.currentRoom.monsters;

    for (const [monsterId, monster] of Object.entries(monsters)) {
      const { threatManager } = monster.combatantProperties;
      if (threatManager === undefined) continue;
      for (const [combatantId, threatEntry] of Object.entries(threatManager.getEntries())) {
        this.threatChanges.addOrUpdateEntry(
          monsterId,
          combatantId,
          ThreatType.Volatile,
          VOLATILE_THREAT_DECAY_PER_TURN
        );
      }
    }
  }
}
