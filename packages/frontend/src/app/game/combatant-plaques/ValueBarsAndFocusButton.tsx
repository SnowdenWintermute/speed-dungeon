import ValueBar, { ValueBarColors } from "@speed-dungeon/ui/atoms/ValueBar";
import { CombatantProperties } from "@speed-dungeon/common";
import { CombatAttribute } from "@speed-dungeon/common";
import React from "react";
import { observer } from "mobx-react-lite";
import { COMBATANT_PLAQUE_RESOURCE_BAR_HEIGHT } from "@/client-consts";

const HIT_POINT_BAR_COLORS: ValueBarColors = {
  border: "border-green-700",
  background: "bg-green-700",
};
const MANA_BAR_COLORS: ValueBarColors = { border: "border-blue-700", background: "bg-blue-700" };
const EXPERIENCE_BAR_COLORS: ValueBarColors = {
  border: "border-ffxipink",
  background: "bg-ffxipink",
};

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
        colors={HIT_POINT_BAR_COLORS}
        compactView={combactView}
      />
    ) : (
      "Immortal object"
    );

    const mpBar = maxManaOption ? (
      <ValueBar
        maxValue={maxManaOption}
        currentValue={combatantProperties.resources.getMana()}
        colors={MANA_BAR_COLORS}
        compactView={combactView}
      />
    ) : (
      <span />
    );

    const { experiencePoints } = combatantProperties.classProgressionProperties;

    const experienceRequiredToLevel = experiencePoints.getRequiredForNextLevel();
    const experienceBar = experienceRequiredToLevel ? (
      <ValueBar
        maxValue={experienceRequiredToLevel}
        currentValue={experiencePoints.getCurrent()}
        colors={EXPERIENCE_BAR_COLORS}
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
