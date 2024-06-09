import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";
import {
  CombatAttribute,
  CombatantAttributeRecord,
  formatCombatAttribute,
} from "@speed-dungeon/common";
import React from "react";

interface Props {
  attributeRequirements: CombatantAttributeRecord;
  unmetRequirements: null | CombatAttribute[];
}

export default function ItemRequirements({ attributeRequirements, unmetRequirements }: Props) {
  let displays = [];

  let i = 0;
  for (const [attributeKey, requirementValue] of Object.entries(attributeRequirements)) {
    const attribute = attributeKey as unknown as CombatAttribute;
    if (i === 0) displays.push(<div>Requirements: </div>);

    const requirementIsUnmet = unmetRequirements !== null && unmetRequirements.includes(attribute);

    const unmetRequirementStyles = requirementIsUnmet ? UNMET_REQUIREMENT_TEXT_COLOR : "";

    displays.push(
      <div
        key={i}
        className={`${unmetRequirementStyles}`}
      >{`${requirementValue} ${formatCombatAttribute(attribute)}`}</div>
    );

    i += 1;
  }

  return <div>{displays}</div>;
}
