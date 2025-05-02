import { FrostParticleStream } from "./frost-particle-stream.js";
import { FrostParticleAccumulation } from "./frost-particle-accumulation.js";
import { Scene } from "@babylonjs/core";
import { CosmeticEffect, CosmeticEffectNames } from "./cosmetic-effect.js";
import { FrostParticleBurst } from "./frost-particle-burst.js";
import { CombatantIsCold } from "./combatant-is-cold.js";

type CosmeticEffectConstructor = new (scene: Scene) => CosmeticEffect;

export const COSMETIC_EFFECT_CONSTRUCTORS: Record<CosmeticEffectNames, CosmeticEffectConstructor> =
  {
    [CosmeticEffectNames.FrostParticleAccumulation]: FrostParticleAccumulation,
    [CosmeticEffectNames.FrostParticleStream]: FrostParticleStream,
    [CosmeticEffectNames.FrostParticleBurst]: FrostParticleBurst,
    [CosmeticEffectNames.CombatantIsCold]: CombatantIsCold,
  };
