import {
  ActionResolutionStepType,
  CombatActionComponent,
  CosmeticEffectNames,
  Milliseconds,
  SceneEntityChildTransformNodeIdentifier,
} from "@speed-dungeon/common";
import { startOrStopCosmeticEffect } from "./start-or-stop-cosmetic-effect";
import { CosmeticEffectManager } from "../../scene-entities/cosmetic-effect-manager";

export function handleStepCosmeticEffects(
  action: CombatActionComponent,
  stepType: ActionResolutionStepType,
  cosmeticEffectManager: CosmeticEffectManager
) {
  let cosmeticEffectNamesToStartThisStep: {
    name: CosmeticEffectNames;
    parent: SceneEntityChildTransformNodeIdentifier;
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
    cosmeticEffectManager
  );
}
