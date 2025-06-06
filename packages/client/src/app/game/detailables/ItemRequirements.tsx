import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";
import { useGameStore } from "@/stores/game-store";
import {
  COMBAT_ATTRIBUTE_STRINGS,
  CombatAttribute,
  CombatantAttributeRecord,
} from "@speed-dungeon/common";
import React from "react";

interface Props {
  attributeRequirements: CombatantAttributeRecord;
}

export default function ItemRequirements({ attributeRequirements }: Props) {
  const unmetRequirements = useGameStore().consideredItemUnmetRequirements;
  let displays = [];

  let i = 0;
  for (const [attributeKey, requirementValue] of Object.entries(attributeRequirements)) {
    const attribute = parseInt(attributeKey) as CombatAttribute;
    if (i === 0) displays.push(<div key={-1}>Requirements: </div>);

    const requirementIsUnmet = unmetRequirements !== null && unmetRequirements.includes(attribute);

    const unmetRequirementStyles = requirementIsUnmet ? UNMET_REQUIREMENT_TEXT_COLOR : "";

    displays.push(
      <div
        key={i}
        className={`${unmetRequirementStyles}`}
      >{`${requirementValue} ${COMBAT_ATTRIBUTE_STRINGS[attribute]}`}</div>
    );

    i += 1;
  }

  return <div>{displays}</div>;
}
