import { CombatActionHitOutcomeProperties } from "../../combat-action-hit-outcome-properties.js";
import { FriendOrFoe } from "../../targeting-schemes-and-categories.js";
import { CombatantConditionName } from "../../../../combatants/index.js";
import {
  createHitOutcomeProperties,
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/hit-outcome-properties-templates/index.js";
import { ActionEntity } from "../../../../action-entities/index.js";

const hitOutcomeOverrides: Partial<CombatActionHitOutcomeProperties> = {};

hitOutcomeOverrides.getAppliedConditions = (user, actionLevel) => {
  // on the client when we get descriptions we need an appliedBy so we'll just take it
  // from the combatant
  let appliedBy;
  if (user instanceof ActionEntity) {
    const appliedByOption = user.getActionEntityProperties().actionOriginData?.spawnedBy;
    if (appliedByOption === undefined)
      throw new Error("expected ice bolt to have a spawnedBy field");
    appliedBy = appliedByOption;
  }

  return [
    {
      conditionName: CombatantConditionName.PrimedForIceBurst,
      level: actionLevel,
      stacks: 1,
      appliedBy: {
        entityProperties: appliedBy || user.getEntityProperties(),
        friendOrFoe: FriendOrFoe.Hostile,
      },
    },
  ];
};

export const ICE_BOLT_PROJECTILE_HIT_OUTCOME_PROPERTIES = createHitOutcomeProperties(
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.PROJECTILE,
  hitOutcomeOverrides
);
