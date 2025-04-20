import {
  AbstractMesh,
  Color4,
  GPUParticleSystem,
  Mesh,
  Nullable,
  ParticleSystem,
  Quaternion,
  Scene,
  Texture,
  TransformNode,
  Vector3,
} from "@babylonjs/core";

export enum ClientOnlyVfxNames {
  FrostParticleAccumulation,
  FrostParticleStream,
  // FrostParticleBurst,
}

export abstract class ClientOnlyVfx {
  particleSystems: { particleSystem: GPUParticleSystem | ParticleSystem; mesh: Mesh }[] = [];
  softCleanupLoopTimeout: null | NodeJS.Timeout = null;
  public transformNode = new TransformNode("");
  constructor(public scene: Scene) {
    this.initialize(scene);
  }
  createParticleSystems?(
    scene: Scene
  ): { particleSystem: GPUParticleSystem | ParticleSystem; mesh: Mesh }[];
  createAnimatedMeshes?(scene: Scene): AbstractMesh[];
  initialize(scene: Scene) {
    if (this.createParticleSystems) {
      this.particleSystems = this.createParticleSystems(scene);
      for (const { particleSystem, mesh } of this.particleSystems) {
        particleSystem.start();

        mesh.setParent(this.transformNode);
      }
    }
  }

  softCleanup() {
    for (const { particleSystem, mesh } of this.particleSystems) {
      particleSystem.stop();
      particleSystem.emitRate = 0;

      const remainingParticles = particleSystem.getActiveCount();

      console.log("remainingParticles", remainingParticles);

      this.softCleanupLoopTimeout = setTimeout(() => {
        this.cleanup();
      }, particleSystem.maxLifeTime * 1000);
      // if (remainingParticles > 0) {
      //   this.softCleanupLoopTimeout = setTimeout(() => {
      //     this.softCleanup();
      //   }, 100);
      //   return;
      // }
    }
  }

  cleanup() {
    console.log("cleaning up ClientOnlyVfx");
    for (const { particleSystem, mesh } of this.particleSystems) {
      particleSystem.emitRate = 0;
      particleSystem.manualEmitCount = 0;

      particleSystem.stop();
      mesh.dispose();
      particleSystem.dispose();
      this.transformNode.dispose();
    }
  }
}

export class FrostParticleAccumulation extends ClientOnlyVfx {
  createAnimatedMeshes(): AbstractMesh[] {
    throw new Error("Method not implemented.");
  }
  createParticleSystems(scene: Scene): { particleSystem: GPUParticleSystem; mesh: Mesh }[] {
    const particleSystem = new GPUParticleSystem("particles", { capacity: 15 }, scene); // scene is optional and defaults to the current scene
    particleSystem.particleTexture = new Texture("img/particle-textures/flare.png");

    particleSystem.createSphereEmitter(0.4, 0.3);

    const mesh = new Mesh("");
    mesh.rotationQuaternion = Quaternion.FromEulerVector(mesh.rotation);
    particleSystem.emitter = mesh;

    particleSystem.preWarmStepOffset = 2;
    particleSystem.preWarmCycles = 300;

    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.2;

    particleSystem.addColorGradient(0, new Color4(0.7, 0.8, 1.0, 0));
    particleSystem.addColorGradient(0.5, new Color4(0.2, 0.5, 1.0, 0.7));
    particleSystem.addColorGradient(1, new Color4(0, 0, 0.2, 0.0));

    particleSystem.minEmitPower = -0.7;
    particleSystem.maxEmitPower = -0.5;
    particleSystem.emitRate = 100;
    particleSystem.minLifeTime = 0.5;
    particleSystem.maxLifeTime = 1;

    return [{ particleSystem, mesh }];
  }
}

export class FrostParticleStream extends ClientOnlyVfx {
  createAnimatedMeshes(): AbstractMesh[] {
    throw new Error("Method not implemented.");
  }
  createParticleSystems(scene: Scene): { particleSystem: GPUParticleSystem; mesh: Mesh }[] {
    const particleSystem = new GPUParticleSystem("particles", { capacity: 30 }, scene); // scene is optional and defaults to the current scene
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
    particleSystem.addColorGradient(1, new Color4(0, 0, 0.2, 0.0));

    particleSystem.minEmitPower = 1;
    particleSystem.maxEmitPower = 1;
    particleSystem.emitRate = 15;
    particleSystem.minLifeTime = 0.5;
    particleSystem.maxLifeTime = 1;

    return [{ particleSystem, mesh }];
  }
}

// export class FrostParticleBurst extends ClientOnlyVfx {
//   createAnimatedMeshs(): AbstractMesh[] {
//     throw new Error("Method not implemented.");
//   }
//   createParticleSystems(): ParticleSystem[] {
//     throw new Error("Method not implemented.");
//   }
// }

type ClientOnlyVfxConstructor = new (scene: Scene) => ClientOnlyVfx;

export const CLIENT_ONLY_VFX_CONSTRUCTORS: Record<ClientOnlyVfxNames, ClientOnlyVfxConstructor> = {
  [ClientOnlyVfxNames.FrostParticleAccumulation]: FrostParticleAccumulation,
  [ClientOnlyVfxNames.FrostParticleStream]: FrostParticleStream,
};
