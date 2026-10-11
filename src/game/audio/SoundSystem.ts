/**
 * Web Audio Procedural Sound Engine
 * Recreates emotional acoustic guitar tones (Santaolalla-inspired),
 * ambient post-apocalyptic rain, clicker echolocation clicks, groans,
 * combat impacts, flesh knife slashes, heartbeats, and footstep textures.
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private rainNoiseNode: AudioNode | null = null;
  private heartbeatInterval: number | null = null;
  private musicTimer: number | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.startRainAmbience();
      this.startEmotionalGuitarTheme();
      this.isInitialized = true;
    } catch (e) {
      console.warn('AudioContext initialization failed or blocked:', e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Generates procedural rain and wind ambience
   */
  private startRainAmbience() {
    if (!this.ctx || !this.ambientGain) return;
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Brown/Pink noise filter for rain & wind
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);

      const highpass = this.ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(180, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(highpass);
      highpass.connect(this.ambientGain);
      noise.start();
      this.rainNoiseNode = noise;
    } catch {
      // ignore
    }
  }

  /**
   * Procedural acoustic guitar notes (Karplus-Strong style + harmonic decay)
   * Plays melancholic, sparse arpeggios reminiscent of Santaolalla's Ronroco / Acoustic 6-string
   */
  public playGuitarPluck(freq: number, velocity = 0.5) {
    if (!this.ctx || !this.musicGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Slightly warm triangle-sine hybrid
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      // Lowpass envelope to emulate wooden guitar string resonance
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 3.5, now);
      filter.frequency.exponentialRampToValueAtTime(freq * 0.8, now + 1.8);

      gain.gain.setValueAtTime(velocity * 0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + 2.5);
    } catch {
      // ignore
    }
  }

  /**
   * Continuous, slow melancholic acoustic melody
   */
  private startEmotionalGuitarTheme() {
    const minorScale = [
      110, // A2 (deep drone)
      146.83, // D3
      164.81, // E3
      174.61, // F3
      220, // A3
      261.63, // C4
      329.63, // E4
      293.66, // D4
      246.94, // B3
    ];

    let noteIndex = 0;
    const playNext = () => {
      if (!this.isInitialized) return;
      const freq = minorScale[noteIndex % minorScale.length];
      const vel = 0.4 + Math.random() * 0.3;
      this.playGuitarPluck(freq, vel);

      // Occasionally add a high harmonizing note
      if (Math.random() > 0.5) {
        setTimeout(() => {
          const highFreq = minorScale[(noteIndex + 3) % minorScale.length] * 2;
          this.playGuitarPluck(highFreq, 0.25);
        }, 320);
      }

      noteIndex++;
      const nextDelay = 1800 + Math.random() * 2200;
      this.musicTimer = window.setTimeout(playNext, nextDelay);
    };

    this.musicTimer = window.setTimeout(playNext, 1200);
  }

  /**
   * Footsteps adapted to surface: concrete, puddle splash, wood, gravel
   */
  public playFootstep(surface: 'mud' | 'asphalt' | 'puddle' | 'wood' = 'asphalt', isSprinting = false) {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      const baseFreq = surface === 'mud' ? 80 : surface === 'puddle' ? 320 : surface === 'wood' ? 120 : 150;
      osc.type = surface === 'puddle' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(surface === 'puddle' ? 1200 : 400, now);

      const vol = isSprinting ? 0.35 : 0.18;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (surface === 'puddle' ? 0.18 : 0.1));

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // ignore
    }
  }

  /**
   * Melee punch impact / whoosh
   */
  public playPunch(isHit = false) {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (isHit) {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.18);

        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      } else {
        // Whoosh
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.12);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      }

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // ignore
    }
  }

  /**
   * Knife draw, slash, or sheath
   */
  public playKnife(type: 'draw' | 'slash' | 'sheath' | 'hit') {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      if (type === 'draw') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(2400, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      } else if (type === 'sheath') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1800, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.18);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      } else if (type === 'slash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      } else {
        // Flesh strike
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.18);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900, now);
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.24);
        return;
      }

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // ignore
    }
  }

  /**
   * Dodge swoosh
   */
  public playDodge() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.18);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // ignore
    }
  }

  /**
   * Clicker echolocation clicks and screeches
   */
  public playClickerSound(type: 'click' | 'shriek') {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      if (type === 'click') {
        // High frequency sharp clicking bursts
        for (let i = 0; i < 3; i++) {
          const t = now + i * 0.04;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(2400 + Math.random() * 800, t);
          gain.gain.setValueAtTime(0.3, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(t);
          osc.stop(t + 0.03);
        }
      } else {
        // Shriek / alert
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(950, now);
        osc.frequency.linearRampToValueAtTime(1400, now + 0.2);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.6);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.7);
      }
    } catch {
      // ignore
    }
  }

  /**
   * Runner infected growl/charge
   */
  public playRunnerGrowl() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(260, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.5);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.6);
    } catch {
      // ignore
    }
  }

  /**
   * Bottle throw and shatter (distraction)
   */
  public playBottleShatter() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      // High pitch crystal burst
      for (let i = 0; i < 4; i++) {
        const t = now + i * 0.025;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(3200 + Math.random() * 2000, t);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.18);
      }
    } catch {
      // ignore
    }
  }

  /**
   * Grapple struggle strain / heartbeat
   */
  public playStruggleEffort() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // ignore
    }
  }

  /**
   * Heartbeat pulsation when health is critical
   */
  public setHeartbeatActive(active: boolean) {
    if (active && !this.heartbeatInterval) {
      this.heartbeatInterval = window.setInterval(() => {
        if (!this.ctx || !this.sfxGain) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(55, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.12);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.16);
      }, 700);
    } else if (!active && this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Crafting and looting sounds
   */
  public playLoot() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.12);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // ignore
    }
  }

  public playCraft() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(440, now + 0.25);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.32);
    } catch {
      // ignore
    }
  }

  public setMasterVolume(v: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, v)), this.ctx.currentTime);
    }
  }

  public setMusicVolume(v: number) {
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(Math.max(0, Math.min(1, v)), this.ctx.currentTime);
    }
  }
}

export const soundEngine = new SoundSystem();
