import {
  COMBATANT_MAX_LEVEL,
  CombatantBuilder,
  CombatantClass,
  CombatAttribute,
  IdGeneratorRandom,
} from "@speed-dungeon/common";
import type { Username } from "@speed-dungeon/common";
import { AnalysisSampleDimensions, RoomGroupedSamples, roomKey } from "../../analysis-runs/analysis-sample.ts";
import { CHARACTER_BUILDS_GROUP_THREE } from "../../analysis-subjects/default-analysis-character-specs.ts";
import { AttainableAttributeCalculator } from "../../attribute-viewer/attainable-attribute-calculator.ts";
import { Distribution } from "../../statistics/distribution.ts";
import { SpeedCurveInputs, SpeedTierRoom } from "./speed-curve-search.ts";
import { SLOW_TIER_MAIN_CLASSES, SPEED_TIER_CONFIGS, SpeedTier } from "./speed-tier.ts";

const SLOW_TIER_CHARACTER_NAME = "slow tier subject" as Username;

interface MedianAgilityRoom {
  floor: number;
  room: number;
  level: number;
  agility: number;
}

export class SpeedCurveInputsAssembler {
  private idGenerator = new IdGeneratorRandom({ saveHistory: false });

  constructor(private samplesByTier: Record<SpeedTier, AnalysisSampleDimensions[]>) {}

  /** no gear and nothing allocated, so inherent is all the slow tier has */
  private computeInherentAgility(mainClass: CombatantClass, level: number) {
    const combatant = CombatantBuilder.playerCharacter(mainClass, SLOW_TIER_CHARACTER_NAME)
      .level(level)
      .build(this.idGenerator);
    const { attributeProperties } = combatant.combatantProperties;
    return Math.floor(attributeProperties.getInherentAttributes()[CombatAttribute.Agility]);
  }

  private computeSlowAgility(level: number) {
    return Math.min(
      ...SLOW_TIER_MAIN_CLASSES.map((mainClass) => this.computeInherentAgility(mainClass, level))
    );
  }

  private selectMedianAgilityByRoom(tier: SpeedTier) {
    const { mainClasses } = SPEED_TIER_CONFIGS[tier];
    const samples = this.samplesByTier[tier].filter((sample) =>
      mainClasses.includes(sample.mainClass)
    );

    const byRoom = new Map<string, MedianAgilityRoom>();
    for (const { floor, room, samples: roomSamples } of new RoomGroupedSamples(
      samples
    ).selectRooms({})) {
      byRoom.set(roomKey({ floor, room }), {
        floor,
        room,
        level: Math.round(Distribution.of(roomSamples.map((s) => s.mainClassLevel)).median),
        agility: Distribution.of(
          roomSamples.map((sample) => sample.totalAttributes[CombatAttribute.Agility])
        ).median,
      });
    }
    return byRoom;
  }

  private computeMaxAttainableAgility() {
    const calculator = new AttainableAttributeCalculator();
    return Math.max(
      ...CHARACTER_BUILDS_GROUP_THREE.map(
        ({ build }) =>
          calculator.getScoredEquipmentSets({
            attribute: CombatAttribute.Agility,
            buildSpec: build,
            level: COMBATANT_MAX_LEVEL,
          }).best.score
      )
    );
  }

  /** only rooms every tier's run reached, since a ratio needs both of its sides */
  private assembleRooms() {
    const medianRoomsByTier: Record<SpeedTier, Map<string, MedianAgilityRoom>> = {
      [SpeedTier.Average]: this.selectMedianAgilityByRoom(SpeedTier.Average),
      [SpeedTier.Fast]: this.selectMedianAgilityByRoom(SpeedTier.Fast),
      [SpeedTier.FullyAllocated]: this.selectMedianAgilityByRoom(SpeedTier.FullyAllocated),
    };

    const rooms: SpeedTierRoom[] = [];
    for (const [key, averageRoom] of medianRoomsByTier[SpeedTier.Average]) {
      const fastRoom = medianRoomsByTier[SpeedTier.Fast].get(key);
      const fullyAllocatedRoom = medianRoomsByTier[SpeedTier.FullyAllocated].get(key);
      if (fastRoom === undefined || fullyAllocatedRoom === undefined) {
        continue;
      }

      const { floor, room, level } = averageRoom;
      rooms.push({
        floor,
        room,
        level,
        slowAgility: this.computeSlowAgility(level),
        agilityByTier: {
          [SpeedTier.Average]: averageRoom.agility,
          [SpeedTier.Fast]: fastRoom.agility,
          [SpeedTier.FullyAllocated]: fullyAllocatedRoom.agility,
        },
      });
    }
    return rooms;
  }

  assemble(): SpeedCurveInputs {
    return {
      rooms: this.assembleRooms(),
      slowestAgility: this.computeSlowAgility(1),
      maxAttainableAgility: this.computeMaxAttainableAgility(),
    };
  }
}
