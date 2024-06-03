import { ActionButtonPropertiesByCategory } from "../build-action-button-properties";
import NumberedButton from "./NumberedButton";

export interface ButtonsByCategory {
  top: JSX.Element[];
  numbered: JSX.Element[];
  nextPrev: JSX.Element[];
}

export default function createActionMenuButtons(
  buttonProperties: ActionButtonPropertiesByCategory
): ButtonsByCategory {
  let lastAssignedNumber = 0;
  const buttonsByCategory: ButtonsByCategory = {
    top: [],
    numbered: [],
    nextPrev: [],
  };

  for (const properties of Object.values(buttonProperties.numbered)) {
    lastAssignedNumber += 1;
    buttonsByCategory.numbered.push(
      <NumberedButton properties={properties} number={lastAssignedNumber} />
    );
  }

  return buttonsByCategory;
}
