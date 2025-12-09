import { Quaternion, TransformNode, Vector2, Vector3 } from "@babylonjs/core";
import {
  CubicBezierCurve,
  CurveType,
  ERROR_MESSAGES,
  exampleTemplate,
  InterpolationCurves,
  Milliseconds,
  NormalizedPercentage,
} from "@speed-dungeon/common";

export enum ModelMovementType {
  Rotation,
  Translation,
}

export abstract class ModelMovementTracker {
  private timeStarted: number = Date.now();
  constructor(
    protected movable: TransformNode,
    protected duration: number
  ) {}

  abstract onComplete: () => void;
  abstract getDestination(): Vector3 | Quaternion;

  percentComplete() {
    const elapsed = Date.now() - this.timeStarted;
    let percent = 1;
    if (this.duration > 0) percent = Math.max(0, Math.min(1, elapsed / this.duration));
    return percent;
  }

  isComplete(): boolean {
    return this.percentComplete() >= 1;
  }

  updateMovable() {
    throw new Error("not implemented");
  }
}

export class TranslationTracker extends ModelMovementTracker {
  private computedCurve: CubicBezierCurve | undefined;

  constructor(
    movable: TransformNode,
    duration: Milliseconds,
    private previous: Vector3,
    private destination: Vector3,
    private curves: { pathCurveOption?: CurveType; speedCurveOption?: CurveType },
    public onComplete: () => void,
    public onUpdate: (percentComplete: NormalizedPercentage) => void
  ) {
    super(movable, duration);
  }
  updateMovable() {
    let lerpPercentage = this.percentComplete();

    if (this.curves.speedCurveOption) {
      lerpPercentage = InterpolationCurves.getCurveByType(this.curves.speedCurveOption)(
        lerpPercentage
      );
    }

    let newPosition = Vector3.Lerp(this.previous, this.destination, lerpPercentage);

    if (this.curves.pathCurveOption !== undefined) {
      if (this.computedCurve === undefined) {
        const startVec2 = new Vector2(this.previous.x, this.previous.z);
        const endVec2 = new Vector2(this.destination.x, this.destination.z);
        const { mod1, mod2 } = CubicBezierCurve.buildControlsFromExample(
          startVec2,
          endVec2,
          exampleTemplate
        );
        this.computedCurve = new CubicBezierCurve(startVec2, mod1, mod2, endVec2);
      }

      const curvePosition = this.computedCurve.getPoint(lerpPercentage);
      newPosition.x = curvePosition.x;
      newPosition.y = curvePosition.y;
    }

    this.movable.position.copyFrom(newPosition);
    this.onUpdate(lerpPercentage);
  }
  getDestination(): Vector3 {
    return this.destination;
  }
}

export class RotationTracker extends ModelMovementTracker {
  constructor(
    movable: TransformNode,
    duration: Milliseconds,
    private previous: Quaternion,
    private destination: Quaternion,
    public onComplete: () => void
  ) {
    super(movable, duration);
  }

  getDestination(): Quaternion {
    return this.destination;
  }

  updateMovable() {
    if (!this.movable.rotationQuaternion)
      return console.error(ERROR_MESSAGES.GAME_WORLD.MISSING_ROTATION_QUATERNION);
    const newPosition = Quaternion.Slerp(this.previous, this.destination, this.percentComplete());
    this.movable.rotationQuaternion.copyFrom(newPosition);
  }
}
