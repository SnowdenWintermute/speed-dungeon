import {
  AbstractMesh,
  Color4,
  Mesh,
  ParticleSystem,
  Quaternion,
  Scene,
  Texture,
} from "@babylonjs/core";
import { CosmeticEffect } from "./cosmetic-effect.js";
import { ManagedParticleSystem } from "./managed-particle-system.js";

export class FlameParticleAccumulation extends CosmeticEffect {
  createAnimatedMeshes(): AbstractMesh[] {
    throw new Error("Method not implemented.");
  }
  createParticleSystems(scene: Scene): ManagedParticleSystem[] {
    const particleSystem = new ParticleSystem("particles", 150, scene); // scene is optional and defaults to the current scene
    particleSystem.particleTexture = new Texture("img/particle-textures/flare.png");

    particleSystem.createSphereEmitter(0.2, 0.3);

    const mesh = new Mesh("");
    mesh.rotationQuaternion = Quaternion.FromEulerVector(mesh.rotation);
    particleSystem.emitter = mesh;

    // particleSystem.preWarmStepOffset = 2;
    // particleSystem.preWarmCycles = 300;

    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.2;

    particleSystem.addColorGradient(0, new Color4(1.0, 0.8, 0.7, 0));
    particleSystem.addColorGradient(0.5, new Color4(1.0, 0.5, 0.2, 0.7));
    particleSystem.addColorGradient(1, new Color4(0, 0, 0.2, 0.0));

    particleSystem.minEmitPower = -0.7;
    particleSystem.maxEmitPower = -0.5;
    particleSystem.emitRate = 10;
    particleSystem.minLifeTime = 0.5;
    particleSystem.maxLifeTime = 1;

    return [new ManagedParticleSystem(particleSystem, mesh, scene)];
  }
}
