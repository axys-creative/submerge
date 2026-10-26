export const PX_PER_M = 10;
/** Visible world area; the camera zooms so every screen shape sees about this much. */
export const VIEW_AREA = 1280 * 720;
export const SUB_RADIUS = 28;
/** Where the sub hangs from the ship's crane, relative to the ship's center. */
export const SUB_DOCK_OFFSET = -215;
export const SAVE_KEY = 'submerge.save.v1';
/** Seconds the spotlight stutters after a bump. */
export const FLICKER_TIME = 0.5;
/** Seconds a speech bubble stays over the sub. */
export const SPEECH_TIME = 4;
/** Dimmest the cockpit and viewport lights get when the battery is dead. */
export const COCKPIT_MIN = 0.12;
/** Seconds the sub can hold its breath after the air runs out. */
export const BREATH_TIME = 5;
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
