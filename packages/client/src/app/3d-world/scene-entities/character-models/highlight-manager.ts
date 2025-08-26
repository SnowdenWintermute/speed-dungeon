import {
  Color3,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import { useGameStore } from "@/stores/game-store";
import { CharacterModel } from ".";
import { AdventuringParty, InputLock, iterateNumericEnumKeyedRecord } from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";
import { CharacterModelPartCategory } from "./modular-character-parts-model-manager/modular-character-parts";
import { actionCommandReceiver } from "@/singletons/action-command-manager";
import { getGameWorld } from "../../SceneManager";

export class HighlightManager {
  private originalPartMaterialColors: Partial<
    Record<CharacterModelPartCategory, { [meshName: string]: Color3 }>
  > = {};
  private originalEquipmentMaterialColors: {
    [equipmentId: string]: { [meshName: string]: Color3 };
  } = {};
  public targetingIndicator: null | Mesh = null;
  public isHighlighted: boolean = false;
  constructor(private modularCharacter: CharacterModel) {}

  setHighlighted() {
    for (const [partCategory, part] of iterateNumericEnumKeyedRecord(
      this.modularCharacter.modularCharacterPartsManager.parts
    )) {
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

    for (const equipmentModel of this.modularCharacter.equipmentModelManager.getAllModels()) {
      const originalColors: { [meshName: string]: Color3 } = {};

      for (const mesh of equipmentModel.assetContainer.meshes) {
        const { material } = mesh;
        if (!(material instanceof StandardMaterial) && !(material instanceof PBRMaterial)) continue;
        const originalColor = cloneDeep(material.emissiveColor);
        originalColors[mesh.name] = originalColor;
      }

      this.originalEquipmentMaterialColors[equipmentModel.entityId] = originalColors;
    }

    this.isHighlighted = true;

    this.targetingIndicator = create3dTargetingIndicator(this.modularCharacter.world.scene);

    this.targetingIndicator.setParent(this.modularCharacter.rootTransformNode);
    this.targetingIndicator.position.copyFrom(Vector3.Zero());

    const offsetTop = 0.1;
    this.targetingIndicator.position.y =
      this.modularCharacter.rootMesh.getBoundingInfo().boundingBox.maximumWorld.y +
      this.targetingIndicator.getBoundingInfo().boundingBox.maximum.y -
      this.targetingIndicator.getBoundingInfo().boundingBox.minimum.y +
      offsetTop;
  }

  removeHighlight() {
    for (const [partCategory, part] of iterateNumericEnumKeyedRecord(
      this.modularCharacter.modularCharacterPartsManager.parts
    )) {
      if (!part) continue;

      const originalColors = this.originalPartMaterialColors[partCategory];
      if (!originalColors) {
        // console.info("original colors not found when removing highlight");
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

    for (const equipmentModel of this.modularCharacter.equipmentModelManager.getAllModels()) {
      const originalColors = this.originalEquipmentMaterialColors[equipmentModel.entityId];
      if (!originalColors) {
        // console.info("original colors not found when removing highlight");
        continue;
      }
      for (const mesh of equipmentModel.assetContainer.meshes) {
        const { material } = mesh;
        if (!(material instanceof StandardMaterial) && !(material instanceof PBRMaterial)) continue;
        const originalColorOption = originalColors[mesh.name];
        if (originalColorOption) material.emissiveColor = originalColorOption;
      }

      delete this.originalEquipmentMaterialColors[equipmentModel.entityId];
    }

    this.isHighlighted = false;

    if (this.targetingIndicator) {
      this.targetingIndicator.dispose(false, true);
    }
  }

  updateHighlight() {
    const partyResult = useGameStore.getState().getParty();
    if (!(partyResult instanceof Error)) {
      // const indicators = useGameStore
      //   .getState()
      //   .targetingIndicators.filter(
      //     (indicator) => indicator.targetId === this.modularCharacter.entityId
      //   );
      //

      const gameOption = useGameStore.getState().game;
      if (gameOption === null) return;
      const battleOption = AdventuringParty.getBattleOption(partyResult, gameOption);
      if (battleOption === null) return;

      const isMonster = partyResult.currentRoom.monsterPositions.includes(
        this.modularCharacter.entityId
      );
      if (isMonster) return;

      const isTurn =
        battleOption.turnOrderManager.getFastestActorTurnOrderTracker().combatantId ===
        this.modularCharacter.getCombatant().entityProperties.id;

      const inputIsLocked = InputLock.isLocked(partyResult.inputLock);

      const isSelectingActionTargets = useGameStore.getState().targetingIndicators.length > 0;

      // if (indicators.length && !this.isHighlighted) {
      if (isTurn && !this.isHighlighted && !inputIsLocked && !isSelectingActionTargets) {
        this.setHighlighted();
        // } else if (this.isHighlighted && !indicators.length) {
      } else if ((this.isHighlighted && !isTurn) || inputIsLocked || isSelectingActionTargets) {
        this.removeHighlight();
      }
    }

    if (!this.isHighlighted) return;

    const base = 0.05;
    const amplitude = 0.15;
    const frequency = 0.3;
    const elapsed = Date.now() / 1000;
    const scale = base + amplitude + amplitude * Math.sin(2 * Math.PI * frequency * elapsed);

    // spin the targetingIndicator

    const rotation = elapsed;
    const isFocused = this.modularCharacter.entityId === useGameStore.getState().focusedCharacterId;
    const color = updateColor(scale, amplitude, base, isFocused);

    if (this.targetingIndicator) {
      this.targetingIndicator.rotation.y = rotation;
      if (this.targetingIndicator.material instanceof StandardMaterial) {
        this.targetingIndicator.material.diffuseColor.r = color.r;
        this.targetingIndicator.material.diffuseColor.g = color.g;
        this.targetingIndicator.material.diffuseColor.b = color.b;
      }
    }

    // glow the character and their equipment

    for (const [_partCategory, part] of iterateNumericEnumKeyedRecord(
      this.modularCharacter.modularCharacterPartsManager.parts
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

    for (const equipmentModel of this.modularCharacter.equipmentModelManager.getAllModels()) {
      for (const mesh of equipmentModel.assetContainer.meshes) {
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
  // material.diffuseColor = new Color3(0.941, 0.788, 0.565);

  mesh.material = material;
  mesh.visibility = 0.75;

  return mesh;
}

function updateColor(value: number, amplitude: number, base: number, isFocused: boolean) {
  const colorA = DARKER_YELLOW;
  const colorB = LIGHTER_YELLOW;

  // Normalize value to [0, 1]
  const normalizedValue = (value - base) / (2 * amplitude);
  const color = Color3.Lerp(colorA, colorB, normalizedValue);
  if (!isFocused) {
    const luminance = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
    const greyScale = new Color3(luminance, luminance, luminance);
    return greyScale;
  }

  return color;
}

const BEIGE = new Color3(0.918, 0.776, 0.69);
const DARKER_YELLOW = new Color3(0.725, 0.576, 0.243);
const LIGHTER_YELLOW = new Color3(0.941, 0.788, 0.565);
