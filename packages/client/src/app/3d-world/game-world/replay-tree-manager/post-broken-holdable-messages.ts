import { CombatLogMessage, CombatLogMessageStyle } from "@/app/game/combat-log/combat-log-message";
import { useGameStore } from "@/stores/game-store";
import {
  FLOATING_TEXT_COLORS,
  FloatingMessageElement,
  FloatingMessageElementType,
  FloatingMessageTextColor,
  startFloatingMessage,
} from "@/stores/game-store/floating-messages";
import { EntityId, Equipment, FLOATING_MESSAGE_DURATION } from "@speed-dungeon/common";

export function postBrokenHoldableMessages(combatantId: EntityId, equipment: Equipment) {
  console.log("BROKE", equipment.entityProperties.name);

  const colorClass = FLOATING_TEXT_COLORS[FloatingMessageTextColor.Damage];
  const elements: FloatingMessageElement[] = [
    {
      type: FloatingMessageElementType.Text,
      text: `${equipment.entityProperties.name} broke`,
      classNames: { mainText: colorClass, shadowText: "" },
    },
  ];
  startFloatingMessage(combatantId, elements, FLOATING_MESSAGE_DURATION);

  useGameStore.getState().mutateState((gameState) => {
    gameState.combatLogMessages.push(
      new CombatLogMessage(`${equipment.entityProperties.name} broke!`, CombatLogMessageStyle.Basic)
    );
  });
}
