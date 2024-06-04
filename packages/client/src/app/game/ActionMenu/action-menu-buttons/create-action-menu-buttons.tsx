import { ActionButtonCategory } from "../action-menu-button-properties";
import { ActionButtonPropertiesByCategory } from "../build-action-button-properties";
import NumberedButton from "./NumberedButton";
import TopButton from "./TopButton";

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

  for (const properties of Object.values(buttonProperties[ActionButtonCategory.Top])) {
    lastAssignedNumber += 1;
    buttonsByCategory.top.push(<TopButton properties={properties} />);
  }

  for (const properties of Object.values(buttonProperties[ActionButtonCategory.Numbered])) {
    lastAssignedNumber += 1;
    buttonsByCategory.numbered.push(
      <NumberedButton properties={properties} number={lastAssignedNumber} />
    );
  }

  return buttonsByCategory;
}
