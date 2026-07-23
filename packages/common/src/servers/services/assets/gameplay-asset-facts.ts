import { AnimationLengths, BoundingBoxSizesBySpecies } from "../../../types.js";

export interface GameplayAssetFacts {
  animationLengths: AnimationLengths;
  boundingBoxes: BoundingBoxSizesBySpecies;
}

export interface VersionedGameplayAssetFacts {
  facts: GameplayAssetFacts;
  version: string;
}

export interface GameplayAssetFactsSource {
  getGameplayAssetFacts(): Promise<VersionedGameplayAssetFacts>;
}
