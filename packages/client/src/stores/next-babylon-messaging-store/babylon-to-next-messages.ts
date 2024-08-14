export enum BabylonToNextMessageTypes {
  CombatantModelLoaded,
}

type CombatantModelLoadedMessage = {
  type: BabylonToNextMessageTypes.CombatantModelLoaded;
  combatantId: string;
};

export type BabylonToNextMessage = CombatantModelLoadedMessage;
