import { ONE_THIRD_OF_ONE } from "../../../app-consts.js";
import { DurabilityLossCondition } from "../../../combat/combat-actions/combat-action-durability-loss-condition.js";
import { CombatActionResource } from "../../../combat/combat-actions/combat-action-hit-outcome-properties.js";
import { CombatActionComponent } from "../../../combat/index.js";
import { IActionUser } from "../../../combatant-context/action-user.js";
import { Combatant, CombatantEquipment } from "../../../combatants/index.js";
import {
  BASE_DURABILITY_LOSS,
  DurabilityChangesByEntityId,
  HIT_OUTCOMES_THAT_CONTACT_TARGET,
} from "../../../durability/index.js";
import { HitOutcome } from "../../../hit-outcome.js";
import {
  Equipment,
  EquipmentSlotType,
  HoldableSlotType,
  TaggedEquipmentSlot,
  WearableSlotType,
} from "../../../items/equipment/index.js";
import { EntityId } from "../../../primatives/index.js";

export function addHitOutcomeDurabilityChanges(
  durabilityChanges: DurabilityChangesByEntityId,
  actionUser: IActionUser,
  actionLevel: number,
  targetCombatant: Combatant,
  action: CombatActionComponent,
  hitOutcomeType: HitOutcome,
  isCrit?: boolean
): Error | { [itemId: EntityId]: number } | undefined {
  // healing magic shouldn't cause durability loss
  const hpChangePropertiesGetter =
    action.hitOutcomeProperties.resourceChangePropertiesGetters[CombatActionResource.HitPoints];
  if (!hpChangePropertiesGetter) return;

  const hpChangeProperties = hpChangePropertiesGetter(
    actionUser,
    action.hitOutcomeProperties,
    actionLevel,
    targetCombatant.combatantProperties
  );
  if (hpChangeProperties?.resourceChangeSource.isHealing) return;

  hitOutcomeDurabilityChangeOnTargetCalculators[hitOutcomeType](
    durabilityChanges,
    targetCombatant,
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

const hitOutcomeDurabilityChangeOnTargetCalculators: Record<
  HitOutcome,
  (
    durabilityChanges: DurabilityChangesByEntityId,
    targetCombatant: Combatant,
    isCrit?: boolean
  ) => void
> = {
  [HitOutcome.Miss]: () => {},
  [HitOutcome.Evade]: () => {},
  [HitOutcome.Death]: () => {},
  [HitOutcome.Parry]: (durabilityChanges, targetCombatant) => {
    durabilityChanges.updateEquipmentRecord(targetCombatant, {
      type: EquipmentSlotType.Holdable,
      slot: HoldableSlotType.MainHand,
    });
  },
  [HitOutcome.Counterattack]: (durabilityChanges, targetCombatant) => {
    durabilityChanges.updateEquipmentRecord(targetCombatant, {
      type: EquipmentSlotType.Holdable,
      slot: HoldableSlotType.MainHand,
    });
  },
  [HitOutcome.ShieldBlock]: (durabilityChanges, targetCombatant, isCrit) => {
    const extraDurabilityLoss = isCrit ? -1 : 0;
    durabilityChanges.updateEquipmentRecord(
      targetCombatant,
      {
        type: EquipmentSlotType.Holdable,
        slot: HoldableSlotType.OffHand,
      },
      extraDurabilityLoss
    );
  },
  [HitOutcome.Hit]: (durabilityChanges, targetCombatant, isCrit) => {
    const { combatantProperties: targetCombatantProperties } = targetCombatant;
    const targetId = targetCombatant.entityProperties.id;
    const headSlot: TaggedEquipmentSlot = {
      type: EquipmentSlotType.Wearable,
      slot: WearableSlotType.Head,
    };
    const bodySlot: TaggedEquipmentSlot = {
      type: EquipmentSlotType.Wearable,
      slot: WearableSlotType.Body,
    };

    // hits damage a random wearable
    const equippedHelmOption = CombatantEquipment.getEquipmentInSlot(
      targetCombatantProperties.equipment,
      headSlot
    );
    const equippedBodyOption = CombatantEquipment.getEquipmentInSlot(
      targetCombatantProperties.equipment,
      bodySlot
    );

    if (
      equippedBodyOption &&
      !Equipment.isBroken(equippedBodyOption) &&
      equippedHelmOption &&
      !Equipment.isBroken(equippedHelmOption)
    ) {
      const whichArmorToHitRoll = Math.random();
      const shouldHitHeadArmor = whichArmorToHitRoll < ONE_THIRD_OF_ONE;

      if (shouldHitHeadArmor || isCrit) {
        durabilityChanges.updateOrCreateDurabilityChangeRecord(targetCombatant, {
          taggedSlot: headSlot,
          value: BASE_DURABILITY_LOSS,
        });
      }

      if (!shouldHitHeadArmor || isCrit) {
        durabilityChanges.updateOrCreateDurabilityChangeRecord(targetCombatant, {
          taggedSlot: bodySlot,
          value: BASE_DURABILITY_LOSS,
        });
      }
    } else if (equippedBodyOption && !Equipment.isBroken(equippedBodyOption)) {
      durabilityChanges.updateOrCreateDurabilityChangeRecord(targetCombatant, {
        taggedSlot: bodySlot,
        value: BASE_DURABILITY_LOSS,
      });
    } else if (equippedHelmOption && !Equipment.isBroken(equippedHelmOption)) {
      durabilityChanges.updateOrCreateDurabilityChangeRecord(targetCombatant, {
        taggedSlot: headSlot,
        value: BASE_DURABILITY_LOSS,
      });
    }
  },
};
