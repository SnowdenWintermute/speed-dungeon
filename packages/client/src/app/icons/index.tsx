import FireIcon from "../../../public/img/game-ui-icons/fire.svg";
import RangedIcon from "../../../public/img/game-ui-icons/ranged.svg";
import SwordSlashIcon from "../../../public/img/game-ui-icons/sword-slash.svg";
import HealthCrossIcon from "../../../public/img/game-ui-icons/health-cross.svg";
import IceIcon from "../../../public/img/game-ui-icons/ice.svg";
import PlusSign from "../../../public/img/game-ui-icons/plus-sign.svg";
import EyeClosed from "../../../public/img/game-ui-icons/eye-closed.svg";
import BloodWithH from "../../../public/img/game-ui-icons/blood-with-h.svg";
import Wind from "../../../public/img/game-ui-icons/wind.svg";
import Water from "../../../public/img/game-ui-icons/water.svg";
import LightningBolt from "../../../public/img/game-ui-icons/lightning-bolt.svg";
import Mountain from "../../../public/img/game-ui-icons/mountain.svg";
import Eclipse from "../../../public/img/game-ui-icons/eclipse-icon.svg";
import Sun from "../../../public/img/game-ui-icons/sun.svg";
import Slashing from "../../../public/img/game-ui-icons/slashing.svg";
import Blunt from "../../../public/img/game-ui-icons/blunt.svg";
import Piercing from "../../../public/img/game-ui-icons/piercing.svg";
import Clock from "../../../public/img/game-ui-icons/clock-icon.svg";
import Heart from "../../../public/img/game-ui-icons/heart.svg";
import Droplet from "../../../public/img/game-ui-icons/droplet.svg";
import Shards from "../../../public/img/game-ui-icons/shards.svg";
import Target from "../../../public/img/game-ui-icons/target-icon.svg";

import { ReactNode } from "react";
import { ActionPayableResource, KineticDamageType, MagicalElement } from "@speed-dungeon/common";

export enum IconName {
  Fire,
  Ice,
  Water,
  Wind,
  LightningBolt,
  Mountain,
  Eclipse,
  Sun,
  Ranged,
  SwordSlash,
  HealthCross,
  PlusSign,
  EyeClosed,
  BloodWithH,
  Slashing,
  Piercing,
  Blunt,
  Clock,
  Heart,
  Droplet,
  Shards,
  Target,
}

export const SVG_ICONS: Record<IconName, (className: string) => ReactNode> = {
  [IconName.Fire]: (className) => <FireIcon className={className} />,
  [IconName.Ranged]: (className) => <RangedIcon className={className} />,
  [IconName.SwordSlash]: (className) => <SwordSlashIcon className={className} />,
  [IconName.HealthCross]: (className) => <HealthCrossIcon className={className} />,
  [IconName.Ice]: (className) => <IceIcon className={className} />,
  [IconName.PlusSign]: (className) => <PlusSign className={className} />,
  [IconName.EyeClosed]: (className) => <EyeClosed className={className} />,
  [IconName.BloodWithH]: (className) => <BloodWithH className={className} />,
  [IconName.Water]: (className) => <Water className={className} />,
  [IconName.Wind]: (className) => <Wind className={className} />,
  [IconName.LightningBolt]: (className) => <LightningBolt className={className} />,
  [IconName.Mountain]: (className) => <Mountain className={className} />,
  [IconName.Eclipse]: (className) => <Eclipse className={className} />,
  [IconName.Sun]: (className) => <Sun className={className} />,
  [IconName.Slashing]: (className) => <Slashing className={className} />,
  [IconName.Piercing]: (className) => <Piercing className={className} />,
  [IconName.Blunt]: (className) => <Blunt className={className} />,
  [IconName.Heart]: (className) => <Heart className={className} />,
  [IconName.Droplet]: (className) => <Droplet className={className} />,
  [IconName.Clock]: (className) => <Clock className={className} />,
  [IconName.Shards]: (className) => <Shards className={className} />,
  [IconName.Target]: (className) => <Target className={className} />,
};

export const MAGICAL_ELEMENT_ICONS: Record<MagicalElement, (className: string) => ReactNode> = {
  [MagicalElement.Fire]: SVG_ICONS[IconName.Fire],
  [MagicalElement.Ice]: SVG_ICONS[IconName.Ice],
  [MagicalElement.Lightning]: SVG_ICONS[IconName.LightningBolt],
  [MagicalElement.Water]: SVG_ICONS[IconName.Water],
  [MagicalElement.Earth]: SVG_ICONS[IconName.Mountain],
  [MagicalElement.Wind]: SVG_ICONS[IconName.Wind],
  [MagicalElement.Dark]: SVG_ICONS[IconName.Eclipse],
  [MagicalElement.Light]: SVG_ICONS[IconName.Sun],
};

export const KINETIC_TYPE_ICONS: Record<KineticDamageType, (className: string) => ReactNode> = {
  [KineticDamageType.Blunt]: SVG_ICONS[IconName.Blunt],
  [KineticDamageType.Slashing]: SVG_ICONS[IconName.Slashing],
  [KineticDamageType.Piercing]: SVG_ICONS[IconName.Piercing],
};

export const PAYABLE_RESOURCE_ICONS: Record<
  ActionPayableResource,
  (className: string) => ReactNode
> = {
  [ActionPayableResource.HitPoints]: SVG_ICONS[IconName.Heart],
  [ActionPayableResource.Mana]: SVG_ICONS[IconName.Droplet],
  [ActionPayableResource.ActionPoints]: SVG_ICONS[IconName.Clock],
  [ActionPayableResource.Shards]: SVG_ICONS[IconName.Shards],
};
