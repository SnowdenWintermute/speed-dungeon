import {
  AbstractMesh,
  Color4,
  GPUParticleSystem,
  Mesh,
  Quaternion,
  Scene,
  Texture,
  Vector3,
} from "@babylonjs/core";
import { CosmeticEffect } from "./cosmetic-effect.js";
import { ManagedParticleSystem } from "./managed-particle-system.js";

export class HeartParticlesLarge extends CosmeticEffect {
  createAnimatedMeshes(): AbstractMesh[] {
    throw new Error("Method not implemented.");
  }
  createParticleSystems(scene: Scene): ManagedParticleSystem[] {
    const particleSystems = [
      new GPUParticleSystem("particles", { capacity: 1 }, scene),
      new GPUParticleSystem("particles", { capacity: 1 }, scene),
      new GPUParticleSystem("particles", { capacity: 1 }, scene),
      new GPUParticleSystem("particles", { capacity: 1 }, scene),
    ];

    const managedParticleSystems: ManagedParticleSystem[] = [];

    particleSystems.forEach((particleSystem, i) => {
      particleSystem.blendMode = GPUParticleSystem.BLENDMODE_STANDARD;
      particleSystem.particleTexture = new Texture(`img/particle-textures/heart-white.png`, scene);
      particleSystem.minSize = 0.3;
      particleSystem.maxSize = 0.4;

      const mesh = new Mesh("", this.scene);

      particleSystem.addColorGradient(0, new Color4(0.66, 0.33, 0.33, 1));
      particleSystem.addColorGradient(0.5, new Color4(0.66, 0.33, 0.33, 0.7));
      particleSystem.addColorGradient(1, new Color4(0.66, 0.33, 0.33, 0));

      // particleSystem.addColorGradient(0, new Color4(0, 0, 0, 1)); // black, opaque
      // particleSystem.addColorGradient(0.5, new Color4(0, 0, 0, 0.7)); // black, semi-opaque
      // particleSystem.addColorGradient(1, new Color4(0, 0, 0, 0)); // fade out

      mesh.rotationQuaternion = Quaternion.FromEulerVector(mesh.rotation);
      particleSystem.emitter = mesh;

      particleSystem.preWarmCycles = 1000;

      particleSystem.minEmitPower = 0.03;
      particleSystem.maxEmitPower = 0.09;
      particleSystem.emitRate = 0.35;
      particleSystem.minLifeTime = 0.6;
      particleSystem.maxLifeTime = 1;

      particleSystem.gravity = new Vector3(0, 0.5, 0);

      const managed = new ManagedParticleSystem(particleSystem, mesh, scene);

      managedParticleSystems.push(managed);
    });

    return managedParticleSystems;
  }
}
