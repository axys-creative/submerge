export const PX_PER_M = 10;
/** Visible world area; the camera zooms so every screen shape sees about this much. */
export const VIEW_AREA = 1280 * 720;
export const SUB_RADIUS = 28;
/** Where the sub hangs from the ship's crane, relative to the ship's center. */
export const SUB_DOCK_OFFSET = -215;
/** How far either side of the crane the sub can be to dock, in px. */
export const DOCK_RANGE = 160;
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

/** Deep in the Crimson Sea cavern: the depth in meters that wakes the monster, how long its face shows, the pause after it, and its chase speeds in px/s. */
export const MONSTER_DEPTH = 4800;
export const MONSTER_FACE_TIME = 7;
export const MONSTER_WAIT = 2;
export const MONSTER_SPEED = 230;
export const MONSTER_SURGE = 310;

/** How much bigger the monster is drawn and collides than its base design, and how many head positions its body follows (16 px apart). */
export const MONSTER_SCALE = 1.7;
export const MONSTER_TRAIL = 150;
