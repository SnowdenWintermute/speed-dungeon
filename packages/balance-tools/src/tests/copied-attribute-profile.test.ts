import {
  AffixGenerator,
  BodyArmor,
  Combatant,
  CombatantClass,
  CombatAttribute,
  EquipmentRandomizer,
  EquipmentSlotId,
  IdGeneratorSequential,
  ItemBuilder,
  RandomNumberGenerationPolicyFactory,
} from "@speed-dungeon/common";
import { AnalysisPartyBuilder } from "../analysis-runs/analysis-party-builder.ts";
import { AnalysisCharacterSpecification } from "../analysis-subjects/analysis-character-specification.ts";
import { AttributeSourceType } from "../analysis-subjects/attribute-source.ts";
import type { CopiedAttributeProfileRoom } from "../analysis-subjects/attribute-source.ts";
import { CopiedAttributeProfile } from "../analysis-subjects/copied-attribute-profile.ts";
import { CharacterWeaponSpecialty } from "../analysis-subjects/character-weapon-specialty.ts";
import { AnalysisGoal } from "../goal-performance-checkers/analysis-goal.ts";
import { WornArmorClassGoalPerformanceChecker } from "../goal-performance-checkers/worn-armor-class.ts";
import { StudyName } from "../studies/study-name.ts";

const COPIED_STRENGTH = 37;
const ARMOR_CLASS_ON_THE_ARMOR = 12;

function copiedRoom(
  floor: number,
  room: number,
  strength: number = COPIED_STRENGTH
): CopiedAttributeProfileRoom {
  return { floor, room, attributes: { [CombatAttribute.Strength]: strength } };
}

function strengthOf(combatant: Combatant) {
  return combatant
    .getCombatantProperties()
    .attributeProperties.getAttributeValue(CombatAttribute.Strength);
}

function buildCopyingCharacter(rooms: CopiedAttributeProfileRoom[]) {
  const spec = new AnalysisCharacterSpecification(
    "armor enjoyer",
    {
      mainClass: CombatantClass.Warrior,
      supportClass: null,
      weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee,
    },
    AnalysisGoal.ArmorClass,
    {
      type: AttributeSourceType.CopiedFromStudyTable,
      studyName: StudyName.AttackDamageGroupOne,
      slice: {},
      rooms,
    }
  );

  const { party } = new AnalysisPartyBuilder().build([spec]);
  const [combatant] = party.combatantManager.getPartyMemberCharacters();
  if (combatant === undefined) {
    throw new Error("expected the party to have been given its one character");
  }

  return { combatant, profile: new CopiedAttributeProfile(combatant, "a test", rooms) };
}

function equipArmor(combatant: ReturnType<typeof buildCopyingCharacter>["combatant"]) {
  const rngPolicy = RandomNumberGenerationPolicyFactory.allFixedPolicy(0);
  const armor = new ItemBuilder(new EquipmentRandomizer(rngPolicy, new AffixGenerator(rngPolicy)))
    .bodyArmor(BodyArmor.Rags)
    .armorClass(ARMOR_CLASS_ON_THE_ARMOR)
    .build(new IdGeneratorSequential({ saveHistory: false }));

  combatant.getCombatantProperties().equipment.putEquipmentInSlot(armor, EquipmentSlotId.Body);
}

it("reports the copied attributes as its total while its armor still scores armor class", () => {
  const { combatant, profile } = buildCopyingCharacter([copiedRoom(1, 1)]);
  equipArmor(combatant);
  profile.applyForRoom({ floor: 1, room: 1 });

  const { attributeProperties } = combatant.getCombatantProperties();
  expect(attributeProperties.getAttributeValue(CombatAttribute.Strength)).toBe(COPIED_STRENGTH);
  // worn armor reaches the score without reaching the attributes, which is what keeps the copied
  // build's own gear from being paid for twice
  expect(attributeProperties.getAttributeValue(CombatAttribute.ArmorClass)).toBe(0);
  expect(WornArmorClassGoalPerformanceChecker.getWornArmorClass(combatant)).toBe(
    ARMOR_CLASS_ON_THE_ARMOR
  );
});

it("falls back to the nearest room at or below the one asked for", () => {
  const { combatant, profile } = buildCopyingCharacter([
    copiedRoom(1, 1, 10),
    copiedRoom(1, 3, 20),
    copiedRoom(1, 6, 30),
  ]);

  profile.applyForRoom({ floor: 1, room: 4 });
  expect(strengthOf(combatant)).toBe(20);

  profile.applyForRoom({ floor: 1, room: 3 });
  expect(strengthOf(combatant)).toBe(20);
});

it("uses a floor's first sampled room for one below anything its source reached", () => {
  const { combatant, profile } = buildCopyingCharacter([
    copiedRoom(1, 4, 10),
    copiedRoom(1, 6, 30),
  ]);

  profile.applyForRoom({ floor: 1, room: 2 });
  expect(strengthOf(combatant)).toBe(10);
});

it("out-walking its source on a floor holds that floor's last sampled room", () => {
  const { combatant, profile } = buildCopyingCharacter([
    copiedRoom(1, 1, 10),
    copiedRoom(1, 2, 20),
  ]);

  profile.applyForRoom({ floor: 1, room: 5 });
  expect(strengthOf(combatant)).toBe(20);
});

it("refuses a floor its source study never reached", () => {
  const { profile } = buildCopyingCharacter([copiedRoom(1, 1)]);

  expect(() => profile.applyForRoom({ floor: 2, room: 1 })).toThrow();
});
