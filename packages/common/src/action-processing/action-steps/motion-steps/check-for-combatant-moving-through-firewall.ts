import { Vector3 } from "@babylonjs/core";
import { ActionEntity, ActionEntityName } from "../../../action-entities/index.js";
import {
  COMBAT_ACTIONS,
  CombatActionExecutionIntent,
  CombatActionName,
  CombatActionTargetType,
} from "../../../combat/index.js";
import { BoxDimensions, ShapeType3D } from "../../../utils/shape-utils.js";
import { ActionResolutionStepContext, ActionResolutionStepType } from "../index.js";
import { TriggerEnvironmentalHazardsActionResolutionStep } from "./determine-environmental-hazard-triggers.js";
import { COMBATANT_TIME_TO_MOVE_ONE_METER } from "../../../app-consts.js";
import { EntityMotionActionResolutionStep } from "./entity-motion.js";
import { AnimationTimingType } from "../../game-update-commands.js";
import cloneDeep from "lodash.clonedeep";
import { timeToReachBox } from "../../../utils/index.js";

export function getFirewallBurnScheduledActions(
  context: ActionResolutionStepContext,
  step: TriggerEnvironmentalHazardsActionResolutionStep
) {
  // @TODO - change to shimmed user based off firewall action entity properties
  const user = context.combatantContext.combatant;

  const { actionExecutionIntent } = context.tracker;
  const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];

  const motionStepType =
    step.type === ActionResolutionStepType.PreInitialPositioningCheckEnvironmentalHazardTriggers
      ? ActionResolutionStepType.InitialPositioning
      : ActionResolutionStepType.FinalPositioning;

  const addRecoveryAnimationTime = motionStepType === ActionResolutionStepType.FinalPositioning;

  const combatant = context.combatantContext.combatant;
  const entityPosition = combatant.combatantProperties.position;

  const destinationsOption = EntityMotionActionResolutionStep.getDestinations(
    context,
    action,
    motionStepType,
    entityPosition,
    COMBATANT_TIME_TO_MOVE_ONE_METER
  );

  if (!destinationsOption) return [];

  const { translationOption } = destinationsOption;
  if (!translationOption) return [];

  const { party } = context.combatantContext;
  let existingFirewallOption: undefined | ActionEntity;

  // just check for a single firewall for now, maybe add more later
  for (const [entityId, actionEntity] of Object.entries(party.actionEntities)) {
    if (actionEntity.actionEntityProperties.name === ActionEntityName.Firewall) {
      existingFirewallOption = actionEntity;
      break;
    }
  }

  if (existingFirewallOption === undefined) return [];

  const { destination, duration } = translationOption;
  const { position: firewallPosition, dimensions: taggedDimensions } =
    existingFirewallOption.actionEntityProperties;
  if (taggedDimensions === undefined) throw new Error("expected firewall to have dimensions");
  if (taggedDimensions.type !== ShapeType3D.Box)
    throw new Error("expected firewall to be box shaped");

  const userPosition = user.combatantProperties.position;

  const movementVector = destination.subtract(userPosition);
  const distance = movementVector.length();
  const speed = distance / duration;
  let timeToReachFirewallOption = timeToReachBox(
    userPosition,
    destination,
    firewallPosition,
    taggedDimensions.dimensions,
    speed
  );

  if (timeToReachFirewallOption === null) return [];

  const firewallBurnExecutionIntent = new CombatActionExecutionIntent(
    CombatActionName.FirewallBurn,
    { type: CombatActionTargetType.Single, targetId: user.entityProperties.id },
    1
  );

  const recoveryAnimationTime = (() => {
    let toReturn = 0;
    try {
      const animationOption = EntityMotionActionResolutionStep.getAnimation(
        context,
        action.name,
        ActionResolutionStepType.RecoveryMotion
      );

      if (animationOption && animationOption.timing.type === AnimationTimingType.Timed)
        toReturn = animationOption.timing.duration;
    } catch {
      console.info("couldn't get recoveryAnimationTime");
    }
    return toReturn;
  })();

  if (addRecoveryAnimationTime) {
    timeToReachFirewallOption += recoveryAnimationTime;
  }

  firewallBurnExecutionIntent.setDelayForStep(
    // firewall burn's InitialPositioning motion, so that the delay happens before the post initial positioning check if should still execute
    ActionResolutionStepType.InitialPositioning,
    timeToReachFirewallOption
  );

  const firewallUser = cloneDeep(user);

  firewallUser.combatantProperties.asShimmedUserOfTriggeredEnvironmentalHazard = {
    hazardEntity: existingFirewallOption,
  };
  firewallBurnExecutionIntent.level =
    existingFirewallOption.actionEntityProperties.actionOriginData?.actionLevel || 1;

  const firewallBurnActionIntentWithUser = {
    user: firewallUser,
    actionExecutionIntent: firewallBurnExecutionIntent,
  };
  return [firewallBurnActionIntentWithUser];
}
