// server ticks combat until next tracker
// - if is combatant, take their AI turn or wait for user input
// - if is condition
//   * aggregate any conditions with the same amount of movement and process their branching actions "simultaneously"
//   * push any conditions with no more ticks remaining to list of removed trackers
// - accumulate a list of removed trackers
// - accumulate list of added trackers
// - update trackers list with the accumulated lists
// - send lists to client
// - client animates any action replays
// - client animates removal of trackers and additions of new trackers
// - if conditions, client updates their aggregated condition turn markers until no markers are left, then
// removes the aggregated condition marker
//
// Turn Order Update Events
// - tracker deletions
// - tracker translations toward left (consolidation)
// - new tracker fadeins
// - first tracker in order scales and translates
//
//
// [] () () ()
//
// FTK turn trackers behavior
// - combatant finishes turn (all action animations resolve)
// - combatant turn marker is instantly removed
// - any killed combatatant's markers are removed, leaving a gap behind
// - turn markers are animated to close space between them by moving toward the front (left side)
//   * the (now) first marker only moves to the left enough to cover the marginRight of the previously first one
// - new turn markers are pushed in predicted turn order (sorted by speed)
// to the end and faded in to fill the minimum of 12 markers
// - the (now) first marker animates moving one more to the left and scaling up while all other markers animate translating
// left to fill in
