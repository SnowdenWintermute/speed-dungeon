import {
  Color4,
  GPUParticleSystem,
  Matrix,
  MeshBuilder,
  Particle,
  ParticleSystem,
  Scene,
  StandardMaterial,
  Texture,
  Vector3,
} from "@babylonjs/core";

export function testParticleSystem(scene: Scene) {
  const particleSystem = new ParticleSystem("particles", 100, scene); // scene is optional and defaults to the current scene
  particleSystem.particleTexture = new Texture("img/particle-textures/flare.png");

  const sphere = MeshBuilder.CreateSphere("", { diameter: 2 });

  particleSystem.emitter = sphere; // a mesh or abstract mesh in the scene
  // meshEmitter.useMeshNormalsForDirection = false;
  // meshEmitter.direction1 = new BABYLON.Vector3(0, 1, 0);
  // meshEmitter.direction2 = new BABYLON.Vector3(0, -1, 0);
  const emitter = particleSystem.createSphereEmitter(1, 1);

  particleSystem.startDirectionFunction = (
    worldMatrix: Matrix,
    directionToUpdate: Vector3,
    particle: Particle,
    isLocal: boolean
  ) => {
    // Get the starting position of the particle
    const particlePosition: Vector3 = particle.position;
    // Get the world position of the emitter (sphere's center)
    const sphereCenter: Vector3 = sphere.getAbsolutePosition();
    // Compute direction from particle to sphere center
    const direction: Vector3 = sphereCenter.subtract(particlePosition).normalize();
    // Set direction
    directionToUpdate.copyFrom(direction);
  };

  const material = new StandardMaterial("");
  sphere.material = material;
  material.alpha = 0.1;
  // or
  // myParticleSystem.emitter = point; //a Vector3

  particleSystem.start(); //Starts the emission of particles

  particleSystem.minSize = 0.1;
  particleSystem.maxSize = 0.5;
  // particleSystem.addSizeGradient(0, 0.1, 0.5); //size range at start of particle lifetime
  // particleSystem.addSizeGradient(0.5, 0.5, 0.9); //size range at 2/5 of duration of particle system
  // particleSystem.addSizeGradient(1.0, 0, 0.3); //size range at end of particle lifetime

  particleSystem.color1 = new Color4(0.7, 0.8, 1.0, 1.0);
  particleSystem.color2 = new Color4(0.2, 0.5, 1.0, 1.0);
  particleSystem.colorDead = new Color4(0, 0, 0.2, 0.0);

  // particleSystem.addColorGradient(0, new Color4(1, 1, 1, 0), new Color4(1, 0, 1, 0));
  // particleSystem.addColorGradient(0.4, new Color4(1, 1, 1, 0.5), new Color4(1, 0, 1, 0.5));
  // particleSystem.addColorGradient(1.0, new Color4(1, 1, 1, 1), new Color4(1, 0, 1, 1));

  particleSystem.minEmitPower = 0.3;
  particleSystem.maxEmitPower = 0.3;

  // particleSystem.addVelocityGradient(0, 0.5, 0.8); //applied power range at start of particle lifetime
  // particleSystem.addVelocityGradient(0.4, 1, 2); //applied power range at 2/5 of duration of particle system
  // particleSystem.addVelocityGradient(1.0, 3, 4); //applied power range at end of particle lifetime

  particleSystem.emitRate = 10;

  particleSystem.minLifeTime = 1;
  particleSystem.maxLifeTime = 1;

  // particleSystem.direction1 = new Vector3(0, 0, 0);

  // const changeDirectionLoop = () => {
  //   const randomX = Math.random();
  //   particleSystem.direction1 = new Vector3(randomX, 0, 0);
  //   setTimeout(changeDirectionLoop, 2000);
  // };
  // changeDirectionLoop();

  // particleSystem.gravity = new Vector3(0, 0, 0);
}
