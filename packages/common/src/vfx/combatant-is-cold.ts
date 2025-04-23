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

export class CombatantIsCold extends ClientOnlyVfx {
  createAnimatedMeshes(): AbstractMesh[] {
    throw new Error("Method not implemented.");
  }
  createParticleSystems(scene: Scene): ManagedParticleSystem[] {
    const particleSystem = new GPUParticleSystem("particles", { capacity: 8 }, scene);
    particleSystem.particleTexture = new Texture("img/particle-textures/flare.png");

    particleSystem.createSphereEmitter(0.3, 1);

    const mesh = new Mesh("");

    mesh.rotationQuaternion = Quaternion.FromEulerVector(mesh.rotation);
    particleSystem.emitter = mesh;

    particleSystem.minSize = 0.05;
    particleSystem.maxSize = 0.15;

    particleSystem.addColorGradient(0, new Color4(0.7, 0.8, 1.0, 0));
    particleSystem.addColorGradient(0.5, new Color4(0.2, 0.5, 1.0, 0.7));
    particleSystem.addColorGradient(1, new Color4(0, 0, 0, 0.0));

    particleSystem.minEmitPower = 0.1;
    particleSystem.maxEmitPower = 0.3;
    particleSystem.emitRate = 1;
    particleSystem.minLifeTime = 1;
    particleSystem.maxLifeTime = 3;

    particleSystem.gravity = new Vector3(0, 0.3, 0);

    return [new ManagedParticleSystem(particleSystem, mesh, scene)];
  }
}
