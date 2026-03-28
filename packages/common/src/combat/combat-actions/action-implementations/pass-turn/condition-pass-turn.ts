import cloneDeep from "lodash.clonedeep";
import { CombatActionGameLogProperties } from "../../combat-action-combat-log-properties.js";
import { passTurnConfig } from "./index.js";
import {
  createTargetingPropertiesConfig,
  TARGETING_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/targeting-properties-config-templates/index.js";
import { ACTION_STEPS_CONFIG_TEMPLATE_GETTERS } from "../generic-action-templates/step-config-templates/index.js";
import { CombatActionOrigin } from "../../combat-action-origin.js";
import { CombatActionName } from "../../combat-action-names.js";
import { CombatActionLeaf } from "../../combat-action-leaf.js";
import { CombatActionComponentConfig } from "../../index.js";

const cloned = cloneDeep(passTurnConfig);

const targetingProperties = createTargetingPropertiesConfig(
  TARGETING_PROPERTIES_TEMPLATE_GETTERS.SINGLE_HOSTILE,
  {
    executionPreconditions: [
      // ACTION_EXECUTION_PRECONDITIONS[ActionExecutionPreconditions.TargetsAreAlive],
    ],
  }
);

const config: CombatActionComponentConfig = {
  ...cloned,
  description: "For combatant conditions ending their turn on tick",
  targetingProperties,
  gameLogMessageProperties: new CombatActionGameLogProperties({
    origin: CombatActionOrigin.SpellCast,
    getOnUseMessageDataOverride(context) {
      const { actionUserContext } = context;
      return { nameOfTarget: "", nameOfActionUser: actionUserContext.actionUser.getName() };
    },
    getOnUseMessage: (data) => {
      return `${data.nameOfActionUser} ticks`;
    },
  }),
  stepsConfig: ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.CONDITION_TICK(),
};

export const CONDITION_PASS_TURN = new CombatActionLeaf(CombatActionName.ConditionPassTurn, config);
