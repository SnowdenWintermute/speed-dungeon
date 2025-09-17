import { AbstractMesh, Color4, ParticleSystem, Scene, Texture } from "@babylonjs/core";
import { ManagedParticleSystem } from "./managed-particle-system.js";
import { CosmeticEffect } from "./cosmetic-effect.js";
import { createParticleStream } from "./frost-particle-stream.js";

export class SmokeParticleStream extends CosmeticEffect {
  createAnimatedMeshes(): AbstractMesh[] {
    throw new Error("Method not implemented.");
  }
  createParticleSystems(scene: Scene): ManagedParticleSystem[] {
    const { particleSystem, mesh } = createParticleStream(scene);
    particleSystem.blendMode = ParticleSystem.BLENDMODE_STANDARD;
    particleSystem.particleTexture = new Texture("img/particle-textures/smoke_01.png");
    particleSystem.addColorGradient(0, new Color4(1, 1, 1, 1));
    particleSystem.addColorGradient(0.5, new Color4(0, 0, 0, 0.7));
    particleSystem.addColorGradient(1, new Color4(0, 0, 0, 0.0));

    return [new ManagedParticleSystem(particleSystem, mesh, scene)];
  }
}
