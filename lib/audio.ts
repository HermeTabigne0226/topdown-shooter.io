// Procedural Web Audio API sound synthesizer
import { WeaponType } from "@/types/game";

class SoundManager {
  private ctx: AudioContext | null = null;
  private sfxVolume = 0.5;
  private musicVolume = 0.35;
  private isMuted = false;
  private isMusicPlaying = false;
  private musicInterval: NodeJS.Timeout | null = null;
  private currentStep = 0;

  // Initialize context on first user interaction
  private initContext() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.isMusicPlaying) {
      this.stopMusic();
    }
    return this.isMuted;
  }

  public getMuted() {
    return this.isMuted;
  }

  // --- SOUND EFFECTS ---

  public playShoot(type: WeaponType) {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    gain.connect(this.ctx.destination);
    osc.connect(gain);

    switch (type) {
      case "PISTOL": {
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(150, t + 0.1);
        gain.gain.setValueAtTime(0.3 * this.sfxVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.start(t);
        osc.stop(t + 0.1);
        break;
      }
      case "SHOTGUN": {
        // Multi-frequency punch with noise burst
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.2);
        gain.gain.setValueAtTime(0.6 * this.sfxVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        osc.start(t);
        osc.stop(t + 0.2);

        // Noise burst for scatter sound
        this.playNoise(0.18, 0.4 * this.sfxVolume, 800);
        break;
      }
      case "RIFLE": {
        osc.type = "square";
        osc.frequency.setValueAtTime(650, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.08);
        gain.gain.setValueAtTime(0.25 * this.sfxVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
        osc.start(t);
        osc.stop(t + 0.08);
        break;
      }
      case "PLASMA": {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(350, t);
        osc.frequency.exponentialRampToValueAtTime(950, t + 0.08);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.25);
        gain.gain.setValueAtTime(0.45 * this.sfxVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
        osc.start(t);
        osc.stop(t + 0.25);
        break;
      }
      case "RAILGUN": {
        // High electric zap beam
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(1600, t);
        osc.frequency.exponentialRampToValueAtTime(220, t + 0.35);
        gain.gain.setValueAtTime(0.55 * this.sfxVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
        osc.start(t);
        osc.stop(t + 0.35);
        break;
      }
    }
  }

  public playEnemyShoot() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(500, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.15);
    gain.gain.setValueAtTime(0.25 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  public playHit() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.05);
    gain.gain.setValueAtTime(0.18 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  public playEnemyDeath() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.15);
    gain.gain.setValueAtTime(0.3 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  public playPlayerHurt() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.25);
    gain.gain.setValueAtTime(0.5 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  public playExplosion(isLarge = false) {
    if (this.isMuted || this.sfxVolume <= 0) return;
    const duration = isLarge ? 0.45 : 0.25;
    const vol = isLarge ? 0.8 : 0.5;
    this.playNoise(duration, vol * this.sfxVolume, isLarge ? 300 : 500);

    // Deep sub-bass boom
    this.initContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + duration);
    gain.gain.setValueAtTime(vol * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + duration);
  }

  public playDash() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.12);
    gain.gain.setValueAtTime(0.35 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  public playPowerup() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    // Ascending arpeggio (C5 -> E5 -> G5 -> C6)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const t = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const startT = t + idx * 0.05;
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startT);
      gain.gain.setValueAtTime(0.28 * this.sfxVolume, startT);
      gain.gain.exponentialRampToValueAtTime(0.01, startT + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(startT);
      osc.stop(startT + 0.1);
    });
  }

  public playLevelUp() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [440, 554.37, 659.25, 880];
    const t = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const startT = t + idx * 0.07;
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startT);
      gain.gain.setValueAtTime(0.35 * this.sfxVolume, startT);
      gain.gain.exponentialRampToValueAtTime(0.01, startT + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(startT);
      osc.stop(startT + 0.25);
    });
  }

  public playReload() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [0, 0.18].forEach((offset, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(idx === 0 ? 500 : 750, t + offset);
      osc.frequency.exponentialRampToValueAtTime(200, t + offset + 0.04);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.01, t + offset + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(t + offset);
      osc.stop(t + offset + 0.04);
    });
  }

  public playGameOver() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [330, 311, 293, 277];
    const t = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const startT = t + idx * 0.15;
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, startT);
      gain.gain.setValueAtTime(0.4 * this.sfxVolume, startT);
      gain.gain.exponentialRampToValueAtTime(0.01, startT + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(startT);
      osc.stop(startT + 0.3);
    });
  }

  public playBossAlert() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [0, 0.2, 0.4].forEach((offset) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, t + offset);
      osc.frequency.linearRampToValueAtTime(440, t + offset + 0.15);
      gain.gain.setValueAtTime(0.5 * this.sfxVolume, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.01, t + offset + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(t + offset);
      osc.stop(t + offset + 0.15);
    });
  }

  // --- WHITE NOISE GENERATOR (Explosions / Impact) ---
  private playNoise(duration: number, volume: number, filterFreq = 1000) {
    this.initContext();
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
    noise.stop(this.ctx.currentTime + duration);
  }

  // --- PROCEDURAL CYBERPUNK SYNTH MUSIC LOOP ---
  public startMusic() {
    if (this.isMusicPlaying || this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.isMusicPlaying = true;
    this.currentStep = 0;

    // D minor synth baseline / melody notes: D2, F2, G2, A2, C3, D3
    const bassScale = [73.42, 87.31, 98.0, 110.0, 130.81, 146.83];
    const leadScale = [293.66, 349.23, 392.0, 440.0, 523.25, 587.33];
    const tempoMs = 150; // 100 BPM 16th notes

    this.musicInterval = setInterval(() => {
      if (!this.ctx || this.isMuted || this.musicVolume <= 0) return;

      const t = this.ctx.currentTime;

      // Bass beat on every 2 steps
      if (this.currentStep % 2 === 0) {
        const bassNote = bassScale[(Math.floor(this.currentStep / 4)) % bassScale.length];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(bassNote, t);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(320, t);
        filter.frequency.exponentialRampToValueAtTime(80, t + 0.18);

        gain.gain.setValueAtTime(0.25 * this.musicVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.005, t + 0.18);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.18);
      }

      // Arp melody on odd steps
      if (this.currentStep % 4 === 1 || this.currentStep % 4 === 3) {
        const leadNote = leadScale[(this.currentStep * 3) % leadScale.length];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(leadNote, t);

        gain.gain.setValueAtTime(0.12 * this.musicVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.005, t + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.12);
      }

      this.currentStep = (this.currentStep + 1) % 32;
    }, tempoMs);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  public toggleMusic(): boolean {
    if (this.isMusicPlaying) {
      this.stopMusic();
      return false;
    } else {
      this.startMusic();
      return true;
    }
  }

  public getMusicPlaying() {
    return this.isMusicPlaying;
  }
}

export const sound = new SoundManager();
