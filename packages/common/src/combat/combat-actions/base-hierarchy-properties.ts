import { ActionResolutionStepContext } from "../../action-processing/index.js";

export const BASE_ACTION_HIERARCHY_PROPERTIES = {
  getChildren: function (context: ActionResolutionStepContext) {
    return [];
  },
  getParent: function () {
    return null;
  },
};

