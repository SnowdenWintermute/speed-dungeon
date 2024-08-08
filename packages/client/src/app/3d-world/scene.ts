import {
  Scene,
  Engine,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  ArcRotateCamera,
  Color4,
  SceneLoader,
  AnimationGroup,
  PointLight,
  StandardMaterial,
  Color3,
  ISceneLoaderAsyncResult,
} from "babylonjs";
import "babylonjs-loaders";
import { disposeAsyncLoadedScene, getTransformNodeByName } from "./utils";
import { ASSET_PATHS, BASE_FILE_PATH } from "./asset-paths";

export class GameWorld {
  scene: Scene;
  engine: Engine;
  characterAnimations: AnimationGroup[] = [];
  camera: ArcRotateCamera | null = null;
  mouse: Vector3 = new Vector3(0, 1, 0);
  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true);
    this.scene = new Scene(this.engine);
    this.init();
  }

  async init() {
    this.camera = await this.initScene();

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  async initScene(): Promise<ArcRotateCamera> {
    this.scene.clearColor = new Color4(0.1, 0.1, 0.15, 1);
    const camera = new ArcRotateCamera("camera", 0, 1.5, 2, new Vector3(0, 1, 0), this.scene);
    camera.wheelDeltaPercentage = 0.02;
    camera.radius = 4;

    camera.attachControl();
    const hemiLight = new HemisphericLight("hemi-light", new Vector3(0, 1, 0), this.scene);
    hemiLight.intensity = 0.85;
    const lightPosition = new Vector3(4.0, 8.0, 4.0);
    const pointLight = new PointLight("point-light", lightPosition, this.scene);
    const ball = MeshBuilder.CreateSphere("ball", { diameter: 0.25 }, this.scene);

    ball.position = lightPosition;
    pointLight.intensity = 0.2;
    const ground = MeshBuilder.CreateGround("ground", { width: 50, height: 50 }, this.scene);
    const material = new StandardMaterial("ground-material", this.scene);
    material.diffuseColor = new Color3(0.203, 0.295, 0.208);
    ground.material = material;

    const characterA = await this.loadCharacterModel(
      ASSET_PATHS.LEGS.WITCH,
      ASSET_PATHS.TORSOS.MIDIEVAL,
      ASSET_PATHS.HEADS.WITCH
    );

    const characterB = await this.loadCharacterModel(
      ASSET_PATHS.LEGS.WITCH,
      ASSET_PATHS.TORSOS.MIDIEVAL,
      ASSET_PATHS.HEADS.MIDIEVAL,
      new Vector3(0, 0, 1),
      Math.PI / 2
    );

    characterB.skeleton.animationGroups[4].stop();
    characterB.skeleton.animationGroups[16].start(true);

    setInterval(() => {
      this.randomizeParts(characterA);
      this.randomizeParts(characterB);
    }, 1000);

    return camera;
  }

  async importMesh(path: string) {
    return SceneLoader.ImportMeshAsync("", BASE_FILE_PATH, path, this.scene);
  }

  async loadCharacterModel(
    legsPath: string,
    torsoPath: string,
    headPath: string,
    startPosition: Vector3 = new Vector3(0, 0, 0),
    startRotation: number = 0
  ): Promise<ModularCharacter> {
    const skeleton = await this.importMesh(ASSET_PATHS.SKELETONS.HUMANOID);
    skeleton.meshes[0].rotate(Vector3.Up(), Math.PI / 2 + startRotation);
    skeleton.meshes[0].position = startPosition;

    const modularCharacter = new ModularCharacter(this, skeleton);

    await modularCharacter.attachPart(ModularCharacterPart.Head, headPath);
    await modularCharacter.attachPart(ModularCharacterPart.Torso, torsoPath);
    await modularCharacter.attachPart(ModularCharacterPart.Legs, legsPath);

    return modularCharacter;
  }

  async randomizeParts(modularCharacter: ModularCharacter) {
    const newHeadPath = Math.random() > 0.5 ? ASSET_PATHS.HEADS.MIDIEVAL : ASSET_PATHS.HEADS.WITCH;
    const newTorsoPath =
      Math.random() > 0.5 ? ASSET_PATHS.TORSOS.MIDIEVAL : ASSET_PATHS.TORSOS.WITCH;
    const newLegsPath = Math.random() > 0.5 ? ASSET_PATHS.LEGS.MIDIEVAL : ASSET_PATHS.LEGS.WITCH;

    modularCharacter.attachPart(ModularCharacterPart.Head, newHeadPath);
    modularCharacter.attachPart(ModularCharacterPart.Torso, newTorsoPath);
    modularCharacter.attachPart(ModularCharacterPart.Legs, newLegsPath);
  }
}

class ModularCharacter {
  skeleton: ISceneLoaderAsyncResult;
  parts: Record<ModularCharacterPart, null | ISceneLoaderAsyncResult> = {
    [ModularCharacterPart.Head]: null,
    [ModularCharacterPart.Torso]: null,
    [ModularCharacterPart.Legs]: null,
  };
  world: GameWorld;
  constructor(world: GameWorld, skeleton: ISceneLoaderAsyncResult) {
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

  setShowBones(bool: boolean) {
    // const cubeSize = 0.01;
    // const red = new Color4(255, 0, 0, 1.0);
    // const skeletonRootBone = getRootBone(this.skeleton.meshes[0]);
    // if (skeletonRootBone !== undefined)
    //   paintCubesOnNodes(skeletonRootBone, cubeSize, red, this.world.scene);
  }
}
