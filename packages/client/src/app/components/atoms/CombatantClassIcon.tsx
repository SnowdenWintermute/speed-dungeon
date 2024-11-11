import { CombatantClass } from "@speed-dungeon/common";
import React from "react";
import Axe from "../../../../public/img/combatant-class-icons/axe.svg";
import Sword from "../../../../public/img/combatant-class-icons/sword.svg";
import Staff from "../../../../public/img/combatant-class-icons/staff.svg";

interface Props {
  combatantClass: CombatantClass;
}

export default function CombatantClassIcon(props: Props) {
  switch (props.combatantClass) {
    case CombatantClass.Warrior:
      return <Axe className="h-full fill-slate-400" />;
    case CombatantClass.Mage:
      return <Staff className="h-full" />;
    case CombatantClass.Rogue:
      return <Sword className="h-full" />;
  }
}
