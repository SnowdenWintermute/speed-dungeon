import { GPUParticleSystem, Scene, Texture, Vector3 } from "@babylonjs/core";

export function testParticleSystem(scene: Scene) {
  const particleSystems = [
    new GPUParticleSystem("particles", { capacity: 3 }, scene),
    new GPUParticleSystem("particles", { capacity: 3 }, scene),
    new GPUParticleSystem("particles", { capacity: 3 }, scene),
    new GPUParticleSystem("particles", { capacity: 3 }, scene),
  ];
  particleSystems.forEach((particleSystem, i) => {
    particleSystem.particleTexture = new Texture(`img/particle-textures/explosion-${i + 1}.jpg`);
    particleSystem.minSize = 0.5;
    particleSystem.maxSize = 0.6;

    particleSystem.createBoxEmitter(
      Vector3.Up(),
      new Vector3(0, 0.8, 0),
      new Vector3(0, 0, 0),
      new Vector3(0, 0, 0)
    );

    particleSystem.preWarmCycles = 50;

    particleSystem.minEmitPower = 0.03;
    particleSystem.maxEmitPower = 0.09;
    particleSystem.emitRate = 0.5;
    particleSystem.minLifeTime = 0.6;
    particleSystem.maxLifeTime = 1;

    particleSystem.gravity = new Vector3(0, 0.3, 0);
  });

  // particleSystem.addColorGradient(0, new Color4(0.7, 0.8, 1.0, 0));
  // particleSystem.addColorGradient(0.5, new Color4(0.2, 0.5, 1.0, 0.7));
  // particleSystem.addColorGradient(1, new Color4(0, 0, 0, 0.0));

  return particleSystems;
}
