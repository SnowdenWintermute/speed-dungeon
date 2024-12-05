import {
  FloatingMessageElement,
  FloatingMessageElementType,
  FloatingMessageIconType,
  FloatingMessageTextColor,
  getTailwindClassFromFloatingTextColor,
  startFloatingMessage,
} from "@/stores/game-store/floating-messages";
import { formatMagicalElement, formatPhysicalDamageType } from "@speed-dungeon/common";
import { HpChange } from "@speed-dungeon/common/src/combat/action-results/hp-change-result-calculation";

export default function startHpChangeFloatingMessage(
  targetId: string,
  hpChange: HpChange,
  displayTime: number
) {
  const color =
    hpChange.value >= 0 ? FloatingMessageTextColor.Healing : FloatingMessageTextColor.Damage;

  const colorClass = getTailwindClassFromFloatingTextColor(color);

  const { elementOption, physicalDamageTypeOption } = hpChange.source;

  const elements: FloatingMessageElement[] = [
    {
      type: FloatingMessageElementType.Text,
      text: `${Math.abs(hpChange.value)}${elementOption ? " " + formatMagicalElement(elementOption) : ""}${physicalDamageTypeOption ? " " + formatPhysicalDamageType(physicalDamageTypeOption) : ""}`,
      classNames: colorClass,
    },
  ];

  startFloatingMessage(targetId, elements, displayTime);
}
