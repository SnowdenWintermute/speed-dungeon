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
import { getTransformNodeByName } from "./utils";
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
    const modularCharacter = new ModularCharacter(this, skeleton);

    skeleton.meshes[0].rotate(Vector3.Up(), Math.PI / 2 + startRotation);
    skeleton.meshes[0].position = startPosition;
    skeleton.meshes[1].dispose();

    await modularCharacter.attachPart(legsPath);
    await modularCharacter.attachPart(torsoPath);
    await modularCharacter.attachPart(headPath);

    skeleton.animationGroups[0].stop();
    skeleton.animationGroups[4].start(true);

    // const cubeSize = 0.01;
    // const red = new Color4(255, 0, 0, 1.0);
    // const skeletonRootBone = getRootBone(skeleton.meshes[0]);
    // if (skeletonRootBone !== undefined)
    //   paintCubesOnNodes(skeletonRootBone, cubeSize, red, this.scene);

    // disposeAsyncLoadedScene(legs);

    // disposeAsyncLoadedScene(torso);
    return modularCharacter;
  }

  async randomizeParts(modularCharacter: ModularCharacter) {
    // disposeAsyncLoadedScene(modularCharacter.head);
    // disposeAsyncLoadedScene(modularCharacter.torso);
    // disposeAsyncLoadedScene(modularCharacter.legs);
    // const newHeadPath = Math.random() > 0.5 ? ASSET_PATHS.HEADS.MIDIEVAL : ASSET_PATHS.HEADS.WITCH;
    // const newTorsoPath =
    //   Math.random() > 0.5 ? ASSET_PATHS.TORSOS.MIDIEVAL : ASSET_PATHS.TORSOS.WITCH;
    // const newLegsPath = Math.random() > 0.5 ? ASSET_PATHS.LEGS.MIDIEVAL : ASSET_PATHS.LEGS.WITCH;
    // const head = await this.importMesh(newHeadPath);
    // const torso = await this.importMesh(newTorsoPath);
    // const legs = await this.importMesh(newLegsPath);
    // attachPart(modularCharacter, head);
    // attachPart(modularCharacter, torso);
    // attachPart(modularCharacter, legs);
  }
}

class ModularCharacter {
  skeleton: ISceneLoaderAsyncResult;
  head: ISceneLoaderAsyncResult | null = null;
  torso: ISceneLoaderAsyncResult | null = null;
  legs: ISceneLoaderAsyncResult | null = null;
  world: GameWorld;
  constructor(world: GameWorld, skeleton: ISceneLoaderAsyncResult) {
    this.skeleton = skeleton;
    this.world = world;
  }

  async attachPart(partPath: string) {
    const part = await this.world.importMesh(partPath);
    const parent = getTransformNodeByName(this.skeleton, "CharacterArmature");

    for (const mesh of part.meshes) {
      if (!mesh.skeleton) continue;
      mesh.skeleton = this.skeleton.skeletons[0];
      mesh.parent = parent!;
    }

    part.skeletons[0].dispose();
  }
}
