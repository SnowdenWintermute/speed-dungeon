import { Vector2 } from "@babylonjs/core";

export enum CurveType {
  GradualToPeakThenSharpDrop,
  EaseOut,
}

export class InterpolationCurves {
  private constructor() {}

  static getCurveByType(curveType: CurveType) {
    return INTERPOLATION_CURVES_BY_TYPE[curveType];
  }

  static easeInOut(t: number) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  static easeIn(t: number) {
    return t * t;
  }

  static easeOut(t: number) {
    return t * (2 - t);
  }
}

const INTERPOLATION_CURVES_BY_TYPE: Record<CurveType, (t: number) => number> = {
  [CurveType.GradualToPeakThenSharpDrop]: function (t: number): number {
    return t;
  },
  [CurveType.EaseOut]: InterpolationCurves.easeOut,
};

export class CubicBezierCurve {
  constructor(
    private readonly start: Vector2,
    private readonly mod1: Vector2,
    private readonly mod2: Vector2,
    private readonly end: Vector2
  ) {}

  getPoint(t: number): Vector2 {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;

    return new Vector2(
      uuu * this.start.x + 3 * uu * t * this.mod1.x + 3 * u * tt * this.mod2.x + ttt * this.end.x,
      uuu * this.start.y + 3 * uu * t * this.mod1.y + 3 * u * tt * this.mod2.y + ttt * this.end.y
    );
  }

  static computeRelativeControls(start: Vector2, mod1: Vector2, mod2: Vector2, end: Vector2) {
    const base = end.subtract(start);
    const baseLength = base.length();

    const rel1 = mod1.subtract(start);
    const rel2 = mod2.subtract(start);

    return {
      mod1Ratio: rel1.length() / baseLength,
      mod2Ratio: rel2.length() / baseLength,
      mod1NormalOffset: rel1.subtract(base.normalize().scale(rel1.length())),
      mod2NormalOffset: rel2.subtract(base.normalize().scale(rel2.length())),
    };
  }

  static buildControlsFromExample(
    newStart: Vector2,
    newEnd: Vector2,
    example: {
      mod1Ratio: number;
      mod2Ratio: number;
      mod1NormalOffset: Vector2;
      mod2NormalOffset: Vector2;
    }
  ) {
    const base = newEnd.subtract(newStart);
    const baseUnit = base.normalize();
    const baseLength = base.length();

    const mod1 = newStart
      .add(baseUnit.scale(baseLength * example.mod1Ratio))
      .add(example.mod1NormalOffset);

    const mod2 = newStart
      .add(baseUnit.scale(baseLength * example.mod2Ratio))
      .add(example.mod2NormalOffset);

    return { mod1, mod2 };
  }
}

// 1. Define your example curve
const exampleStart = new Vector2(0, 0);
const exampleEnd = new Vector2(15, 0);
const exampleMod1 = new Vector2(7, 5);
const exampleMod2 = new Vector2(15, 10);

// 2. Compute the relative template
export const exampleTemplate = CubicBezierCurve.computeRelativeControls(
  exampleStart,
  exampleMod1,
  exampleMod2,
  exampleEnd
);

// 3. For any new start/end
const newStart = new Vector2(5, 2);
const newEnd = new Vector2(25, 4);

// 4. Build new control points proportionally
const { mod1, mod2 } = CubicBezierCurve.buildControlsFromExample(newStart, newEnd, exampleTemplate);
// 5. Create a new curve instance
const newCurve = new CubicBezierCurve(newStart, mod1, mod2, newEnd);
