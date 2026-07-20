import {
  GameplayAssetFactsSource,
  VersionedGameplayAssetFacts,
} from "./gameplay-asset-facts.js";

export class HttpGameplayAssetFactsSource implements GameplayAssetFactsSource {
  constructor(private readonly baseUrl: string) {}

  async getGameplayAssetFacts(): Promise<VersionedGameplayAssetFacts> {
    const url = `${this.baseUrl}/gameplay-asset-facts`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`gameplay asset facts fetch failed: ${res.status} ${res.statusText}`);
    }

    return await res.json();
  }
}
