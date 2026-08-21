import {
  Combatant,
  Equipment,
  COMBAT_ACTIONS,
  SpeedDungeonGame,
  EquipmentSlotId,
  getAttackActionName,
  getTooltipOffensiveSpec,
} from "@speed-dungeon/common";
import { WeaponProperties } from "@speed-dungeon/common";
import { EquipmentType } from "@speed-dungeon/common";
import { NumberRange } from "@speed-dungeon/common";
import React from "react";
import { IconName, SVG_ICONS } from "@/app/icons";
import { observer } from "mobx-react-lite";
import { useCharacterSheetSubject } from "./character-sheet-subject-context";
import HoverableTooltipWrapper from "@speed-dungeon/ui/atoms/HoverableTooltipWrapper";

export const CharacterSheetWeaponDamage = observer(
  ({ combatant, disableOh }: { combatant: Combatant; disableOh?: boolean }) => {
    const { combatantProperties } = combatant;
    const { equipment } = combatantProperties;

    const gameOption = useCharacterSheetSubject().getGameOption();

    const mhWeaponOption = equipment.hotswapSlotsManager.activeSlot
      .getEquipmentInSlot(EquipmentSlotId.MainHand)
      ?.requireWeaponProperties();

    const mhDamageAndAccuracyResult = getAttackActionDamageAndAccuracy(
      combatant,
      mhWeaponOption,
      false,
      gameOption
    );
    const isTwoHanded = mhWeaponOption
      ? Equipment.isTwoHandedWeaponType(mhWeaponOption.equipmentType)
      : false;

    const ohEquipmentOption = equipment.hotswapSlotsManager.activeSlot.getEquipmentInSlot(
      EquipmentSlotId.OffHand
    );

    let ohDamageAndAccuracyResult;
    if (
      !isTwoHanded &&
      ohEquipmentOption?.equipmentBaseItemProperties.equipmentType !== EquipmentType.Shield
    ) {
      const ohWeaponOption = ohEquipmentOption?.requireWeaponProperties();
      ohDamageAndAccuracyResult = getAttackActionDamageAndAccuracy(
        combatant,
        ohWeaponOption,
        true,
        gameOption
      );
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
          <div className="flex pl-1 w-1/2">
            <div className="flex w-1/2">
              <HoverableTooltipWrapper tooltipText="Block chance">
                <div className="h-6 mr-1 relative">
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
      <div className="w-full flex justify-start">
        <span className="flex w-1/2">
          {SVG_ICONS[IconName.OpenHand](
            `h-5 w-6 fill-slate-400 mr-1 ${props.isOffHand && "-scale-x-100"} `
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
      <div className="flex ">
        <span className=" flex w-1/2">
          <HoverableTooltipWrapper tooltipText="Critical strike chance">
            {SVG_ICONS[IconName.CritChance]("h-6 w-6 fill-slate-400 mr-1")}{" "}
          </HoverableTooltipWrapper>
          {(critChance * 100).toFixed(0)}%
        </span>
        <span className="flex">
          <HoverableTooltipWrapper
            tooltipText="Critical strike multiplier"
            extraStyles="cursor-default"
          >
            <div className="w-6 flex justify-center text-center">↟</div>
          </HoverableTooltipWrapper>
          {((critMultiplierOption || 0) * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

function getAttackActionDamageAndAccuracy(
  user: Combatant,
  weaponOption: undefined | WeaponProperties,
  isOffHand: boolean,
  gameOption: SpeedDungeonGame | null
) {
  const actionName = getAttackActionName(weaponOption, { isOffHand });

  const targetOption = user
    .getTargetingProperties()
    .getPrimaryTargetOption(gameOption, user, actionName);

  const combatAction = COMBAT_ACTIONS[actionName];

  return getTooltipOffensiveSpec(combatAction, user, targetOption);
}
