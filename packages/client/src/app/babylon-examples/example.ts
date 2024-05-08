import {
  Scene,
  Engine,
  FreeCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  ArcRotateCamera,
  Color4,
  SceneLoader,
  AnimationGroup,
  Animation,
} from "babylonjs";
import "babylonjs-loaders";

export class BasicScene {
  scene: Scene;
  engine: Engine;
  characterAnimations: AnimationGroup[] = [];
  camera: ArcRotateCamera;
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
    scene.clearColor = new Color4(0.01, 0.2, 0.2, 1);
    const camera = new ArcRotateCamera(
      "camera",
      0,
      1.5,
      2,
      new Vector3(0, 1, 0),
      this.scene
    );

    camera.attachControl();
    const hemiLight = new HemisphericLight(
      "hemi-light",
      new Vector3(0, 1, 0),
      this.scene
    );
    hemiLight.intensity = 0.3;
    const ground = MeshBuilder.CreateGround(
      "ground",
      { width: 10, height: 10 },
      this.scene
    );
    // const ball = MeshBuilder.CreateSphere("ball", { diameter: 1 }, this.scene);
    // ball.position = new Vector3(0, 1, 0);

    // this.loadCharacterModel();

    return [scene, camera];
  }

  async loadCharacterModel(): Promise<void> {
    const { meshes, animationGroups } = await SceneLoader.ImportMeshAsync(
      "",
      "./",
      "mixamo-on-kenny.glb",
      this.scene,
      (_progress_event) => {
        console.log("loading");
      }
    );
    this.characterAnimations = animationGroups;

    meshes[0].rotate(Vector3.Up(), -Math.PI / 2);
    meshes[0].position = new Vector3(8, 0, -4);
    const idle = animationGroups[0];
    const jump = animationGroups[1];
    const running = animationGroups[2];

    const jumpAnimation = jump.targetedAnimations[0].animation;

    const zombie1 = await SceneLoader.ImportMeshAsync(
      "",
      "./",
      "mixamo-on-kenny.glb",
      this.scene
    );
    zombie1.meshes[0].rotate(Vector3.Up(), Math.PI / 2);
    zombie1.meshes[0].position = new Vector3(-8, 0, -4);
    const zombie2 = await SceneLoader.ImportMeshAsync(
      "",
      "./",
      "mixamo-on-kenny.glb",
      this.scene
    );
    zombie2.meshes[0].rotate(Vector3.Up(), Math.PI / 2);
    zombie2.meshes[0].position = new Vector3(-6, 0, -2);
  }

  createCutscene(): void {
    const camKeys: { frame: number; value: Vector3 }[] = [];
    const fps = 60;
    const camAnim = new Animation(
      "camAnim",
      "position",
      fps,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT,
      true
    );

    camKeys.push({ frame: 0, value: new Vector3(8, 0, -8) });
    camKeys.push({ frame: 5 * fps, value: new Vector3(-8, 0, -8) });
    camKeys.push({ frame: 8 * fps, value: new Vector3(-8, 0, -8) });
    camKeys.push({ frame: 12 * fps, value: new Vector3(0, 3, -14) });
    camAnim.setKeys(camKeys);
    this.camera.animations.push(camAnim);
    let animation = this.scene.beginAnimation(this.camera, 0, 12 * fps);
    animation.onAnimationEnd = () => console.log("animation finished");
  }
}
