import { ClientApplication } from "@/client-application";
import { ActionEntitySceneEntity } from "../scene-entities/action-entities";
import { SceneEntityManager } from "./base";
import { GameWorldView } from "..";
import { ActionEntitySceneEntityFactory } from "../scene-entities/action-entities/factory";
import { ActionEntity } from "@speed-dungeon/common";

export class ActionEntitySceneEntityManager extends SceneEntityManager<ActionEntitySceneEntity> {
  private factory: ActionEntitySceneEntityFactory;
  constructor(clientApplication: ClientApplication, gameWorldView: GameWorldView) {
    super(clientApplication, gameWorldView);
    this.factory = new ActionEntitySceneEntityFactory(
      gameWorldView,
      gameWorldView.scene,
      clientApplication
    );
  }
  protected async onRegister(_sceneEntity: ActionEntitySceneEntity) {
    /*no-op*/
  }

  async spawnActionEntitySceneEntity(actionEntity: ActionEntity) {
    return this.factory.create(actionEntity);
  }

  updateEntities(deltaTime: number) {
    for (const actionEntityModel of this.getAll()) {
      actionEntityModel.movementManager.processActiveActions(deltaTime);
      actionEntityModel.dynamicAnimationManager.playing?.animationGroup?.animateScene(
        actionEntityModel.dynamicAnimationManager.assetContainer
      );
      actionEntityModel.dynamicAnimationManager.handleCompletedAnimations();
      actionEntityModel.dynamicAnimationManager.stepAnimationTransitionWeights();
    }
  }
}
