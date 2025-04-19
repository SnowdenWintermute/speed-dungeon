import {
  Color4,
  GPUParticleSystem,
  Matrix,
  Mesh,
  Particle,
  ParticleSystem,
  Quaternion,
  Scene,
  Texture,
  Vector3,
} from "@babylonjs/core";

export function testParticleSystem(scene: Scene) {
  const particleSystem = new GPUParticleSystem("particles", { capacity: 30 }, scene); // scene is optional and defaults to the current scene
  particleSystem.particleTexture = new Texture("img/particle-textures/flare.png");

  particleSystem.createSphereEmitter(1, 0.3);

  const emitter = new Mesh("");
  emitter.rotationQuaternion = Quaternion.FromEulerVector(emitter.rotation);
  particleSystem.emitter = emitter;

  particleSystem.minSize = 0.1;
  particleSystem.maxSize = 0.5;

  particleSystem.addColorGradient(0, new Color4(0.7, 0.8, 1.0, 0));
  particleSystem.addColorGradient(0.5, new Color4(0.2, 0.5, 1.0, 0.7));
  particleSystem.addColorGradient(1, new Color4(0, 0, 0.2, 0.0));

  particleSystem.minEmitPower = -0.8;
  particleSystem.maxEmitPower = -0.6;
  particleSystem.emitRate = 5;
  particleSystem.minLifeTime = 1;
  particleSystem.maxLifeTime = 1;

  particleSystem.start();

  return [particleSystem];
}
