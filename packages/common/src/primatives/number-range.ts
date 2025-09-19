export class NumberRange {
  constructor(
    public min: number,
    public max: number
  ) {}

  getAverage() {
    return Math.floor(this.min + this.max / 2);
  }

  floor(minValue: number) {
    this.min = Math.max(minValue, Math.floor(this.min));
    this.max = Math.max(minValue, Math.floor(this.max));
  }

  mult(scalar: number) {
    this.min = this.min * scalar;
    this.max = this.max * scalar;
  }

  add(additive: number) {
    this.min = this.min += additive;
    this.max = this.max += additive;
  }
}
