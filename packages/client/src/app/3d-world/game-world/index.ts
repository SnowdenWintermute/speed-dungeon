import {
  Scene,
  Engine,
  Vector3,
  ArcRotateCamera,
  SceneLoader,
  ShadowGenerator,
  Mesh,
} from "babylonjs";
import "babylonjs-loaders";
import { BASE_FILE_PATH } from "../combatant-models/modular-character-parts";
import { initScene } from "./init-scene";
import { CombatTurnResult } from "@speed-dungeon/common";
import handleMessageFromNext from "./handle-message-from-next";
import { NextToBabylonMessage } from "@/stores/next-babylon-messaging-store/next-to-babylon-messages";
import { MutateState } from "@/stores/mutate-state";
import { GameState } from "@/stores/game-store";
import showDebugText from "./show-debug-text";
import processMessagesFromNext from "./process-messages-from-next";
import { NextBabylonMessagingState } from "@/stores/next-babylon-messaging-store";
import { ModelManager } from "./model-manager";

export class GameWorld {
  scene: Scene;
  engine: Engine;
  camera: ArcRotateCamera | null = null;
  sun: Mesh;
  shadowGenerator: null | ShadowGenerator = null;
  messages: NextToBabylonMessage[] = [];
  mouse: Vector3 = new Vector3(0, 1, 0);
  debug: { debugRef: React.RefObject<HTMLDivElement> | null } = { debugRef: null };
  useShadows: boolean = false;
  modelManager: ModelManager = new ModelManager(this);
  turnResultsQueue: CombatTurnResult[] = [];
  constructor(
    public canvas: HTMLCanvasElement,
    public mutateGameState: MutateState<GameState>,
    public mutateNextBabylonMessagingState: MutateState<NextBabylonMessagingState>,
    debugRef: React.RefObject<HTMLDivElement>
  ) {
    this.engine = new Engine(canvas, true);
    this.scene = new Scene(this.engine);
    this.debug.debugRef = debugRef;
    [this.camera, this.shadowGenerator, this.sun] = this.initScene();

    this.engine.runRenderLoop(() => {
      this.showDebugText();
      this.processMessagesFromNext();
      this.modelManager.startProcessingNewMessages();
      // const firstModel = Object.values(this.combatantModels)[0];
      // if (firstModel) {
      //   const boundingBox = firstModel.getClientRectFromMesh(
      //     Object.values(this.combatantModels)[0]!.rootMesh
      //   );
      // if (this.debug.debugRef?.current) {
      //   this.debug.debugRef.current.setAttribute(
      //     "style",
      //     `height: ${boundingBox.height}px; width: ${boundingBox.width}px; position: absolute; z-index: 50; top: ${boundingBox.top}px; left: ${boundingBox.left}px; border: 1px solid red;`
      //   );
      // }
      // }
      for (const combatantModel of Object.values(this.modelManager.combatantModels)) {
        combatantModel.updateDomRefPosition();
        // start model actions from action results
        combatantModel.enqueueNewModelActionsFromActionResults(this);
        // start new model actions or return to idle
        combatantModel.startNewModelActions(mutateGameState);
        // process active model actions
        combatantModel.processActiveModelActions(this, mutateGameState);
        // process floating text
        // process any animation transitions
        combatantModel.animationManager.stepAnimationTransitionWeights();
        // combatantModel.updateBoundingBox();
      }
      // console.log(Object.keys(this.combatantModels));
      //
      // if no active model actions and turn results remain
      // send the actionResults to combatant models
      this.scene.render();
    });
  }

  initScene = initScene;
  handleMessageFromNext = handleMessageFromNext;
  showDebugText = showDebugText;
  processMessagesFromNext = processMessagesFromNext;

  async importMesh(path: string) {
    const sceneResult = await SceneLoader.ImportMeshAsync("", BASE_FILE_PATH, path, this.scene);
    if (this.useShadows)
      for (const mesh of sceneResult.meshes) this.shadowGenerator?.addShadowCaster(mesh, true);
    return sceneResult;
  }
}
