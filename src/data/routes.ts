import { ZONES } from './zones';
import type { Loadout } from './upgrades';

export type Side = 'west' | 'east';

/** One end of a zone. */
export interface Endpoint {
  zone: number;
  side: Side;
}

/**
 * Each entry joins two zone ends: sailing off one end arrives at the other.
 * An end can appear in several entries, which makes a junction where the player picks a route.
 */
export const ROUTES: [Endpoint, Endpoint][] = [
  [{ zone: 0, side: 'east' }, { zone: 1, side: 'west' }],
  [{ zone: 1, side: 'east' }, { zone: 2, side: 'west' }],
  [{ zone: 1, side: 'east' }, { zone: 3, side: 'west' }],
  [{ zone: 2, side: 'east' }, { zone: 4, side: 'west' }],
  [{ zone: 3, side: 'east' }, { zone: 4, side: 'west' }],
  [{ zone: 4, side: 'east' }, { zone: 5, side: 'west' }],
];

/** A portal standing on the surface at x; sailing to it and entering takes the ship to `toX` in zone `to`. */
export interface Portal {
  zone: number;
  x: number;
  to: number;
  toX: number;
  /** Stays closed until the portal stone has been taken. */
  sealed: boolean;
  /** Stays hidden until the monster has started its chase. */
  chase?: boolean;
}

export const PORTALS: Portal[] = [
  { zone: 4, x: 3450, to: 6, toX: 1200, sealed: true },
  { zone: 6, x: 1200, to: 4, toX: 3450, sealed: false, chase: true },
];

/** Abyssal Plains and Crimson Sea, joined by the portals; drawn on the route map once open. */
export const PORTAL_LINK: [Endpoint, Endpoint] = [{ zone: 4, side: 'east' }, { zone: 6, side: 'west' }];

export const FROZEN = 5;

/** The lowest bought level (counting from 0) of each upgrade that opens the way into Frozen Expanse. */
export const FROZEN_REQUIRES: Loadout = { plating: 2, oxygen: 2, battery: 2, propeller: 1, cargo: 1, hull: 2, light: 2, sonar: 2 };

/** Frozen Expanse is still in progress: no route leads there, only the dev panel's zone stepper. */
const FROZEN_HIDDEN = true;

export const frozenOpen = (owned: Loadout) =>
  !FROZEN_HIDDEN &&
  (Object.keys(FROZEN_REQUIRES) as (keyof Loadout)[]).every((id) => owned[id] >= FROZEN_REQUIRES[id]);

const same = (a: Endpoint, b: Endpoint) => a.zone === b.zone && a.side === b.side;

/** Every end you can sail to from the given end of a zone. */
export function routesFrom(zone: number, side: Side, owned: Loadout): Endpoint[] {
  const from = { zone, side };
  const out: Endpoint[] = [];
  for (const [a, b] of ROUTES) {
    if (same(a, from)) out.push(b);
    else if (same(b, from)) out.push(a);
  }
  return frozenOpen(owned) ? out : out.filter((e) => e.zone !== FROZEN);
}

/** Short buoy text for an end: the destination's name, or a hint when there is a choice. */
export function buoyLabel(zone: number, side: Side, owned: Loadout): string {
  const routes = routesFrom(zone, side, owned);
  return routes.length === 1 ? ZONES[routes[0].zone].name : 'Choose a route';
}
