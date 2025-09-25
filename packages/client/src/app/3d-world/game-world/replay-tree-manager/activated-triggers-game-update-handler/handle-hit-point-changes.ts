import { useGameStore } from "@/stores/game-store";
import {
  ActionPayableResource,
  ActivatedTriggersGameUpdateCommand,
  COMBAT_ACTIONS,
  HitPointChanges,
} from "@speed-dungeon/common";
import { plainToInstance } from "class-transformer";
import { induceHitRecovery } from "../induce-hit-recovery";

export function handleHitPointChanges(command: ActivatedTriggersGameUpdateCommand) {
  const hitPointChanges = plainToInstance(HitPointChanges, command.hitPointChanges);
  const action = COMBAT_ACTIONS[command.actionName];

  if (hitPointChanges) {
    for (const [entityId, hpChange] of hitPointChanges.getRecords()) {
      const combatantResult = useGameStore.getState().getCombatant(entityId);
      if (combatantResult instanceof Error) throw combatantResult;
      induceHitRecovery(
        combatantResult.entityProperties.name,
        entityId,
        command.actionName,
        command.step,
        hpChange,
        ActionPayableResource.HitPoints,
        entityId,
        false,
        action.hitOutcomeProperties.getShouldAnimateTargetHitRecovery()
      );
    }
  }
}
