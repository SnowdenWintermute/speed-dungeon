export class MaxAndCurrent {
  constructor(
    public max: number,
    public current: number
  ) {}

  addValue(value: number) {
    this.current = Math.max(0, Math.min(this.max, this.current + value));
  }
}
