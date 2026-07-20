import { Scene, Engine, Vector3, ArcRotateCamera, Color4 } from "@babylonjs/core";
import "@babylonjs/loaders";
import { IdGeneratorRandom, invariant } from "@speed-dungeon/common";
import { ClientApplication } from "@/client-application";
import { ItemSceneEntityFactory } from "./scene-entities/items/item-scene-entity-factory";
import { MaterialManager } from "./materials/material-manager";
import { ImageGenerator } from "./images/image-generator";
import { TextureManager } from "./textures/texture-manager";
import { GameWorldViewDebug } from "./debug";
import { LAYER_MASK_ALL } from "./game-world-view-consts";
import { EnvironmentView } from "./environment";
import { SceneEntityService } from "./scene-entity-service/index";
import { SCENE_ENTITY_PICKER_DISC_RENDERING_GROUP_ID } from "./scene-entities/scene-entity-picker-disc";

export class GameWorldView {
  readonly engine: Engine;
  readonly scene: Scene;
  readonly environment: EnvironmentView;
  readonly camera: ArcRotateCamera;
  readonly materialManager: MaterialManager;
  readonly textureManager: TextureManager;
  readonly idGenerator = new IdGeneratorRandom({ saveHistory: false });
  readonly id = this.idGenerator.generate();

  private _clientApplication: ClientApplication | null = null;
  private _sceneEntityService: SceneEntityService | null = null;
  private _imageGenerator: ImageGenerator | null = null;
  private _itemSceneEntityFactory: ItemSceneEntityFactory | null = null;
  private _debug: GameWorldViewDebug | null = null;

  constructor(readonly canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true);
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0, 0, 0, 0);
    // clear depth before the picker-disc rendering group so those discs draw on top of the
    // character meshes rather than clipping through them
    this.scene.setRenderingAutoClearDepthStencil(
      SCENE_ENTITY_PICKER_DISC_RENDERING_GROUP_ID,
      true,
      true,
      true
    );
    this.materialManager = new MaterialManager(this.scene);
    this.textureManager = new TextureManager(this.scene);
    this.camera = this.createMainCamera();
    this.environment = new EnvironmentView(this.scene);
    this.environment.groundPlane.clear();

    this.engine.runRenderLoop(() => {
      this.updateGameWorld(this.engine.getDeltaTime());
      this.scene.render();
    });
  }

  initialize(
    clientApplication: ClientApplication,
    uiDebugDisplayRef: React.RefObject<HTMLUListElement | null>
  ) {
    this._clientApplication = clientApplication;
    this._itemSceneEntityFactory = new ItemSceneEntityFactory(
      clientApplication.assetService,
      clientApplication.floatingMessagesService,
      this.scene,
      this.materialManager
    );
    this._imageGenerator = new ImageGenerator(clientApplication, this);

    this._sceneEntityService = new SceneEntityService(clientApplication, this);
    this._debug = new GameWorldViewDebug(clientApplication, this);
    clientApplication.targetIndicatorStore.initialize(this);

    this._debug.uiDebugDisplayRef = uiDebugDisplayRef;
    if (this.clientApplication.gameContext.gameOption) {
      this.setDefaultCameraPositionForGame();
    }

    // on reconnection the GameFullUpdate can arrive before this view exists, in which case
    // its handler couldn't enqueue thumbnails and we catch up on the already received state
    const { partyOption } = clientApplication.gameContext;
    if (partyOption) {
      this.imageGenerator.enqueueThumbnailsForParty(partyOption);
    }
  }

  get initialized() {
    return this._clientApplication !== null;
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

  setDefaultCameraPositionForGame() {
    const { camera } = this;
    camera.target.copyFrom(new Vector3(-1, 0.85, 0.51));
    camera.alpha = 4.7;
    camera.beta = 1.06;
    camera.radius = 10.94;
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
    this.sceneEntityService.clearAll();
    this.scene.dispose();
    this.engine.dispose();
  }

  updateGameWorld(deltaTime: number) {
    this.debug.updateDebugText();
    this._sceneEntityService?.updateEntities(deltaTime);
  }

  handleError(error: Error) {
    console.error("critical error in GameWorldView, stopping render loop:", error);
    this.engine.stopRenderLoop();
  }
}
