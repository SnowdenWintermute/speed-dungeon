export enum ConsumableType {
  HpAutoinjector,
  MpAutoinjector,
}

export class ConsumableProperties {
  constructor(
    public consumableType: ConsumableType,
    usesRemaining: number
  ) {}
}
