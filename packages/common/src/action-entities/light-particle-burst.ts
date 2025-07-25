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
import { GRAVITY } from "../app-consts.js";

export class LightParticleBurst extends CosmeticEffect {
  createAnimatedMeshes(): AbstractMesh[] {
    throw new Error("Method not implemented.");
  }
  createParticleSystems(scene: Scene): ManagedParticleSystem[] {
    const particleSystem = new GPUParticleSystem("particles", { capacity: 30 }, scene);
    particleSystem.particleTexture = new Texture("img/particle-textures/flare.png");

    particleSystem.createSphereEmitter(0.5, 1);

    const mesh = new Mesh("");
    mesh.rotationQuaternion = Quaternion.FromEulerVector(mesh.rotation);
    particleSystem.emitter = mesh;

    particleSystem.preWarmStepOffset = 2;
    particleSystem.preWarmCycles = 150;

    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.3;

    particleSystem.addColorGradient(0, new Color4(1, 1, 1.0, 0));
    particleSystem.addColorGradient(0.5, new Color4(0.5, 0.5, 0.5, 0.7));
    particleSystem.addColorGradient(1, new Color4(0, 0, 0.2, 0.0));

    particleSystem.minEmitPower = 0.1;
    particleSystem.maxEmitPower = 0.3;
    particleSystem.emitRate = 5;
    particleSystem.minLifeTime = 0.75;
    particleSystem.maxLifeTime = 1.5;

    particleSystem.gravity = new Vector3(0, (GRAVITY / 10) * -1, 0);

    return [new ManagedParticleSystem(particleSystem, mesh, scene)];
  }
}
