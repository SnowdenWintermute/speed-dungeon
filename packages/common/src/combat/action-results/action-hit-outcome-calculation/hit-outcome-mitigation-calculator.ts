import { MAX_CRIT_CHANCE, MIN_HIT_CHANCE } from "../../../app-consts.js";
import { CombatAttribute } from "../../../combatants/attributes/index.js";
import {
  Combatant,
  CombatantEquipment,
  CombatantProperties,
  CombatantTraitType,
} from "../../../combatants/index.js";
import { HitOutcome } from "../../../hit-outcome.js";
import {
  SHIELD_SIZE_BLOCK_RATE,
  SHIELD_SIZE_DAMAGE_REDUCTION,
} from "../../../items/equipment/index.js";
import { Percentage } from "../../../primatives/index.js";
import { RandomNumberGenerator } from "../../../utility-classes/randomizers.js";
import { randBetween } from "../../../utils/index.js";
import { ActionAccuracyType } from "../../combat-actions/combat-action-accuracy.js";
import { CombatActionResource } from "../../combat-actions/combat-action-hit-outcome-properties.js";
import { CombatActionComponent, CombatActionIntent } from "../../combat-actions/index.js";
import { ResourceChangeSource } from "../../hp-change-source-types.js";

const BASE_PARRY_CHANCE = 5;

export class HitOutcomeMitigationCalculator {
  constructor(
    private action: CombatActionComponent,
    private actionLevel: number,
    private user: Combatant,
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

    const user = this.user.combatantProperties;
    const target = this.targetCombatant.combatantProperties;

    const percentChanceToHit = HitOutcomeMitigationCalculator.getActionHitChance(
      this.action,
      user,
      this.actionLevel,
      CombatantProperties.getTotalAttributes(target)[CombatAttribute.Evasion],
      targetWillAttemptMitigation
    );

    // it is possible to miss a target who is not attempting mitigation if your accuracy
    // is just that bad
    const hitRoll = randBetween(0, 100, this.rng);
    const isMiss = hitRoll < 100 - percentChanceToHit.beforeEvasion;
    if (isMiss) return [HitOutcome.Miss];

    if (targetWillAttemptMitigation) {
      const isEvaded = !isMiss && hitRoll < 100 - percentChanceToHit.afterEvasion;
      if (isEvaded) return [HitOutcome.Evade];
    } else return [HitOutcome.Hit];

    const { hitOutcomeProperties } = this.action;

    const { actionLevel } = this;

    const willAttemptParry =
      hitOutcomeProperties.getIsParryable(user, actionLevel) &&
      CombatantProperties.canParry(target);

    // PARRIES
    if (willAttemptParry) {
      const percentChanceToParry = HitOutcomeMitigationCalculator.getParryChance(user, target);
      // const percentChanceToParry = 5;
      const parryRoll = randBetween(0, 100, this.rng);
      const isParried = parryRoll < percentChanceToParry;
      if (isParried) return [HitOutcome.Parry];
    }

    // COUNTERATTACKS
    if (hitOutcomeProperties.getCanTriggerCounterattack(user, actionLevel)) {
      // @TODO - derrive this from various combatant properties
      const percentChanceToCounterAttack = HitOutcomeMitigationCalculator.getCounterattackChance(
        user,
        target
      );
      const counterAttackRoll = randBetween(0, 100, this.rng);
      // const counterAttackRoll = randBetween(0, 1, this.rng);
      const isCounterAttacked = counterAttackRoll < percentChanceToCounterAttack;
      if (isCounterAttacked) return [HitOutcome.Counterattack];
    }

    // it is possible that an ability hits, but does not change resource values, ex: a spell that only induces a condition
    const flagsToReturn: HitOutcome[] = [HitOutcome.Hit];

    // BLOCK
    const actionHasResourceChanges = this.incomingResourceChangesPerTarget !== null;
    if (actionHasResourceChanges) {
      if (
        hitOutcomeProperties.getIsBlockable(user, actionLevel) &&
        CombatantProperties.canBlock(target)
      ) {
        const percentChanceToBlock = HitOutcomeMitigationCalculator.getShieldBlockChance(
          user,
          target
        );
        const blockRoll = randBetween(0, 100, this.rng);
        const isBlocked = blockRoll < percentChanceToBlock;
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
          this.user.combatantProperties,
          this.actionLevel,
          targetCombatantProperties
        )
      : null;

    // regardless of the action intent, don't try to evade if would be healed
    if (hpChangePropertiesOption) {
      const { resourceChangeSource } = hpChangePropertiesOption;
      const { isHealing } = resourceChangeSource;

      const isUndead = CombatantProperties.hasTraitType(
        targetCombatantProperties,
        CombatantTraitType.Undead
      );

      if (isHealing && isUndead) return true;
      if (isHealing) return false;

      const { elementOption } = resourceChangeSource;
      if (elementOption) {
        const targetAffinities =
          CombatantProperties.getCombatantTotalElementalAffinities(targetCombatantProperties);
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
    userCombatantProperties: CombatantProperties,
    actionLevel: number,
    targetEvasion: number,
    targetWillAttemptToEvade: boolean
  ): { beforeEvasion: number; afterEvasion: number } {
    const actionBaseAccuracy = combatAction.getAccuracy(userCombatantProperties, actionLevel);
    if (actionBaseAccuracy.type === ActionAccuracyType.Unavoidable)
      return { beforeEvasion: 100, afterEvasion: 100 };

    const finalTargetEvasion = !targetWillAttemptToEvade ? 0 : targetEvasion;
    const accComparedToEva = actionBaseAccuracy.value - finalTargetEvasion;

    return {
      beforeEvasion: actionBaseAccuracy.value,
      afterEvasion: Math.max(MIN_HIT_CHANCE, accComparedToEva),
    };
  }

  static getActionCritChance(
    action: CombatActionComponent,
    actionLevel: number,
    user: CombatantProperties,
    target: CombatantProperties,
    targetWillAttemptMitigation: boolean
  ) {
    const actionBaseCritChance = action.hitOutcomeProperties.getCritChance(user, actionLevel);

    const targetAttributes = CombatantProperties.getTotalAttributes(target);
    const targetAvoidaceAttributeValue = targetAttributes[CombatAttribute.Spirit];

    const targetCritAvoidance = targetWillAttemptMitigation ? targetAvoidaceAttributeValue : 0;
    const finalUnroundedCritChance = (actionBaseCritChance || 0) - targetCritAvoidance;

    return Math.floor(Math.max(0, Math.min(MAX_CRIT_CHANCE, finalUnroundedCritChance)));
  }

  static getParryChance(aggressor: CombatantProperties, defender: CombatantProperties): Percentage {
    // derive this from attributes (focus?), traits (parryBonus) and conditions (parryStance)
    // and probably put it on the action configs
    return BASE_PARRY_CHANCE;
  }

  static getCounterattackChance(
    aggressor: CombatantProperties,
    defender: CombatantProperties
  ): Percentage {
    // derive this from attributes (focus?), traits (parryBonus) and conditions (parryStance)
    // and probably put it on the action configs
    return BASE_PARRY_CHANCE;
  }

  static getShieldBlockChance(
    aggressor: CombatantProperties,
    defender: CombatantProperties
  ): Percentage {
    const shieldPropertiesOption = CombatantEquipment.getEquippedShieldProperties(defender);
    if (!shieldPropertiesOption) return 0;

    const baseBlockRate = SHIELD_SIZE_BLOCK_RATE[shieldPropertiesOption.size] * 100;

    return baseBlockRate;

    // note:
    // FFXI formula: BlockRate = SizeBaseBlockRate + ((ShieldSkill - AttackerCombatSkill) × 0.2325)
  }

  /**Should return a normalized percentage*/
  static getShieldBlockDamageReduction(combatantProperties: CombatantProperties) {
    const shieldPropertiesOption =
      CombatantEquipment.getEquippedShieldProperties(combatantProperties);
    if (!shieldPropertiesOption) return 0;

    const baseDamageReduction = SHIELD_SIZE_DAMAGE_REDUCTION[shieldPropertiesOption.size];

    return baseDamageReduction + shieldPropertiesOption.armorClass / 200;

    // FFXI formula:
    // PercentDamageBlocked = SizeDamageReduction + (ShieldDEF / ((max(ShieldItemLevel, 99) - 99) / 10 + 2))
  }
}
