import { CosmeticEffectNames } from "../../action-entities/cosmetic-effect.js";
import { AbstractParentType } from "../../action-entities/index.js";
import {
  ActionResolutionStepContext,
  ActionResolutionStepType,
  EntityAnimation,
  EntityDestination,
} from "../../action-processing/index.js";
import { CombatantSpecies } from "../../combatants/combatant-species.js";
import { CombatantProperties } from "../../combatants/index.js";
import { Milliseconds } from "../../primatives/index.js";
import { iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import { MeleeAttackAnimationType } from "./action-implementations/attack/determine-melee-attack-animation-type.js";

export interface ActionResolutionStepConfig {
  cosmeticsEffectsToStart?: {
    name: CosmeticEffectNames;
    parentType: AbstractParentType;
    lifetime?: Milliseconds;
  }[];
  cosmeticsEffectsToStop?: CosmeticEffectNames[];
  getAnimation?(
    user: CombatantProperties,
    animationLengths: Record<CombatantSpecies, Record<string, Milliseconds>>,
    meleeAttackAnimationType?: MeleeAttackAnimationType,
    successOption?: boolean
  ): EntityAnimation;
  getEquipmentAnimations?(
    user: CombatantProperties,
    animationLengths: Record<CombatantSpecies, Record<string, Milliseconds>>
  ): EntityAnimation[];
  getDestination?(context: ActionResolutionStepContext): Error | EntityDestination;
  // don't include this step in the initial list, it may be added later such as in the case
  // of return home step for a melee main hand attack that killed its target, thus not needing
  // to do the offhand attack
  isConditionalStep?: boolean;
}

export class ActionResolutionStepsConfig {
  constructor(
    public steps: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>>,
    // some actions may or may not be the last action in a chain, such as main hand
    // attack while wielding an offhand. In this case we can't difinitively say that
    // user will always return home after such an action, but we can say if they
    // should return home if it is the last action in the chain and dynamically
    // add the step
    public options: { userShouldMoveHomeOnComplete?: boolean }
  ) {}
  getStepTypes() {
    const stepTypes = iterateNumericEnumKeyedRecord(this.steps)
      .sort(([aKey, aValue], [bKey, bValue]) => aKey - bKey)
      .filter(([key, value]) => !value.isConditionalStep)
      .map(([key, value]) => key);
    return stepTypes;
  }
}
