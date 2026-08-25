import { Serializable, SerializedOf } from "../serialization/index.js";

export class NumberRange implements Serializable {
  constructor(
    public min: number,
    public max: number
  ) {}

  toSerialized() {
    return { min: this.min, max: this.max };
  }

  static fromSerialized(serialized: SerializedOf<NumberRange>) {
    return new NumberRange(serialized.min, serialized.max);
  }

  isValid() {
    return this.min <= this.max;
  }

  getAverage() {
    return Math.floor((this.min + this.max) / 2);
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

  toString() {
    return `${this.min}-${this.max}`;
  }
}
