import ValueBar from "@/app/components/atoms/ValueBar";
import { CombatantProperties } from "@speed-dungeon/common";
import { CombatAttribute } from "@speed-dungeon/common/src/combatants/combat-attributes";
import React from "react";
import FocusCharacterButton from "./FocusCharacterButton";

interface Props {
  combatantProperties: CombatantProperties;
  combatantId: string;
  showExperience: boolean;
  isFocused: boolean;
}

export default function ValueBarsAndFocusButton({
  combatantProperties,
  combatantId,
  showExperience,
  isFocused,
}: Props) {
  const totalAttributes = combatantProperties.getTotalAttributes();
  const maxHitPointsOption = totalAttributes[CombatAttribute.Hp];
  const maxManaOption = totalAttributes[CombatAttribute.Mp];

  const hpBar = maxHitPointsOption ? (
    <ValueBar
      maxValue={maxHitPointsOption}
      currentValue={combatantProperties.hitPoints}
      color="green-700"
    />
  ) : (
    "Immortal object"
  );

  const mpBar = maxManaOption ? (
    <ValueBar maxValue={maxManaOption} currentValue={combatantProperties.mana} color="blue-700" />
  ) : (
    "Infinite mana"
  );

  const experiencRequiredToLevel = combatantProperties.experiencePoints.requiredForNextLevel;
  const experienceBar = experiencRequiredToLevel ? (
    <ValueBar
      maxValue={experiencRequiredToLevel}
      currentValue={combatantProperties.experiencePoints.current}
      color="ffxipink"
      hideNumbers={true}
    />
  ) : (
    <></>
  );

  return (
    <>
      <div className="h-5 mb-1">{hpBar}</div>
      <div className="h-5">{mpBar}</div>
      {showExperience && (
        <div className="h-5 mt-1 flex text-sm">
          <FocusCharacterButton combatantId={combatantId} isFocused={isFocused} />
          {experienceBar}
        </div>
      )}
    </>
  );
}
