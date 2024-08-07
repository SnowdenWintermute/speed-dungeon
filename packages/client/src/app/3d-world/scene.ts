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
  Node,
  Mesh,
  AbstractMesh,
  ISceneLoaderAsyncResult,
} from "babylonjs";
import "babylonjs-loaders";

const ASSET_PATHS = {
  skeletons: {
    humanoid: "adventurer-skeleton.glb",
  },
  heads: {
    witch: "witch-head.glb",
    midieval: "midieval-head.glb",
  },
  torsos: {
    witch: "witch-torso.glb",
    midieval: "midieval-torso.glb",
  },
  legs: {
    witch: "witch-legs.glb",
    midieval: "midieval-legs.glb",
  },
};

export class BasicScene {
  scene: Scene;
  engine: Engine;
  characterAnimations: AnimationGroup[] = [];
  camera: ArcRotateCamera;
  mouse: Vector3 = new Vector3(0, 1, 0);
  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true);
    [this.scene, this.camera] = this.createScene();

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  createScene(): [Scene, ArcRotateCamera] {
    const scene = new Scene(this.engine);
    scene.clearColor = new Color4(0.1, 0.1, 0.15, 1);
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

    this.loadCharacterModel();

    return [scene, camera];
  }

  async loadCharacterModel(): Promise<void> {
    const baseFilePath = "./3d-assets/";

    const skeleton = await SceneLoader.ImportMeshAsync(
      "",
      baseFilePath,
      ASSET_PATHS.skeletons.humanoid,
      this.scene
    );
    const legs = await SceneLoader.ImportMeshAsync(
      "",
      baseFilePath,
      ASSET_PATHS.legs.witch,
      this.scene
    );
    const torso = await SceneLoader.ImportMeshAsync(
      "",
      baseFilePath,
      ASSET_PATHS.torsos.midieval,
      this.scene
    );

    skeleton.animationGroups[0].stop();
    skeleton.animationGroups[4].start(true);

    const cubeSize = 0.01;
    const red = new Color4(255, 0, 0, 1.0);

    skeleton.meshes[0].rotate(Vector3.Up(), Math.PI / 2);
    skeleton.meshes[0].position = new Vector3(0.0, 0, 0);
    skeleton.meshes[1].visibility = 0;

    const skeletonRootBone = getRootBone(skeleton.meshes[0]);

    // if (skeletonRootBone !== undefined)
    //   paintCubesOnNodes(skeletonRootBone, cubeSize, red, this.scene);

    attachPart(skeleton, legs);
    attachPart(skeleton, torso);
    disposeAsyncLoadedScene(legs);
    const otherLegs = await SceneLoader.ImportMeshAsync(
      "",
      baseFilePath,
      ASSET_PATHS.legs.midieval,
      this.scene
    );
    attachPart(skeleton, otherLegs);

    // disposeAsyncLoadedScene(torso);

    const idle = skeleton.animationGroups[4];
    idle.start(true);
  }
}

function attachPart(skeleton: ISceneLoaderAsyncResult, part: ISceneLoaderAsyncResult) {
  const parent = getTransformNodeByName(skeleton, "CharacterArmature");

  part.meshes.forEach((mesh, i) => {
    if (mesh.skeleton) {
      mesh.skeleton = skeleton.skeletons[0];
      mesh.parent = parent!;
    }
  });

  part.skeletons[0].dispose();
}

function getTransformNodeByName(sceneResult: ISceneLoaderAsyncResult, name: string) {
  for (const transformNode of sceneResult.transformNodes) {
    if (transformNode.name === name) return transformNode;
  }
  return undefined;
}

function getRootBone(mesh: Mesh | AbstractMesh) {
  for (const node of mesh.getDescendants(false)) {
    if (node.name === "Root") return node;
  }
  return undefined;
}

function disposeAsyncLoadedScene(sceneResult: ISceneLoaderAsyncResult) {
  sceneResult.meshes.forEach((item) => item.dispose());
  sceneResult.skeletons.forEach((item) => item.dispose());
  sceneResult.transformNodes.forEach((item) => item.dispose());
  sceneResult.lights.forEach((item) => item.dispose());
  sceneResult.geometries.forEach((item) => item.dispose());
  sceneResult.spriteManagers.forEach((item) => item.dispose());
  sceneResult.animationGroups.forEach((item) => item.dispose());
  sceneResult.particleSystems.forEach((item) => item.dispose());
}
// function disposeAsyncLoadedScene(sceneResult: ISceneLoaderAsyncResult) {
//   while (sceneResult.meshes.length) sceneResult.meshes[0].dispose();
//   while (sceneResult.skeletons.length) sceneResult.skeletons[0].dispose();
//   while (sceneResult.transformNodes.length) sceneResult.transformNodes[0].dispose();
//   while (sceneResult.lights.length) sceneResult.lights[0].dispose();
//   while (sceneResult.geometries.length) sceneResult.geometries[0].dispose();
//   while (sceneResult.spriteManagers.length) sceneResult.spriteManagers[0].dispose();
//   while (sceneResult.animationGroups.length) sceneResult.animationGroups[0].dispose();
//   while (sceneResult.particleSystems.length) sceneResult.particleSystems[0].dispose();
// }

function getChildrenByName(rootNode: Node) {
  const childrenByName: { [name: string]: Node } = {};
  for (const node of rootNode.getDescendants(false)) {
    childrenByName[node.name] = node;
  }
  return childrenByName;
}

function paintCubesOnNodes(rootNode: Node, cubeSize: number, color: Color4, scene: Scene) {
  for (const node of rootNode.getDescendants(false)) {
    const boneMarkerCube = MeshBuilder.CreateBox(
      `node-cube-${node.name}`,
      {
        height: cubeSize,
        width: cubeSize,
        depth: cubeSize,
        faceColors: new Array(6).fill(color),
      },
      // @ts-ignore
      scene
    );

    boneMarkerCube.setParent(node);
    boneMarkerCube.setPositionWithLocalVector(new Vector3(0.0, 0.0, 0.0));
  }
}
