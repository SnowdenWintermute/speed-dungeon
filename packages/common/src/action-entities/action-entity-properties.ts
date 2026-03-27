import { Vector3 } from "@babylonjs/core";
import {
  SceneEntityChildTransformNodeIdentifier,
  SceneEntityChildTransformNodeIdentifierWithDuration,
} from "../scene-entities/index.js";
import { TaggedShape3DDimensions } from "../utils/shape-utils.js";
import { ActionEntityActionOriginData, ActionEntityName } from "./index.js";
import { makeAutoObservable } from "mobx";
import { SerializedOf } from "../serialization/index.js";
import { removeUndefinedFields } from "../utils/index.js";

export class ActionEntityProperties {
  public dimensions?: TaggedShape3DDimensions;
  public initialCosmeticYPosition?: SceneEntityChildTransformNodeIdentifier;
  public parentOption?: SceneEntityChildTransformNodeIdentifier;
  public initialRotation?: Vector3;
  public initialPointToward?: SceneEntityChildTransformNodeIdentifier;
  public initialLockRotationToFace?: SceneEntityChildTransformNodeIdentifierWithDuration;
  public actionOriginData?: ActionEntityActionOriginData;
  constructor(
    public name: ActionEntityName,
    public position: Vector3
  ) {}

  makeObservable() {
    makeAutoObservable(this);
    this.actionOriginData?.makeObservable();
  }

  toSerialized() {
    const result = {
      ...this,
      position: this.position.asArray(),
      dimensions: this.dimensions,
      initialCosmeticYPosition: this.initialCosmeticYPosition,
      parentOption: this.parentOption,
      initialRotation: this.initialRotation?.asArray(),
      initialPointToward: this.initialPointToward,
      initialLockRotationToFace: this.initialLockRotationToFace,
      actionOriginData: this.actionOriginData?.toSerialized(),
    };

    removeUndefinedFields(result);

    return result;
  }

  static fromSerialized(serialized: SerializedOf<ActionEntityProperties>) {
    const result = new ActionEntityProperties(serialized.name, serialized.position);
    result.position = Vector3.FromArray(serialized.position);
    result.dimensions = serialized.dimensions;
    result.initialCosmeticYPosition = serialized.initialCosmeticYPosition;
    result.parentOption = serialized.parentOption;
    if (serialized.initialRotation) {
      result.initialRotation = Vector3.FromArray(serialized.initialRotation);
    }
    result.initialPointToward = serialized.initialPointToward;
    result.initialLockRotationToFace = serialized.initialLockRotationToFace;
    if (serialized.actionOriginData) {
      result.actionOriginData = ActionEntityActionOriginData.fromSerialized(
        serialized.actionOriginData
      );
    }

    return result;
  }
}
