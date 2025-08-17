import FireIcon from "../../../public/img/game-ui-icons/fire.svg";
import RangedIcon from "../../../public/img/game-ui-icons/ranged.svg";
import SwordSlashIcon from "../../../public/img/game-ui-icons/sword-slash.svg";
import HealthCrossIcon from "../../../public/img/game-ui-icons/health-cross.svg";
import IceIcon from "../../../public/img/game-ui-icons/ice.svg";
import PlusSign from "../../../public/img/game-ui-icons/plus-sign.svg";
import EyeClosed from "../../../public/img/game-ui-icons/eye-closed.svg";
import { ReactNode } from "react";

export enum IconName {
  Fire,
  Ranged,
  SwordSlash,
  HealthCross,
  Ice,
  PlusSign,
  EyeClosed,
}

export const SVG_ICONS: Record<IconName, (className: string) => ReactNode> = {
  [IconName.Fire]: (className) => <FireIcon className={className} />,
  [IconName.Ranged]: (className) => <RangedIcon className={className} />,
  [IconName.SwordSlash]: (className) => <SwordSlashIcon className={className} />,
  [IconName.HealthCross]: (className) => <HealthCrossIcon className={className} />,
  [IconName.Ice]: (className) => <IceIcon className={className} />,
  [IconName.PlusSign]: (className) => <PlusSign className={className} />,
  [IconName.EyeClosed]: (className) => <EyeClosed className={className} />,
};
