import {
  CombatActionHitOutcomeProperties,
  CombatActionResource,
} from "../../../combat-action-hit-outcome-properties.js";
import { RANGED_ACTION_HIT_OUTCOME_PROPERTIES } from "./ranged-action.js";

export const PROJECTILE_HIT_OUTCOME_PROPERTIES: CombatActionHitOutcomeProperties = {
  ...RANGED_ACTION_HIT_OUTCOME_PROPERTIES,
  resourceChangePropertiesGetters: {
    [CombatActionResource.HitPoints]: (user, hitOutcomeProperties, actionLevel, primaryTarget) => {
      const resourceChangeProperties =
        user.getActionEntityProperties().actionOriginData?.resourceChangeProperties?.[
          CombatActionResource.HitPoints
        ];

      if (resourceChangeProperties === undefined)
        throw new Error("expected projectile to have stored a resource change properties object");

      return resourceChangeProperties;
    },
  },
};
