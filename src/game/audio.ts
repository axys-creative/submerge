const BASE = `${import.meta.env.BASE_URL}audio/sfx/`;

const FILES = {
  splash: ["sound-splash.m4a"],
  sonar: ["sound-sonar.m4a"],
  surface: ["sound-ocean-surface-background.m4a"],
  depths: ["sound-ocean-depths-background.mp3"],
  propeller: ["sound-propeller.m4a"],
  sailing: ["sound-ship-sailing.m4a"],
  implosion: ["sound-implosion.m4a"],
  horn: ["sound-warning-horn.m4a"],
  clank1: ["sound-clank-1.m4a"],
  clank2: ["sound-clank-2.m4a"],
  depth1: ["sound-depth-1.m4a"],
  depth2: ["sound-depth-2.m4a"],
  chime1: ["sound-chime-1.m4a"],
  chime2: ["sound-chime-2.m4a"],
  seagulls: ["sound-seagulls.m4a"],
  music: ["sound-music-1.m4a"],
  whaleFar: ["sound-whale-far.m4a"],
  whaleNear: ["sound-whale-near.m4a"],
} as const;

type Sound = keyof typeof FILES;
type Scene = "surface" | "dive";

const KEY = "submerge.audio.v1";

const VOLUME: Record<Sound, number> = {
  splash: 1,
  sonar: 0.35,
  surface: 0.7,
  depths: 0.7,
  propeller: 0.6,
  sailing: 0.6,
  implosion: 1,
  horn: 0.8,
  clank1: 0.8,
  clank2: 0.8,
  depth1: 0.7,
  depth2: 0.8,
  chime1: 0.7,
  chime2: 0.7,
  seagulls: 0.6,
  music: 0.5,
  whaleFar: 0.7,
  whaleNear: 0.9,
};

/** Which looping beds play in each scene. */
const BEDS: Record<Scene, Sound[]> = { surface: ["surface"], dive: ["depths"] };
const LOOPS: Sound[] = ["surface", "depths", "propeller", "sailing"];


const HORN_GAP = 0.5;

/** Distances in px from the nearest whale: the far call plays between these, the near call inside the first. */
const WHALE_NEAR_PX = 1200;
const WHALE_FAR_PX = 3000;
/** The far call starts beyond this, so the whale itself is still off screen. */
const WHALE_FAR_FROM_PX = 1500;

/** Depth in meters at which the music is fully muffled, and the cutoff range it sweeps through. */
const MUFFLE_DEPTH = 120;
const OPEN_HZ = 18000;
const MUFFLED_HZ = 250;
const MUFFLED_GAIN = 0.2;
const GULL_MUFFLED_HZ = 450;

/** Hull creaks (depth 1, then depth 2) start at these fractions of the plating's depth rating. */
const DEPTH_1_FROM = 0.4;
const DEPTH_2_FROM = 0.85;

export class AudioManager {
  private ctx: AudioContext | null = null;
  private buffers = new Map<Sound, AudioBuffer>();
  private beds = new Map<Sound, GainNode>();
  private master: GainNode | null = null;
  private out: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private musicFilter: BiquadFilterNode | null = null;
  private musicDepth: GainNode | null = null;
  private muffle = 0;
  private scene: Scene = "surface";
  private propeller = false;
  private hornTimer = 0;
  private depthTimer = 0;
  private gullTimer = 3;
  private gullFilter: BiquadFilterNode | null = null;
  private gullBus: GainNode | null = null;
  private gullMuffled = 0;
  private depthTravel = 0;
  private depthNext = 40;
  private depthY = 0;
  private hitIndex = 0;
  private whaleFarTimer = 4;
  private whaleNearTimer = 0;
  volume = 1;
  musicVolume = 1;
  muted = false;

  constructor() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "{}");
      if (typeof saved.volume === "number") this.volume = Math.min(1, Math.max(0, saved.volume));
      if (typeof saved.musicVolume === "number")
        this.musicVolume = Math.min(1, Math.max(0, saved.musicVolume));
      this.muted = saved.muted === true;
    } catch {}
    const unlock = () => {
      removeEventListener("pointerdown", unlock);
      removeEventListener("keydown", unlock);
      this.unlock();
    };
    addEventListener("pointerdown", unlock);
    addEventListener("keydown", unlock);
  }

  setScene(scene: Scene) {
    if (scene === this.scene) return;
    this.scene = scene;
    this.applyBeds();
  }

  setPropeller(on: boolean) {
    if (on === this.propeller) return;
    this.propeller = on;
    this.applyBeds();
  }

  /** Fades the ship's engine loop with its speed, 0 (still) to 1 (full speed). */
  setSailing(speed: number) {
    const gain = this.beds.get("sailing");
    if (!this.ctx || !gain) return;
    gain.gain.setTargetAtTime(VOLUME.sailing * speed, this.ctx.currentTime, 0.3);
  }

  /** Repeats the single-blast horn while a warning is active. */
  tick(dt: number, warning: boolean) {
    if (!warning) {
      this.hornTimer = 0;
      return;
    }
    this.hornTimer -= dt;
    const horn = this.buffers.get("horn");
    if (this.hornTimer <= 0 && horn) {
      this.play("horn");
      this.hornTimer = horn.duration + HORN_GAP;
    }
  }

  /** Seagulls go through their own low-pass, so a call already playing is muffled the moment the sub dips under. */
  private playGull(volume: number, clip: AudioBuffer) {
    if (!this.ctx || !this.master) return;
    if (!this.gullFilter) {
      this.gullFilter = this.ctx.createBiquadFilter();
      this.gullFilter.type = "lowpass";
      this.gullFilter.frequency.value = OPEN_HZ;
      this.gullBus = this.ctx.createGain();
      this.gullFilter.connect(this.gullBus).connect(this.master);
    }
    const src = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    gain.gain.value = VOLUME.seagulls * volume;
    src.buffer = clip;
    src.connect(gain).connect(this.gullFilter);
    src.start();
  }

  /** Muffles seagulls fast as soon as the sub is below the surface. */
  gullMuffleTick(dt: number, depthM: number) {
    if (!this.gullFilter || !this.gullBus) return;
    const target = Math.min(1, Math.max(0, (depthM - 0.8) / 1.5));
    this.gullMuffled += (target - this.gullMuffled) * (1 - Math.exp(-10 * dt));
    this.gullFilter.frequency.value = OPEN_HZ * (GULL_MUFFLED_HZ / OPEN_HZ) ** this.gullMuffled;
    this.gullBus.gain.value = 1 - 0.55 * this.gullMuffled;
  }

  /** Plays the seagull clip every so often at the surface, by day, when within earshot of an island (nearness 0..1). */
  gulls(dt: number, nearness: number) {
    if (this.scene !== "surface" || !this.ctx || !this.master || nearness <= 0) return;
    this.gullTimer -= dt;
    const clip = this.buffers.get("seagulls");
    if (this.gullTimer > 0 || !clip) return;
    this.playGull((0.4 + 0.6 * nearness) * (0.8 + Math.random() * 0.2), clip);
    this.gullTimer = clip.duration + 8 + Math.random() * 17;
  }

  /**
   * Whale calls: a far call when the nearest whale is distant and off screen, a near call once it is close.
   * `dist` is in px (Infinity for none) and `dx` its sideways offset from the sub, used to pan the sound.
   */
  whales(dt: number, dist: number, dx: number) {
    this.whaleFarTimer -= dt;
    this.whaleNearTimer -= dt;
    const far = this.buffers.get("whaleFar");
    const near = this.buffers.get("whaleNear");
    const pan = Math.max(-1, Math.min(1, dx / 1500));
    if (near && dist < WHALE_NEAR_PX && this.whaleNearTimer <= 0) {
      this.play("whaleNear", 0.6 + 0.4 * (1 - dist / WHALE_NEAR_PX), pan);
      this.whaleNearTimer = near.duration + 12 + Math.random() * 18;
      this.whaleFarTimer = Math.max(this.whaleFarTimer, near.duration + 6);
    } else if (far && dist >= WHALE_FAR_FROM_PX && dist < WHALE_FAR_PX && this.whaleFarTimer <= 0) {
      this.play("whaleFar", 0.45 + 0.55 * (1 - (dist - WHALE_FAR_FROM_PX) / (WHALE_FAR_PX - WHALE_FAR_FROM_PX)), pan);
      this.whaleFarTimer = far.duration + 15 + Math.random() * 25;
    }
  }

  /** Alternates the two clanks so repeated hits don't sound identical. */
  hit(volume = 1) {
    this.play(this.hitIndex++ % 2 ? "clank2" : "clank1", volume);
  }

  /** Depth sounds (hull creaks) while moving through the pressure zones, at irregular distances rather than fixed depths. */
  depthSounds(depthFrac: number, y: number, dt: number) {
    this.depthTimer -= dt;
    const moved = Math.abs(y - this.depthY);
    this.depthY = y;
    if (depthFrac < DEPTH_1_FROM) {
      this.depthTravel = 0;
      return;
    }
    this.depthTravel += moved;
    if (this.depthTravel < this.depthNext || this.depthTimer > 0) return;
    this.play(depthFrac >= DEPTH_2_FROM ? "depth2" : "depth1", 0.7 + Math.random() * 0.3);
    this.depthTravel = 0;
    this.depthNext = 80 + Math.random() * 200;
    this.depthTimer = 2.5;
  }

  setVolume(v: number) {
    this.volume = Math.min(1, Math.max(0, v));
    this.applyMaster();
    this.persist();
  }

  setMusicVolume(v: number) {
    this.musicVolume = Math.min(1, Math.max(0, v));
    this.applyMaster();
    this.persist();
  }

  /** Muffles the music the deeper the sub is: a low-pass sweep plus a fade. */
  musicTick(dt: number, depthM: number) {
    if (!this.musicFilter || !this.musicDepth) return;
    const target = Math.min(1, Math.max(0, depthM / MUFFLE_DEPTH));
    this.muffle += (target - this.muffle) * (1 - Math.exp(-3 * dt));
    this.musicFilter.frequency.value = OPEN_HZ * (MUFFLED_HZ / OPEN_HZ) ** this.muffle;
    this.musicDepth.gain.value = 1 - (1 - MUFFLED_GAIN) * this.muffle;
  }

  setMuted(m: boolean) {
    this.muted = m;
    this.applyMaster();
    this.persist();
  }

  private persist() {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({ volume: this.volume, musicVolume: this.musicVolume, muted: this.muted }),
      );
    } catch {}
  }

  private applyMaster() {
    if (this.out) this.out.gain.value = this.muted ? 0 : 1;
    if (this.master) this.master.gain.value = this.volume;
    if (this.musicBus) this.musicBus.gain.value = this.musicVolume * VOLUME.music;
  }

  play(name: Sound, volume = 1, pan = 0) {
    const buf = this.buffers.get(name);
    if (!this.ctx || !this.master || !buf) return;
    const src = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    gain.gain.value = VOLUME[name] * volume;
    src.buffer = buf;
    if (pan) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = pan;
      src.connect(gain).connect(panner).connect(this.master);
    } else src.connect(gain).connect(this.master);
    src.start();
  }

  private async unlock() {
    try {
      this.ctx = new AudioContext();
      this.out = this.ctx.createGain();
      this.out.connect(this.ctx.destination);
      this.master = this.ctx.createGain();
      this.master.connect(this.out);
      this.musicBus = this.ctx.createGain();
      this.musicBus.connect(this.out);
      this.applyMaster();
      await this.ctx.resume();
      await Promise.all(
        (Object.keys(FILES) as Sound[]).map(async (name) => {
          for (const file of FILES[name]) {
            try {
              const res = await fetch(BASE + file);
              if (!res.ok) continue;
              this.buffers.set(name, await this.ctx!.decodeAudioData(await res.arrayBuffer()));
              return;
            } catch {}
          }
          console.warn(`No audio file found for "${name}". Tried: ${FILES[name].join(", ")}`);
        }),
      );
      for (const name of LOOPS) {
        const buffer = this.buffers.get(name);
        if (!buffer) continue;
        const src = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        gain.gain.value = 0;
        src.buffer = buffer;
        src.loop = true;
        src.connect(gain).connect(this.master);
        src.start();
        this.beds.set(name, gain);
      }
      this.startMusic();
      this.applyBeds();
    } catch {
      this.ctx = null;
    }
  }

  private startMusic() {
    const buffer = this.buffers.get("music");
    if (!this.ctx || !this.musicBus || !buffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    this.musicFilter = this.ctx.createBiquadFilter();
    this.musicFilter.type = "lowpass";
    this.musicFilter.frequency.value = OPEN_HZ;
    this.musicDepth = this.ctx.createGain();
    src.connect(this.musicFilter).connect(this.musicDepth).connect(this.musicBus);
    src.start();
  }

  private applyBeds() {
    if (!this.ctx) return;
    for (const [name, gain] of this.beds) {
      if (name === "sailing") continue;
      const on = name === "propeller" ? this.propeller : BEDS[this.scene].includes(name);
      gain.gain.setTargetAtTime(
        on ? VOLUME[name] : 0,
        this.ctx.currentTime,
        name === "propeller" ? 0.15 : 0.6,
      );
    }
  }
}
