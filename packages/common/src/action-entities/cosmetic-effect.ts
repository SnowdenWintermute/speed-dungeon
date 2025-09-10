import { AbstractMesh, Scene, TransformNode } from "@babylonjs/core";
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
}

export abstract class CosmeticEffect {
  public lifetimeTimeouts: null | NodeJS.Timeout[] = null;
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

  addLifetimeTimeout(timeout: NodeJS.Timeout) {
    if (this.lifetimeTimeouts === null) this.lifetimeTimeouts = [];
    this.lifetimeTimeouts.push(timeout);
  }

  softCleanup() {
    if (this.lifetimeTimeouts !== null) {
      for (const timeout of this.lifetimeTimeouts) clearTimeout(timeout);
    }
    for (const particleSystem of this.particleSystems) {
      particleSystem.softCleanup(() => {
        this.cleanup();
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
