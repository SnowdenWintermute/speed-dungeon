import {
  ActionPayableResource,
  ActivatedTriggersGameUpdateCommand,
  COMBAT_ACTIONS,
  HitPointChanges,
} from "@speed-dungeon/common";
import { plainToInstance } from "class-transformer";
import { induceHitRecovery } from "../induce-hit-recovery";
import { AppStore } from "@/mobx-stores/app-store";

export function handleHitPointChanges(command: ActivatedTriggersGameUpdateCommand) {
  const hitPointChanges = plainToInstance(HitPointChanges, command.hitPointChanges);
  const action = COMBAT_ACTIONS[command.actionName];

  if (hitPointChanges) {
    for (const [entityId, hpChange] of hitPointChanges.getRecords()) {
      const combatant = AppStore.get().gameStore.getExpectedCombatant(entityId);
      induceHitRecovery(
        combatant.entityProperties.name,
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
