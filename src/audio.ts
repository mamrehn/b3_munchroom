// ──────────────────────────────────────────────
//  MUNCHROOM – Audio engine (Web Audio API, no files)
// ──────────────────────────────────────────────

export class AudioEngine {
  private ctx: AudioContext | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    // Resume if suspended (browser autoplay policy)
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  /** Short beep: freq Hz, duration s, type */
  private beep(
    freq: number,
    duration: number,
    type: OscillatorType = 'square',
    gainVal = 0.18,
    detune = 0,
  ): void {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.detune.setValueAtTime(detune, ctx.currentTime);
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.01);
  }

  /** Noise burst for impact */
  private noise(duration: number, gainVal = 0.15): void {
    const ctx = this.getCtx();
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    source.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.start(ctx.currentTime);
  }

  playJump(): void {
    this.beep(220, 0.06, 'square', 0.2);
    this.beep(440, 0.1, 'square', 0.15);
  }

  playThrow(): void {
    this.beep(600, 0.04, 'sawtooth', 0.12);
    this.beep(300, 0.08, 'sawtooth', 0.08);
  }

  playMunch(): void {
    // Fun crunchy munch sound
    this.noise(0.06, 0.22);
    this.beep(180, 0.12, 'square', 0.18);
    setTimeout(() => this.beep(150, 0.08, 'square', 0.14), 60);
    setTimeout(() => this.noise(0.05, 0.18), 110);
  }

  playGrow(): void {
    // Rising arpeggio
    [220, 330, 440, 660].forEach((f, i) => {
      setTimeout(() => this.beep(f, 0.1, 'triangle', 0.15), i * 55);
    });
  }

  playRoundEnd(): void {
    // Fanfare descending
    [660, 550, 440, 330, 220].forEach((f, i) => {
      setTimeout(() => this.beep(f, 0.15, 'square', 0.2), i * 80);
    });
  }

  playWin(): void {
    const melody = [330, 330, 330, 262, 330, 392, 196];
    const times = [0, 150, 300, 500, 650, 800, 1100];
    melody.forEach((f, i) => {
      setTimeout(() => this.beep(f, 0.18, 'square', 0.22), times[i]);
    });
  }

  playLand(): void {
    this.beep(120, 0.06, 'triangle', 0.1);
  }
}
