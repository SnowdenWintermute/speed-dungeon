import { ActionButtonCategory, ActionMenuButtonProperties } from "../action-menu-button-properties";
import { ActionButtonPropertiesByCategory } from "../build-action-button-properties";
import ChangeTargetButton from "./ChangeTargetButton";
import NumberedButton from "./NumberedButton";
import TopButton from "./TopButton";

export interface ButtonsByCategory {
  top: JSX.Element[];
  numbered: JSX.Element[];
  nextPrev: JSX.Element[];
}

export default function createActionMenuButtons(
  buttonProperties: ActionButtonPropertiesByCategory,
  numberedButtonPropertiesOnCurrentPage: ActionMenuButtonProperties[]
): ButtonsByCategory {
  let lastAssignedNumber = 0;
  const buttonsByCategory: ButtonsByCategory = {
    top: [],
    numbered: [],
    nextPrev: [],
  };

  for (const properties of Object.values(buttonProperties[ActionButtonCategory.Top])) {
    buttonsByCategory.top.push(<TopButton properties={properties} />);
  }

  for (const properties of Object.values(numberedButtonPropertiesOnCurrentPage)) {
    lastAssignedNumber += 1;
    buttonsByCategory.numbered.push(
      <NumberedButton properties={properties} number={lastAssignedNumber} />
    );
  }

  for (const properties of Object.values(buttonProperties[ActionButtonCategory.NextPrevious])) {
    buttonsByCategory.nextPrev.push(
      <ChangeTargetButton
        properties={properties}
        key={properties.dedicatedKeysOption?.toString()}
      />
    );
  }

  return buttonsByCategory;
}
