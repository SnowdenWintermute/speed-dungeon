import {
  Scene,
  Engine,
  Vector3,
  ArcRotateCamera,
  Mesh,
  DynamicTexture,
  RenderTargetTexture,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import {
  COSMETIC_EFFECT_CONSTRUCTORS,
  CosmeticEffectOnTargetTransformNode,
  invariant,
} from "@speed-dungeon/common";
import { GameWorldGroundPlane } from "./environment/ground-plane";
import { ClientApplication } from "@/client-application";
import { ItemSceneEntityFactory } from "./scene-entities/items/item-scene-entity-factory";
import { MaterialManager } from "./materials/material-manager";
import { ImageGenerator } from "./images/image-generator";
import { TextureManager } from "./textures/texture-manager";

const notInitialized = "GameWorldView not initialized with ClientApplication";

export class GameWorldView {
  // core
  engine: Engine;
  scene: Scene;
  // entities
  modelManager = new ModelManager(this);
  actionEntityManager = new ActionEntityModelManager();
  // environment
  ground: GameWorldGroundPlane;
  sun: Mesh;
  // cameras
  camera: ArcRotateCamera | null = null;
  // images
  private _imageGenerator: ImageGenerator | null = null;
  portraitCamera: ArcRotateCamera;
  portraitRenderTarget: RenderTargetTexture;
  // target indicators
  targetIndicatorTexture: DynamicTexture;

  private _itemSceneEntityFactory: ItemSceneEntityFactory | null = null;

  debug: { debugRef: React.RefObject<HTMLUListElement | null> | null } = { debugRef: null };

  readonly materialManager: MaterialManager;
  readonly textureManager: TextureManager;

  private _clientApplication: ClientApplication | null = null;

  constructor(
    public canvas: HTMLCanvasElement,
    debugRef: React.RefObject<HTMLUListElement | null>
  ) {
    // this.imageCreatorEngine = new Engine(imageCreatorCanvas, false);
    // this.imageCreatorScene = createImageCreatorScene(this.imageCreatorEngine);

    this.engine = new Engine(canvas, true);
    this.scene = new Scene(this.engine);
    this.materialManager = new MaterialManager(this.scene);
    this.textureManager = new TextureManager(this.scene);

    this.ground = new GameWorldGroundPlane(this.scene);

    // this.engine.setHardwareScalingLevel(10); // renders at lower resolutions
    this.debug.debugRef = debugRef;
    [this.camera, this.sun, this.groundTexture, this.ground] = this.initScene();
    this.camera.layerMask = LAYER_MASK_ALL;
    this.defaultMaterials = createDefaultMaterials(this.scene);
    this.scene.activeCamera = this.camera;

    this.portraitCamera = new ArcRotateCamera(
      "portrait camera",
      0,
      0,
      0,
      Vector3.Zero(),
      this.scene
    );

    this.portraitCamera.minZ = 0;
    this.portraitCamera.layerMask = LAYER_MASK_1;

    this.portraitRenderTarget = new RenderTargetTexture(
      "portraitTexture",
      { width: 100, height: 100 },
      this.scene
    );

    this.portraitCamera.outputRenderTarget = this.portraitRenderTarget;

    const targetIndicatorTexture = new DynamicTexture(
      "target indicator texture",
      256,
      this.scene,
      false
    );
    targetIndicatorTexture.hasAlpha = true;

    const targetImageUrl = "/img/game-ui-icons/target-icon.svg";
    fillDynamicTextureWithSvg(targetImageUrl, targetIndicatorTexture, {
      strokeColor: "white",
      fillColor: "white",
    });
    this.targetIndicatorTexture = targetIndicatorTexture;

    // PIXELATION FILTER
    // pixelate(this.camera, this.scene);

    this.engine.runRenderLoop(() => {
      this.updateGameWorld();
      this.scene.render();
    });

    // testingSounds();

    // const particleSystems = testParticleSystem(this.scene);
    // particleSystems.forEach((system) => system.start());

    // this.startLimitedFramerateRenderLoop(5, 3000);
  }

  initialize(clientApplication: ClientApplication) {
    this._clientApplication = clientApplication;
    this._itemSceneEntityFactory = new ItemSceneEntityFactory(
      clientApplication.assetService,
      this.scene,
      this.materialManager
    );
    this._imageGenerator = new ImageGenerator(clientApplication, this);
    clientApplication.targetIndicatorStore.initialize(this);
  }

  get clientApplication() {
    invariant(this._clientApplication !== null, notInitialized);
    return this._clientApplication;
  }

  get itemSceneEntityFactory() {
    invariant(this._itemSceneEntityFactory !== null, notInitialized);
    return this._itemSceneEntityFactory;
  }

  get imageGenerator() {
    invariant(this._imageGenerator !== null, notInitialized);
    return this._imageGenerator;
  }

  dispose() {
    this.scene.dispose();
    this.engine.dispose();
  }

  updateGameWorld() {
    this.updateDebugText();
    this.replayTreeManager.tick();

    if (
      !this.modelManager.modelActionQueue.isProcessing &&
      this.modelManager.modelActionQueue.messages.length
    ) {
      this.modelManager.modelActionQueue.processMessages();
    }

    for (const actionEntityModel of this.actionEntityManager.getAll()) {
      actionEntityModel.movementManager.processActiveActions();
      actionEntityModel.dynamicAnimationManager.playing?.animationGroup?.animateScene(
        actionEntityModel.dynamicAnimationManager.assetContainer
      );
      actionEntityModel.dynamicAnimationManager.handleCompletedAnimations();
      actionEntityModel.dynamicAnimationManager.stepAnimationTransitionWeights();
    }

    for (const [_, combatantModel] of this.modelManager.combatantModels) {
      combatantModel.highlightManager.updateHighlight();

      combatantModel.movementManager.processActiveActions();
      combatantModel.skeletalAnimationManager.stepAnimationTransitionWeights();
      combatantModel.skeletalAnimationManager.handleCompletedAnimations();
      combatantModel.updateDomRefPosition();
      combatantModel.targetingIndicatorBillboardManager.updateBillboardPositions();
    }
  }

  handleError = handleGameWorldViewError;
  updateDebugText = updateDebugText;

  startLimitedFramerateRenderLoop(fps: number, timeout: number) {
    window.setTimeout(() => {
      this.engine.stopRenderLoop();
      let lastTime = new Date().getTime();
      // const fpsLabel = document.getElementsByClassName("fps")[0];
      window.setInterval(() => {
        this.updateGameWorld();
        this.scene.render();
        const curTime = new Date().getTime();
        // fpsLabel.innerHTML = (1000 / (curTime - lastTime)).toFixed() + " fps";
        lastTime = curTime;
      }, 1000 / fps);
    }, timeout);
  }

  startOrStopCosmeticEffects(
    cosmeticEffectsToStart?: CosmeticEffectOnTargetTransformNode[],
    cosmeticEffectsToStop?: CosmeticEffectOnTargetTransformNode[]
  ) {
    for (const cosmeticEffectOnEntity of cosmeticEffectsToStop || []) {
      const { name, parent } = cosmeticEffectOnEntity;
      const sceneEntity = SceneEntity.getFromIdentifier(parent.sceneEntityIdentifier, this);
      const { cosmeticEffectManager } = sceneEntity;
      cosmeticEffectManager.stopEffect(name, () => {
        // no-op
      });
    }

    if (cosmeticEffectsToStart?.length) {
      const sceneOption = this.scene;

      let effectToStartLifetimeTimeout;

      for (const {
        name,
        parent,
        lifetime,
        rankOption,
        offsetOption,
        unattached,
      } of cosmeticEffectsToStart) {
        const cosmeticEffectManager = SceneEntity.getFromIdentifier(
          parent.sceneEntityIdentifier,
          this
        ).cosmeticEffectManager;

        const existingEffectOption = cosmeticEffectManager.cosmeticEffects[name];

        if (existingEffectOption) {
          existingEffectOption.referenceCount += 1;
          effectToStartLifetimeTimeout = existingEffectOption.effect;
        } else {
          const effect = new COSMETIC_EFFECT_CONSTRUCTORS[name](sceneOption, rankOption || 1);

          if (effect.setsMaterial) {
            const material = effect.setsMaterial(sceneOption);
            cosmeticEffectManager.setMaterial(material);
          }

          cosmeticEffectManager.cosmeticEffects[name] = { effect, referenceCount: 1 };
          const targetTransformNode = SceneEntity.getChildTransformNodeFromIdentifier(parent, this);

          if (!unattached) {
            effect.transformNode.setParent(targetTransformNode);
            const offset = offsetOption || Vector3.Zero();
            effect.transformNode.setPositionWithLocalVector(offset);
          } else {
            effect.transformNode.setAbsolutePosition(targetTransformNode.position);
          }

          effectToStartLifetimeTimeout = effect;
        }

        if (lifetime !== undefined) {
          effectToStartLifetimeTimeout.addLifetimeTimeout(
            setTimeout(() => {
              cosmeticEffectManager.stopEffect(name, () => {
                // no-op
              });
            }, lifetime)
          );
        }
      }
    }
  }
}
