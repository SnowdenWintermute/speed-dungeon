import { useClientApplication } from "@/hooks/create-client-application-context";
import { DropTarget, dropTargetsEqual } from "@/client-application/item-drag/types";
import { DropResolution, DropResolutionType } from "@/client-application/item-drag/resolve-drop";

export interface DropTargetState {
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  resolution: DropResolution;
  isDragging: boolean;
  isHovered: boolean;
}

// Wires an element as a drop target: reports how the current drag resolves against it (for
// highlighting) and tracks it as the hovered target while the pointer is over it.
export function useDropTarget(target: DropTarget): DropTargetState {
  const { dragService } = useClientApplication();
  const isDragging = dragService.isDragging();
  const resolution: DropResolution = isDragging
    ? dragService.resolve(target)
    : { type: DropResolutionType.Incompatible };
  const isHovered =
    dragService.hoveredTarget !== null && dropTargetsEqual(dragService.hoveredTarget, target);

  function onPointerEnter() {
    if (dragService.isDragging()) {
      dragService.setHoveredTarget(target);
    }
  }

  function onPointerLeave() {
    dragService.clearHoveredTarget(target);
  }

  return { onPointerEnter, onPointerLeave, resolution, isDragging, isHovered };
}
