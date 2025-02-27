import {
  FLOATING_TEXT_COLORS,
  FloatingMessageElement,
  FloatingMessageElementType,
  FloatingMessageTextColor,
  startFloatingMessage,
} from "@/stores/game-store/floating-messages";
import {
  HpChangeSourceCategory,
  KINETIC_DAMAGE_TYPE_STRINGS,
  MAGICAL_ELEMENT_STRINGS,
} from "@speed-dungeon/common";
import { HpChange } from "@speed-dungeon/common";

export default function startHpChangeFloatingMessage(
  targetId: string,
  hpChange: HpChange,
  wasBlocked: boolean,
  displayTime: number
) {
  let color =
    hpChange.value > 0
      ? FloatingMessageTextColor.Healing
      : hpChange.source.category === HpChangeSourceCategory.Magical
        ? FloatingMessageTextColor.MagicalDamage
        : FloatingMessageTextColor.Damage;

  const colorClass = FLOATING_TEXT_COLORS[color];

  const critClass = hpChange.isCrit ? " scale-[1.25] animate-crit-text" : "";

  const { elementOption, kineticDamageTypeOption } = hpChange.source;

  const elements: FloatingMessageElement[] = [
    {
      type: FloatingMessageElementType.Text,
      text: `${wasBlocked ? "Block: " : ""} ${Math.abs(hpChange.value)}${kineticDamageTypeOption !== undefined ? " " + KINETIC_DAMAGE_TYPE_STRINGS[kineticDamageTypeOption].toLowerCase() : ""}${elementOption !== undefined ? " " + MAGICAL_ELEMENT_STRINGS[elementOption].toLowerCase() : ""}`,
      classNames: { mainText: colorClass + critClass, shadowText: critClass },
    },
  ];

  startFloatingMessage(targetId, elements, displayTime);
}
