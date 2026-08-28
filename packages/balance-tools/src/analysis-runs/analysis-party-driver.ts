import {
  AdventuringParty,
  AffixGenerator,
  ClassProgressionProperties,
  COMBAT_ATTRIBUTES,
  DungeonExplorationManager,
  DungeonGenerationPolicy,
  EquipmentGenerationTemplate,
  Equipment,
  EquipmentRandomizer,
  EquipmentTraitType,
  EquipmentType,
  IdGeneratorRandom,
  ItemBuilder,
  LootGenerator,
  RandomDungeonGenerationPolicy,
  RandomNumberGenerationPolicyFactory,
  SpeedDungeonGame,
  TaggedAffixType,
} from "@speed-dungeon/common";
import { AllocationIntensity } from "./allocation-intensity";

/** the scaled reader is only installed for the length of a walk, so this is both the one it reads
 * through and the one it puts back */
const getAttributesOnEquipmentList = Equipment.getAttributesOnEquipmentList.bind(Equipment);

const DAMAGE_TRAITS = [EquipmentTraitType.DamagePercentage, EquipmentTraitType.FlatDamageAdditive];

export class AnalysisPartyDriver {
  private dungeonGenerationPolicy: DungeonGenerationPolicy;
  private idGenerator = new IdGeneratorRandom({ saveHistory: false });
  private rngPolicy = RandomNumberGenerationPolicyFactory.allRandomPolicy();
  private affixGenerator = new AffixGenerator(this.rngPolicy);
  private itemBuilder = new ItemBuilder(
    new EquipmentRandomizer(this.rngPolicy, this.affixGenerator)
  );
  private dungeonExplorationManager: DungeonExplorationManager;
  private lootGenerator = new LootGenerator(this.itemBuilder, this.idGenerator, this.rngPolicy);

  constructor(
    private game: SpeedDungeonGame,
    private party: AdventuringParty,
    private allocationIntensity: AllocationIntensity
  ) {
    this.dungeonExplorationManager = party.dungeonExplorationManager;

    this.modifyAffixValueGeneration();
    this.modifyWornEquipmentAttributes();

    this.dungeonGenerationPolicy = new RandomDungeonGenerationPolicy(
      this.idGenerator,
      this.itemBuilder,
      this.rngPolicy
    );
  }

  get reachedEndOfFloor() {
    return !this.dungeonExplorationManager.unexploredRoomsExistOnCurrentFloor();
  }

  /** although we modify most equipment attribute reads by replacing the
   * Equipment.getAttributesOnEquipmentList, some relevant affix values are not
   * combat attributes */
  private modifyAffixValueGeneration() {
    const rollAffixTierAndValue = this.affixGenerator.rollAffixTierAndValue.bind(
      this.affixGenerator
    );

    this.affixGenerator.rollAffixTierAndValue = (
      template: EquipmentGenerationTemplate,
      taggedAffixType: TaggedAffixType,
      maxTierLimiter: number,
      equipmentType: EquipmentType
    ) => {
      const affix = rollAffixTierAndValue(template, taggedAffixType, maxTierLimiter, equipmentType);
      for (const traitType of DAMAGE_TRAITS) {
        const trait = affix.equipmentTraits[traitType];
        if (trait !== undefined) {
          trait.value = this.allocationIntensity.scaleValue(trait.value);
        }
      }

      return affix;
    };
  }

  /** attributes on worn equipment are read through a static, so scaling them for this party means
   * swapping it */
  private modifyWornEquipmentAttributes() {
    Equipment.getAttributesOnEquipmentList = (list: Equipment[]) => {
      const attributes = getAttributesOnEquipmentList(list);
      for (const attribute of COMBAT_ATTRIBUTES) {
        attributes[attribute] = this.allocationIntensity.scaleValue(attributes[attribute]);
      }

      return attributes;
    };
  }

  /** a swap left installed past the run that asked for it would go on scaling for whatever ran
   * next, so the run puts it back when it finishes */
  restoreWornEquipmentAttributes() {
    Equipment.getAttributesOnEquipmentList = getAttributesOnEquipmentList;
  }

  moveToNextRoom(options: { isDescending: boolean }) {
    if (this.reachedEndOfFloor) {
      this.dungeonExplorationManager.enterNewFloor(this.dungeonGenerationPolicy, true, options);
    }

    this.dungeonExplorationManager.enterNextRoom(
      this.game,
      this.dungeonGenerationPolicy,
      this.idGenerator
    );
  }

  descend() {
    this.dungeonExplorationManager.incrementCurrentFloor();
    this.dungeonExplorationManager.clearRoomsExploredOnCurrentFloorCount();
    this.dungeonExplorationManager.clearUnexploredRooms();
    this.moveToNextRoom({ isDescending: true });
  }

  // incremented rather than assigned: a support class level also awards ability and attribute
  // points, which the allocation solver then has to spend
  private awardSupportClassLevels() {
    for (const combatant of this.party.combatantManager.getPartyMemberCharacters()) {
      const { classProgressionProperties } = combatant.getCombatantProperties();
      const supportClassOption = classProgressionProperties.getSupportClassOption();
      if (!supportClassOption) {
        continue;
      }

      const mainClassLevel = classProgressionProperties.getMainClass().level;
      const expectedLevel = ClassProgressionProperties.maxSupportClassLevel(mainClassLevel);
      while (supportClassOption.level < expectedLevel) {
        classProgressionProperties.incrementSupportClassLevel(supportClassOption.combatantClass);
      }
    }
  }

  clearCurrentRoom() {
    if (this.party.battleId === null) {
      return;
    }
    const battle = this.game.getExpectedBattle(this.party.battleId);
    battle.resolveBattle(this.lootGenerator, { alliesDefeated: false, opponentsDefeated: true });
    this.awardSupportClassLevels();
    this.party.combatantManager.removeDungeonControlledCombatants(this.game);
  }
}
