class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    duration = 0.12,
    type: OscillatorType = 'sine',
    vol = 0.14,
    delay = 0
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(vol, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  pick() {
    this.playTone(520, 0.09, 'sine', 0.12);
  }

  drop(stackLen: number) {
    this.playTone(380 + stackLen * 85, 0.12, 'triangle', 0.15);
  }

  invalid() {
    this.playTone(165, 0.14, 'sawtooth', 0.07);
  }

  reveal() {
    this.playTone(620, 0.12, 'sine', 0.1, 0.04);
  }

  tubeComplete() {
    this.playTone(523.25, 0.15, 'triangle', 0.15, 0);
    this.playTone(659.25, 0.15, 'triangle', 0.15, 0.07);
    this.playTone(783.99, 0.25, 'triangle', 0.17, 0.14);
  }

  win() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      this.playTone(f, 0.28, 'sine', 0.15, i * 0.09);
    });
  }
}

export const sfx = new SoundEngine();
