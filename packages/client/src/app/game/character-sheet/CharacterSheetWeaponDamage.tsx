import {
  ERROR_MESSAGES,
  Combatant,
  CombatAttribute,
  Equipment,
  HoldableSlotType,
  CombatActionName,
  COMBAT_ACTIONS,
  CombatActionResource,
  HitOutcomeMitigationCalculator,
} from "@speed-dungeon/common";
import { WeaponProperties } from "@speed-dungeon/common";
import { EquipmentType } from "@speed-dungeon/common";
import { NumberRange } from "@speed-dungeon/common";
import React from "react";
import { getTargetOption } from "@/utils/get-target-option";
import { TARGET_DUMMY_COMBATANT } from "./ability-tree/action-description";
import { IconName, SVG_ICONS } from "@/app/icons";
import cloneDeep from "lodash.clonedeep";
import { observer } from "mobx-react-lite";
import { AppStore } from "@/mobx-stores/app-store";

export const CharacterSheetWeaponDamage = observer(
  ({ combatant, disableOh }: { combatant: Combatant; disableOh?: boolean }) => {
    const { combatantProperties } = combatant;
    const { equipment } = combatantProperties;

    const mhWeaponOption = equipment.getEquippedWeapon(HoldableSlotType.MainHand);

    if (mhWeaponOption instanceof Error) return <div>{mhWeaponOption.message}</div>;
    const mhDamageAndAccuracyResult = getAttackActionDamageAndAccuracy(
      combatant,
      mhWeaponOption,
      false
    );
    const isTwoHanded = mhWeaponOption
      ? Equipment.isTwoHanded(mhWeaponOption.taggedBaseEquipment.equipmentType)
      : false;

    const ohEquipmentOption = equipment.getEquippedHoldable(HoldableSlotType.OffHand);

    if (ohEquipmentOption instanceof Error) return <div>{ohEquipmentOption.message}</div>;

    let ohDamageAndAccuracyResult;
    if (
      !isTwoHanded &&
      ohEquipmentOption?.equipmentBaseItemProperties.taggedBaseEquipment.equipmentType !==
        EquipmentType.Shield
    ) {
      let ohWeaponOption = equipment.getEquippedWeapon(HoldableSlotType.OffHand);
      if (ohWeaponOption instanceof Error) ohWeaponOption = undefined; // might be a shield
      ohDamageAndAccuracyResult = getAttackActionDamageAndAccuracy(combatant, ohWeaponOption, true);
    }

    if (mhDamageAndAccuracyResult instanceof Error)
      return <div>{mhDamageAndAccuracyResult.message}</div>;
    if (ohDamageAndAccuracyResult instanceof Error)
      return <div>{ohDamageAndAccuracyResult.message}</div>;

    return (
      <div className="flex w-full">
        <WeaponDamageEntry
          damageAndAccuracyOption={mhDamageAndAccuracyResult}
          label="Main Hand"
          paddingClass="pr-1"
        />
        <WeaponDamageEntry
          damageAndAccuracyOption={ohDamageAndAccuracyResult}
          label="Off Hand"
          paddingClass="pl-1"
          isOffHand={true}
          showDisabled={disableOh}
        />
      </div>
    );
  }
);

interface WeaponDamageEntryProps {
  damageAndAccuracyOption:
    | undefined
    | {
        hpChangeRange: NumberRange;
        hitChance: {
          beforeEvasion: number;
          afterEvasion: number;
        };
        critChance: number;
        critMultiplierOption: null | number;
      };
  label: string;
  paddingClass: string;
  isOffHand?: boolean;
  showDisabled?: boolean;
}

function WeaponDamageEntry(props: WeaponDamageEntryProps) {
  if (!props.damageAndAccuracyOption) return <div className={`w-1/2 mr-1${props.paddingClass}`} />;
  const { hpChangeRange, hitChance, critChance, critMultiplierOption } =
    props.damageAndAccuracyOption;

  return (
    <div className={`w-1/2 min-w-1/2 ${props.paddingClass} ${props.showDisabled && "opacity-50"}`}>
      <div className="w-full flex justify-between">
        <span className="flex">
          {SVG_ICONS[IconName.OpenHand](
            `h-5 fill-slate-400 mr-1 ${props.isOffHand && "-scale-x-100"} `
          )}
          {`${hpChangeRange.min.toFixed(0)}-${hpChangeRange.max.toFixed(0)}`}
        </span>
        <span className="flex">
          {SVG_ICONS[IconName.Target]("h-6 fill-slate-400 mr-1")}{" "}
          {hitChance.afterEvasion.toFixed(0)}%
        </span>
      </div>
      <div className="flex justify-between ">
        <span className=" flex">
          {SVG_ICONS[IconName.CritChance]("h-6 fill-slate-400 mr-1")} {critChance.toFixed(0)}%
        </span>
        <span>↟{((critMultiplierOption || 0) * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}

function getAttackActionDamageAndAccuracy(
  combatant: Combatant,
  weaponOption: undefined | WeaponProperties,
  isOffHand: boolean
) {
  const actionName = getAttackActionName(weaponOption, isOffHand);

  const gameOption = AppStore.get().gameStore.getGameOption();

  const currentlyTargetedCombatantResult = getTargetOption(gameOption, combatant, actionName);
  if (currentlyTargetedCombatantResult instanceof Error) return currentlyTargetedCombatantResult;
  const usingDummy = currentlyTargetedCombatantResult === undefined;

  const target = currentlyTargetedCombatantResult || TARGET_DUMMY_COMBATANT.combatantProperties;

  const combatAction = COMBAT_ACTIONS[actionName];

  const hpChangeGetterOption =
    combatAction.hitOutcomeProperties.resourceChangePropertiesGetters[
      CombatActionResource.HitPoints
    ];

  if (hpChangeGetterOption === undefined) {
    return new Error("No hp change properties getter found");
  }

  const hpChangeProperties = hpChangeGetterOption(
    combatant,
    combatAction.hitOutcomeProperties,
    1,
    target
  );
  if (hpChangeProperties === null) return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.INVALID_TYPE);
  const modified = cloneDeep(hpChangeProperties);
  modified.baseValues.mult(combatAction.hitOutcomeProperties.resourceChangeValuesModifier);

  const hpChangeRangeResult = modified.baseValues;

  if (hpChangeRangeResult instanceof Error) return hpChangeRangeResult;

  const targetEvasion = target.attributeProperties.getAttributeValue(CombatAttribute.Evasion);

  const hpChangeRange = hpChangeRangeResult;
  const hitChance = HitOutcomeMitigationCalculator.getActionHitChance(
    combatAction,
    combatant,
    1,
    targetEvasion,
    !usingDummy,
    target
  );

  const { hitOutcomeProperties } = combatAction;

  const critMultiplierOption = hitOutcomeProperties.getCritMultiplier(combatant, 1);

  const critChance = HitOutcomeMitigationCalculator.getActionCritChance(
    combatAction,
    1,
    combatant,
    target,
    !usingDummy
  );

  return { hpChangeRange, hitChance, critChance, critMultiplierOption };
}

export function getAttackActionName(
  weaponOption: WeaponProperties | undefined,
  isOffHand: boolean
) {
  if (isOffHand) return CombatActionName.AttackMeleeOffhand;

  if (weaponOption) {
    const weaponProperties = weaponOption;
    if (weaponProperties.equipmentType === EquipmentType.TwoHandedRangedWeapon)
      return CombatActionName.AttackRangedMainhand;
  }
  return CombatActionName.AttackMeleeMainhand;
}
