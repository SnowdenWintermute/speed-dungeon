import { Scene, Engine, Vector3, ArcRotateCamera } from "@babylonjs/core";
import "@babylonjs/loaders";
import { invariant } from "@speed-dungeon/common";
import { ClientApplication } from "@/client-application";
import { ItemSceneEntityFactory } from "./scene-entities/items/item-scene-entity-factory";
import { MaterialManager } from "./materials/material-manager";
import { ImageGenerator } from "./images/image-generator";
import { TextureManager } from "./textures/texture-manager";
import { GameWorldViewDebug } from "./debug";
import { LAYER_MASK_ALL } from "./game-world-view-consts";
import { EnvironmentView } from "./environment";
import { SceneEntityService } from "./scene-entity-service/index";

export class GameWorldView {
  readonly engine: Engine;
  readonly scene: Scene;
  readonly environment: EnvironmentView;
  readonly camera: ArcRotateCamera;
  readonly materialManager: MaterialManager;
  readonly textureManager: TextureManager;

  private _clientApplication: ClientApplication | null = null;
  private _sceneEntityService: SceneEntityService | null = null;
  private _imageGenerator: ImageGenerator | null = null;
  private _itemSceneEntityFactory: ItemSceneEntityFactory | null = null;
  private _debug: GameWorldViewDebug | null = null;

  constructor(
    readonly canvas: HTMLCanvasElement,
    uiDebugDisplayRef: React.RefObject<HTMLUListElement | null>
  ) {
    this.engine = new Engine(canvas, true);
    this.scene = new Scene(this.engine);
    this.materialManager = new MaterialManager(this.scene);
    this.textureManager = new TextureManager(this.scene);
    this.camera = this.createMainCamera();

    this.debug.uiDebugDisplayRef = uiDebugDisplayRef;
    this.environment = new EnvironmentView(this.scene);

    this.engine.runRenderLoop(() => {
      this.updateGameWorld(this.engine.getDeltaTime());
      this.scene.render();
    });
  }

  initialize(clientApplication: ClientApplication) {
    this._clientApplication = clientApplication;
    this._itemSceneEntityFactory = new ItemSceneEntityFactory(
      clientApplication.assetService,
      clientApplication.floatingMessagesService,
      this.scene,
      this.materialManager
    );
    this._sceneEntityService = new SceneEntityService(clientApplication, this);
    this._imageGenerator = new ImageGenerator(clientApplication, this);
    this._debug = new GameWorldViewDebug(clientApplication, this);
    clientApplication.targetIndicatorStore.initialize(this);
  }

  createMainCamera() {
    const camera = new ArcRotateCamera("camera", 0, 0, 0, new Vector3(0, 1, 0), this.scene);
    camera.alpha = Math.PI / 2;
    camera.beta = (Math.PI / 5) * 2;
    camera.radius = 4.28;
    camera.wheelDeltaPercentage = 0.01;
    camera.attachControl();
    camera.minZ = 0;
    camera.layerMask = LAYER_MASK_ALL;

    return camera;
  }

  static NOT_INITIALIZED = "GameWorldView not initialized with ClientApplication";

  get clientApplication() {
    invariant(this._clientApplication !== null, GameWorldView.NOT_INITIALIZED);
    return this._clientApplication;
  }
  get sceneEntityService() {
    invariant(this._sceneEntityService !== null, GameWorldView.NOT_INITIALIZED);
    return this._sceneEntityService;
  }
  get itemSceneEntityFactory() {
    invariant(this._itemSceneEntityFactory !== null, GameWorldView.NOT_INITIALIZED);
    return this._itemSceneEntityFactory;
  }
  get imageGenerator() {
    invariant(this._imageGenerator !== null, GameWorldView.NOT_INITIALIZED);
    return this._imageGenerator;
  }
  get debug() {
    invariant(this._debug !== null, GameWorldView.NOT_INITIALIZED);
    return this._debug;
  }

  dispose() {
    this.scene.dispose();
    this.engine.dispose();
  }

  updateGameWorld(deltaTime: number) {
    this.debug.updateDebugText();
    // @TODO - tick injected scheduler
    // this.replayTreeManager.tick();
    this._sceneEntityService?.updateEntities(deltaTime);
  }

  handleError(error: Error) {
    console.error("critical error in GameWorldView, stopping render loop:", error);
    this.engine.stopRenderLoop();
  }
}
