import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import {
  COMBATANT_CLASS_NAME_STRINGS,
  CombatantClass,
  iterateNumericEnum,
} from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";

export const InGameCharacterCreationForm = observer(() => {
  const [selectedClass, setSelectedClass] = useState(CombatantClass.Warrior);

  return (
    <div>
      <ul>
        {iterateNumericEnum(CombatantClass).map((combatantClass) => (
          <li
            className={`${selectedClass === combatantClass ? "bg-slate-700" : ""} p-2 border border-slate-400`}
          >
            <HotkeyButton
              onClick={() => {
                setSelectedClass(combatantClass);
              }}
            >
              {COMBATANT_CLASS_NAME_STRINGS[combatantClass]}
            </HotkeyButton>
          </li>
        ))}
      </ul>
      <div></div>
    </div>
  );
});
