import {
  AbstractMesh,
  BoxParticleEmitter,
  Color3,
  Color4,
  GPUParticleSystem,
  Material,
  Mesh,
  MeshBuilder,
  Quaternion,
  Scene,
  StandardMaterial,
  Texture,
  Vector3,
} from "@babylonjs/core";
import { ManagedParticleSystem } from "./managed-particle-system.js";
import { CosmeticEffect } from "./cosmetic-effect.js";
import { BoxDimensions } from "../utils/shape-utils.js";

const particleSystemCount = 4;
const maxRank = 3;

export class FirewallParticles extends CosmeticEffect {
  createAnimatedMeshes(): AbstractMesh[] {
    throw new Error("Method not implemented.");
  }
  createParticleSystems(scene: Scene): ManagedParticleSystem[] {
    const percentOfMaxRank = this.rank / maxRank;

    const totalParticlesCapacity = Math.max(percentOfMaxRank, 0.66) * 5000;
    const capacity = (totalParticlesCapacity / particleSystemCount) * percentOfMaxRank;

    const particleSystems: GPUParticleSystem[] = [];
    for (let i = particleSystemCount; i > 0; i -= 1) {
      particleSystems.push(new GPUParticleSystem("firewall particles", { capacity }, scene));
    }

    const managedParticleSystems: ManagedParticleSystem[] = [];

    particleSystems.forEach((particleSystem, i) => {
      // particleSystem.particleTexture = new Texture("img/particle-textures/flare.png");
      particleSystem.particleTexture = new Texture(`img/particle-textures/explosion-${i + 1}.jpg`);

      const maxDepth = 0.75;
      const depth = percentOfMaxRank * maxDepth;

      const maxHeight = 0.5;
      const height = percentOfMaxRank * maxHeight;

      const dimensions: BoxDimensions = {
        width: 7,
        height,
        depth,
      };

      // Box emitter: particles spawn within a box and move upward
      const boxEmitter = new BoxParticleEmitter();
      // Particles spawn inside this box
      boxEmitter.minEmitBox = new Vector3(
        -dimensions.width / 2,
        -dimensions.height / 2,
        -dimensions.depth / 2
      );
      boxEmitter.maxEmitBox = new Vector3(
        dimensions.width / 2,
        dimensions.height / 2,
        dimensions.depth / 2
      );

      // Push them mostly upward with a little flicker
      boxEmitter.direction1 = new Vector3(-0.2, 1, -0.2);
      boxEmitter.direction2 = new Vector3(0.2, 1, 0.2);
      particleSystem.particleEmitterType = boxEmitter;

      // Emitter mesh (placeholder for positioning)
      const mesh = new Mesh("");
      // const mesh = MeshBuilder.CreateBox("", dimensions);

      // const debugMaterial = new StandardMaterial("");
      // debugMaterial.diffuseColor = new Color3(1, 1, 1);
      // debugMaterial.alpha = 0.5;
      // mesh.material = debugMaterial;

      mesh.position.y = height / 2;

      mesh.rotationQuaternion = Quaternion.FromEulerVector(mesh.rotation);
      particleSystem.emitter = mesh;

      // Size and lifetime
      particleSystem.minSize = 0.05 * Math.max(percentOfMaxRank, 0.66);
      particleSystem.maxSize = 0.2 * Math.max(percentOfMaxRank, 0.66);

      const maxRankMinLifetime = 0.5;
      const maxRankMaxLifetime = 1.5;

      particleSystem.minLifeTime = percentOfMaxRank * maxRankMinLifetime;
      particleSystem.maxLifeTime = percentOfMaxRank * maxRankMaxLifetime;

      // Coloring (warm firewall colors)
      particleSystem.addColorGradient(0, new Color4(1.0, 0.4, 0.0, 0.6)); // orange
      particleSystem.addColorGradient(0.5, new Color4(1.0, 0.1, 0.0, 0.4)); // red
      particleSystem.addColorGradient(1, new Color4(0, 0, 0, 0)); // fade to transparent

      // Emit power and rate
      particleSystem.minEmitPower = 0.5;
      particleSystem.maxEmitPower = 1.5;
      particleSystem.emitRate = Math.max(percentOfMaxRank, 0.66) * 600;

      // Let flames rise (slight upward pull)
      particleSystem.gravity = new Vector3(0, 0.5, 0);

      managedParticleSystems.push(new ManagedParticleSystem(particleSystem, mesh, scene));
    });

    return managedParticleSystems;
  }
}
