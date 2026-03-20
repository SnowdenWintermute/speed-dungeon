import { Color3, Mesh, MeshBuilder, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import { CombatantSceneEntity } from "..";
import { PulseEffectParameters } from ".";

const offsetTop = 0.1;
const DARKER_YELLOW = new Color3(0.725, 0.576, 0.243);
const LIGHTER_YELLOW = new Color3(0.941, 0.788, 0.565);

export class TurnIndicator {
  private mesh: Mesh;
  constructor(scene: Scene) {
    const topRadius = 1; // Radius of the top triangle
    const elongation = 3; // How far the tip extends downward
    // Top triangle vertices
    // Define    // Calculate top vertices of the equilateral triangle in the XZ-plane
    const topVertices = [
      [topRadius, 0, 0], // Vertex 0
      [
        -topRadius / 2,
        0,
        (Math.sqrt(3) * topRadius) / 2, // Vertex 1
      ],
      [
        -topRadius / 2,
        0,
        (-Math.sqrt(3) * topRadius) / 2, // Vertex 2
      ],
    ];

    // Bottom vertex, elongated downward along the Y-axis
    const bottomVertex = [0, -elongation, 0]; // Vertex 3 faces with CCW winding
    const vertices = [...topVertices, bottomVertex];

    const faces = [
      [0, 1, 3], // Side face 1
      [1, 2, 3], // Side face 2
      [2, 0, 3], // Side face 3
      [0, 2, 1], // Base face
    ];

    this.mesh = MeshBuilder.CreatePolyhedron(
      "arrowTetrahedron",
      {
        custom: {
          vertex: vertices,
          face: faces,
        },
        size: 0.2,
      },
      scene
    );

    const material = new StandardMaterial("targeting indicator material", scene);
    // material.diffuseColor = new Color3(0.941, 0.788, 0.565);

    this.mesh.material = material;
    this.mesh.visibility = 0.75;
  }

  attachToCombatantEntity(sceneEntity: CombatantSceneEntity) {
    this.mesh.setParent(sceneEntity.rootTransformNode);
    this.mesh.position.copyFrom(Vector3.Zero());

    this.mesh.position.y =
      sceneEntity.rootMesh.getBoundingInfo().boundingBox.maximumWorld.y +
      this.mesh.getBoundingInfo().boundingBox.maximum.y -
      this.mesh.getBoundingInfo().boundingBox.minimum.y +
      offsetTop;
  }

  dispose() {
    this.mesh.dispose(false, true);
  }

  update(pulseEffectParameters: PulseEffectParameters, isFocused: boolean) {
    const rotation = pulseEffectParameters.elapsed;

    const color = this.updateColor(pulseEffectParameters, isFocused);

    this.mesh.rotation.y = rotation;
    if (!(this.mesh.material instanceof StandardMaterial)) return;
    this.mesh.material.diffuseColor.copyFrom(color);
  }

  private updateColor(pulseEffectParameters: PulseEffectParameters, isFocused: boolean) {
    const colorA = DARKER_YELLOW;
    const colorB = LIGHTER_YELLOW;

    const { normalized } = pulseEffectParameters;
    const color = Color3.Lerp(colorA, colorB, normalized);
    if (!isFocused) {
      const luminance = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
      const greyScale = new Color3(luminance, luminance, luminance);
      return greyScale;
    }

    return color;
  }
}
