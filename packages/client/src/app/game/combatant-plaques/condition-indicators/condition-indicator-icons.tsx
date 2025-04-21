import { CombatantConditionName } from "@speed-dungeon/common";
import BombIcon from "../../../../../public/img/game-ui-icons/bomb.svg";
import IceIcon from "../../../../../public/img/game-ui-icons/ice.svg";
import { ReactNode } from "react";

export const CONDITION_INDICATOR_ICONS: Record<CombatantConditionName, ReactNode> = {
  [CombatantConditionName.Poison]: <BombIcon />,
  [CombatantConditionName.PrimedForExplosion]: <BombIcon className="fill-firered h-full" />,
  [CombatantConditionName.PrimedForIceBurst]: <IceIcon className="fill-iceblue h-full" />,
};
