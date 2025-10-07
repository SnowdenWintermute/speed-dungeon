import { AdventuringParty } from "../../adventuring-party/index.js";
import { CombatActionHitOutcomes, ThreatChanges } from "../../combat/action-results/index.js";
import { COMBAT_ACTIONS } from "../../combat/combat-actions/action-implementations/index.js";
import { CombatActionResource } from "../../combat/combat-actions/combat-action-hit-outcome-properties.js";
import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import { IActionUser } from "../../action-user-context/action-user.js";
import { HitOutcome } from "../../hit-outcome.js";
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
export const STABLE_THREAT_REDUCTION_ON_MONSTER_DEBUFFING_PLAYER = -80;

export class ThreatCalculator {
  private monsters: Combatant[];
  constructor(
    private threatChanges: ThreatChanges,
    private hitOutcomes: CombatActionHitOutcomes,
    private party: AdventuringParty,
    private actionUser: IActionUser,
    private actionName: CombatActionName
  ) {
    const { combatantManager } = party;
    this.monsters = combatantManager.getDungeonControlledCombatants();
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
        const targetCombatant = this.party.combatantManager.getExpectedCombatant(entityId);
        const { combatantProperties } = targetCombatant;
        const targetIsPlayerControlled = combatantProperties.isPlayerControlled();

        if (combatantProperties.threatManager) {
          if (!CombatantProperties.isDead(combatantProperties))
            // add flat threat to monster for user
            this.addThreatFromDebuffingMonster(
              targetCombatant,
              this.actionUser,
              action.hitOutcomeProperties.flatThreatGeneratedOnHit
            );
        } else if (targetIsPlayerControlled) {
          // add threat to all monsters for user
          this.addThreatFromBuffingPlayerCharacter(
            this.monsters,
            this.actionUser,
            action.hitOutcomeProperties.flatThreatGeneratedOnHit
          );
        }
      }
    }

    const userIsMonster = this.actionUser.getCombatantProperties().isDungeonControlled();

    if (userIsMonster) {
      return console.error(
        "updateThreatChangesForPlayerControlledCharacterHitOutcomes but user was not on player team"
      );
    }

    const resourceChanges = this.hitOutcomes.resourceChanges;
    if (!resourceChanges) return;
    const hitPointChanges = resourceChanges[CombatActionResource.HitPoints];

    if (!hitPointChanges) return;
    for (const [entityId, hitPointChange] of hitPointChanges.getRecords()) {
      const targetCombatant = this.party.combatantManager.getExpectedCombatant(entityId);
      const { combatantProperties } = targetCombatant;
      const targetIsPlayerControlled = combatantProperties.isPlayerControlled();

      if (combatantProperties.threatManager) {
        this.addThreatDamageDealtByPlayerCharacter(
          targetCombatant,
          this.actionUser,
          hitPointChange.value
        );
      } else if (targetIsPlayerControlled) {
        this.addThreatFromHealingPlayerCharacter(
          this.monsters,
          this.actionUser,
          combatantProperties.level,
          hitPointChange.value
        );
      }
    }
  }

  updateThreatChangesForMonsterHitOutcomes() {
    const entitiesHit = this.hitOutcomes.outcomeFlags[HitOutcome.Hit] || [];
    const { threatManager } = this.actionUser.getCombatantProperties();
    if (!threatManager) return;

    for (const entityId of entitiesHit) {
      const targetCombatant = this.party.combatantManager.getExpectedCombatant(entityId);
      const { combatantProperties } = targetCombatant;
      const targetIsAIControlled = !combatantProperties.isPlayerControlled();
      if (targetIsAIControlled) continue;

      const currentThreatForTargetOption = threatManager.getEntries()[entityId];
      if (!currentThreatForTargetOption || currentThreatForTargetOption.getTotal() === 0) continue;

      this.threatChanges.addOrUpdateEntry(
        this.actionUser.getEntityId(),
        entityId,
        ThreatType.Stable,
        STABLE_THREAT_REDUCTION_ON_MONSTER_DEBUFFING_PLAYER
      );
    }

    const hitPointChanges =
      this.hitOutcomes.resourceChanges &&
      this.hitOutcomes.resourceChanges[CombatActionResource.HitPoints];

    if (hitPointChanges === undefined) return;

    for (const [entityId, hitPointChange] of hitPointChanges.getRecords()) {
      if (hitPointChange.value > 0) continue; // don't add threat for monsters healing players
      const targetCombatant = this.party.combatantManager.getExpectedCombatant(entityId);
      const { combatantProperties } = targetCombatant;
      const targetIsAIControlled = !combatantProperties.isPlayerControlled();
      if (targetIsAIControlled) continue;

      const currentThreatForTargetOption = threatManager.getEntries()[entityId];
      if (!currentThreatForTargetOption || currentThreatForTargetOption.getTotal() === 0) continue;

      const targetMaxHp =
        CombatantProperties.getTotalAttributes(combatantProperties)[CombatAttribute.Hp];

      const stableThreatChange = ThreatCalculator.getThreatChangeOnDamageTaken(
        hitPointChange.value,
        targetMaxHp
      );

      this.threatChanges.addOrUpdateEntry(
        this.actionUser.getEntityId(),
        entityId,
        ThreatType.Stable,
        Math.min(-1, stableThreatChange) // all monster actions should at least reduce ST by 1
      );
    }
  }

  addThreatDamageDealtByPlayerCharacter(
    monster: Combatant,
    playerCharacter: IActionUser,
    hpChangeValue: number
  ) {
    if (CombatantProperties.isDead(monster.combatantProperties)) return;

    const stableThreatGenerated =
      ThreatCalculator.getThreatGeneratedOnHpChange(
        hpChangeValue,
        monster.combatantProperties.level,
        DAMAGE_STABLE_THREAT_BASE,
        DAMAGE_THREAT_SCALING_OFFSET
      ) * -1;

    this.threatChanges.addOrUpdateEntry(
      monster.entityProperties.id,
      playerCharacter.getEntityId(),
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
      playerCharacter.getEntityId(),
      ThreatType.Volatile,
      volatileThreatGenerated
    );
  }

  addThreatFromHealingPlayerCharacter(
    monsters: Combatant[],
    user: IActionUser,
    targetLevel: number,
    hpChangeValue: number
  ) {
    for (const monster of monsters) {
      const stableThreatGenerated = ThreatCalculator.getThreatGeneratedOnHpChange(
        hpChangeValue,
        targetLevel,
        HEALING_STABLE_THREAT_BASE,
        HEALING_THREAT_SCALING_OFFSET
      );

      this.threatChanges.addOrUpdateEntry(
        monster.entityProperties.id,
        user.getEntityId(),
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
        user.getEntityId(),
        ThreatType.Volatile,
        volatileThreatGenerated
      );
    }
  }

  addThreatFromBuffingPlayerCharacter(
    monsters: Combatant[],
    user: IActionUser,
    values: Record<ThreatType, number>
  ) {
    for (const monster of monsters) {
      if (CombatantProperties.isDead(monster.combatantProperties)) continue;

      this.threatChanges.addOrUpdateEntry(
        monster.entityProperties.id,
        user.getEntityId(),
        ThreatType.Stable,
        values[ThreatType.Stable]
      );

      this.threatChanges.addOrUpdateEntry(
        monster.entityProperties.id,
        user.getEntityId(),
        ThreatType.Volatile,
        values[ThreatType.Volatile]
      );
    }
  }

  addThreatFromDebuffingMonster(
    monster: Combatant,
    playerCharacter: IActionUser,
    threatToAdd: Record<ThreatType, number>
  ) {
    this.threatChanges.addOrUpdateEntry(
      monster.entityProperties.id,
      playerCharacter.getEntityId(),
      ThreatType.Stable,
      threatToAdd[ThreatType.Stable]
    );

    this.threatChanges.addOrUpdateEntry(
      monster.entityProperties.id,
      playerCharacter.getEntityId(),
      ThreatType.Volatile,
      threatToAdd[ThreatType.Volatile]
    );
  }

  addVolatileThreatDecay() {
    const monsters = this.party.combatantManager.getDungeonControlledCombatants();

    for (const monster of monsters) {
      if (CombatantProperties.isDead(monster.combatantProperties)) continue;
      const { threatManager } = monster.combatantProperties;
      if (threatManager === undefined) continue;
      for (const [combatantId, threatEntry] of Object.entries(threatManager.getEntries())) {
        this.threatChanges.addOrUpdateEntry(
          monster.getEntityId(),
          combatantId,
          ThreatType.Volatile,
          VOLATILE_THREAT_DECAY_PER_TURN
        );
      }
    }
  }
}
