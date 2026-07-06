import {
  createTargetingPropertiesConfig,
  TARGETING_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/targeting-properties-config-templates/index.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import { CombatActionName } from "../../combat-action-names.js";
import { CombatActionLeaf } from "../../combat-action-leaf.js";
import cloneDeep from "lodash.clonedeep";
import { deathActionConfig } from "./index.js";
import { ResourceChangePropertiesGetters } from "../../../../types.js";
import { CombatActionResource } from "../../combat-action-hit-outcome-properties.js";
import {
  ResourceChangeSource,
  ResourceChangeSourceCategory,
} from "../../../hp-change-source-types.js";
import { NumberRange } from "../../../../primatives/number-range.js";

const targetingProperties = createTargetingPropertiesConfig(
  TARGETING_PROPERTIES_TEMPLATE_GETTERS.SINGLE_ANY,
  { executionPreconditions: [], intent: CombatActionIntent.Benevolent }
);

export const HALF_KILL_ACTION_RESOURCE_PROPERTY_CHANGE_GETTERS: ResourceChangePropertiesGetters = {
  [CombatActionResource.HitPoints]: (user, hitOutcomeProperties, actionRank, primaryTarget) => {
    return {
      resourceChangeSource: new ResourceChangeSource({
        category: ResourceChangeSourceCategory.Direct,
      }),
      baseValues: new NumberRange(
        Math.floor(primaryTarget.resources.getHitPoints() / 2),
        Math.floor(primaryTarget.resources.getHitPoints() / 2)
      ),
    };
  },
};

export const halfKillConfig = cloneDeep(deathActionConfig);
halfKillConfig.targetingProperties = targetingProperties;
halfKillConfig.hitOutcomeProperties.resourceChangePropertiesGetters = cloneDeep(
  HALF_KILL_ACTION_RESOURCE_PROPERTY_CHANGE_GETTERS
);
halfKillConfig.description = "Deal direct damage equal to half the target's hit points";

export const HALF_KILL = new CombatActionLeaf(CombatActionName.Kill, halfKillConfig);
