import { AbstractMesh, Nullable, Observer, PointerEventTypes, PointerInfo } from "@babylonjs/core";
import { EntityId } from "@speed-dungeon/common";
import { GameWorldView } from ".";

// the "plus"/spreadsheet cursor
const COMBATANT_HOVER_CURSOR = "crosshair";

export class CombatantMeshPickingManager {
  hoveredCombatantEntityId: EntityId | null = null;
  private pointerObserver: Nullable<Observer<PointerInfo>>;

  constructor(private gameWorldView: GameWorldView) {
    this.pointerObserver = gameWorldView.scene.onPointerObservable.add((pointerInfo) => {
      // skip while a button is held so the cursor doesn't flicker during a camera-orbit drag
      if (pointerInfo.type === PointerEventTypes.POINTERMOVE && pointerInfo.event.buttons === 0) {
        this.updateHoveredCombatant();
      }
    });
  }

  private updateHoveredCombatant() {
    const { scene } = this.gameWorldView;
    const pickInfo = scene.pick(scene.pointerX, scene.pointerY);
    const hoveredEntityId =
      pickInfo?.pickedMesh != null
        ? this.getCombatantEntityIdForMesh(pickInfo.pickedMesh)
        : undefined;
    this.setHoveredCombatant(hoveredEntityId ?? null);
  }

  private setHoveredCombatant(entityId: EntityId | null) {
    if (entityId === this.hoveredCombatantEntityId) {
      return;
    }
    this.hoveredCombatantEntityId = entityId;
    // drive scene.defaultCursor rather than canvas.style.cursor directly: babylon rewrites the
    // canvas cursor to scene.defaultCursor on every pointer move for meshes without an
    // actionManager, which would otherwise clobber a direct set a frame later
    this.gameWorldView.scene.defaultCursor = entityId === null ? "" : COMBATANT_HOVER_CURSOR;
  }

  private getCombatantEntityIdForMesh(mesh: AbstractMesh): EntityId | undefined {
    const { combatantSceneEntityManager } = this.gameWorldView.sceneEntityService;
    for (const [entityId, sceneEntity] of combatantSceneEntityManager.sceneEntities) {
      if (mesh.isDescendantOf(sceneEntity.rootTransformNode)) {
        return entityId;
      }
    }
    return undefined;
  }

  cleanup() {
    this.gameWorldView.scene.onPointerObservable.remove(this.pointerObserver);
    this.pointerObserver = null;
    this.gameWorldView.scene.defaultCursor = "";
  }
}
