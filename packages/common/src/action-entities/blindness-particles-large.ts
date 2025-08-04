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

export class BlindnessParticlesLarge extends CosmeticEffect {
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
      particleSystem.particleTexture = new Texture(`img/particle-textures/eye-strikethrough.png`);
      particleSystem.minSize = 0.3;
      particleSystem.maxSize = 0.4;

      const mesh = new Mesh("");

      particleSystem.addColorGradient(0, new Color4(0.1, 0.1, 1, 0));
      particleSystem.addColorGradient(0.5, new Color4(0.2, 0.1, 0.2, 0.7));
      particleSystem.addColorGradient(1, new Color4(0.1, 0, 0.1, 0.0));

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
