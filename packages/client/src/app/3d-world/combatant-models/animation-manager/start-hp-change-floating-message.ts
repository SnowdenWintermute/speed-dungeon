import {
  FloatingMessageElement,
  FloatingMessageElementType,
  FloatingMessageTextColor,
  getTailwindClassFromFloatingTextColor,
  startFloatingMessage,
} from "@/stores/game-store/floating-messages";
import {
  HpChangeSourceCategory,
  KINETIC_DAMAGE_TYPE_STRINGS,
  MAGICAL_ELEMENT_STRINGS,
} from "@speed-dungeon/common";
import { HpChange } from "@speed-dungeon/common/src/combat/action-results/hp-change-result-calculation";

export default function startHpChangeFloatingMessage(
  targetId: string,
  hpChange: HpChange,
  displayTime: number
) {
  let color =
    hpChange.value >= 0 ? FloatingMessageTextColor.Healing : FloatingMessageTextColor.Damage;

  if (hpChange.source.category === HpChangeSourceCategory.Magical)
    color = FloatingMessageTextColor.MagicalDamage;

  console.log(
    "IS MAGICAL FLOATING TEXT: ",
    hpChange.source.category === HpChangeSourceCategory.Magical,
    JSON.stringify(hpChange, null, 2)
  );

  const colorClass = getTailwindClassFromFloatingTextColor(color);

  const { elementOption, kineticDamageTypeOption } = hpChange.source;

  const elements: FloatingMessageElement[] = [
    {
      type: FloatingMessageElementType.Text,
      text: `${Math.abs(hpChange.value)}${elementOption !== undefined ? " " + MAGICAL_ELEMENT_STRINGS[elementOption] : ""}${kineticDamageTypeOption !== undefined ? " " + KINETIC_DAMAGE_TYPE_STRINGS[kineticDamageTypeOption] : ""}`,
      classNames: colorClass,
    },
  ];

  startFloatingMessage(targetId, elements, displayTime);
}
