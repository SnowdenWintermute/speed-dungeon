import { DynamicAnimationName } from "@speed-dungeon/common";

export const DYNAMIC_ANIMATIONS: Record<DynamicAnimationName, () => void> = {
  [DynamicAnimationName.ExplosionDelivery]: function (): void {
    throw new Error("Function not implemented.");
  },
  [DynamicAnimationName.ExplosionDissipation]: function (): void {
    throw new Error("Function not implemented.");
  },
};
