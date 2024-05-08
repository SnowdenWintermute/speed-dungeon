import {
  Scene,
  Engine,
  Vector3,
  MeshBuilder,
  CubeTexture,
  Texture,
  PBRMaterial,
  SceneLoader,
  ArcRotateCamera,
  Color3,
  Color4,
} from "babylonjs";

import "@babylonjs/loaders";

export class CustomModels {
  scene: Scene;
  engine: Engine;

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.scene = this.createScene();
    //this.CreateGround();
    //this.CreateBarrel();
    this.createCampfire();

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  createScene(): Scene {
    const scene = new Scene(this.engine);
    scene.clearColor = new Color4(25, 89, 180, 1);
    const camera = new ArcRotateCamera(
      "camera",
      0,
      1.5,
      2,
      new Vector3(0, 1, 0),
      this.scene
    );
    camera.attachControl();
    camera.speed = 0.25;

    const envTex = CubeTexture.CreateFromPrefilteredData(
      "./environment/sky.env",
      scene
    );

    scene.environmentTexture = envTex;

    scene.createDefaultSkybox(envTex, true);

    scene.environmentIntensity = 0.5;

    return scene;
  }

  createGround(): void {
    const ground = MeshBuilder.CreateGround(
      "ground",
      { width: 10, height: 10 },
      this.scene
    );

    ground.material = this.createAsphalt();
  }

  createAsphalt(): PBRMaterial {
    const pbr = new PBRMaterial("pbr", this.scene);
    pbr.albedoTexture = new Texture(
      "./textures/asphalt/asphalt_diffuse.jpg",
      this.scene
    );

    pbr.bumpTexture = new Texture(
      "./textures/asphalt/asphalt_normal.jpg",
      this.scene
    );

    pbr.invertNormalMapX = true;
    pbr.invertNormalMapY = true;

    pbr.useAmbientOcclusionFromMetallicTextureRed = true;
    pbr.useRoughnessFromMetallicTextureGreen = true;
    pbr.useMetallnessFromMetallicTextureBlue = true;

    pbr.metallicTexture = new Texture(
      "./textures/asphalt/asphalt_ao_rough_metal.jpg",
      this.scene
    );

    return pbr;
  }

  async createBarrel(): Promise<void> {
    // SceneLoader.ImportMesh(
    //   "",
    //   "./models/",
    //   "barrel.glb",
    //   this.scene,
    //   (meshes) => {
    //     console.log("meshes", meshes);
    //   }
    // );

    const { meshes } = await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "barrel.glb"
    );

    console.log("meshes", meshes);
  }

  async createCampfire(): Promise<void> {
    const models = await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "campfire.glb"
    );

    // models.meshes[0].position = new Vector3(-15, 0, 0);

    console.log("models", models);
  }
}
