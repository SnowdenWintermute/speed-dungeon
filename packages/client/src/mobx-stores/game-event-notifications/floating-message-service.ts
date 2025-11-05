import {
  ActionPayableResource,
  EntityId,
  Equipment,
  FLOATING_MESSAGE_DURATION,
  KINETIC_DAMAGE_TYPE_STRINGS,
  MAGICAL_ELEMENT_STRINGS,
  ResourceChange,
  ResourceChangeSourceCategory,
} from "@speed-dungeon/common";
import {
  FLOATING_TEXT_COLORS,
  FloatingMessageElement,
  FloatingMessageElementType,
  FloatingMessageTextColor,
} from "./floating-messages";
import { AppStore } from "../app-store";

export class FloatingMessageService {
  private static dispatch(entityId: EntityId, elements: FloatingMessageElement[]) {
    const { gameEventNotificationStore } = AppStore.get();
    gameEventNotificationStore.startFloatingMessage(entityId, elements, FLOATING_MESSAGE_DURATION);
  }

  static startResourceChangeFloatingMessage(
    targetId: string,
    resourceChange: ResourceChange,
    resourceType: ActionPayableResource,
    wasBlocked: boolean
  ) {
    const isPositive = resourceChange.value > 0;
    const isMana = resourceType === ActionPayableResource.Mana;
    const isMagical = resourceChange.source.category === ResourceChangeSourceCategory.Magical;

    let color = FloatingMessageTextColor.Damage;
    if (isMana) color = FloatingMessageTextColor.ManaGained;
    else if (isPositive) color = FloatingMessageTextColor.Healing;
    else if (isMagical) color = FloatingMessageTextColor.MagicalDamage;

    const colorClass = FLOATING_TEXT_COLORS[color];

    // const critClass = resourceChange.isCrit ? " scale-[1.25] animate-crit-text " : "";
    const critClass = resourceChange.isCrit ? " scale-[1.25] animate-crit-text " : "";

    const { elementOption, kineticDamageTypeOption } = resourceChange.source;

    let value = resourceChange.value;
    if (resourceType == ActionPayableResource.HitPoints) value = Math.abs(resourceChange.value);

    let blockedText = "";
    if (wasBlocked) {
      blockedText = "Block: ";
    }

    let kineticText = "";
    if (kineticDamageTypeOption !== undefined) {
      kineticText = ` ${KINETIC_DAMAGE_TYPE_STRINGS[kineticDamageTypeOption].toLowerCase()}`;
    }

    let elementText = "";
    if (elementOption !== undefined) {
      elementText = ` ${MAGICAL_ELEMENT_STRINGS[elementOption].toLowerCase()}`;
    }

    const elements: FloatingMessageElement[] = [
      {
        type: FloatingMessageElementType.Text,
        text: `${blockedText} ${value}${kineticText}${elementText}`,
        classNames: { mainText: colorClass + critClass, shadowText: critClass },
      },
    ];

    this.dispatch(targetId, elements);
  }

  static startBrokenHoldablesMessage(entityId: EntityId, equipment: Equipment) {
    const colorClass = FLOATING_TEXT_COLORS[FloatingMessageTextColor.Damage];
    const elements: FloatingMessageElement[] = [
      {
        type: FloatingMessageElementType.Text,
        text: `${equipment.entityProperties.name} broke`,
        classNames: { mainText: colorClass, shadowText: "" },
      },
    ];

    this.dispatch(entityId, elements);
  }

  static startHitOutcomeMissMessage(entityId: EntityId) {
    const elements: FloatingMessageElement[] = [
      {
        type: FloatingMessageElementType.Text,
        text: `Miss`,
        classNames: { mainText: "text-gray-500", shadowText: "text-black" },
      },
    ];

    this.dispatch(entityId, elements);
  }

  static startHitOutcomeEvadeMessage(entityId: EntityId) {
    const elements: FloatingMessageElement[] = [
      {
        type: FloatingMessageElementType.Text,
        text: `Evade`,
        classNames: { mainText: "text-gray-500", shadowText: "text-black" },
      },
    ];

    this.dispatch(entityId, elements);
  }

  static startHitOutcomeParryMessage(entityId: EntityId) {
    const elements: FloatingMessageElement[] = [
      {
        type: FloatingMessageElementType.Text,
        text: `Parry`,
        classNames: {
          mainText: FLOATING_TEXT_COLORS[FloatingMessageTextColor.Parried],
          shadowText: "text-black",
        },
      },
    ];

    this.dispatch(entityId, elements);
  }

  static startHitOutcomeCounteredMessage(entityId: EntityId) {
    const elements: FloatingMessageElement[] = [
      {
        type: FloatingMessageElementType.Text,
        text: `Countered`,
        classNames: {
          mainText: FLOATING_TEXT_COLORS[FloatingMessageTextColor.Parried],
          shadowText: "text-black",
        },
      },
    ];

    this.dispatch(entityId, elements);
  }
}
