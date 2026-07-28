import Divider from "@/app/components/atoms/Divider";
import { iterateNumericEnumKeyedRecord } from "@speed-dungeon/common";
import { CombatAttribute } from "@speed-dungeon/common";
import React, { useState } from "react";
import { AttributeListItem } from "./AttributeListItem";
import HpAndMp from "./HpAndMp";
import { CharacterSheetWeaponDamage } from "./CharacterSheetWeaponDamage";
import ElementalAffinitiesDisplay from "./ElementalAffinitiesDisplay";
import KineticAffinitiesDisplay from "./KineticAffinitiesDisplay";
import { observer } from "mobx-react-lite";
import { useCharacterSheetSubject } from "./character-sheet-subject-context";
import { CharacterSheetHeader } from "./CharacterSheetHeader";
import { ParryAndCounterattackChanceDisplay } from "./ParryAndCounterattackChanceDisplay";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";

interface Props {
  widthOptionClass?: string;
  hideHeader?: boolean;
}

export const CharacterAttributes = observer(({ widthOptionClass, hideHeader }: Props) => {
  const subject = useCharacterSheetSubject();
  const { combatant } = subject;
  const { entityProperties, combatantProperties } = combatant;

  const allocateAttributePointOption = subject.getAttributeAllocationHandlerOption();

  const { attributeProperties } = combatantProperties;

  const hasUnspentAttributePoints = attributeProperties.getUnspentPoints() > 0;

  const isPlayerControlled = combatantProperties.controlledBy.isPlayerControlled();

  const shouldShowNumberOfUnspentAttributes =
    hasUnspentAttributePoints && isPlayerControlled && allocateAttributePointOption !== null;

  const totalAttributes = combatantProperties.attributeProperties.getTotalAttributes();
  let totalAttributesSortedArray: [CombatAttribute, number][] = iterateNumericEnumKeyedRecord(
    totalAttributes
  ).map(([attribute, value]) => {
    return [attribute, value];
  });

  totalAttributesSortedArray = totalAttributesSortedArray.filter(
    ([attribute, _value]) => attribute !== CombatAttribute.Hp && attribute !== CombatAttribute.Mp
  );

  totalAttributesSortedArray.sort((a, b) => a[0] - b[0]);
  const numberOfAttributes = totalAttributesSortedArray.length;
  const halfNumberOfAttributes =
    numberOfAttributes % 2 === 0 ? numberOfAttributes / 2 : (numberOfAttributes - 1) / 2;

  const listItems = totalAttributesSortedArray.map(([attribute, value]) => (
    <AttributeListItem
      key={attribute}
      attribute={attribute}
      value={value}
      combatantHasUnspentAttributePoints={hasUnspentAttributePoints}
      onAllocatePointOption={allocateAttributePointOption}
    />
  ));

  const [viewingOtherPage, setViewingOtherPage] = useState(false);

  return (
    <div
      className={`h-full ${widthOptionClass ? `widthOptionClass` : "w-[25.25rem]"} whitespace-nowrap`}
    >
      {!hideHeader && (
        <CharacterSheetHeader
          entityId={combatant.getEntityId()}
          name={entityProperties.name}
          combatantProperties={combatantProperties}
        />
      )}
      {!viewingOtherPage ? (
        <div className="">
          <div className="flex mb-1">
            {/*LEFT COLUMN*/}
            <ul className="list-none w-1/2 mr-1">
              {listItems.filter((_, i) => i < halfNumberOfAttributes)}
              {shouldShowNumberOfUnspentAttributes && (
                <li className="text-ffxipink flex justify-between">
                  <span>Unspent: </span>
                  <span>
                    <span>{attributeProperties.getUnspentPoints()}</span>
                  </span>
                </li>
              )}
            </ul>
            {/*RIGHT COLUMN*/}
            <ul className="list-none w-1/2 ml-1">
              {listItems.filter((_, i) => i >= halfNumberOfAttributes)}
            </ul>
          </div>
          <Divider extraStyles={"mr-2 ml-2 "} />
          <div className="flex w-full mb-1">
            <HpAndMp combatantProperties={combatantProperties} totalAttributes={totalAttributes} />
            <ParryAndCounterattackChanceDisplay
              combatantProperties={combatant.combatantProperties}
            />
          </div>

          <CharacterSheetWeaponDamage combatant={combatant} />
          <Divider extraStyles={"mr-2 ml-2 "} />
          <ElementalAffinitiesDisplay
            affinities={combatantProperties.mitigationProperties.getElementalAffinities()}
          />
          <KineticAffinitiesDisplay
            affinities={combatantProperties.mitigationProperties.getKineticImpactTypeAffinities()}
          />
        </div>
      ) : (
        <div>
          <ul>
            <li className="flex justify-between">
              <div>Kinetic crit evasion:</div>
              <div>
                {Math.floor(combatantProperties.mitigationProperties.getKineticCritEvasion() * 100)}
                %
              </div>
            </li>
            <li className="flex justify-between">
              <div>Incoming crit damage:</div>
              <div>
                -
                {Math.floor(
                  combatantProperties.mitigationProperties.getCritDamageReduction() * 100
                )}
                %
              </div>
            </li>
            <li className="flex justify-between">
              <div>Magical healing received:</div>
              <div>
                +
                {Math.floor(
                  combatantProperties.mitigationProperties.getMagicalHealingIncrease() * 100
                )}
                %
              </div>
            </li>
            <li className="flex justify-between">
              <div>Magical damage received:</div>
              <div>
                -
                {Math.floor(
                  combatantProperties.mitigationProperties.getMagicalDamageReduction() * 100
                )}
                %
              </div>
            </li>
            <li className="flex justify-between">
              <div>Lifesteal:</div>
              <div>{combatantProperties.equipment.getEquippedLifestealPercentage()}%</div>
            </li>
          </ul>
        </div>
      )}
      <div className="absolute bottom-2 right-2 z-10">
        <HotkeyButton
          className="border px-2 border-slate-400"
          onClick={() => setViewingOtherPage(!viewingOtherPage)}
        >
          More
        </HotkeyButton>
      </div>
    </div>
  );
});
