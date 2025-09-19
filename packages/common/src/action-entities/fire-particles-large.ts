import {
  AbstractMesh,
  GPUParticleSystem,
  Mesh,
  Quaternion,
  Scene,
  Texture,
  Vector3,
} from "@babylonjs/core";
import { CosmeticEffect } from "./cosmetic-effect.js";
import { ManagedParticleSystem } from "./managed-particle-system.js";

export class FireParticlesLarge extends CosmeticEffect {
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
      particleSystem.particleTexture = new Texture(`img/particle-textures/explosion-${i + 1}.jpg`);
      particleSystem.minSize = 0.5;
      particleSystem.maxSize = 0.6;

      const mesh = new Mesh("");

      mesh.rotationQuaternion = Quaternion.FromEulerVector(mesh.rotation);
      particleSystem.emitter = mesh;

      particleSystem.preWarmCycles = 1000;

      particleSystem.minEmitPower = 0.03;
      particleSystem.maxEmitPower = 0.09;
      particleSystem.emitRate = 0.5;
      particleSystem.minLifeTime = 0.6;
      particleSystem.maxLifeTime = 1;

      particleSystem.gravity = new Vector3(0, 0.3, 0);

      const managed = new ManagedParticleSystem(particleSystem, mesh, scene);
      managedParticleSystems.push(managed);
    });

    return managedParticleSystems;
  }
}
