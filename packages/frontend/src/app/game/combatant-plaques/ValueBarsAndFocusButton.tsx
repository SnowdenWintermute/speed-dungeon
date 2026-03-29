import ValueBar from "@/app/components/atoms/ValueBar";
import { CombatantProperties } from "@speed-dungeon/common";
import { CombatAttribute } from "@speed-dungeon/common";
import React from "react";
import { observer } from "mobx-react-lite";
import { COMBATANT_PLAQUE_RESOURCE_BAR_HEIGHT } from "@/client-consts";

interface Props {
  combatantProperties: CombatantProperties;
  combatantId: string;
  showExperience: boolean;
  isFocused: boolean;
  combactView?: boolean;
}

export const ValueBarsAndFocusButton = observer(
  ({ combatantProperties, showExperience, combactView }: Props) => {
    const totalAttributes = combatantProperties.attributeProperties.getTotalAttributes();
    const maxHitPointsOption = totalAttributes[CombatAttribute.Hp];
    const maxManaOption = totalAttributes[CombatAttribute.Mp];

    const hpBar = maxHitPointsOption ? (
      <ValueBar
        maxValue={maxHitPointsOption}
        currentValue={combatantProperties.resources.getHitPoints()}
        color="green-700"
        compactView={combactView}
      />
    ) : (
      "Immortal object"
    );

    const mpBar = maxManaOption ? (
      <ValueBar
        maxValue={maxManaOption}
        currentValue={combatantProperties.resources.getMana()}
        color="blue-700"
        compactView={combactView}
      />
    ) : (
      <span />
    );

    const { experiencePoints } = combatantProperties.classProgressionProperties;

    const experiencRequiredToLevel = experiencePoints.getRequiredForNextLevel();
    const experienceBar = experiencRequiredToLevel ? (
      <ValueBar
        maxValue={experiencRequiredToLevel}
        currentValue={experiencePoints.getCurrent()}
        color="ffxipink"
        hideNumbers={true}
        compactView={combactView}
      />
    ) : (
      <></>
    );

    // <FocusCharacterButton combatantId={combatantId} isFocused={isFocused} />;

    return (
      <>
        <div className={`${COMBATANT_PLAQUE_RESOURCE_BAR_HEIGHT} mb-1`}>{hpBar}</div>
        <div className={`${COMBATANT_PLAQUE_RESOURCE_BAR_HEIGHT} flex`}>{mpBar}</div>
        {showExperience && <div className={`h-2 mt-[6px] flex text-sm`}>{experienceBar} </div>}
      </>
    );
  }
);
