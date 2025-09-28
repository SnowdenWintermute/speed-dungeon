import {
  ActionAccuracyType,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionExecutionIntent,
  CombatActionName,
} from "../../index.js";
import { CombatantEquipment } from "../../../../combatants/index.js";
import { ActionResolutionStepContext } from "../../../../action-processing/index.js";
import cloneDeep from "lodash.clonedeep";
import { ATTACK_CONFIG } from "../attack/index.js";
import { createTargetingPropertiesConfig } from "../generic-action-templates/targeting-properties-config-templates/index.js";

const clonedConfig = cloneDeep(ATTACK_CONFIG);

const targetingProperties = createTargetingPropertiesConfig(
  () => clonedConfig.targetingProperties,
  {}
);

const config: CombatActionComponentConfig = {
  ...clonedConfig,
  targetingProperties,
  hitOutcomeProperties: {
    ...clonedConfig.hitOutcomeProperties,
    getIsBlockable: () => false,
    getIsParryable: () => false,
    getCanTriggerCounterattack: () => false,
    getUnmodifiedAccuracy: () => {
      return { type: ActionAccuracyType.Unavoidable };
    },
  },
  description: "Cancel an incoming attack and respond with one of your own",
  costProperties: { ...clonedConfig.costProperties, costBases: {} },
  hierarchyProperties: {
    ...clonedConfig.hierarchyProperties,
    getChildren: function (context: ActionResolutionStepContext) {
      const { actionUser } = context.actionUserContext;
      const { actionExecutionIntent } = context.tracker;
      const { targets, rank } = actionExecutionIntent;

      let actionName = CombatActionName.CounterattackMeleeMainhand;

      if (CombatantEquipment.isWearingUsableTwoHandedRangedWeapon(actionUser)) {
        actionName = CombatActionName.CounterattackRangedMainhand;
      }

      return [
        {
          actionExecutionIntent: new CombatActionExecutionIntent(actionName, rank, targets),
          user: actionUser,
        },
      ];
    },
  },
};

export const COUNTER_ATTACK = new CombatActionComposite(CombatActionName.Counterattack, config);
