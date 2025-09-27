import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { AdventuringParty } from "../../../../adventuring-party/index.js";
import { ActionResolutionStepConfig } from "../../combat-action-steps-config.js";
import { FriendOrFoe } from "../../targeting-schemes-and-categories.js";
import {
  ACTION_STEPS_CONFIG_TEMPLATE_GETTERS,
  createStepsConfig,
} from "../generic-action-templates/step-config-templates/index.js";
import { createBowAttackArrowProjectile } from "../generic-action-templates/step-config-templates/bow-skill.js";

const base = ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.BOW_SKILL;
const stepOverrides: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>> = {};
const finalStepOverrides: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>> =
  {};

stepOverrides[ActionResolutionStepType.PostPrepSpawnEntity] = {
  getSpawnableEntities: (context) => {
    const { actionUserContext } = context;
    const { actionUser, party } = actionUserContext;

    const battleOption = context.actionUserContext.getBattleOption();
    const entityIdsByDisposition = actionUser.getAllyAndOpponentIds(party, battleOption);

    const opponentIds = entityIdsByDisposition[FriendOrFoe.Hostile];
    const opponents = AdventuringParty.getCombatants(party, opponentIds);

    const projectileEntitiesToSpawn = opponents
      .filter((opponent) => opponent.combatantProperties.hitPoints > 0)
      .map((opponent) => createBowAttackArrowProjectile(context, opponent));

    return projectileEntitiesToSpawn;
  },
};

const config = createStepsConfig(base, {
  steps: stepOverrides,
  finalSteps: finalStepOverrides,
});

// @REFACTOR
// @BADPRACTICE not really great, but this is to avoid igniting the dummy arrow. Not like we're ever going to walk in
// an environmental hazard right in front of us anyway, but if ever we implement that we'll have to change this
// delete config.steps[ActionResolutionStepType.PreInitialPositioningCheckEnvironmentalHazardTriggers];

export const CHAINING_SPLIT_ARROW_PARENT_STEPS_CONFIG = config;
