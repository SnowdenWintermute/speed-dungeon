// PETS
// pet ai with no active pet command
// pet ai with pet command
// pet can not level up beyond rank limit pet level
//
// ENSNARE
// ensnare debuff gained when ensnared
// melee attackers hit flying when combatant ensnared
// ensnare debuff removed when web killed
// flying trait combatant starts flying when ensnare debuff removed
//
// CHAINING SPLIT ARROW
// chaining split arrow sets off ice bursts in correct order
//
// COUNTERATTACK
// combatant dies from explosion set off from their own counterattack
// counterattack + enemy countered is hit from firewall on way back from getting counterattacked:
// - doesn't unlock input early
// ranged counterattack through firewall incinerates (does no damage)
// ranged counterattack through firewall ignites projectile
//
//
// ICE BURST
// if killed with primed for ice burst, don't error
// ice burst triggered by firewall doesn't hit anyone
//
// MONSTER AI
// monsters heal allies
// combatants attack highest threat target
//
// ABILITY TREE ALLOCATION
// allocate point
// can not allocate without prerequisite
// can not allocate without required level

// -DONE-
//
// PETS
// monster with tameable trait is tameable
// monster without tameable trait is not tameable
// pet tamed removes web and ensnared condition
// pet dismissed removes web and ensnared condition
// pet summoned added to turn order
// pet summoned still has conditions it had when dismissed
// tickable conditions added to turn order bar when pet with conditions summoned in battle
// can not tame pet if slots are full
// release pet frees up slot
// can not tame pet above rank limit pet level
// battle ends if last monster is tamed
//
// FIREWALL
// enemy dies in firewall on way to melee
// enemy dies in firewall comming back from melee
// arrows light on fire (deal fire damage)
// arrows disintigrate
// firewall deteriorates stacks/ranks
// firewall can be stoked by recast
// disappears on new room entered
