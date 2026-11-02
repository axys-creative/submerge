import { ZONES } from './zones';

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
  { zone: 4, x: 3450, to: 5, toX: 1200, sealed: true },
  { zone: 5, x: 1200, to: 4, toX: 3450, sealed: false, chase: true },
];

/** Moana Deep and Crimson Sea, joined by the portals; drawn on the route map once open. */
export const PORTAL_LINK: [Endpoint, Endpoint] = [{ zone: 4, side: 'east' }, { zone: 5, side: 'west' }];

const same = (a: Endpoint, b: Endpoint) => a.zone === b.zone && a.side === b.side;

/** Every end you can sail to from the given end of a zone. */
export function routesFrom(zone: number, side: Side): Endpoint[] {
  const from = { zone, side };
  const out: Endpoint[] = [];
  for (const [a, b] of ROUTES) {
    if (same(a, from)) out.push(b);
    else if (same(b, from)) out.push(a);
  }
  return out;
}

/** Short buoy text for an end: the destination's name, or a hint when there is a choice. */
export function buoyLabel(zone: number, side: Side): string {
  const routes = routesFrom(zone, side);
  return routes.length === 1 ? ZONES[routes[0].zone].name : 'Choose a route';
}
