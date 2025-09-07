import { Vector3 } from "@babylonjs/core";
import { ActionEntityName } from "../../../action-entities/index.js";
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
  let existingFirewallOption;

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
      console.log("couldn't get recoveryAnimationTime");
    }
    return toReturn;
  })();

  if (addRecoveryAnimationTime) {
    console.log("ADDED TIME:", recoveryAnimationTime);
    timeToReachFirewallOption += recoveryAnimationTime;
  }

  firewallBurnExecutionIntent.setDelayForStep(
    ActionResolutionStepType.DeliveryMotion, // firewall burn's delivery motion, an arbitrary place to delay before hit outcomes
    timeToReachFirewallOption
  );

  const firewallBurnActionIntentWithUser = {
    user,
    actionExecutionIntent: firewallBurnExecutionIntent,
  };
  return [firewallBurnActionIntentWithUser];
}

const EPSILON = 1e-8; // tiny value to prevent division by zero in ray-AABB calculations

export function timeToReachBox(
  userPosition: Vector3,
  destination: Vector3,
  boxCenter: Vector3,
  boxDimensions: BoxDimensions,
  movementSpeed: number // units per ms
): number | null {
  // Compute min/max of AABB
  const half = (value: number) => value / 2;
  const min = boxCenter.subtract(
    new Vector3(half(boxDimensions.width), half(boxDimensions.height), half(boxDimensions.depth))
  );
  const max = boxCenter.add(
    new Vector3(half(boxDimensions.width), half(boxDimensions.height), half(boxDimensions.depth))
  );

  const dir = destination.subtract(userPosition);
  const dirFrac = new Vector3(
    1 / (dir.x || EPSILON),
    1 / (dir.y || EPSILON),
    1 / (dir.z || EPSILON)
  );

  // Using "slab method" for line-segment vs AABB intersection
  const t1 = (min.x - userPosition.x) * dirFrac.x;
  const t2 = (max.x - userPosition.x) * dirFrac.x;
  const t3 = (min.y - userPosition.y) * dirFrac.y;
  const t4 = (max.y - userPosition.y) * dirFrac.y;
  const t5 = (min.z - userPosition.z) * dirFrac.z;
  const t6 = (max.z - userPosition.z) * dirFrac.z;

  const tMin = Math.max(Math.min(t1, t2), Math.min(t3, t4), Math.min(t5, t6));
  const tMax = Math.min(Math.max(t1, t2), Math.max(t3, t4), Math.max(t5, t6));

  // No intersection if tMax < 0 (behind start) or tMin > tMax (misses)
  if (tMax < 0 || tMin > tMax || tMin > 1 || tMin < 0) return null;

  const distanceToFirewall = dir.length() * tMin;
  const timeToFirewall = distanceToFirewall / movementSpeed;

  return timeToFirewall;
}
