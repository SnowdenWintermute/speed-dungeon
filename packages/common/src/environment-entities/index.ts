export enum EnvironmentEntityName {
  VendingMachine,
  ThreatTargetChangedArrow,
}

export const ENVIRONMENT_ENTITY_STRINGS: Record<EnvironmentEntityName, string> = {
  [EnvironmentEntityName.VendingMachine]: "VendingMachine",
  [EnvironmentEntityName.ThreatTargetChangedArrow]: "ThreatTargetChangedArrow",
};
