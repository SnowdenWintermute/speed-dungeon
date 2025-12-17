import { CreateAudioEngineAsync, CreateSoundAsync } from "@babylonjs/core";

export async function testingSounds() {
  const audioEngine = await CreateAudioEngineAsync();

  const gunshot = await CreateSoundAsync("ice", "audio/combat-actions/ice-bolt.mp3");

  // Wait until audio engine is ready to play sounds.
  await audioEngine.unlockAsync();

  gunshot.play();
}
