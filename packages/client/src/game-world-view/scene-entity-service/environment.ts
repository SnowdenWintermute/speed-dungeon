import { ClientApplication } from "@/client-application";
import { EnvironmentSceneEntity } from "../scene-entities/environment-entities";
import { EnvironmentSceneEntityFactory } from "../scene-entities/environment-entities/factory";
import { SceneEntityManager } from "./base";
import { GameWorldView } from "..";
import { EnvironmentEntityName } from "@speed-dungeon/common";
import { Quaternion, Vector3 } from "@babylonjs/core";

export class EnvironmentSceneEntityManager extends SceneEntityManager<EnvironmentSceneEntity> {
  private factory: EnvironmentSceneEntityFactory;

  constructor(clientApplication: ClientApplication, gameWorldView: GameWorldView) {
    super(clientApplication, gameWorldView);
    this.factory = new EnvironmentSceneEntityFactory(gameWorldView, clientApplication);
  }

  async spawnEnvironmentEntity(
    id: string,
    name: EnvironmentEntityName,
    position: Vector3,
    rotationQuat?: Quaternion
  ) {
    const entity = await this.factory.create(id, name, position, rotationQuat);
    this.register(entity);
    return entity;
  }

  protected async onRegister(sceneEntity: EnvironmentSceneEntity) {
    //
  }

  updateEntities(deltaTime: number) {
    for (const [_, sceneEntity] of this.sceneEntities) {
      sceneEntity.movementManager.processActiveActions(deltaTime);
    }
  }
}
