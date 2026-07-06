import {
  createTargetingPropertiesConfig,
  TARGETING_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/targeting-properties-config-templates/index.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import { CombatActionName } from "../../combat-action-names.js";
import { CombatActionLeaf } from "../../combat-action-leaf.js";
import cloneDeep from "lodash.clonedeep";
import { deathActionConfig } from "./index.js";

const targetingProperties = createTargetingPropertiesConfig(
  TARGETING_PROPERTIES_TEMPLATE_GETTERS.SINGLE_ANY,
  { executionPreconditions: [], intent: CombatActionIntent.Benevolent }
);

export const killConfig = cloneDeep(deathActionConfig);
killConfig.targetingProperties = targetingProperties;
killConfig.description = "Kill any target by dealing damage equal to its hit points";

export const KILL = new CombatActionLeaf(CombatActionName.Kill, killConfig);
