import { DropResolution, DropResolutionType } from "@/client-application/item-drag/resolve-drop";
import {
  DRAG_BLOCKED_BORDER,
  DRAG_BLOCKED_BORDER_HOVERED,
  DRAG_VALID_BG,
  DRAG_VALID_BG_HOVERED,
  DRAG_VALID_BORDER,
  DRAG_VALID_BORDER_HOVERED,
} from "@/client-consts";

// border color for a drop target given how the current drag resolves against it; null when the
// target isn't a candidate (so callers can fall back to their normal border)
export function dropTargetBorderClass(
  resolution: DropResolution,
  isHovered: boolean
): string | null {
  switch (resolution.type) {
    case DropResolutionType.Valid:
      return isHovered ? DRAG_VALID_BORDER_HOVERED : DRAG_VALID_BORDER;
    case DropResolutionType.Blocked:
      return isHovered ? DRAG_BLOCKED_BORDER_HOVERED : DRAG_BLOCKED_BORDER;
    case DropResolutionType.Incompatible:
      return null;
  }
}

// background tint for a droppable-area target; "" unless the drag can validly drop here
export function dropTargetBgClass(resolution: DropResolution, isHovered: boolean): string {
  if (resolution.type !== DropResolutionType.Valid) {
    return "";
  }
  return isHovered ? DRAG_VALID_BG_HOVERED : DRAG_VALID_BG;
}
