export * from "./cosmetic-effect.js";
export * from "./cosmetic-effect-constructors.js";
import { Vector3 } from "@babylonjs/core";
import { EntityProperties } from "../primatives/index.js";
import {
  SceneEntityChildTransformNodeIdentifier,
  SceneEntityChildTransformNodeIdentifierWithDuration,
} from "../scene-entities/index.js";
import { TaggedShape3DDimensions } from "../utils/shape-utils.js";
import { CombatantAttributeRecord } from "../combatants/index.js";
import { KineticDamageType } from "../combat/kinetic-damage-types.js";
import { MagicalElement } from "../combat/magical-elements.js";

export enum ActionEntityName {
  Arrow,
  IceBolt,
  Explosion,
  IceBurst,
  TargetChangedIndicatorArrow,
  Firewall,
}

export const ACTION_ENTITY_STRINGS: Record<ActionEntityName, string> = {
  [ActionEntityName.Arrow]: "Arrow",
  [ActionEntityName.IceBolt]: "Ice Bolt",
  [ActionEntityName.Explosion]: "Explosion",
  [ActionEntityName.IceBurst]: "Ice Burst",
  [ActionEntityName.TargetChangedIndicatorArrow]: "Target Changed Indicator Arrow",
  [ActionEntityName.Firewall]: "Firewall",
};

// for when things pass through firewall, we can know
// what the caster's +bonus to fire damage was when they cast it
export interface ActionEntityActionOriginData {
  actionLevel?: number;
  userCombatantAttributes?: CombatantAttributeRecord;
  userElementalAffinities?: Partial<Record<MagicalElement, number>>;
  userKineticAffinities?: Partial<Record<KineticDamageType, number>>;
}

export type ActionEntityProperties = {
  position: Vector3;
  name: ActionEntityName;
  dimensions?: TaggedShape3DDimensions;
  initialCosmeticYPosition?: SceneEntityChildTransformNodeIdentifier;
  parentOption?: SceneEntityChildTransformNodeIdentifier;
  initialRotation?: Vector3;
  initialPointToward?: SceneEntityChildTransformNodeIdentifier;
  initialLockRotationToFace?: SceneEntityChildTransformNodeIdentifierWithDuration;
  actionOriginData?: ActionEntityActionOriginData;
};

export class ActionEntity {
  constructor(
    public entityProperties: EntityProperties,
    public actionEntityProperties: ActionEntityProperties
  ) {}
}
