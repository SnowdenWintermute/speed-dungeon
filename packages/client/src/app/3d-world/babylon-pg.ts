class Playground {
  public static CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene {
    const world = new GameWorld(engine, canvas);

    // LIGHT/CAMERA
    world.scene.clearColor = new BABYLON.Color4(0.2, 0.3, 0.3);
    const camera = new BABYLON.ArcRotateCamera(
      "camera",
      0,
      1.5,
      2,
      new BABYLON.Vector3(0, 1, 0),
      world.scene
    );
    camera.wheelDeltaPercentage = 0.02;
    camera.radius = 4;
    camera.attachControl(canvas);

    const hemiLight = new BABYLON.HemisphericLight(
      "hemi-light",
      new BABYLON.Vector3(0, 1, 0),
      world.scene
    );
    hemiLight.intensity = 0.85;

    return world.scene;
  }
}

class GameWorld {
  scene: BABYLON.Scene;
  engine: BABYLON.Engine;
  canvas: HTMLCanvasElement;
  characterAnimations: BABYLON.AnimationGroup[] = [];
  camera: BABYLON.ArcRotateCamera | null = null;
  mouse: BABYLON.Vector3 = new BABYLON.Vector3(0, 1, 0);
  constructor(engine: BABYLON.Engine, canvas: HTMLCanvasElement) {
    this.engine = engine;
    this.canvas = canvas;
    this.scene = new BABYLON.Scene(this.engine);
    this.init();
  }

  async init() {
    await this.initScene();

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  async initScene() {
    // load two modular characters to demonstrate we can add different
    // parts and play different animations
    const characterA = await this.loadCharacterModel(
      ASSET_PATHS.LEGS.WITCH,
      ASSET_PATHS.TORSOS.MIDIEVAL,
      ASSET_PATHS.HEADS.WITCH
    );

    const characterB = await this.loadCharacterModel(
      ASSET_PATHS.LEGS.WITCH,
      ASSET_PATHS.TORSOS.MIDIEVAL,
      ASSET_PATHS.HEADS.MIDIEVAL,
      new BABYLON.Vector3(0, 0, 1),
      Math.PI / 2
    );

    // show a different animation on the 2nd character
    characterB.skeleton.animationGroups[4].stop();
    characterB.skeleton.animationGroups[16].start(true);

    // randomize the parts every 1 second
    setInterval(() => {
      characterA.randomizeParts();
      characterB.randomizeParts();
    }, 1000);
  }

  // make it easier to import meshes without having to write this long function call
  async importMesh(path: string) {
    return BABYLON.SceneLoader.ImportMeshAsync("", BASE_FILE_PATH, path, this.scene);
  }

  async loadCharacterModel(
    legsPath: string,
    torsoPath: string,
    headPath: string,
    startPosition: BABYLON.Vector3 = new BABYLON.Vector3(0, 0, 0),
    startRotation: number = 0
  ): Promise<ModularCharacter> {
    // this is a rigged character model exported from blender with a single
    // plane mesh and a skeleton with animations. Babylon does not recognize
    // the skeleton as a skeleton unless we include at least 1 mesh in the .glb
    const skeleton = await this.importMesh(ASSET_PATHS.SKELETONS.HUMANOID);
    // point the skeleton towards the camerea
    skeleton.meshes[0].rotate(BABYLON.Vector3.Up(), Math.PI / 2 + startRotation);
    skeleton.meshes[0].position = startPosition;

    // use the skeleton to create a modular character object and attach parts to it
    const modularCharacter = new ModularCharacter(this, skeleton);

    await modularCharacter.attachPart(ModularCharacterPart.Head, headPath);
    await modularCharacter.attachPart(ModularCharacterPart.Torso, torsoPath);
    await modularCharacter.attachPart(ModularCharacterPart.Legs, legsPath);

    return modularCharacter;
  }
}

class ModularCharacter {
  skeleton: BABYLON.ISceneLoaderAsyncResult;
  parts: Record<ModularCharacterPart, null | BABYLON.ISceneLoaderAsyncResult> = {
    [ModularCharacterPart.Head]: null,
    [ModularCharacterPart.Torso]: null,
    [ModularCharacterPart.Legs]: null,
  };
  world: GameWorld;
  constructor(world: GameWorld, skeleton: BABYLON.ISceneLoaderAsyncResult) {
    this.world = world;

    this.skeleton = skeleton;
    while (skeleton.meshes.length > 1) {
      console.log("pruning ", skeleton.meshes[0].name);
      skeleton.meshes.pop()!.dispose();
    }

    skeleton.animationGroups[0].stop();
    skeleton.animationGroups[4].start(true);
  }

  async attachPart(partCategory: ModularCharacterPart, partPath: string) {
    const part = await this.world.importMesh(partPath);
    const parent = getTransformNodeByName(this.skeleton, "CharacterArmature");

    for (const mesh of part.meshes) {
      if (!mesh.skeleton) continue;
      mesh.skeleton = this.skeleton.skeletons[0];
      mesh.parent = parent!;
    }

    part.skeletons[0].dispose();

    this.removePart(partCategory);

    // we need to save a reference to the part so we can dispose of it when switching to a different part
    this.parts[partCategory] = part;
  }

  removePart(partCategory: ModularCharacterPart) {
    disposeAsyncLoadedScene(this.parts[partCategory]);
    this.parts[partCategory] = null;
  }

  async randomizeParts() {
    const newHeadPath = Math.random() > 0.5 ? ASSET_PATHS.HEADS.MIDIEVAL : ASSET_PATHS.HEADS.WITCH;
    const newTorsoPath =
      Math.random() > 0.5 ? ASSET_PATHS.TORSOS.MIDIEVAL : ASSET_PATHS.TORSOS.WITCH;
    const newLegsPath = Math.random() > 0.5 ? ASSET_PATHS.LEGS.MIDIEVAL : ASSET_PATHS.LEGS.WITCH;

    this.attachPart(ModularCharacterPart.Head, newHeadPath);
    this.attachPart(ModularCharacterPart.Torso, newTorsoPath);
    this.attachPart(ModularCharacterPart.Legs, newLegsPath);
  }
}

enum ModularCharacterPart {
  Head,
  Torso,
  Legs,
}

function getTransformNodeByName(sceneResult: BABYLON.ISceneLoaderAsyncResult, name: string) {
  for (const transformNode of sceneResult.transformNodes) {
    if (transformNode.name === name) return transformNode;
  }
  return undefined;
}

function disposeAsyncLoadedScene(sceneResult: BABYLON.ISceneLoaderAsyncResult | null) {
  if (sceneResult === null) return;
  while (sceneResult.meshes.length) sceneResult.meshes.pop()!.dispose();
  while (sceneResult.skeletons.length) sceneResult.skeletons.pop()!.dispose();
  while (sceneResult.transformNodes.length) sceneResult.transformNodes.pop()!.dispose();
  while (sceneResult.lights.length) sceneResult.lights.pop()!.dispose();
  while (sceneResult.geometries.length) sceneResult.geometries.pop()!.dispose();
  while (sceneResult.spriteManagers.length) sceneResult.spriteManagers.pop()!.dispose();
  while (sceneResult.animationGroups.length) sceneResult.animationGroups.pop()!.dispose();
  while (sceneResult.particleSystems.length) sceneResult.particleSystems.pop()!.dispose();
}

const ASSET_PATHS = {
  SKELETONS: {
    HUMANOID: "adventurer-skeleton.glb",
  },
  HEADS: {
    WITCH: "witch-head.glb",
    MIDIEVAL: "midieval-head.glb",
  },
  TORSOS: {
    WITCH: "witch-torso.glb",
    MIDIEVAL: "midieval-torso.glb",
  },
  LEGS: {
    WITCH: "witch-legs.glb",
    MIDIEVAL: "midieval-legs.glb",
  },
};

const BASE_FILE_PATH =
  "https://raw.githubusercontent.com/SnowdenWintermute/3d-assets/main/babylon-modular-characters-pg/";
