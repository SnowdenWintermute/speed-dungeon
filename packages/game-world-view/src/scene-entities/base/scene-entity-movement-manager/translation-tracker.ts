import { TransformNode, Vector2, Vector3 } from "@babylonjs/core";
import {
  CubicBezierCurve,
  CurveType,
  exampleTemplate,
  InterpolationCurves,
  Milliseconds,
  NormalizedPercentage,
} from "@speed-dungeon/common";
import { SceneEntityMovementTracker } from "./movement-tracker";

export class TranslationTracker extends SceneEntityMovementTracker {
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
      const start3 = this.previous; // Vector3
      const end3 = this.destination; // Vector3
      const forward = end3.subtract(start3).normalize();
      const worldUp = new Vector3(0, 1, 0);

      let tempUp = worldUp;
      if (Math.abs(forward.dot(worldUp)) > 0.99) {
        tempUp = new Vector3(1, 0, 0); // fallback if almost parallel
      }
      const right = forward.cross(tempUp).normalize();
      const up = right.cross(forward).normalize();
      if (this.computedCurve === undefined) {
        const startVec2 = projectToPlane(start3, start3, forward, up); // always (0,0)
        const endVec2 = projectToPlane(end3, start3, forward, up); // (distance, vertical offset)

        const { mod1, mod2 } = CubicBezierCurve.buildControlsFromExample(
          startVec2,
          endVec2,
          exampleTemplate
        );
        this.computedCurve = new CubicBezierCurve(startVec2, mod1, mod2, endVec2);
      }

      const curvePosition = this.computedCurve.getPoint(lerpPercentage);

      newPosition = toWorld(curvePosition, this.previous, forward, up);
    }

    this.movable.position.copyFrom(newPosition);
    this.onUpdate(lerpPercentage);
  }

  getDestination(): Vector3 {
    return this.destination;
  }
}

function projectToPlane(point: Vector3, origin: Vector3, forward: Vector3, up: Vector3): Vector2 {
  const local = point.subtract(origin);
  return new Vector2(
    local.dot(forward), // X coordinate along forward direction
    local.dot(up) // Y coordinate along up direction (height)
  );
}

function toWorld(v: Vector2, origin: Vector3, forward: Vector3, up: Vector3): Vector3 {
  return origin.add(forward.scale(v.x)).add(up.scale(v.y));
}
