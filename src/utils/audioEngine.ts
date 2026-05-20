// Procedural Web Audio Engine for Quiziz
class WebAudioEngine {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private currentAmbientNode: OscillatorNode[] = [];
  private currentAmbientGain: GainNode | null = null;
  private musicInterval: any = null;
  private isMusicPlaying = false;
  
  // Settings
  public musicVolume = 0.4;
  public sfxVolume = 0.6;
  public musicEnabled = true;
  public sfxEnabled = true;
  public currentTrackName = "Chill mode";

  constructor() {
    // Lazy initialisation to support safari and modern browser auto-play blockers
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      
      this.musicGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setMusicVolume(val: number) {
    this.musicVolume = val;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.linearRampToValueAtTime(val, this.ctx.currentTime + 0.1);
    }
  }

  public setSfxVolume(val: number) {
    this.sfxVolume = val;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.linearRampToValueAtTime(val, this.ctx.currentTime + 0.1);
    }
  }

  public toggleMusic(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopMusic();
    } else {
      this.playMusic(this.currentTrackName);
    }
  }

  public toggleSfx(enabled: boolean) {
    this.sfxEnabled = enabled;
  }

  // PROCEDURAL SOUND EFFECTS
  public playClick() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1000, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  public playHover() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
  }

  public playCorrect() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 -> E5 -> G5 -> C6

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.3);
    });
  }

  public playIncorrect() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    
    // Buzzing slide down
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(140, now);
    osc1.frequency.linearRampToValueAtTime(90, now + 0.35);

    osc2.type = "sawtooth";
    osc2.frequency.setValueAtTime(143, now); // slightly detuned for dissonance
    osc2.frequency.linearRampToValueAtTime(91, now + 0.35);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start();
    osc2.start();
    osc1.stop(now + 0.4);
    osc2.stop(now + 0.4);
  }

  public playTimerWarning() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  public playCombo() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    // A fast sparkling chime
    const now = this.ctx.currentTime;
    const baseFreq = 600;
    for (let i = 0; i < 6; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq + (i * 120), now + i * 0.04);
      
      gain.gain.setValueAtTime(0.08, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.2);
    }
  }

  public playTransition() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.32);
  }

  public playVictory() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    // Dynamic triumphant chord arpeggio
    const now = this.ctx.currentTime;
    const chord = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major scale sweep
    chord.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.12, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.5);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.6);
    });
  }

  // PROCEDURAL MUSIC SYNTHESIS (AMBIENT drone & arpeggio)
  public playMusic(trackName: string) {
    this.currentTrackName = trackName;
    if (!this.musicEnabled) return;

    this.initCtx();
    if (!this.ctx || !this.musicGain) return;

    if (this.isMusicPlaying) {
      this.stopMusic();
    }

    this.isMusicPlaying = true;
    const playChordSequence = () => {
      if (!this.ctx || !this.isMusicPlaying || !this.musicGain) return;

      const now = this.ctx.currentTime;
      let root = 110; // A2
      
      if (trackName === "Deep Study mode") {
        root = 73.42; // D2 (Deeper drone)
      } else if (trackName === "Calm Ambient") {
        root = 65.41; // C2 (Warmer drone)
      } else if (trackName === "Night Study mode") {
        root = 82.41; // E2 (Slightly mysterious)
      }

      const freqs = [
        root, 
        root * 1.5, // Perfect 5th
        root * 2,   // Root Octave
        root * 2.5, // Major 3rd Octave
        root * 3,   // 5th Octave
      ];

      // Play soft evolving drone oscillators
      const oscs: OscillatorNode[] = [];
      const ambientGain = this.ctx.createGain();
      ambientGain.gain.setValueAtTime(0, now);
      ambientGain.gain.linearRampToValueAtTime(0.15, now + 1.5);
      ambientGain.gain.exponentialRampToValueAtTime(0.0001, now + 5.8);
      ambientGain.connect(this.musicGain);

      freqs.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        osc.type = i % 2 === 0 ? "sine" : "triangle";
        // Slightly detune for warm chorus effect
        osc.frequency.setValueAtTime(freq + (Math.random() * 2 - 1), now);
        osc.connect(ambientGain);
        osc.start(now);
        oscs.push(osc);
      });

      this.currentAmbientNode = oscs;
      this.currentAmbientGain = ambientGain;

      // Clean up past oscillators reference after fade
      setTimeout(() => {
        oscs.forEach(osc => {
          try { osc.stop(); } catch(e){}
        });
      }, 6000);
    };

    // Cycle every 5.5 seconds for endless evolving ambient soundscapes
    playChordSequence();
    this.musicInterval = setInterval(playChordSequence, 5500);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.currentAmbientGain && this.ctx) {
      try {
        this.currentAmbientGain.gain.setValueAtTime(this.currentAmbientGain.gain.value, this.ctx.currentTime);
        this.currentAmbientGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
      } catch (e) {}
    }
    setTimeout(() => {
      this.currentAmbientNode.forEach(osc => {
        try { osc.stop(); } catch(e){}
      });
      this.currentAmbientNode = [];
    }, 500);
  }
}

export const audio = new WebAudioEngine();
