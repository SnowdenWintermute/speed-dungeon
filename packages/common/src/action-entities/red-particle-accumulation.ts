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

export class RedParticleAccumulation extends CosmeticEffect {
  createAnimatedMeshes(): AbstractMesh[] {
    throw new Error("Method not implemented.");
  }
  createParticleSystems(scene: Scene): ManagedParticleSystem[] {
    const particleSystem = new ParticleSystem("particles", 150, scene);
    particleSystem.particleTexture = new Texture("img/particle-textures/flare.png", scene);

    particleSystem.createSphereEmitter(0.2, 0.3);

    const mesh = new Mesh("", this.scene);
    mesh.rotationQuaternion = Quaternion.FromEulerVector(mesh.rotation);
    particleSystem.emitter = mesh;

    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.2;

    particleSystem.addColorGradient(0, new Color4(0.7, 0.15, 0.15, 0));
    particleSystem.addColorGradient(0.5, new Color4(0.8, 0.3, 0.2, 0.7));
    particleSystem.addColorGradient(1, new Color4(0.1, 0.0, 0.0, 0.0));

    particleSystem.minEmitPower = -0.3;
    particleSystem.maxEmitPower = -0.1;
    particleSystem.emitRate = 5;
    particleSystem.minLifeTime = 0.8;
    particleSystem.maxLifeTime = 1.4;

    return [new ManagedParticleSystem(particleSystem, mesh, scene)];
  }
}
