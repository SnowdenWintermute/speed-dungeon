import { ActionEntityName } from "../../../action-entities/index.js";
import {
  COMBAT_ACTIONS,
  CombatActionExecutionIntent,
  CombatActionName,
  CombatActionTargetType,
} from "../../../combat/index.js";
import { ShapeType3D } from "../../../utils/shape-utils.js";
import {
  ActionIntentAndUser,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "../index.js";
import { TriggerEnvironmentalHazardsActionResolutionStep } from "./determine-environmental-hazard-triggers.js";
import { COMBATANT_TIME_TO_MOVE_ONE_METER } from "../../../app-consts.js";
import { EntityMotionActionResolutionStep } from "./entity-motion.js";
import { AnimationTimingType } from "../../game-update-commands.js";
import { timeToReachBox } from "../../../utils/index.js";
import { AdventuringParty } from "../../../adventuring-party/index.js";

export function getFirewallBurnScheduledActions(
  context: ActionResolutionStepContext,
  step: TriggerEnvironmentalHazardsActionResolutionStep
): ActionIntentAndUser[] {
  const { actionUser } = context.actionUserContext;

  const { actionExecutionIntent } = context.tracker;
  const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];

  const motionStepType =
    step.type === ActionResolutionStepType.PreInitialPositioningCheckEnvironmentalHazardTriggers
      ? ActionResolutionStepType.InitialPositioning
      : ActionResolutionStepType.FinalPositioning;

  const addRecoveryAnimationTime = motionStepType === ActionResolutionStepType.FinalPositioning;

  const entityPosition = actionUser.getPosition();

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

  const { party } = context.actionUserContext;

  const existingFirewallOption = AdventuringParty.getExistingActionEntityOfType(
    party,
    ActionEntityName.Firewall
  );

  if (existingFirewallOption === null) return [];

  const { destination, duration } = translationOption;
  const { position: firewallPosition, dimensions: taggedDimensions } =
    existingFirewallOption.actionEntityProperties;
  if (taggedDimensions === undefined) throw new Error("expected firewall to have dimensions");
  if (taggedDimensions.type !== ShapeType3D.Box)
    throw new Error("expected firewall to be box shaped");

  const movementVector = destination.subtract(entityPosition);
  const distance = movementVector.length();
  const speed = distance / duration;
  let timeToReachFirewallOption = timeToReachBox(
    entityPosition,
    destination,
    firewallPosition,
    taggedDimensions.dimensions,
    speed
  );

  if (timeToReachFirewallOption === null) return [];

  const firewallBurnExecutionIntent = new CombatActionExecutionIntent(
    CombatActionName.FirewallBurn,
    1,
    { type: CombatActionTargetType.Single, targetId: actionUser.getEntityId() }
  );

  if (addRecoveryAnimationTime) {
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

    timeToReachFirewallOption += recoveryAnimationTime;
  }

  firewallBurnExecutionIntent.setDelayForStep(
    // firewall burn's InitialPositioning motion, so that the delay happens before the post initial positioning check if should still execute
    ActionResolutionStepType.InitialPositioning,
    timeToReachFirewallOption
  );

  firewallBurnExecutionIntent.rank = existingFirewallOption.getLevel();

  const firewallBurnActionIntentWithUser = {
    user: existingFirewallOption,
    actionExecutionIntent: firewallBurnExecutionIntent,
  };

  return [firewallBurnActionIntentWithUser];
}
