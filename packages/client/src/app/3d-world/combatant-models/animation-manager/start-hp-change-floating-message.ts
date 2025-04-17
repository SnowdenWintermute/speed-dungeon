import {
  FLOATING_TEXT_COLORS,
  FloatingMessageElement,
  FloatingMessageElementType,
  FloatingMessageTextColor,
  startFloatingMessage,
} from "@/stores/game-store/floating-messages";
import {
  ResourceChangeSourceCategory,
  KINETIC_DAMAGE_TYPE_STRINGS,
  MAGICAL_ELEMENT_STRINGS,
  ActionPayableResource,
} from "@speed-dungeon/common";
import { ResourceChange } from "@speed-dungeon/common";

export default function startResourceChangeFloatingMessage(
  targetId: string,
  resourceChange: ResourceChange,
  resourceType: ActionPayableResource,
  wasBlocked: boolean,
  displayTime: number
) {
  let color =
    resourceChange.value > 0
      ? FloatingMessageTextColor.Healing
      : resourceChange.source.category === ResourceChangeSourceCategory.Magical
        ? FloatingMessageTextColor.MagicalDamage
        : FloatingMessageTextColor.Damage;

  if (resourceType === ActionPayableResource.Mana) color = FloatingMessageTextColor.ManaGained;

  const colorClass = FLOATING_TEXT_COLORS[color];

  const critClass = resourceChange.isCrit ? " scale-[1.25] animate-crit-text" : "";

  const { elementOption, kineticDamageTypeOption } = resourceChange.source;

  let value = resourceChange.value;
  if (resourceType == ActionPayableResource.HitPoints) value = Math.abs(resourceChange.value);

  const elements: FloatingMessageElement[] = [
    {
      type: FloatingMessageElementType.Text,
      text: `${wasBlocked ? "Block: " : ""} ${value}${kineticDamageTypeOption !== undefined ? " " + KINETIC_DAMAGE_TYPE_STRINGS[kineticDamageTypeOption].toLowerCase() : ""}${elementOption !== undefined ? " " + MAGICAL_ELEMENT_STRINGS[elementOption].toLowerCase() : ""}`,
      classNames: { mainText: colorClass + critClass, shadowText: critClass },
    },
  ];

  startFloatingMessage(targetId, elements, displayTime);
}
