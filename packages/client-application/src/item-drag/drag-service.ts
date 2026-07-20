import { Item } from "@speed-dungeon/common";
import { makeAutoObservable, observable } from "mobx";
import { ClientApplication } from "..";
import { DragSource, DragSourceType, DropTarget, PointerPosition, dropTargetsEqual } from "./types";
import { DropResolution, DropResolutionType, resolveDrop } from "./resolve-drop";

export class ItemDragService {
  current: DragSource | null = null;
  pointerPosition: PointerPosition = { x: 0, y: 0 };
  hoveredTarget: DropTarget | null = null;

  constructor(private clientApplication: ClientApplication) {
    // store the drag source/target by reference so mobx doesn't deep-proxy their nested plain
    // objects (e.g. a slot), which would then fail to structured-clone when dispatched in an intent
    makeAutoObservable(this, {
      current: observable.ref,
      hoveredTarget: observable.ref,
    });
  }

  isDragging() {
    return this.current !== null;
  }

  begin(source: DragSource, pointerPosition: PointerPosition) {
    this.current = source;
    this.pointerPosition = pointerPosition;
    this.hoveredTarget = null;
  }

  setPointerPosition(pointerPosition: PointerPosition) {
    this.pointerPosition = pointerPosition;
  }

  setHoveredTarget(target: DropTarget) {
    this.hoveredTarget = target;
  }

  clearHoveredTarget(target: DropTarget) {
    if (this.hoveredTarget !== null && dropTargetsEqual(this.hoveredTarget, target)) {
      this.hoveredTarget = null;
    }
  }

  end() {
    this.current = null;
    this.hoveredTarget = null;
  }

  // resolve the current drag against an arbitrary target — used by targets to decide their own
  // highlight during a drag, and internally to complete a drop
  resolve(target: DropTarget): DropResolution {
    if (this.current === null) {
      return { type: DropResolutionType.Incompatible };
    }
    const character = this.clientApplication.combatantFocus.requireFocusedCharacter();
    return resolveDrop(this.current, target, character, this.clientApplication.itemCommands);
  }

  completeDrop() {
    if (this.hoveredTarget !== null) {
      const resolution = this.resolve(this.hoveredTarget);
      if (resolution.type === DropResolutionType.Valid) {
        resolution.execute();
      }
    }
    this.end();
  }

  // the item represented by the current drag, for rendering the preview. For an equipped source the
  // item is derived from its slot rather than stored on the source.
  getDraggedItem(): Item | null {
    const source = this.current;
    if (source === null) {
      return null;
    }
    switch (source.type) {
      case DragSourceType.InventoryItem:
      case DragSourceType.GroundItem:
        return source.item;
      case DragSourceType.EquippedItem: {
        const character = this.clientApplication.combatantFocus.requireFocusedCharacter();
        return character.combatantProperties.equipment.getEquipmentInSlot(source.slot) ?? null;
      }
    }
  }
}
