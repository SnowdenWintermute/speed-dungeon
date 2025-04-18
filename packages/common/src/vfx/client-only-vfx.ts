import {
  AbstractMesh,
  Color4,
  Matrix,
  Mesh,
  Particle,
  ParticleSystem,
  Scene,
  Texture,
  TransformNode,
  Vector3,
} from "@babylonjs/core";

export enum ClientOnlyVfxNames {
  FrostParticleAccumulation,
  // FrostParticleBurst,
}

export abstract class ClientOnlyVfx {
  particleSystems: { particleSystem: ParticleSystem; mesh: Mesh }[] = [];
  transformNode = new TransformNode("");
  constructor(public name: ClientOnlyVfxNames) {}
  createParticleSystems?(scene: Scene): { particleSystem: ParticleSystem; mesh: Mesh }[];
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

  cleanup() {
    for (const { particleSystem, mesh } of this.particleSystems) {
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
  createParticleSystems(scene: Scene): { particleSystem: ParticleSystem; mesh: Mesh }[] {
    const particleSystem = new ParticleSystem("particles", 1000, scene);
    particleSystem.particleTexture = new Texture("img/particle-textures/flare.png");

    particleSystem.createSphereEmitter(1, 1);

    const mesh = new Mesh("");
    particleSystem.emitter = mesh;

    particleSystem.startDirectionFunction = (
      worldMatrix: Matrix,
      directionToUpdate: Vector3,
      particle: Particle,
      isLocal: boolean
    ) => {
      const particlePosition: Vector3 = particle.position;
      const direction: Vector3 = mesh.position.subtract(particlePosition).normalize();
      directionToUpdate.copyFrom(direction);
    };

    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.5;
    particleSystem.color1 = new Color4(0.7, 0.8, 1.0, 1.0);
    particleSystem.color2 = new Color4(0.2, 0.5, 1.0, 1.0);
    particleSystem.colorDead = new Color4(0, 0, 0.2, 0.0);
    particleSystem.minEmitPower = 1;
    particleSystem.maxEmitPower = 1;
    particleSystem.emitRate = 20;
    particleSystem.minLifeTime = 0.3;
    particleSystem.maxLifeTime = 0.3;

    particleSystem.start();

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

type ClientOnlyVfxConstructor = new (name: ClientOnlyVfxNames) => ClientOnlyVfx;

export const CLIENT_ONLY_VFX_CONSTRUCTORS: Record<ClientOnlyVfxNames, ClientOnlyVfxConstructor> = {
  [ClientOnlyVfxNames.FrostParticleAccumulation]: FrostParticleAccumulation,
  // [ClientOnlyVfxNames.FrostParticleBurst]: FrostParticleBurst,
};
