import { ActionEntityName } from "@speed-dungeon/common";

export const MOBILE_VFX_NAME_TO_MODEL_PATH: Record<ActionEntityName, string> = {
  [ActionEntityName.Arrow]: "equipment/arrow.glb",
  [ActionEntityName.IceBolt]: "equipment/ice-bolt.glb",
  [ActionEntityName.Explosion]: "",
  [ActionEntityName.IceBurst]: "",
};
