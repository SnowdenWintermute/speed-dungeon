import { RandomNumberGenerator } from "../../../utility-classes/randomizers.js";
import { ONE_THIRD_OF_ONE } from "../../../app-consts.js";
import { DurabilityLossCondition } from "../../../combat/combat-actions/combat-action-durability-loss-condition.js";
import { CombatActionResource } from "../../../combat/combat-actions/combat-action-hit-outcome-properties.js";
import { IActionUser } from "../../../action-user-context/action-user.js";
import { Combatant } from "../../../combatants/index.js";
import {
  BASE_DURABILITY_LOSS,
  DurabilityChangesByEntityId,
  HIT_OUTCOMES_THAT_CONTACT_TARGET,
} from "../../../durability/index.js";
import { HitOutcome } from "../../../hit-outcome.js";
import { ItemId } from "../../../aliases.js";
import { CombatActionComponent } from "../../../combat/combat-actions/index.js";
import { ResourceChangePropertiesStrategy } from "../../../combat/combat-actions/action-implementations/resource-change-properties-strategy.js";
import { CombatantEquipment } from "../../../combatants/combatant-equipment/index.js";
import { EquipmentSlotId } from "../../../combatants/combatant-equipment/types.js";

export function addHitOutcomeDurabilityChanges(
  durabilityChanges: DurabilityChangesByEntityId,
  actionUser: IActionUser,
  actionLevel: number,
  targetCombatant: Combatant,
  action: CombatActionComponent,
  resourceChangePropertiesStrategy: ResourceChangePropertiesStrategy,
  hitOutcomeType: HitOutcome,
  combatDurabilityTargetRng: RandomNumberGenerator,
  isCrit?: boolean
): Error | Record<ItemId, number> | undefined {
  // healing magic shouldn't cause durability loss
  const hpChangePropertiesGetter =
    resourceChangePropertiesStrategy.getResourceChangePropertiesGetters(action.name)[
      CombatActionResource.HitPoints
    ];
  if (!hpChangePropertiesGetter) return;

  const hpChangeProperties = hpChangePropertiesGetter(
    actionUser,
    action.hitOutcomeProperties,
    actionLevel,
    targetCombatant.combatantProperties
  );
  if (hpChangeProperties?.resourceChangeSource.isHealing) return;

  HIT_OUTCOME_DURABILITY_CHANGE_ON_TARGET_CALCULATORS[hitOutcomeType](
    durabilityChanges,
    targetCombatant,
    combatDurabilityTargetRng,
    isCrit
  );

  if (HIT_OUTCOMES_THAT_CONTACT_TARGET.includes(hitOutcomeType)) {
    // ex: the action user's weapon should lose durability
    durabilityChanges.updateConditionalChangesOnUser(
      actionUser,
      action,
      DurabilityLossCondition.OnHit
    );
  }
}

const HIT_OUTCOME_DURABILITY_CHANGE_ON_TARGET_CALCULATORS: Record<
  HitOutcome,
  (
    durabilityChanges: DurabilityChangesByEntityId,
    targetCombatant: Combatant,
    rng: RandomNumberGenerator,
    isCrit?: boolean
  ) => void
> = {
  [HitOutcome.Miss]: () => {},
  [HitOutcome.Evade]: () => {},
  [HitOutcome.Death]: () => {},
  [HitOutcome.Parry]: (durabilityChanges, targetCombatant) => {
    durabilityChanges.updateEquipmentRecord(targetCombatant, EquipmentSlotId.MainHand);
  },
  [HitOutcome.Counterattack]: (durabilityChanges, targetCombatant) => {
    // don't charge durability for counterattack with bow since we'll break the bow before
    // we get to fire our shot if on the last durability
    const targetWearingBow =
      CombatantEquipment.isWearingUsableTwoHandedRangedWeapon(targetCombatant);
    if (targetWearingBow) return;

    durabilityChanges.updateEquipmentRecord(targetCombatant, EquipmentSlotId.MainHand);
  },
  [HitOutcome.ShieldBlock]: (durabilityChanges, targetCombatant, isCrit) => {
    const extraDurabilityLoss = isCrit ? -1 : 0;
    durabilityChanges.updateEquipmentRecord(
      targetCombatant,
      EquipmentSlotId.OffHand,
      extraDurabilityLoss
    );
  },
  [HitOutcome.Hit]: (durabilityChanges, targetCombatant, rng, isCrit) => {
    const { combatantProperties: targetCombatantProperties } = targetCombatant;

    // hits damage a random wearable
    const { equipment } = targetCombatantProperties;
    const equippedHelmOption = equipment.getEquipmentInSlot(EquipmentSlotId.Head);
    const equippedBodyOption = equipment.getEquipmentInSlot(EquipmentSlotId.Body);

    if (
      equippedBodyOption &&
      !equippedBodyOption.isBroken() &&
      equippedHelmOption &&
      !equippedHelmOption.isBroken()
    ) {
      const whichArmorToHitRoll = rng.roll();
      const shouldHitHeadArmor = whichArmorToHitRoll < ONE_THIRD_OF_ONE;

      if (shouldHitHeadArmor || isCrit) {
        durabilityChanges.updateOrCreateDurabilityChangeRecord(targetCombatant, {
          slotId: EquipmentSlotId.Head,
          value: BASE_DURABILITY_LOSS,
        });
      }

      if (!shouldHitHeadArmor || isCrit) {
        durabilityChanges.updateOrCreateDurabilityChangeRecord(targetCombatant, {
          slotId: EquipmentSlotId.Body,
          value: BASE_DURABILITY_LOSS,
        });
      }
    } else if (equippedBodyOption && !equippedBodyOption.isBroken()) {
      durabilityChanges.updateOrCreateDurabilityChangeRecord(targetCombatant, {
        slotId: EquipmentSlotId.Body,
        value: BASE_DURABILITY_LOSS,
      });
    } else if (equippedHelmOption && !equippedHelmOption.isBroken()) {
      durabilityChanges.updateOrCreateDurabilityChangeRecord(targetCombatant, {
        slotId: EquipmentSlotId.Head,
        value: BASE_DURABILITY_LOSS,
      });
    }
  },
  [HitOutcome.Resist]: () => {},
};
