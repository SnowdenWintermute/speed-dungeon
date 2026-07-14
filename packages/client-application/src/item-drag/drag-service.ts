import { makeAutoObservable } from "mobx";
import { ClientApplication } from "..";
import { DragSource, DropTarget, PointerPosition, dropTargetsEqual } from "./types";
import { DropResolution, DropResolutionType, resolveDrop } from "./resolve-drop";

export class ItemDragService {
  current: DragSource | null = null;
  pointerPosition: PointerPosition = { x: 0, y: 0 };
  hoveredTarget: DropTarget | null = null;

  constructor(private clientApplication: ClientApplication) {
    makeAutoObservable(this);
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
    if (this.current === null) return { type: DropResolutionType.Incompatible };
    const character = this.clientApplication.combatantFocus.requireFocusedCharacter();
    return resolveDrop(this.current, target, character, this.clientApplication.itemCommands);
  }

  completeDrop() {
    if (this.hoveredTarget !== null) {
      const resolution = this.resolve(this.hoveredTarget);
      if (resolution.type === DropResolutionType.Valid) resolution.execute();
    }
    this.end();
  }
}
