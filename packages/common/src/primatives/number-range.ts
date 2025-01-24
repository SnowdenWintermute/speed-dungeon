export class NumberRange {
  constructor(
    public min: number,
    public max: number
  ) {}

  getAverage() {
    return Math.floor(this.min + this.max / 2);
  }
}
