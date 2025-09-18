import { AbstractMesh, Scene, StandardMaterial, TransformNode } from "@babylonjs/core";
import { ManagedParticleSystem } from "./managed-particle-system.js";

export enum CosmeticEffectNames {
  FrostParticleAccumulation,
  FrostParticleStream,
  FrostParticleBurst,
  CombatantIsCold,
  Burning,
  FlameParticleAccumulation,
  FireParticlesLarge,
  FireParticlesSmall,
  LightParticleAccumulation,
  LightParticleBurst,
  DarkParticleAccumulation,
  BlindnessCast,
  FirewallParticles,
  SmokeParticleStream,
  SmokePuff,
}

export abstract class CosmeticEffect {
  public lifetimeTimeouts: null | NodeJS.Timeout[] = null;
  particleSystems: ManagedParticleSystem[] = [];
  public transformNode = new TransformNode("");
  constructor(
    public scene: Scene,
    public rank: number
  ) {
    this.initialize(scene);
  }
  createParticleSystems?(scene: Scene): ManagedParticleSystem[];
  createAnimatedMeshes?(scene: Scene): AbstractMesh[];
  setsMaterial?(scene: Scene): StandardMaterial;
  initialize(scene: Scene) {
    if (this.createParticleSystems) {
      this.particleSystems = this.createParticleSystems(scene);
      for (const { particleSystem, mesh } of this.particleSystems) {
        particleSystem.start();

        mesh.setParent(this.transformNode);
      }
    }
  }

  addLifetimeTimeout(timeout: NodeJS.Timeout) {
    if (this.lifetimeTimeouts === null) this.lifetimeTimeouts = [];
    this.lifetimeTimeouts.push(timeout);
  }

  softCleanup(onComplete: () => void) {
    if (this.lifetimeTimeouts !== null) {
      for (const timeout of this.lifetimeTimeouts) clearTimeout(timeout);
    }
    let particleSystemsCleaningUpCount = this.particleSystems.length;
    for (const particleSystem of this.particleSystems) {
      particleSystem.softCleanup(() => {
        this.cleanup();
        particleSystemsCleaningUpCount -= 1;
        if (particleSystemsCleaningUpCount === 0) onComplete();
      });
    }
  }

  cleanup() {
    for (const particleSystem of this.particleSystems) {
      particleSystem.cleanup(() => {
        this.transformNode.dispose();
      });
    }
  }
}
