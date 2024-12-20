import {
  Color3,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import { ModularCharacter } from ".";
import { iterateNumericEnumKeyedRecord } from "@speed-dungeon/common";
import { ModularCharacterPartCategory } from "./modular-character-parts";
import cloneDeep from "lodash.clonedeep";

export class HighlightManager {
  private originalPartMaterialColors: Partial<
    Record<ModularCharacterPartCategory, { [meshName: string]: Color3 }>
  > = {};
  private originalEquipmentMaterialColors: {
    [equipmentId: string]: { [meshName: string]: Color3 };
  } = {};
  private targetingIndicator: null | Mesh = null;
  public isHighlighted: boolean = false;
  constructor(private modularCharacter: ModularCharacter) {}

  setHighlighted() {
    for (const [partCategory, part] of iterateNumericEnumKeyedRecord(this.modularCharacter.parts)) {
      if (!part) continue;

      const originalColors: { [meshName: string]: Color3 } = {};

      for (const mesh of part.meshes) {
        const { material } = mesh;
        if (!(material instanceof StandardMaterial) && !(material instanceof PBRMaterial)) continue;
        const originalColor = cloneDeep(material.emissiveColor);
        originalColors[mesh.name] = originalColor;
      }

      this.originalPartMaterialColors[partCategory] = originalColors;
    }

    for (const [equipmentId, equipmentModel] of Object.entries(
      this.modularCharacter.equipment.holdables
    )) {
      const originalColors: { [meshName: string]: Color3 } = {};

      for (const mesh of equipmentModel.meshes) {
        const { material } = mesh;
        if (!(material instanceof StandardMaterial) && !(material instanceof PBRMaterial)) continue;
        const originalColor = cloneDeep(material.emissiveColor);
        originalColors[mesh.name] = originalColor;
      }

      this.originalEquipmentMaterialColors[equipmentId] = originalColors;
    }

    this.isHighlighted = true;

    this.targetingIndicator = create3dTargetingIndicator(this.modularCharacter.world.scene);

    this.targetingIndicator.position.copyFrom(this.modularCharacter.rootTransformNode.position);

    this.targetingIndicator.position.y =
      this.modularCharacter.rootMesh.getBoundingInfo().boundingBox.maximumWorld.y +
      (this.targetingIndicator.getBoundingInfo().maximum.y -
        this.targetingIndicator.getBoundingInfo().minimum.y);
  }

  removeHighlight() {
    for (const [partCategory, part] of iterateNumericEnumKeyedRecord(this.modularCharacter.parts)) {
      if (!part) continue;

      const originalColors = this.originalPartMaterialColors[partCategory];
      if (!originalColors) {
        console.error("original colors not found when removing highlight");
        continue;
      }

      for (const mesh of part.meshes) {
        const { material } = mesh;
        if (!(material instanceof StandardMaterial) && !(material instanceof PBRMaterial)) continue;
        const originalColorOption = originalColors[mesh.name];
        if (originalColorOption) material.emissiveColor = originalColorOption;
      }
      delete this.originalPartMaterialColors[partCategory];
    }

    for (const [equipmentId, equipmentModel] of Object.entries(
      this.modularCharacter.equipment.holdables
    )) {
      const originalColors = this.originalEquipmentMaterialColors[equipmentId];
      if (!originalColors) {
        console.error("original colors not found when removing highlight");
        continue;
      }
      for (const mesh of equipmentModel.meshes) {
        const { material } = mesh;
        if (!(material instanceof StandardMaterial) && !(material instanceof PBRMaterial)) continue;
        const originalColorOption = originalColors[mesh.name];
        if (originalColorOption) material.emissiveColor = originalColorOption;
      }

      delete this.originalEquipmentMaterialColors[equipmentId];
    }

    this.isHighlighted = false;

    this.targetingIndicator?.dispose();
  }

  updateHighlight() {
    if (!this.isHighlighted) return;

    const base = 0.05;
    const amplitude = 0.15;
    const frequency = 0.3;
    const elapsed = Date.now() / 1000;
    const scale = base + amplitude + amplitude * Math.sin(2 * Math.PI * frequency * elapsed);

    for (const [_partCategory, part] of iterateNumericEnumKeyedRecord(
      this.modularCharacter.parts
    )) {
      if (!part) continue;

      for (const mesh of part.meshes) {
        const { material } = mesh;

        if (material instanceof StandardMaterial || material instanceof PBRMaterial) {
          const baseColor =
            material instanceof PBRMaterial ? material.albedoColor : material.diffuseColor;
          material.emissiveColor.r = baseColor.r * scale;
          material.emissiveColor.g = baseColor.g * scale;
          material.emissiveColor.b = baseColor.b * scale;
        }
      }
    }

    for (const [_entityId, equipmentModel] of Object.entries(
      this.modularCharacter.equipment.holdables
    )) {
      for (const mesh of equipmentModel.meshes) {
        const { material } = mesh;

        if (material instanceof StandardMaterial || material instanceof PBRMaterial) {
          const baseColor =
            material instanceof PBRMaterial ? material.albedoColor : material.diffuseColor;
          material.emissiveColor.r = baseColor.r * scale * 0.5;
          material.emissiveColor.g = baseColor.g * scale * 0.5;
          material.emissiveColor.b = baseColor.b * scale * 0.5;
        }
      }
    }
  }
}

// beige  0.918, 0.776, 0.69
// darkeryellow 0.725, 0.576, 0.243
// lighteryellow 0.941, 0.788, 0.565

function create3dTargetingIndicator(scene: Scene) {
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

  // Create the mesh
  const mesh = MeshBuilder.CreatePolyhedron(
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
  material.diffuseColor = new Color3(0.941, 0.788, 0.565);
  mesh.material = material;

  return mesh;
}
