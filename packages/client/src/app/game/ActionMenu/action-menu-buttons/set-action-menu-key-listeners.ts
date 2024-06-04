import { ActionButtonPropertiesByCategory } from "../build-action-button-properties";

export default function setActionMenuKeyListeners(
  buttonPropertiesByCategory: ActionButtonPropertiesByCategory,
  listenerRef: React.MutableRefObject<((...args: any[]) => void) | null>
) {
  const listener = (e: KeyboardEvent) => handleActionButtonKeyEvent(e, buttonPropertiesByCategory);
  listenerRef.current = listener;
  window.addEventListener("keyup", listener);
}

export function handleActionButtonKeyEvent(
  e: KeyboardEvent,
  buttonPropertiesByCategory: ActionButtonPropertiesByCategory
) {
  const keyPressed = e.code;
  console.log(e.code);
  let nextNumberToAssign = 1;
  for (const category of Object.values(buttonPropertiesByCategory)) {
  }
}
