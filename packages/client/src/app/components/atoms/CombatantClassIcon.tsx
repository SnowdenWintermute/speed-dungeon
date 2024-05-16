import { CombatantClass } from "@speed-dungeon/common/src/combatants";
import React from "react";

interface Props {
  combatantClass: CombatantClass;
}

export default function CombatantClassIcon(props: Props) {
  switch (props.combatantClass) {
    case CombatantClass.Warrior:
      return (
        <img src="img/combatant-class-icons/warrior.svg" alt="warrior icon" className="h-full" />
      );
    case CombatantClass.Mage:
      return <img src="img/combatant-class-icons/staff.svg" alt={"mage icon"} className="h-full" />;
    case CombatantClass.Rogue:
      return (
        <img src="img/combatant-class-icons/sword.svg" alt={"rogue icon"} className="h-full" />
      );
  }
}
