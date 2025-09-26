import { ActionResolutionStepContext, ActionResolutionStepType } from "../index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../../game-update-commands.js";
import { SpawnableEntityType } from "../../../spawnables/index.js";
import { EntityMotionActionResolutionStep } from "./entity-motion.js";
import { ActionUserType } from "../../../action-user-context/action-user.js";

export class WaitForDelayActionResolutionStep extends EntityMotionActionResolutionStep {
  constructor(context: ActionResolutionStepContext, step: ActionResolutionStepType) {
    const { actionName } = context.tracker.actionExecutionIntent;

    const { actionUser } = context.actionUserContext;

    // all we do is send an empty step. the delay will be set by triggered firewall actions

    const gameUpdateCommand: GameUpdateCommand = (() => {
      switch (actionUser.getType()) {
        case ActionUserType.Combatant:
          return {
            type: GameUpdateCommandType.CombatantMotion,
            actionName,
            step,
            completionOrderId: null,
            mainEntityUpdate: {
              entityType: SpawnableEntityType.Combatant,
              entityId: actionUser.getEntityId(),
            },
          };
        case ActionUserType.Condition:
          throw new Error("this step is not intended to be used with conditions");
        case ActionUserType.ActionEntity:
          return {
            type: GameUpdateCommandType.ActionEntityMotion,
            actionName,
            step,
            completionOrderId: null,
            mainEntityUpdate: {
              entityType: SpawnableEntityType.ActionEntity,
              entityId: actionUser.getEntityId(),
            },
          };
      }
    })();

    super(step, context, gameUpdateCommand, actionUser);
  }
}
