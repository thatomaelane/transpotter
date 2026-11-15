export const MODES = ['road', 'rail', 'aviation', 'marine', 'other'] as const
export type Mode = (typeof MODES)[number]

// Keys only. The visible names live in the translation files.
export const HAZARDS: Record<Mode, string[]> = {
  road: ['reckless_driving', 'road_defect', 'dangerous_loading', 'pedestrian_risk', 'road_flooding', 'near_miss', 'other_hazard'],
  rail: ['track_obstruction', 'crossing_hazard', 'signalling_fault', 'infrastructure_damage', 'near_miss', 'other_hazard'],
  aviation: ['ramp_hazard', 'foreign_object', 'ground_operations', 'workplace_safety', 'near_miss', 'other_hazard'],
  marine: ['vessel_risk', 'port_hazard', 'spill', 'navigation_concern', 'near_miss', 'other_hazard'],
  other: ['workplace_safety', 'near_miss', 'other_hazard'],
}
