import {
  Scene,
  Engine,
  // FreeCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  ArcRotateCamera,
  Color4,
  SceneLoader,
  AnimationGroup,
  Animation,
  PointLight,
  Material,
  StandardMaterial,
  Color3,
  Node,
} from "babylonjs";
import "babylonjs-loaders";

export class BasicScene {
  scene: Scene;
  engine: Engine;
  characterAnimations: AnimationGroup[] = [];
  camera: ArcRotateCamera;
  mouse: Vector3 = new Vector3(0, 1, 0);
  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true);
    [this.scene, this.camera] = this.createScene();
    // this.createCutscene();
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
    // ball.position = this.mouse;
    //
    this.loadCharacterModel();

    return [scene, camera];
  }

  async loadCharacterModel(): Promise<void> {
    const adventurerFilePath = "./3d-assets/adventurer.glb";
    const skeletonFilePath = "./3d-assets/humanoid-skeleton.glb";
    const headFilePath = "./3d-assets/scifi-head.glb";
    const torsoFilePath = "./3d-assets/scifi-torso.glb";
    const legsFilePath = "./3d-assets/witch-legs.glb";
    const skeleton = await SceneLoader.ImportMeshAsync(
      "",
      "./",
      skeletonFilePath,
      this.scene,
      (_progress_event) => {
        console.log("loading");
      }
    );

    const adventurer = await SceneLoader.ImportMeshAsync("", "./", adventurerFilePath, this.scene);
    adventurer.animationGroups[0].stop();
    adventurer.animationGroups[4].start();

    const cubeSize = 0.01;
    const rootBone = (() => {
      for (const node of skeleton.meshes[0].getDescendants(false)) {
        if (node.name === "Root") return node;
      }
      return undefined;
    })();

    const skeletonNodesByName: { [name: string]: Node } = {};

    if (rootBone !== undefined) {
      for (const node of rootBone.getDescendants(false)) {
        console.log(node.name);
        skeletonNodesByName[node.name] = node;

        const boneMarkerCube = MeshBuilder.CreateBox(
          `node-cube-${node.name}`,
          {
            height: cubeSize,
            width: cubeSize,
            depth: cubeSize,
            faceColors: new Array(6).fill(new Color4(255, 0, 0, 1.0)),
          },
          this.scene
        );
        boneMarkerCube.setParent(node);
        boneMarkerCube.setPositionWithLocalVector(new Vector3(0.0, 0.0, 0.0));
      }
    }

    this.characterAnimations = skeleton.animationGroups;

    // adventurer.meshes[0].rotate(Vector3.Up(), Math.PI);
    skeleton.meshes[0].rotate(Vector3.Up(), Math.PI + Math.PI / 2);

    skeleton.animationGroups[0].stop();

    const legs = await SceneLoader.ImportMeshAsync("", "./", legsFilePath, this.scene);
    console.log("SKELYTON: ", legs.skeletons, adventurer.skeletons);

    legs.meshes[0].skeleton?.dispose();
    legs.meshes[0].skeleton = adventurer.skeletons[0];

    const idle = skeleton.animationGroups[4];
    idle.start(true);
    // const legsRootBone = (() => {
    //   for (const node of legs.meshes[0].getDescendants(false)) {
    //     if (node.name === "Root") return node;
    //   }
    //   return undefined;
    // })();

    // if (legsRootBone !== undefined) {
    //   for (const node of legsRootBone.getDescendants(false)) {
    //     const skeletonNodeOption = skeletonNodesByName[node.name];
    //     if (skeletonNodeOption !== undefined) {
    //       console.log(
    //         "setting " + node.name + " parent to " + " skeleton node " + skeletonNodeOption.name
    //       );
    //       node.parent = skeletonNodeOption;
    //       node.isSynchronized;
    //     }
    //   }
    // }

    // adventurer.animationGroups[0].stop();
    // adventurer.animationGroups[4].start();
  }

  createCutscene(): void {
    // const camKeys: { frame: number; value: Vector3 }[] = [];
    // const fps = 60;
    // const camAnim = new Animation(
    //   "camAnim",
    //   "position",
    //   fps,
    //   Animation.ANIMATIONTYPE_VECTOR3,
    //   Animation.ANIMATIONLOOPMODE_CONSTANT,
    //   true
    // );
    // camKeys.push({ frame: 0, value: new Vector3(8, 0, -8) });
    // camKeys.push({ frame: 5 * fps, value: new Vector3(-8, 0, -8) });
    // camKeys.push({ frame: 8 * fps, value: new Vector3(-8, 0, -8) });
    // camKeys.push({ frame: 12 * fps, value: new Vector3(0, 3, -14) });
    // camAnim.setKeys(camKeys);
    // this.camera.animations.push(camAnim);
    // let animation = this.scene.beginAnimation(this.camera, 0, 12 * fps);
    // animation.onAnimationEnd = () => console.log("animation finished");
  }
}
