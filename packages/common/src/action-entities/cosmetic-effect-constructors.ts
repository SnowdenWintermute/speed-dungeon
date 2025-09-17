import { FrostParticleStream } from "./frost-particle-stream.js";
import { FrostParticleAccumulation } from "./frost-particle-accumulation.js";
import { Scene } from "@babylonjs/core";
import { CosmeticEffect, CosmeticEffectNames } from "./cosmetic-effect.js";
import { FrostParticleBurst } from "./frost-particle-burst.js";
import { CombatantIsCold } from "./combatant-is-cold-cosmetic-effect.js";
import { FlameParticleAccumulation } from "./flame-particle-accumulation.js";
import { FireParticlesLarge } from "./fire-particles-large.js";
import { FireParticlesSmall } from "./fire-particles-small.js";
import { BurningCosmeticEffect } from "./burning-cosmetic-effect.js";
import { LightParticleBurst } from "./light-particle-burst.js";
import { LightParticleAccumulation } from "./light-particle-accumulation.js";
import { DarkParticleAccumulation } from "./dark-particle-accumulation.js";
import { BlindnessParticlesLarge } from "./blindness-particles-large.js";
import { FirewallParticles } from "./firewall-particles.js";
import { SmokeParticleStream } from "./smoke-particle-stream.js";

type CosmeticEffectConstructor = new (scene: Scene, rank: number) => CosmeticEffect;

export const COSMETIC_EFFECT_CONSTRUCTORS: Record<CosmeticEffectNames, CosmeticEffectConstructor> =
  {
    [CosmeticEffectNames.FrostParticleAccumulation]: FrostParticleAccumulation,
    [CosmeticEffectNames.FrostParticleStream]: FrostParticleStream,
    [CosmeticEffectNames.FrostParticleBurst]: FrostParticleBurst,
    [CosmeticEffectNames.CombatantIsCold]: CombatantIsCold,
    [CosmeticEffectNames.FlameParticleAccumulation]: FlameParticleAccumulation,
    [CosmeticEffectNames.FireParticlesLarge]: FireParticlesLarge,
    [CosmeticEffectNames.FireParticlesSmall]: FireParticlesSmall,
    [CosmeticEffectNames.Burning]: BurningCosmeticEffect,
    [CosmeticEffectNames.LightParticleAccumulation]: LightParticleAccumulation,
    [CosmeticEffectNames.LightParticleBurst]: LightParticleBurst,
    [CosmeticEffectNames.DarkParticleAccumulation]: DarkParticleAccumulation,
    [CosmeticEffectNames.BlindnessCast]: BlindnessParticlesLarge,
    [CosmeticEffectNames.FirewallParticles]: FirewallParticles,
    [CosmeticEffectNames.SmokeParticleStream]: SmokeParticleStream,
  };
