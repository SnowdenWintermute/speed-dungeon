import { CombatantConditionName } from "@speed-dungeon/common";
import BombIcon from "../../../../../public/img/game-ui-icons/bomb.svg";
import IceIcon from "../../../../../public/img/game-ui-icons/ice.svg";
import FireIcon from "../../../../../public/img/game-ui-icons/fire.svg";
import EyeOpenIcon from "../../../../../public/img/game-ui-icons/eye-open.svg";
import { ReactNode } from "react";

export const CONDITION_INDICATOR_ICONS: Record<CombatantConditionName, ReactNode> = {
  [CombatantConditionName.PrimedForExplosion]: <BombIcon className="fill-firered h-full" />,
  [CombatantConditionName.PrimedForIceBurst]: <IceIcon className="fill-iceblue h-full" />,
  [CombatantConditionName.Burning]: <FireIcon className="fill-firered h-full" />,
  [CombatantConditionName.Blinded]: (
    <div className="h-full bg-darknessblack">
      <EyeOpenIcon className="fill-lightningpurple stroke-darknessblack h-full" />
    </div>
  ),
};
