export const PX_PER_M = 10;
/** Visible world area; the camera zooms so every screen shape sees about this much. */
export const VIEW_AREA = 1280 * 720;
export const SUB_RADIUS = 28;
/** Where the sub hangs from the ship's crane, relative to the ship's center. */
export const SUB_DOCK_OFFSET = -215;
/** How far either side of the crane the sub can be to dock, in px. */
export const DOCK_RANGE = 25;
export const SAVE_KEY = 'submerge.save.v1';
/** Seconds the spotlight stutters after a bump. */
export const FLICKER_TIME = 0.5;
/** Seconds a speech bubble stays over the sub. */
export const SPEECH_TIME = 4;
/** Dimmest the cockpit and viewport lights get when the battery is dead. */
export const COCKPIT_MIN = 0.12;
/** Seconds the sub can hold its breath after the air runs out. */
export const BREATH_TIME = 5;
/** Fraction of the air tank at or below which surfacing gets a deep breath. */
export const LOW_AIR = 0.2;
/** Rays a sonar ping casts to find terrain. */
export const SONAR_RAYS = 180;
/** Treasure worth at least this much sets off the ship's detector when the ship passes within the range (px) of it. */
export const VALUABLE_TREASURE = 200;
export const TREASURE_DETECT_RANGE = 150;
/** How fast a sonar ring expands, as a multiple of the sonar's range per second. */
export const SONAR_RING_SPEED = 1.8;
/** The game draws at most this many frames per second, which saves heat and battery on fast displays. */
export const MAX_FPS = 60;
/** The canvas is drawn with at most this many pixels, so very large or high-density screens do not overload the GPU. */
export const MAX_CANVAS_PIXELS = 2_800_000;
/** Depth in meters below which the spotlight and the sonar switch on, by day and at night (or on a moon). A few meters of slack stop them flickering at the edge. */
export const LAMP_ON_DEPTH_DAY = 50;
export const LAMP_ON_DEPTH_NIGHT = 15;
export const SONAR_ON_DEPTH_DAY = 75;
export const SONAR_ON_DEPTH_NIGHT = 50;
export const SWITCH_SLACK = 7;

/** How far around the sub (or ship) the minimap is revealed, in px. */
export const MAP_REVEAL_RADIUS = 450;
/** Fraction of a zone's dim-to-full darkness range at which the map stops revealing without a light (about 5% of daylight left). */
export const MAP_BLIND_DEPTH = 0.95;

/** Seconds the sub takes to crumple before the flash, and until the wreck message appears. */
export const IMPLODE_COLLAPSE = 0.05;
export const IMPLODE_MESSAGE = 1;

/** Minimap px below the surface over which the unexplored shadow fades in from clear. */
export const MAP_SURFACE_FADE = 70;

/** A suffocated sub sinks at SINK_SLOW px/s near the surface and speeds up to SINK_FAST by SINK_RAMP_M meters down. */
export const SINK_SLOW = 25;
export const SINK_FAST = 100;
export const SINK_RAMP_M = 150;

/** Meters above the depth rating that show yellow on the depth meter, and how far the red crush zone below it is drawn. */
export const DEPTH_WARN_RANGE = 40;
export const CRUSH_DEPTH_SHOWN = 6000;

/** How far outside the screen, in px, a dropped weight can still be heard hitting the bottom (100 m). */
export const WEIGHT_HEARING_MARGIN = 1000;

/** In the Crimson Sea's deep cave: the depth in meters that wakes the monster, the pause before it rises, and its chase speeds in px/s. */
export const MONSTER_DEPTH = 3900;
export const MONSTER_WAIT = 2;
export const MONSTER_SPEED = 230;
export const MONSTER_SURGE = 310;

/** How much bigger the monster is drawn and collides than its base design, and how many head positions its body follows (16 px apart). */
export const MONSTER_SCALE = 1.7;
export const MONSTER_TRAIL = 150;

/** Once the leviathan takes the sub: seconds it is pulled into the open mouth, then seconds the jaws take to shut. */
export const SWALLOW_CLOSE = 1.4;
export const SWALLOW_SHUT = 0.6;

/** The Crimson Sea's instruments glitch for this many seconds, then again after a random wait between the two lengths. */
export const GLITCH_TIME = 3;
export const GLITCH_GAP: [number, number] = [20, 20];
/** Seconds after the wreck message appears before the instruments glitch. */
export const DEATH_GLITCH_DELAY = 1;

/** The zoom while the test panel's fast mode is on, wider than any zone's own. */
export const DEBUG_ZOOM = 0.3;

/** Holding the boost key while sailing: how many times faster the ship goes, and how far the camera zooms out at full boost. */
export const BOOST_SPEED = 3;
export const BOOST_ZOOM = 0.62;

/** Seconds the crane hook takes to reel all the way up or down. */
export const HOOK_TIME = 1;

/** Spotlight aim: degrees below the heading after a tap of down, seconds of holding down before it points straight below, total sway in degrees when idle and when steering, and how quickly it tilts. */
export const LAMP_PITCH_DOWN = 70;
export const LAMP_PITCH_FORWARD = 12;
export const LAMP_HOLD_TIME = 0.35;
export const LAMP_SWAY_IDLE = 7.5;
export const LAMP_SWAY_STEER = 1.5;
export const LAMP_TILT_RATE = 1.5;
/** How quickly the beam moves between aims (down vs forward); lower is slower. */
export const LAMP_AIM_RATE = 0.7;

/** Battery spent per second while the sub holds its depth. */
export const DEPTH_HOLD_DRAIN = 5;
/** Propeller sound level while the sub holds its depth, as a fraction of its driving volume. */
export const HOLD_MOTOR_VOLUME = 0.5;

/** How many times wider than the original design the islands are, above and below the waterline. */
export const ISLAND_WIDTH = 2;

/** Fraction of the listed kelp, coral, rocks, reefs, bones and cave stones that actually get placed. */
export const SCENERY_DENSITY = 0.3;

/** How close the ship may sail to either end of a zone; enough that the sub's mount, SUB_DOCK_OFFSET behind it, is still inside the sub's reach. */
export const SHIP_MARGIN = 300;
