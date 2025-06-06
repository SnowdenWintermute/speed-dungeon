export enum DurabilityLossCondition {
  OnHit,
  OnUse,
}

export const DURABILITY_LOSS_CONDITION_STRINGS: Record<DurabilityLossCondition, string> = {
  [DurabilityLossCondition.OnHit]: "OnHit",
  [DurabilityLossCondition.OnUse]: "OnUse",
};
