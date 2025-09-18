import { ActionEntityName } from "@speed-dungeon/common";

export const ACTION_ENTITY_NAME_TO_MODEL_PATH: Record<ActionEntityName, string> = {
  [ActionEntityName.Arrow]: "equipment/arrow.glb",
  [ActionEntityName.DummyArrow]: "equipment/arrow.glb",
  [ActionEntityName.IceBolt]: "equipment/ice-bolt.glb",
  [ActionEntityName.Explosion]: "",
  [ActionEntityName.IceBurst]: "",
  [ActionEntityName.TargetChangedIndicatorArrow]: "",
  [ActionEntityName.Firewall]: "",
};
