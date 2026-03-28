import Divider from "@/app/components/atoms/Divider";
import { Combatant, iterateNumericEnumKeyedRecord } from "@speed-dungeon/common";
import { CombatAttribute } from "@speed-dungeon/common";
import React from "react";
import { AttributeListItem } from "./AttributeListItem";
import HpAndMp from "./HpAndMp";
import { CharacterSheetWeaponDamage } from "./CharacterSheetWeaponDamage";
import ElementalAffinitiesDisplay from "./ElementalAffinitiesDisplay";
import KineticAffinitiesDisplay from "./KineticAffinitiesDisplay";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { CharacterSheetHeader } from "./CharacterSheetHeader";

interface Props {
  combatant: Combatant;
  showAttributeAssignmentButtons: boolean;
  widthOptionClass?: string;
  hideHeader?: boolean;
}

export const CharacterAttributes = observer(
  ({ combatant, showAttributeAssignmentButtons, widthOptionClass, hideHeader }: Props) => {
    const { entityProperties, combatantProperties } = combatant;
    const clientApplication = useClientApplication();
    const { combatantFocus } = clientApplication;
    const playerOwnsCharacter = combatantFocus.clientUserControlsFocusedCombatant();

    const { attributeProperties } = combatantProperties;

    const hasUnspentAttributePoints = attributeProperties.getUnspentPoints() > 0;

    const isPlayerControlled = combatantProperties.controlledBy.isPlayerControlled();

    const shouldShowNumberOfUnspentAttributes =
      hasUnspentAttributePoints && isPlayerControlled && showAttributeAssignmentButtons;

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
        playerOwnsCharacter={playerOwnsCharacter}
        showAttributeAssignmentButtonsIfOwned={showAttributeAssignmentButtons}
      />
    ));

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
        <HpAndMp combatantProperties={combatantProperties} totalAttributes={totalAttributes} />
        {<CharacterSheetWeaponDamage combatant={combatant} />}
        <Divider extraStyles={"mr-2 ml-2 "} />
        <ElementalAffinitiesDisplay
          affinities={combatantProperties.mitigationProperties.getElementalAffinities()}
        />
        <KineticAffinitiesDisplay
          affinities={combatantProperties.mitigationProperties.getKineticImpactTypeAffinities()}
        />
      </div>
    );
  }
);
