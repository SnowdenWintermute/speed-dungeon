import {
  AbstractParentType,
  ActionResolutionStepType,
  CombatActionComponent,
  CosmeticEffectNames,
  EntityId,
  Milliseconds,
} from "@speed-dungeon/common";
import { startOrStopCosmeticEffect } from "./start-or-stop-cosmetic-effect";
import { CosmeticEffectManager } from "../../scene-entities/cosmetic-effect-manager";

export function handleStepCosmeticEffects(
  action: CombatActionComponent,
  stepType: ActionResolutionStepType,
  cosmeticEffectManager: CosmeticEffectManager,
  entityId: EntityId
) {
  let cosmeticEffectNamesToStartThisStep: {
    name: CosmeticEffectNames;
    parentType: AbstractParentType;
    lifetime?: Milliseconds;
  }[] = [];

  let cosmeticEffectNamesToStopThisStep: CosmeticEffectNames[] = [];

  const stepConfigOption = action.stepsConfig.steps[stepType];
  if (!stepConfigOption) throw new Error("unexpected missing step config");
  if (stepConfigOption.cosmeticsEffectsToStart)
    cosmeticEffectNamesToStartThisStep.push(...stepConfigOption.cosmeticsEffectsToStart);
  if (stepConfigOption.cosmeticsEffectsToStop)
    cosmeticEffectNamesToStopThisStep.push(...stepConfigOption.cosmeticsEffectsToStop);

  startOrStopCosmeticEffect(
    cosmeticEffectNamesToStartThisStep,
    cosmeticEffectNamesToStopThisStep,
    cosmeticEffectManager,
    entityId
  );
}
