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
import { ClientOnlyVfx } from "./client-only-vfx.js";
import { ManagedParticleSystem } from "./managed-particle-system.js";

export class FrostParticleBurst extends ClientOnlyVfx {
  createAnimatedMeshes(): AbstractMesh[] {
    throw new Error("Method not implemented.");
  }
  createParticleSystems(scene: Scene): ManagedParticleSystem[] {
    const particleSystem = new GPUParticleSystem("particles", { capacity: 300 }, scene);
    particleSystem.particleTexture = new Texture("img/particle-textures/flare.png");

    particleSystem.createSphereEmitter(1.5, 1);

    const mesh = new Mesh("");
    mesh.rotationQuaternion = Quaternion.FromEulerVector(mesh.rotation);
    particleSystem.emitter = mesh;

    particleSystem.preWarmStepOffset = 2;
    particleSystem.preWarmCycles = 350;

    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.3;

    particleSystem.addColorGradient(0, new Color4(0.7, 0.8, 1.0, 0));
    particleSystem.addColorGradient(0.5, new Color4(0.2, 0.5, 1.0, 0.7));
    particleSystem.addColorGradient(1, new Color4(0, 0, 0.2, 0.0));

    particleSystem.minEmitPower = 1;
    particleSystem.maxEmitPower = 2;
    particleSystem.emitRate = 25;
    particleSystem.minLifeTime = 0.5;
    particleSystem.maxLifeTime = 1;

    particleSystem.gravity = new Vector3(0, -9.81, 0);

    return [new ManagedParticleSystem(particleSystem, mesh, scene)];
  }
}
