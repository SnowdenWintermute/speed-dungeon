import { CombatAction } from "@speed-dungeon/common";
import React from "react";

interface Props {
  combatAction: CombatAction;
  hideTitle: boolean;
}

export default function ActionDetails({ combatAction, hideTitle }: Props) {
  return (
    <div>
      {!hideTitle && (
        <>
          <span>
            {
              // action_name
            }
          </span>
          <div className="mb-1 mt-1 h-[1px] bg-slate-400" />
        </>
      )}
      {
        // ability_details
      }
      <div>
        {
          // combat_action_properties.description
        }
      </div>
      <div>
        {"Valid targets: "}
        {
          // combat_action_properties.valid_target_categories
        }
      </div>
      <div>
        {"Targeting schemes: "}
        {
          // targeting_schemes_text
        }
      </div>
      <div>
        {"Usable "}
        {
          // "{}", combat_action_properties.usability_context
        }
      </div>
    </div>
  );
}
