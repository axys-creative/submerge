import { MONSTER_SCALE } from "../config";

export type CreatureKind =
  | "fish"
  | "jelly"
  | "moonjelly"
  | "shark"
  | "hammerhead"
  | "squid"
  | "angler"
  | "whale"
  | "orca"
  | "orcacalf"
  | "mobydick"
  | "stingray"
  | "manta"
  | "colossal"
  | "giant"
  | "turtle"
  | "bluewhale"
  | "whaleshark"
  | "bigfin"
  | "leviathan";

export interface CreatureDef {
  name: string;
  radius: number;
  harmful: boolean;
  /** For long bodies: circles along the body (offset in px toward the head, radius) used for collisions. */
  body?: [number, number][];
}

/** Sharks are drawn this many times longer than their base design, and then this much bigger overall. */
export const SHARK_LENGTH = 1.5;
export const SHARK_SCALE = 0.9;
/** Great whites come in three sizes, the smallest a quarter bigger than the hammerhead, picked by the same third of the tint as their color. */
export const GREAT_WHITE_SCALES = [1.25, 1.35, 1.45];
export const greatWhiteScale = (tint: number) => GREAT_WHITE_SCALES[Math.floor(tint * 3) % 3];
const GREAT_WHITE_MAX = GREAT_WHITE_SCALES[GREAT_WHITE_SCALES.length - 1];
export const HAMMERHEAD_SCALE = 0.9;
/** Sea turtles come in three sizes, picked by the same third of the tint as their color. */
export const TURTLE_SCALES = [0.75, 0.85, 0.95];
export const turtleScale = (tint: number) => TURTLE_SCALES[Math.floor(tint * 3) % 3];
const TURTLE_MAX = TURTLE_SCALES[TURTLE_SCALES.length - 1];
export const JELLY_SCALE = 0.5;
/** How much bigger the whale shark is drawn than its 460 px design. */
export const WHALE_SHARK_SCALE = 1.25;
/** Moon jellies come in three sizes, the smallest one and a half times as big as the jellyfish, picked by the same third of the tint. */
export const MOON_JELLY_SIZES = [1.5, 1.8, 2.1];
export const moonJellyScale = (tint: number) => JELLY_SCALE * MOON_JELLY_SIZES[Math.floor(tint * 3) % 3];
const MOON_JELLY_MAX = JELLY_SCALE * MOON_JELLY_SIZES[MOON_JELLY_SIZES.length - 1];
/** Manta rays come in three sizes, the largest as they were before, picked by the same third of the tint as their color. */
export const MANTA_SCALES = [0.8, 0.9, 1].map((s) => s * 0.75);
export const STINGRAY_SCALE = 0.5;
export const mantaScale = (tint: number) => MANTA_SCALES[Math.floor(tint * 3) % 3];
/** Anglerfish come in three sizes, the largest as they were before, picked by the same third of the tint as their color. */
export const ANGLER_SCALES = [0.65, 0.75, 0.85];
const anglerIndex = (tint: number) => Math.floor(tint * 3) % 3;
/** How much the anglerfish drawing (a 120 px design) is scaled. */
export const anglerScale = (tint: number) => 0.75 * ANGLER_SCALES[anglerIndex(tint)];
const ANGLER_MAX = ANGLER_SCALES[ANGLER_SCALES.length - 1];
/** An anglerfish's size against the largest, 1 for the largest. */
export const anglerRelSize = (tint: number) => ANGLER_SCALES[anglerIndex(tint)] / ANGLER_MAX;

/** How much bigger the sperm whale is drawn and collides than its base 480 px design. */
export const WHALE_SCALE = 1.5;
/** Moby Dick is a sperm whale about 40% bigger again. */
export const MOBY_DICK_SCALE = WHALE_SCALE * 1.125 * 1.25;

/** How much bigger the blue whale is drawn than its base 640 px design: about 45 m against a 6 m great white. */
export const BLUE_WHALE_SCALE = 1.83;

/** The speed in px/s at which a fish's tail beats hardest and fastest. */
export const FISH_FULL_SPEED = 120;

/** How much the squid is scaled down from its base design. */
export const SQUID_SCALE = 0.5625;

/** How much the bigfin squid is scaled down from its base design. */
export const BIGFIN_SCALE = 0.5;

/** How much bigger the colossal squid is drawn than the squid's base design. */
export const COLOSSAL_SCALE = 1.40625;
/** The giant squid is drawn a quarter smaller than the colossal squid. */
export const GIANT_SCALE = COLOSSAL_SCALE * 0.75;
/** Segments in each of the giant squid's two long tentacles (an ordinary squid has 11). */
export const GIANT_TENTACLE = 24;

/** How big the orca is drawn against its 330 px design, and how much smaller a calf is than an adult. */
export const ORCA_SCALE = 1;
/** The orca is drawn turned this far nose-down (10 degrees) to level out its arched body. */
export const ORCA_TILT = (10 * Math.PI) / 180;
export const ORCA_CALF_SCALE = 0.38;

/** Kinds drawn behind the sea floor and scenery, so the sub passes in front of them. */
export const BACKGROUND_KINDS: CreatureKind[] = ["bluewhale"];

export const CREATURES: Record<CreatureKind, CreatureDef> = {
  fish: { name: "Fish", radius: 10, harmful: false },
  jelly: { name: "Jellyfish", radius: 16 * JELLY_SCALE, harmful: false },
  moonjelly: { name: "Moon Jelly", radius: 18 * MOON_JELLY_MAX, harmful: false },
  shark: { name: "Great White Shark", radius: 30 * SHARK_SCALE * GREAT_WHITE_MAX, harmful: true },
  hammerhead: { name: "Hammerhead Shark", radius: 32 * SHARK_SCALE * HAMMERHEAD_SCALE, harmful: true },
  squid: { name: "Squid", radius: 32 * SQUID_SCALE, harmful: true },
  angler: { name: "Anglerfish", radius: 21 * ANGLER_MAX, harmful: true },
  stingray: { name: "Stingray", radius: 26 * STINGRAY_SCALE, harmful: false },
  manta: { name: "Manta Ray", radius: 62 * 0.75, harmful: false },
  turtle: { name: "Sea Turtle", radius: 26 * TURTLE_MAX, harmful: false },
  bluewhale: { name: "Blue Whale", radius: 110, harmful: false },
  whaleshark: { name: "Whale Shark", radius: 70 * WHALE_SHARK_SCALE, harmful: false },
  bigfin: { name: "Bigfin Squid", radius: 26 * BIGFIN_SCALE, harmful: false },
  leviathan: { name: "Leviathan", radius: 95 * MONSTER_SCALE, harmful: true },
  colossal: { name: "Colossal Squid", radius: 38.5 * COLOSSAL_SCALE, harmful: true },
  giant: { name: "Giant Squid", radius: 38.5 * GIANT_SCALE, harmful: true },
  orca: {
    name: "Orca",
    radius: 44 * ORCA_SCALE,
    harmful: true,
    body: (
      [
        [125, 36],
        [50, 42],
        [-40, 36],
        [-110, 22],
      ] as [number, number][]
    ).map(([dx, r]): [number, number] => [dx * ORCA_SCALE, r * ORCA_SCALE]),
  },
  orcacalf: { name: "Orca Calf", radius: 44 * ORCA_CALF_SCALE, harmful: false },
  whale: {
    name: "Sperm Whale",
    radius: 130 * WHALE_SCALE,
    harmful: true,
    body: (
      [
        [150, 92],
        [40, 92],
        [-70, 80],
        [-170, 48],
      ] as [number, number][]
    ).map(([dx, r]): [number, number] => [dx * WHALE_SCALE, r * WHALE_SCALE]),
  },
  mobydick: {
    name: "Moby Dick",
    radius: 130 * MOBY_DICK_SCALE,
    harmful: true,
    body: (
      [
        [150, 92],
        [40, 92],
        [-70, 80],
        [-170, 48],
      ] as [number, number][]
    ).map(([dx, r]): [number, number] => [dx * MOBY_DICK_SCALE, r * MOBY_DICK_SCALE]),
  },
};

/** How far from its center each kind is drawn, in world px: sizes sonar outlines and keeps big animals from popping in or out at the screen edge. */
export const CREATURE_EXTENT: Record<CreatureKind, number> = {
  fish: 36,
  jelly: 70 * JELLY_SCALE,
  moonjelly: 110 * MOON_JELLY_MAX,
  shark: 110 * SHARK_LENGTH * SHARK_SCALE * GREAT_WHITE_MAX,
  hammerhead: 110 * SHARK_LENGTH * SHARK_SCALE * HAMMERHEAD_SCALE,
  squid: 140 * SQUID_SCALE,
  angler: 80 * ANGLER_MAX,
  orca: 215 * ORCA_SCALE,
  orcacalf: 215 * ORCA_CALF_SCALE,
  whale: 270 * WHALE_SCALE,
  mobydick: 270 * MOBY_DICK_SCALE,
  stingray: 130 * STINGRAY_SCALE,
  manta: 170 * 0.75,
  turtle: 70 * TURTLE_MAX,
  bluewhale: 360 * BLUE_WHALE_SCALE,
  whaleshark: 240 * WHALE_SHARK_SCALE,
  bigfin: 1000 * BIGFIN_SCALE,
  leviathan: 2700,
  colossal: 138.5 * COLOSSAL_SCALE,
  giant: (23 + 11 * GIANT_TENTACLE) * GIANT_SCALE,
};

/** How far a sperm whale pitches nose-up or nose-down, in radians. */
const WHALE_PITCH_MAX = 0.55;

/** The tilt of a sperm whale from how it is moving; the drawing and the collision body both follow it. */
export const whalePitch = (c: { vx: number; vy: number }) =>
  Math.max(
    -WHALE_PITCH_MAX,
    Math.min(WHALE_PITCH_MAX, Math.atan2(c.vy, Math.max(Math.abs(c.vx), 30))),
  );

/** A creature's own collision radius: turtles vary in size, every other kind has one radius. */
export const creatureRadius = (c: { kind: CreatureKind; tint: number }) =>
  c.kind === "turtle"
    ? 26 * turtleScale(c.tint)
    : c.kind === "moonjelly"
      ? 18 * moonJellyScale(c.tint)
      : c.kind === "shark"
      ? 30 * SHARK_SCALE * greatWhiteScale(c.tint)
      : c.kind === "manta"
        ? 62 * mantaScale(c.tint)
        : c.kind === "angler"
          ? 21 * ANGLER_SCALES[anglerIndex(c.tint)]
          : CREATURES[c.kind].radius;
