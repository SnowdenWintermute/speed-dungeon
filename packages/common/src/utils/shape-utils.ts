export interface BoxDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface SphereDimensions {
  diameter: number;
}

export enum ShapeType3D {
  Box,
  Sphere,
}

export interface TaggedBoxDimensions {
  type: ShapeType3D;
  dimensions: BoxDimensions;
}

export interface TaggedSphereDimensions {
  type: ShapeType3D;
  dimensions: SphereDimensions;
}

export type TaggedShape3DDimensions = TaggedBoxDimensions | TaggedSphereDimensions;
