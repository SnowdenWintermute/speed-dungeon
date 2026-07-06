import { Combatant } from "./combatants/index.js";
import { AdventuringParty } from "./adventuring-party/index.js";
import { SpeedDungeonGame } from "./game/index.js";
import { SpeedDungeonPlayer } from "./game/player.js";
import { Meters } from "./aliases.js";
import { CombatantSpecies } from "./combatants/combatant-species.js";
import { IActionUser } from "./action-user-context/action-user.js";
import {
  CombatActionHitOutcomeProperties,
  CombatActionResource,
} from "./combat/combat-actions/combat-action-hit-outcome-properties.js";
import { CombatantProperties } from "./combatants/combatant-properties.js";
import { ActionEntity } from "./action-entities/index.js";
import { CombatActionResourceChangeProperties } from "./combat/combat-actions/combat-action-resource-change-properties.js";

export interface CharacterAssociatedData {
  character: Combatant;
  game: SpeedDungeonGame;
  party: AdventuringParty;
  player: SpeedDungeonPlayer;
}

export interface PlayerAssociatedData {
  player: SpeedDungeonPlayer;
  game: SpeedDungeonGame;
  partyOption: AdventuringParty | undefined;
}

export enum CleanupMode {
  Immediate,
  Soft,
}

export type BoundingBoxSizesBySpecies = Partial<
  Record<
    CombatantSpecies,
    { min: [Meters, Meters, Meters]; max: [Meters, Meters, Meters]; volume: number }
  >
>;

export interface PartyWipes {
  alliesDefeated: boolean;
  opponentsDefeated: boolean;
}

export type AnimationLengths = Record<CombatantSpecies, Record<string, number>>;
export type BoundingBoxSizes = Partial<
  Record<
    CombatantSpecies,
    {
      min: [Meters, Meters, Meters];
      max: [Meters, Meters, Meters];
      volume: number;
    }
  >
>;

export interface CombatantWithPets {
  combatant: Combatant;
  pets: Combatant[];
}

export type CombatActionResourceChangePropertiesGetter = (
  user: IActionUser,
  hitOutcomeProperties: CombatActionHitOutcomeProperties,
  actionLevel: number,
  primaryTarget: CombatantProperties,
  actionEntityOption?: ActionEntity
) => null | CombatActionResourceChangeProperties;

export type ResourceChangePropertiesGetters = Partial<
  Record<CombatActionResource, CombatActionResourceChangePropertiesGetter>
>;
