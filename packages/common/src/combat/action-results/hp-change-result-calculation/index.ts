export interface ValueChangesAndCrits {
  valueChangesByEntityId: { [entityId: string]: number };
  entityIdsCrit: string[];
}
