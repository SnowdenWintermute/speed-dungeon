import { GameKey } from "../action-menu-button-properties";
import { ActionButtonPropertiesByCategory } from "../build-action-button-properties";

export default function setActionMenuKeyListeners(
  buttonPropertiesByCategory: ActionButtonPropertiesByCategory,
  keyupListenerRef: React.MutableRefObject<((...args: any[]) => void) | null>,
  keypressListenerRef: React.MutableRefObject<((...args: any[]) => void) | null>
) {
  const keyupListener = (e: KeyboardEvent) =>
    handleActionButtonKeyUpEvent(e, buttonPropertiesByCategory);
  const keypressListener = (e: KeyboardEvent) =>
    handleActionButtonKeyPressEvent(e, buttonPropertiesByCategory);
  // store it so it can be removed in the useEffect cleanup
  keyupListenerRef.current = keyupListener;
  keypressListenerRef.current = keypressListener;
  window.addEventListener("keyup", keyupListener);
  window.addEventListener("keypress", keypressListener);
}

export function handleActionButtonKeyPressEvent(
  e: KeyboardEvent,
  buttonPropertiesByCategory: ActionButtonPropertiesByCategory
) {
  let lastNumberAssigned = 0;
  for (const category of Object.values(buttonPropertiesByCategory)) {
    for (const buttonProperties of category) {
      const assignedkeys = [];

      if (buttonProperties.dedicatedKeysOption === null) {
        lastNumberAssigned += 1;
        if (buttonProperties.shouldBeDisabled) continue;
        assignedkeys.push(`Digit${lastNumberAssigned}`);
      } else {
        if (buttonProperties.shouldBeDisabled) continue;
        for (const key of buttonProperties.dedicatedKeysOption) {
          switch (key) {
            case GameKey.Cancel:
              break; // escape only works as keyup
            case GameKey.Confirm:
              assignedkeys.push("KeyR");
              assignedkeys.push("Enter");
              break;
            case GameKey.Next:
              assignedkeys.push("KeyE");
              break;
            case GameKey.Previous:
              assignedkeys.push("KeyW");
              break;
            case GameKey.S:
              assignedkeys.push("KeyS");
              break;
            case GameKey.I:
              assignedkeys.push("KeyI");
              break;
            case GameKey.D:
              assignedkeys.push("KeyD");
              break;
            case GameKey.O:
              assignedkeys.push("KeyO");
              break;
            case GameKey.F:
              assignedkeys.push("KeyF");
              break;
            case GameKey.P:
              assignedkeys.push("KeyP");
              break;
            case GameKey.T:
              assignedkeys.push("KeyT");
              break;
          }
        }
      }

      if (assignedkeys.includes(e.code)) {
        // @ts-ignore
        buttonProperties.clickHandler(new MouseEvent("mouseup"));
      }
    }
  }
}

export function handleActionButtonKeyUpEvent(
  e: KeyboardEvent,
  buttonPropertiesByCategory: ActionButtonPropertiesByCategory
) {
  for (const category of Object.values(buttonPropertiesByCategory)) {
    for (const buttonProperties of category) {
      if (buttonProperties.shouldBeDisabled) continue;
      if (!buttonProperties.dedicatedKeysOption) continue;
      const assignedkeys = [];

      for (const key of buttonProperties.dedicatedKeysOption) {
        switch (key) {
          case GameKey.Cancel:
            assignedkeys.push("Escape");
            break;
          case GameKey.Next:
            assignedkeys.push("ArrowRight");
            break;
          case GameKey.Previous:
            assignedkeys.push("ArrowLeft");
            break;
          default:
        }
      }

      if (assignedkeys.includes(e.code)) {
        // @ts-ignore
        buttonProperties.clickHandler(new MouseEvent("mouseup"));
      }
    }
  }
}
