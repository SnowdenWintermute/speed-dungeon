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
import { ManagedParticleSystem } from "./managed-particle-system.js";
import { CosmeticEffect } from "./cosmetic-effect.js";

export class FrostParticleStream extends CosmeticEffect {
  createAnimatedMeshes(): AbstractMesh[] {
    throw new Error("Method not implemented.");
  }
  createParticleSystems(scene: Scene): ManagedParticleSystem[] {
    const particleSystem = new GPUParticleSystem("particles", { capacity: 30 }, scene);
    particleSystem.particleTexture = new Texture("img/particle-textures/flare.png");

    particleSystem.createPointEmitter(new Vector3(0, 0, 0.9), new Vector3(0, 0, 1));

    const mesh = new Mesh("");
    mesh.rotationQuaternion = Quaternion.FromEulerVector(mesh.rotation);
    particleSystem.emitter = mesh;

    particleSystem.preWarmStepOffset = 2;
    particleSystem.preWarmCycles = 350;

    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.3;

    particleSystem.addColorGradient(0, new Color4(0.7, 0.8, 1.0, 0));
    particleSystem.addColorGradient(0.5, new Color4(0.2, 0.5, 1.0, 0.7));
    particleSystem.addColorGradient(1, new Color4(0, 0, 0, 0.0));

    particleSystem.minEmitPower = 1;
    particleSystem.maxEmitPower = 1;
    particleSystem.emitRate = 15;
    particleSystem.minLifeTime = 0.5;
    particleSystem.maxLifeTime = 1;

    return [new ManagedParticleSystem(particleSystem, mesh, scene)];
  }
}
