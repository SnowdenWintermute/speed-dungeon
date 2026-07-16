import {
  ERROR_MESSAGES,
  Combatant,
  Equipment,
  HoldableSlotType,
  CombatActionName,
  COMBAT_ACTIONS,
  CombatActionResource,
  HitOutcomeMitigationCalculator,
  SpeedDungeonGame,
  invariant,
} from "@speed-dungeon/common";
import { WeaponProperties } from "@speed-dungeon/common";
import { EquipmentType } from "@speed-dungeon/common";
import { NumberRange } from "@speed-dungeon/common";
import React from "react";
import { TARGET_DUMMY_COMBATANT } from "./ability-tree/action-description";
import { IconName, SVG_ICONS } from "@/app/icons";
import cloneDeep from "lodash.clonedeep";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";

export const CharacterSheetWeaponDamage = observer(
  ({ combatant, disableOh }: { combatant: Combatant; disableOh?: boolean }) => {
    const { combatantProperties } = combatant;
    const { equipment } = combatantProperties;

    const clientApplication = useClientApplication();
    const { gameContext } = clientApplication;

    const mhWeaponOption = equipment.getEquippedWeapon(HoldableSlotType.MainHand);

    if (mhWeaponOption instanceof Error) return <div>{mhWeaponOption.message}</div>;
    const mhDamageAndAccuracyResult = getAttackActionDamageAndAccuracy(
      combatant,
      mhWeaponOption,
      false,
      gameContext.gameOption
    );
    const isTwoHanded = mhWeaponOption
      ? Equipment.isTwoHandedWeaponType(mhWeaponOption.taggedBaseEquipment.equipmentType)
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
      ohDamageAndAccuracyResult = getAttackActionDamageAndAccuracy(
        combatant,
        ohWeaponOption,
        true,
        gameContext.gameOption
      );
    }

    if (mhDamageAndAccuracyResult instanceof Error) {
      return <div>{mhDamageAndAccuracyResult.message}</div>;
    }
    if (ohDamageAndAccuracyResult instanceof Error) {
      return <div>{ohDamageAndAccuracyResult.message}</div>;
    }

    const blockPropertiesOption =
      combatantProperties.mitigationProperties.getShieldBlockProperties();

    return (
      <div className="flex w-full">
        <WeaponDamageEntry
          damageAndAccuracyOption={mhDamageAndAccuracyResult}
          label="Main Hand"
          paddingClass="pr-1"
        />
        {blockPropertiesOption ? (
          <div className="flex pl-1 justify-between w-1/2">
            <div className="flex ">
              <HoverableTooltipWrapper tooltipText="Block chance">
                <div className="h-6 mr-1 relative">
                  <div className="absolute leading-none text-slate-700 font-bold pointer-events-none h-full w-full">
                    %
                  </div>
                  {SVG_ICONS[IconName.Shield]("h-full fill-slate-400")}
                </div>
              </HoverableTooltipWrapper>
              <div>{Math.floor(blockPropertiesOption.blockChance * 100)}%</div>
            </div>
            <div className="flex ">
              <HoverableTooltipWrapper tooltipText="Blocked damage reduction">
                <div className="h-6 mr-1 relative">
                  <div className="absolute leading-none text-slate-700 font-bold pointer-events-none text-center text-lg h-full w-full">
                    ↡
                  </div>
                  {SVG_ICONS[IconName.Shield]("h-full fill-slate-400")}
                </div>
              </HoverableTooltipWrapper>
              <div>{Math.floor(blockPropertiesOption.blockReduction * 100)}%</div>
            </div>
          </div>
        ) : (
          <WeaponDamageEntry
            damageAndAccuracyOption={ohDamageAndAccuracyResult}
            label="Off Hand"
            paddingClass="pl-1"
            isOffHand={true}
            showDisabled={disableOh}
          />
        )}
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
          <HoverableTooltipWrapper tooltipText="Hit chance">
            {SVG_ICONS[IconName.Target]("h-6 fill-slate-400 mr-1")}{" "}
          </HoverableTooltipWrapper>
          {(hitChance.afterEvasion * 100).toFixed(0)}%
        </span>
      </div>
      <div className="flex justify-between ">
        <span className=" flex">
          <HoverableTooltipWrapper tooltipText="Critical strike chance">
            {SVG_ICONS[IconName.CritChance]("h-6 fill-slate-400 mr-1")}{" "}
          </HoverableTooltipWrapper>
          {(critChance * 100).toFixed(0)}%
        </span>
        <span className="flex">
          <HoverableTooltipWrapper
            tooltipText="Critical strike multiplier"
            extraStyles="cursor-default"
          >
            ↟
          </HoverableTooltipWrapper>
          {((critMultiplierOption || 0) * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

function getAttackActionDamageAndAccuracy(
  combatant: Combatant,
  weaponOption: undefined | WeaponProperties,
  isOffHand: boolean,
  gameOption: SpeedDungeonGame | null
) {
  const actionName = getAttackActionName(weaponOption, isOffHand);

  const currentlyTargetedCombatantResult = combatant
    .getTargetingProperties()
    .getPrimaryTargetOption(gameOption, combatant, actionName);
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

  const hpChangeRange = hpChangeRangeResult;
  const hitChance = HitOutcomeMitigationCalculator.getActionHitChance(
    combatAction,
    combatant,
    1,
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
