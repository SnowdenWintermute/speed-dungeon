// USES FOR PERSISTANCE
// save a character
// save a game
// save list of game victory times and defeat floors/mosters killed
//
// TODO:
// - combine monster and playercharacter into a Combatant class
// - change entity ids to uuids
// - figure out simple serialization of Combatants to JSONB data
// - figure out deserialization of Combatants
//
//
// patchVersion: number
// id: unique integer (need to change how ids are assigned in game then)
// ownerId: foreign key unique integer,
// name: string
// combatantProperties: {
//   combatantClass: CombatantClass,
//   combatantSpecies: CombatantSpecies,
//   level: number,
//   hitPoints: number,
//   mana: number,
//   experiencePoints: { current: number, requiredForNextLevel: number },
//   unspentAttributePoints: number,
//   unspentAbilityPoints: number,
//   abilities: Partial<Record<CombatantAbilityName, CombatantAbility>>,
//   inherentAttributes: Partial<Record<CombatAttribute, number>>,
//   speccedAttributes: Partial<Record<CombatAttribute, number>>,
//   inherentElementalAffinities: Partial<Record<MagicalElement, number>>,
//   inherentPhysicalDamageTypeAffinities: Partial<Record<PhysicalDamageType, number>>,
//   traits: CombatantTrait[] = [];
//
//   equipment: Partial<Record<EquipmentSlot, Item>> = {};
//   inventory: {
//     items: Item[] = [];
//     capacity: number;
//     shards: number;
//   }
// }
