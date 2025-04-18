import {
  Color4,
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
  const particleSystem = new ParticleSystem("particles", 1000, scene); // scene is optional and defaults to the current scene
  particleSystem.particleTexture = new Texture("img/particle-textures/flare.png");

  particleSystem.createSphereEmitter(1, 1);

  const emitter = new Mesh("");
  emitter.rotationQuaternion = Quaternion.FromEulerVector(emitter.rotation);
  particleSystem.emitter = emitter;

  particleSystem.startDirectionFunction = (
    worldMatrix: Matrix,
    directionToUpdate: Vector3,
    particle: Particle,
    isLocal: boolean
  ) => {
    const particlePosition: Vector3 = particle.position;
    const direction: Vector3 = emitter.position.subtract(particlePosition).normalize();
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

  return [particleSystem];
}
