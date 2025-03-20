import { CombatantCondition } from "@speed-dungeon/common";
import React from "react";

interface Props {
  conditions: CombatantCondition[];
}

export default function ConditionIndicators(props: Props) {
  const { conditions } = props;
  return (
    <div>
      {conditions.map((condition, i) => (
        <li key={i}>"a"</li>
      ))}
    </div>
  );
}
