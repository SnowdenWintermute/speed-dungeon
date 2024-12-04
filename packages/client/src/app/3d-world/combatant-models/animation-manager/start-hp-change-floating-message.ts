import {
  FloatingMessageElementType,
  FloatingMessageTextColor,
  getTailwindClassFromFloatingTextColor,
  startFloatingMessage,
} from "@/stores/game-store/floating-messages";
import { HpChange } from "@speed-dungeon/common/src/combat/action-results/hp-change-result-calculation";

export default function startHpChangeFloatingMessage(
  targetId: string,
  hpChange: HpChange,
  displayTime: number
) {
  const color =
    hpChange.value >= 0 ? FloatingMessageTextColor.Healing : FloatingMessageTextColor.Damage;

  const colorClass = getTailwindClassFromFloatingTextColor(color);

  startFloatingMessage(
    targetId,
    [
      {
        type: FloatingMessageElementType.Text,
        text: Math.abs(hpChange.value),
        classNames: colorClass,
      },
    ],
    displayTime
  );
}
