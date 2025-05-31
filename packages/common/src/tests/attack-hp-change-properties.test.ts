import cloneDeep from "lodash.clonedeep";
import { ActionSequenceManagerRegistry } from "../action-processing/action-sequence-manager-registry.js";
import { ActionSequenceManager } from "../action-processing/action-sequence-manager.js";
import { ActionTracker } from "../action-processing/action-tracker.js";
import { NestedNodeReplayEvent, ReplayEventType } from "../action-processing/replay-events.js";
import { AdventuringParty } from "../adventuring-party/index.js";
import {
  ResourceChangeSource,
  ResourceChangeSourceCategory,
} from "../combat/hp-change-source-types.js";
import {
  CombatActionExecutionIntent,
  CombatActionName,
  CombatActionTargetType,
  calculateActionHitOutcomes,
} from "../combat/index.js";
import { KineticDamageType } from "../combat/kinetic-damage-types.js";
import { CombatantContext } from "../combatant-context/index.js";
import { CombatantEquipment, CombatantSpecies } from "../combatants/index.js";
import { TEST_WARRIOR_COMBATANT } from "../combatants/test-combatants/test-humanoid-warrior-combatant.js";
import { SpeedDungeonGame } from "../game/index.js";
import {
  Equipment,
  EquipmentSlotType,
  EquipmentType,
  HoldableSlotType,
  TwoHandedMeleeWeapon,
} from "../items/equipment/index.js";
import { NumberRange } from "../primatives/number-range.js";
import { GameMode } from "../types.js";
import { IdGenerator } from "../utility-classes/index.js";
import { CombatAttribute } from "../combatants/attributes/index.js";
import { HitOutcome } from "../hit-outcome.js";

describe("kinetic damage type selection", () => {
  it("correctly chooses a kinetic damage type when attacking", () => {
    const testWarrior = TEST_WARRIOR_COMBATANT;
    testWarrior.combatantProperties.inherentAttributes[CombatAttribute.Accuracy] = 9999;

    const mainhandEquipmentNameId = "slashing piercing weapon";
    const mainhandEquipment = new Equipment(
      { name: mainhandEquipmentNameId, id: mainhandEquipmentNameId },
      1,
      {},
      {
        taggedBaseEquipment: {
          equipmentType: EquipmentType.TwoHandedMeleeWeapon,
          baseItemType: TwoHandedMeleeWeapon.GreatAxe,
        },
        equipmentType: EquipmentType.TwoHandedMeleeWeapon,
        damage: new NumberRange(100, 100),
        damageClassification: [
          new ResourceChangeSource({
            category: ResourceChangeSourceCategory.Physical,
            kineticDamageTypeOption: KineticDamageType.Slashing,
          }),
          new ResourceChangeSource({
            category: ResourceChangeSourceCategory.Physical,
            kineticDamageTypeOption: KineticDamageType.Piercing,
          }),
        ],
      },
      null
    );

    CombatantEquipment.putEquipmentInSlot(testWarrior.combatantProperties, mainhandEquipment, {
      type: EquipmentSlotType.Holdable,
      slot: HoldableSlotType.MainHand,
    });

    const testTarget = cloneDeep(TEST_WARRIOR_COMBATANT);
    const testTargetId = "test target id";
    testTarget.entityProperties.id = testTargetId;

    testTarget.combatantProperties.inherentKineticDamageTypeAffinities[KineticDamageType.Slashing] =
      250;
    testTarget.combatantProperties.inherentKineticDamageTypeAffinities[KineticDamageType.Piercing] =
      199;

    const gameName = "test game";
    const game = new SpeedDungeonGame(gameName, gameName, GameMode.Race);
    const partyName = "test party";
    const party = new AdventuringParty(partyName, partyName);
    game.adventuringParties[partyName] = party;

    party.characters[testWarrior.entityProperties.id] = testWarrior;
    party.characterPositions.push(testWarrior.entityProperties.id);
    party.currentRoom.monsters[testTargetId] = testTarget;
    party.currentRoom.monsterPositions = [testTargetId];

    const actionExecutionIntent = new CombatActionExecutionIntent(CombatActionName.Attack, {
      type: CombatActionTargetType.Single,
      targetId: testTargetId,
    });

    const replayNode: NestedNodeReplayEvent = {
      type: ReplayEventType.NestedNode,
      events: [],
    };

    const combatantContext = new CombatantContext(game, party, testWarrior);

    const idGenerator = new IdGenerator();

    const animationLengths: Record<CombatantSpecies, Record<string, number>> = {
      [CombatantSpecies.Humanoid]: {},
      [CombatantSpecies.Dragon]: {},
      [CombatantSpecies.Skeleton]: {},
      [CombatantSpecies.Velociraptor]: {},
      [CombatantSpecies.Elemental]: {},
      [CombatantSpecies.Golem]: {},
    };

    const sequentialActionManagerRegistry = new ActionSequenceManagerRegistry(
      idGenerator,
      animationLengths
    );

    const actionSequenceManager = new ActionSequenceManager(
      "",
      actionExecutionIntent,
      replayNode,
      combatantContext,
      sequentialActionManagerRegistry,
      idGenerator,
      null
    );

    //
    const context = {
      combatantContext,
      tracker: new ActionTracker(
        actionSequenceManager,
        "",
        actionExecutionIntent,
        null,
        Date.now(),
        idGenerator
      ),
      manager: actionSequenceManager,
      idGenerator,
    };

    const hitOutcomes = calculateActionHitOutcomes(context);
    expect(!(hitOutcomes instanceof Error));
    if (hitOutcomes instanceof Error) return;
    expect(hitOutcomes.outcomeFlags[HitOutcome.Hit]?.includes(testTargetId));

    console.log(JSON.stringify(hitOutcomes, null, 2));
  });
});
