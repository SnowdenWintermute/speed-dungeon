import {
  AdventuringParty,
  CharacterControlScheme,
  Combatant,
  CombatantBuilder,
  CombatantClass,
  CombatAttribute,
  Equipment,
  EquipmentSlotId,
  GameId,
  GameMode,
  GameName,
  IdGeneratorSequential,
  PartyId,
  SpeedDungeonGame,
  Username,
} from "@speed-dungeon/common";
import { BestImprovementEquipmentSolver } from "./best-improvement";
import { EquipmentSolverTestItems, totalDexterity } from "./equipment-solver-test-items";

const PARTY_CHARACTER_COUNT = 2;
const FINGER_SLOT_IDS = [EquipmentSlotId.FingerMain, EquipmentSlotId.FingerAlternate];

const dexterityPerformance = (combatant: Combatant) =>
  combatant.getTotalAttributes()[CombatAttribute.Dexterity] ?? 0;

class BestImprovementFixture {
  private idGenerator = new IdGeneratorSequential({ saveHistory: false });
  private party: AdventuringParty;
  readonly items = new EquipmentSolverTestItems(this.idGenerator);

  constructor() {
    const game = new SpeedDungeonGame(
      "game-id" as GameId,
      "game" as GameName,
      GameMode.Progression,
      CharacterControlScheme.Freelancer
    );
    this.party = AdventuringParty.createInitialized("party-id" as PartyId, "party");
    game.addParty(this.party);

    for (let i = 0; i < PARTY_CHARACTER_COUNT; i += 1) {
      const character = CombatantBuilder.playerCharacter(
        CombatantClass.Warrior,
        `player-${i}` as Username
      )
        .name(`character-${i}`)
        .build(this.idGenerator);

      this.party.combatantManager.addCombatant(character, game);
    }
  }

  dropInRoom(equipment: Equipment) {
    this.party.currentRoom.inventory.insertItem(equipment);

    return equipment;
  }

  solve() {
    new BestImprovementEquipmentSolver(this.party, dexterityPerformance, [totalDexterity]).solve();
  }

  getEquipmentInFingerSlots() {
    return this.party.combatantManager
      .getPartyMemberCharacters()
      .flatMap((character) =>
        FINGER_SLOT_IDS.map((slotId) => character.getEquipmentOption().getEquipmentInSlot(slotId))
      );
  }
}

describe("best improvement equipment solver", () => {
  it("equips rings in alternate finger slots after filling main finger slots", () => {
    const fixture = new BestImprovementFixture();
    // one ring per finger slot in the party, each an improvement over an empty slot
    const rings = [8, 6, 4, 2].map((dexterity) =>
      fixture.dropInRoom(fixture.items.dexterityRing(dexterity))
    );

    fixture.solve();

    const equipped = new Set(fixture.getEquipmentInFingerSlots());
    for (const ring of rings) {
      expect(equipped.has(ring)).toBe(true);
    }
  });
});
