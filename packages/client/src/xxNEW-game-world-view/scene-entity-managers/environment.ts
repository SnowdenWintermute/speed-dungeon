import { ClientApplication } from "@/client-application";
import { EnvironmentSceneEntity } from "../scene-entities/environment-entities";
import { EnvironmentSceneEntityFactory } from "../scene-entities/environment-entities/factory";
import { SceneEntityRegistry } from "./base";
import { GameWorldView } from "..";
import { EnvironmentEntityName } from "@speed-dungeon/common";
import { Quaternion, Vector3 } from "@babylonjs/core";

export class EnvironmentSceneEntityRegistry extends SceneEntityRegistry<EnvironmentSceneEntity> {
  private factory: EnvironmentSceneEntityFactory;
  constructor(clientApplication: ClientApplication, gameWorldView: GameWorldView) {
    super();
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
  }

  protected async onRegister(sceneEntity: EnvironmentSceneEntity) {
    //
  }
}
