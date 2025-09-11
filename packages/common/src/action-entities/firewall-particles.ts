import {
  AbstractMesh,
  BoxParticleEmitter,
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
import { BoxDimensions } from "../utils/shape-utils.js";

const particleSystemCount = 4;
const totalParticlesCapacity = 5000;
const capacity = totalParticlesCapacity / particleSystemCount;

export class FirewallParticles extends CosmeticEffect {
  createAnimatedMeshes(): AbstractMesh[] {
    throw new Error("Method not implemented.");
  }
  createParticleSystems(scene: Scene): ManagedParticleSystem[] {
    const particleSystems: GPUParticleSystem[] = [];
    for (let i = particleSystemCount; i > 0; i -= 1) {
      particleSystems.push(new GPUParticleSystem("firewall particles", { capacity }, scene));
    }

    const managedParticleSystems: ManagedParticleSystem[] = [];

    particleSystems.forEach((particleSystem, i) => {
      // particleSystem.particleTexture = new Texture("img/particle-textures/flare.png");
      particleSystem.particleTexture = new Texture(`img/particle-textures/explosion-${i + 1}.jpg`);

      const dimensions: BoxDimensions = {
        width: 7,
        height: 0.5,
        depth: 0.75,
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

      mesh.position.y = -dimensions.height - 0.2;

      mesh.rotationQuaternion = Quaternion.FromEulerVector(mesh.rotation);
      particleSystem.emitter = mesh;

      // Size and lifetime
      particleSystem.minSize = 0.05;
      particleSystem.maxSize = 0.2;
      particleSystem.minLifeTime = 0.5;
      particleSystem.maxLifeTime = 1.5;

      // Coloring (warm firewall colors)
      particleSystem.addColorGradient(0, new Color4(1.0, 0.4, 0.0, 0.6)); // orange
      particleSystem.addColorGradient(0.5, new Color4(1.0, 0.1, 0.0, 0.4)); // red
      particleSystem.addColorGradient(1, new Color4(0, 0, 0, 0)); // fade to transparent

      // Emit power and rate
      particleSystem.minEmitPower = 0.5;
      particleSystem.maxEmitPower = 1.5;
      particleSystem.emitRate = 600;

      // Let flames rise (slight upward pull)
      particleSystem.gravity = new Vector3(0, 0.5, 0);

      managedParticleSystems.push(new ManagedParticleSystem(particleSystem, mesh, scene));
    });

    return managedParticleSystems;
  }
}
