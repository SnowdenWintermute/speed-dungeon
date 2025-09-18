import {
  AbstractMesh,
  GPUParticleSystem,
  Mesh,
  ParticleSystem,
  Quaternion,
  Scene,
  Texture,
  Vector3,
} from "@babylonjs/core";
import { CosmeticEffect } from "./cosmetic-effect.js";
import { ManagedParticleSystem } from "./managed-particle-system.js";

export class SmokePuff extends CosmeticEffect {
  createAnimatedMeshes(): AbstractMesh[] {
    throw new Error("Method not implemented.");
  }
  createParticleSystems(scene: Scene): ManagedParticleSystem[] {
    const particleSystems = [
      new GPUParticleSystem("particles", { capacity: 3 }, scene),
      new GPUParticleSystem("particles", { capacity: 3 }, scene),
      new GPUParticleSystem("particles", { capacity: 3 }, scene),
      new GPUParticleSystem("particles", { capacity: 3 }, scene),
    ];

    const managedParticleSystems: ManagedParticleSystem[] = [];

    particleSystems.forEach((particleSystem, i) => {
      particleSystem.blendMode = ParticleSystem.BLENDMODE_STANDARD;
      particleSystem.particleTexture = new Texture(`img/particle-textures/smoke-${i + 1}.png`);

      particleSystem.createConeEmitter(0.1, 0.3);

      const mesh = new Mesh("");

      mesh.rotationQuaternion = Quaternion.FromEulerVector(Vector3.Up());

      particleSystem.emitter = mesh;

      particleSystem.preWarmStepOffset = 2;
      particleSystem.preWarmCycles = 350;

      particleSystem.minSize = 0.1;
      particleSystem.maxSize = 0.3;

      particleSystem.minEmitPower = 0.5;
      particleSystem.maxEmitPower = 1;
      particleSystem.emitRate = 15;
      particleSystem.minLifeTime = 0.2;
      particleSystem.maxLifeTime = 0.5;

      particleSystem.gravity = new Vector3(0, 0.25, 0);

      const managed = new ManagedParticleSystem(particleSystem, mesh, scene);

      managedParticleSystems.push(managed);
    });

    return managedParticleSystems;
  }
}
