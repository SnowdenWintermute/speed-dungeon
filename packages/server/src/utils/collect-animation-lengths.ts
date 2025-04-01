import { NodeIO } from "@gltf-transform/core";
import {
  CombatantSpecies,
  Milliseconds,
  SKELETON_FILE_PATHS,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";

export async function getAnimationLengths(filePath: string) {
  const io = new NodeIO();
  const document = await io.read(filePath);

  const toReturn: Record<string, number> = {};
  document
    .getRoot()
    .listAnimations()
    .forEach((anim) => {
      const samplers = anim.listSamplers();
      let maxTime = 0;

      for (const sampler of samplers) {
        const input = sampler.getInput(); // Input is the list of keyframe times
        if (!input) return;
        const times = input.getArray(); // Get the actual keyframe time values
        if (!times) return;
        if (times.length > 0) {
          const time = times[times.length - 1];
          if (time === undefined) return;
          maxTime = Math.max(maxTime, time); // Last keyframe is the duration
        }
      }

      toReturn[anim.getName()] = Math.floor(maxTime * 1000); // convert from seconds to milliseconds and truncate
    });
  return toReturn;
}

export async function collectAnimationLengths() {
  const assetsFolderPath = "./assets/";
  const toReturn: Record<CombatantSpecies, Record<string, Milliseconds>> = {
    [CombatantSpecies.Humanoid]: {},
    [CombatantSpecies.Dragon]: {},
    [CombatantSpecies.Skeleton]: {},
    [CombatantSpecies.Velociraptor]: {},
    [CombatantSpecies.Elemental]: {},
    [CombatantSpecies.Golem]: {},
  };

  for (const [species, skeletonPath] of iterateNumericEnumKeyedRecord(SKELETON_FILE_PATHS)) {
    const animationLengths = await getAnimationLengths(assetsFolderPath + skeletonPath);
    toReturn[species] = animationLengths;
  }

  return toReturn;
}
