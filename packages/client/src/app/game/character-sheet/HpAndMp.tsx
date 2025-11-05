import {
  CombatAttribute,
  CombatantAttributeRecord,
  CombatantProperties,
} from "@speed-dungeon/common";
import React from "react";

export default function HpAndMp({
  combatantProperties,
  totalAttributes,
}: {
  combatantProperties: CombatantProperties;
  totalAttributes: CombatantAttributeRecord;
}) {
  const maxHpOption = totalAttributes[CombatAttribute.Hp];
  const maxMpOption = totalAttributes[CombatAttribute.Mp];

  const mana = combatantProperties.resources.getMana();

  return (
    <div className="flex">
      <div className="w-1/2 flex justify-between mr-1">
        <span>{"HP"}</span>
        <span>
          {maxHpOption !== undefined
            ? `${combatantProperties.resources.getHitPoints()}/${maxHpOption}`
            : "Immortal Object"}
        </span>
      </div>
      <div className="w-1/2 flex justify-between ml-1">
        <span>{"Mana"}</span>
        {maxMpOption !== undefined && !isNaN(mana) ? (
          <span>{`${mana}/${maxMpOption}`}</span>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
