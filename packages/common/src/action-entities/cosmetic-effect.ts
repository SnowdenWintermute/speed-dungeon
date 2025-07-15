import { AbstractMesh, Scene, TransformNode } from "@babylonjs/core";
import { ManagedParticleSystem } from "./managed-particle-system.js";

export enum CosmeticEffectNames {
  FrostParticleAccumulation,
  FrostParticleStream,
  FrostParticleBurst,
  CombatantIsCold,
  FlameParticleAccumulation,
  FireParticlesLarge,
  FireParticlesSmall,
}

export abstract class CosmeticEffect {
  public lifetimeTimeout: null | NodeJS.Timeout = null;
  particleSystems: ManagedParticleSystem[] = [];
  public transformNode = new TransformNode("");
  constructor(public scene: Scene) {
    this.initialize(scene);
  }
  createParticleSystems?(scene: Scene): ManagedParticleSystem[];
  createAnimatedMeshes?(scene: Scene): AbstractMesh[];
  initialize(scene: Scene) {
    if (this.createParticleSystems) {
      this.particleSystems = this.createParticleSystems(scene);
      for (const { particleSystem, mesh } of this.particleSystems) {
        particleSystem.start();

        mesh.setParent(this.transformNode);
      }
    }
  }

  softCleanup() {
    if (this.lifetimeTimeout !== null) clearTimeout(this.lifetimeTimeout);
    for (const particleSystem of this.particleSystems) {
      particleSystem.softCleanup();
    }
  }

  cleanup() {
    for (const particleSystem of this.particleSystems) {
      particleSystem.cleanup();
    }
  }
}
