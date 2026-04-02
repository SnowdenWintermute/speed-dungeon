import { MAX_CRIT_CHANCE, MIN_HIT_CHANCE } from "../../../app-consts.js";
import { IActionUser } from "../../../action-user-context/action-user.js";
import { CombatAttribute } from "../../../combatants/attributes/index.js";
import { Combatant } from "../../../combatants/index.js";
import { HitOutcome } from "../../../hit-outcome.js";
import { NormalizedPercentage } from "../../../aliases.js";
import { RandomNumberGenerator } from "../../../utility-classes/randomizers.js";
import { ActionAccuracyType } from "../../combat-actions/combat-action-accuracy.js";
import { CombatActionResource } from "../../combat-actions/combat-action-hit-outcome-properties.js";
import { CombatActionComponent } from "../../combat-actions/index.js";
import { ProhibitedTargetCombatantStates } from "../../combat-actions/prohibited-target-combatant-states.js";
import { ResourceChangeSource } from "../../hp-change-source-types.js";
import { CombatantProperties } from "../../../combatants/combatant-properties.js";
import { CombatantTraitType } from "../../../combatants/combatant-traits/trait-types.js";
import { CombatActionRequiredRange } from "../../combat-actions/combat-action-range.js";
import { rollNormalized } from "../../../utils/rand-between.js";
import { CombatActionIntent } from "../../combat-actions/combat-action-intent.js";
import {
  SHIELD_SIZE_BLOCK_RATE,
  SHIELD_SIZE_DAMAGE_REDUCTION,
} from "../../../items/equipment/equipment-properties/shield-properties.js";
import { rollIsSuccess } from "../../../utility-classes/random-number-generation-policy.js";

const BASE_PARRY_CHANCE: NormalizedPercentage = 0.05;

export class HitOutcomeMitigationCalculator {
  constructor(
    private action: CombatActionComponent,
    private actionLevel: number,
    private user: IActionUser,
    private targetCombatant: Combatant,
    private incomingResourceChangesPerTarget: null | Partial<
      Record<
        CombatActionResource,
        {
          valuePerTarget: number;
          source: ResourceChangeSource;
        }
      >
    >,
    private rng: RandomNumberGenerator
  ) {
    //
  }

  setTargetCombatant(targetCombatant: Combatant) {
    this.targetCombatant = targetCombatant;
  }

  rollHitMitigationEvents() {
    // HITS
    const targetWillAttemptMitigation = this.targetWillAttemptMitigation();

    const user = this.user;
    const target = this.targetCombatant;

    const normalizedChanceToHit = HitOutcomeMitigationCalculator.getActionHitChance(
      this.action,
      user,
      this.actionLevel,
      targetWillAttemptMitigation,
      target.combatantProperties
    );

    // it is possible to miss a target who is not attempting mitigation if your accuracy
    // is just that bad
    const hitRoll = rollNormalized(this.rng);
    const wouldHitIfNotEvaded = rollIsSuccess({
      roll: hitRoll,
      successChance: normalizedChanceToHit.beforeEvasion,
    });
    const isMiss = !wouldHitIfNotEvaded;
    if (isMiss) return [HitOutcome.Miss];

    if (!targetWillAttemptMitigation) return [HitOutcome.Hit];

    const isHit = rollIsSuccess({
      roll: hitRoll,
      successChance: normalizedChanceToHit.afterEvasion,
    });
    const isEvaded = !isMiss && !isHit;
    if (isEvaded) return [HitOutcome.Evade];

    const { hitOutcomeProperties } = this.action;

    const { actionLevel } = this;

    const willAttemptParry =
      hitOutcomeProperties.getIsParryable(user, actionLevel) &&
      target.combatantProperties.mitigationProperties.canParry();

    // PARRIES
    if (willAttemptParry) {
      const normalizedChanceToParry = HitOutcomeMitigationCalculator.getParryChance(user, target);
      // const percentChanceToParry = 5;
      const parryRoll = rollNormalized(this.rng);
      const isParried = rollIsSuccess({ roll: parryRoll, successChance: normalizedChanceToParry });
      if (isParried) return [HitOutcome.Parry];
    }

    // COUNTERATTACKS
    if (hitOutcomeProperties.getCanTriggerCounterattack(user, actionLevel)) {
      // @TODO - derrive this from various combatant properties
      const normalizedChanceToCounterAttack = HitOutcomeMitigationCalculator.getCounterattackChance(
        user,
        target
      );
      const counterAttackRoll = rollNormalized(this.rng);
      const isCounterAttacked = rollIsSuccess({
        roll: counterAttackRoll,
        successChance: normalizedChanceToCounterAttack,
      });
      // const isCounterAttacked = percentChanceToCounterAttack !== 0;
      if (isCounterAttacked) return [HitOutcome.Counterattack];
    }

    // RESISTS
    if (hitOutcomeProperties.getResistChance !== undefined) {
      const resistChance = hitOutcomeProperties.getResistChance(user, this.actionLevel, target);

      const resistRoll = rollNormalized(this.rng);
      const isResisted = rollIsSuccess({
        roll: resistRoll,
        successChance: resistChance,
      });

      if (isResisted) {
        return [HitOutcome.Resist];
      }
    }

    // it is possible that an ability hits, but does not change resource values, ex: a spell that only induces a condition
    const flagsToReturn: HitOutcome[] = [HitOutcome.Hit];

    // BLOCK
    const actionHasResourceChanges = this.incomingResourceChangesPerTarget !== null;
    if (actionHasResourceChanges) {
      if (
        hitOutcomeProperties.getIsBlockable(user, actionLevel) &&
        target.combatantProperties.mitigationProperties.canBlock()
      ) {
        const normalizedPercentChanceToBlock = HitOutcomeMitigationCalculator.getShieldBlockChance(
          user,
          target
        );

        const blockRoll = rollNormalized(this.rng);
        const isBlocked = rollIsSuccess({
          roll: blockRoll,
          successChance: normalizedPercentChanceToBlock,
        });
        if (isBlocked) flagsToReturn.push(HitOutcome.ShieldBlock);
      }
    }

    return flagsToReturn;
  }

  targetWillAttemptMitigation() {
    const targetCombatantProperties = this.targetCombatant.combatantProperties;
    const hpChangePropertiesGetterOption =
      this.action.hitOutcomeProperties.resourceChangePropertiesGetters[
        CombatActionResource.HitPoints
      ];
    const hpChangePropertiesOption = hpChangePropertiesGetterOption
      ? hpChangePropertiesGetterOption(
          this.user,
          this.action.hitOutcomeProperties,
          this.actionLevel,
          targetCombatantProperties
        )
      : null;

    // regardless of the action intent, don't try to evade if would be healed
    if (hpChangePropertiesOption) {
      const { resourceChangeSource } = hpChangePropertiesOption;
      const { isHealing } = resourceChangeSource;

      const isUndead = targetCombatantProperties.abilityProperties
        .getTraitProperties()
        .hasTraitType(CombatantTraitType.Undead);

      if (isHealing && isUndead) return true;
      if (isHealing) return false;

      const { elementOption } = resourceChangeSource;
      if (elementOption) {
        const targetAffinities =
          targetCombatantProperties.mitigationProperties.getElementalAffinities();
        const targetAffinity = targetAffinities[elementOption];
        if (targetAffinity && targetAffinity > 100) return false;
      }
    }

    // finally resolve based on action intent
    if (this.action.targetingProperties.intent === CombatActionIntent.Malicious) return true;
    else return false;
  }

  static getActionHitChance(
    combatAction: CombatActionComponent,
    user: IActionUser,
    actionLevel: number,
    targetWillAttemptToEvade: boolean,
    target: CombatantProperties
  ): { beforeEvasion: NormalizedPercentage; afterEvasion: NormalizedPercentage } {
    const targetEvasion = target.attributeProperties.getAttributeValue(CombatAttribute.Evasion);
    const canHitDeadCombatants =
      !combatAction.targetingProperties.prohibitedHitCombatantStates.includes(
        ProhibitedTargetCombatantStates.Dead
      );
    const targetIsDead = target.isDead();
    if (targetIsDead && !canHitDeadCombatants) {
      return { beforeEvasion: 0, afterEvasion: 0 };
    }

    const actionBaseAccuracy = combatAction.getAccuracy(user, actionLevel);
    if (actionBaseAccuracy.type === ActionAccuracyType.Unavoidable) {
      return { beforeEvasion: 1, afterEvasion: 1 };
    }

    const finalTargetEvasion = !targetWillAttemptToEvade ? 0 : targetEvasion;
    const accComparedToEva = actionBaseAccuracy.value - finalTargetEvasion;
    let afterEvasion = Math.max(MIN_HIT_CHANCE, accComparedToEva);

    const canNotReachTargetForMeleeAction =
      user.targetFlyingConditionPreventsReachingMeleeRange(target);

    const isMeleeAction =
      combatAction.targetingProperties.getRequiredRange(user, combatAction) ===
      CombatActionRequiredRange.Melee;

    if (isMeleeAction && canNotReachTargetForMeleeAction) {
      afterEvasion = 0;
    }

    const normalizedAccuracy = actionBaseAccuracy.value / 100;
    const normalizedAfterEvasionHitChance = afterEvasion / 100;

    return {
      beforeEvasion: normalizedAccuracy,
      afterEvasion: normalizedAfterEvasionHitChance,
    };
  }

  static getActionCritChance(
    action: CombatActionComponent,
    actionLevel: number,
    user: IActionUser,
    target: CombatantProperties,
    targetWillAttemptMitigation: boolean
  ) {
    const actionBaseCritChance = action.getCritChance(user, actionLevel);

    const targetAvoidaceAttributeValue = target.attributeProperties.getAttributeValue(
      CombatAttribute.Spirit
    );

    const targetCritAvoidance = targetWillAttemptMitigation ? targetAvoidaceAttributeValue : 0;
    const normalizedCritAvoidance = targetCritAvoidance / 100;
    const finalUnroundedCritChance = (actionBaseCritChance || 0) - normalizedCritAvoidance;
    const bounded = Math.max(0, Math.min(MAX_CRIT_CHANCE, finalUnroundedCritChance));

    return bounded;
  }

  static getParryChance(aggressor: IActionUser, defender: Combatant): NormalizedPercentage {
    // derive this from attributes (focus?), traits (parryBonus) and conditions (parryStance)
    // and probably put it on the action configs
    if (!defender.combatantProperties.mitigationProperties.canParry()) return 0;
    return BASE_PARRY_CHANCE;
  }

  static getCounterattackChance(aggressor: IActionUser, defender: Combatant): NormalizedPercentage {
    if (defender.combatantProperties.isDead()) return 0;
    if (!defender.combatantProperties.mitigationProperties.canCounterattack()) return 0;
    // derive this from attributes (focus?), traits (parryBonus) and conditions (parryStance)
    // and probably put it on the action configs
    return BASE_PARRY_CHANCE;
  }

  static getShieldBlockChance(aggressor: IActionUser, defender: Combatant): NormalizedPercentage {
    const shieldPropertiesOption = defender.getEquipmentOption().getEquippedShieldProperties();
    if (!shieldPropertiesOption) return 0;

    const baseBlockRate = SHIELD_SIZE_BLOCK_RATE[shieldPropertiesOption.size];

    return baseBlockRate;

    // note:
    // FFXI formula: BlockRate = SizeBaseBlockRate + ((ShieldSkill - AttackerCombatSkill) × 0.2325)
  }

  /**Should return a normalized percentage*/
  static getShieldBlockDamageReduction(
    combatantProperties: CombatantProperties
  ): NormalizedPercentage {
    const shieldPropertiesOption = combatantProperties.equipment.getEquippedShieldProperties();
    if (!shieldPropertiesOption) return 0;

    const baseDamageReduction = SHIELD_SIZE_DAMAGE_REDUCTION[shieldPropertiesOption.size];

    return baseDamageReduction + shieldPropertiesOption.armorClass / 200;

    // FFXI formula:
    // PercentDamageBlocked = SizeDamageReduction + (ShieldDEF / ((max(ShieldItemLevel, 99) - 99) / 10 + 2))
  }
}
