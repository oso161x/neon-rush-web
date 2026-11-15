// Synthesised sound effects for NEON RUSH: short WebAudio oscillator blips,
// no audio files, no network. Created lazily on the first user gesture so the
// browser's autoplay policy never blocks the game.
export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context) return context;
    try {
      const AudioContext = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    } catch {
      context = null;
    }
    return context;
  }

  function tone({ frequency, endFrequency, duration, type, volume, delay = 0 }) {
    if (muted) return;
    const audio = ensure();
    if (!audio) return;
    try {
      if (audio.state === 'suspended') void audio.resume();
      const start = audio.currentTime + delay;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
      gain.gain.setValueAtTime(volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    } catch {
      // Sound is garnish: a failure here must never break the game.
    }
  }

  return {
    unlock() {
      ensure();
    },
    get muted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    click() {
      tone({ frequency: 660, duration: 0.06, type: 'sine', volume: 0.12 });
    },
    collect(combo) {
      const step = Math.min(combo, 12);
      tone({ frequency: 520 + step * 32, endFrequency: 880 + step * 32, duration: 0.12, type: 'sine', volume: 0.16 });
    },
    powerup() {
      tone({ frequency: 440, duration: 0.09, type: 'triangle', volume: 0.16 });
      tone({ frequency: 660, duration: 0.09, type: 'triangle', volume: 0.16, delay: 0.08 });
      tone({ frequency: 880, duration: 0.14, type: 'triangle', volume: 0.16, delay: 0.16 });
    },
    hit() {
      tone({ frequency: 180, endFrequency: 55, duration: 0.28, type: 'sawtooth', volume: 0.2 });
    },
    shieldBreak() {
      tone({ frequency: 900, endFrequency: 240, duration: 0.18, type: 'square', volume: 0.12 });
    },
    levelUp() {
      [523, 659, 784, 1047].forEach((frequency, index) => {
        tone({ frequency, duration: 0.14, type: 'triangle', volume: 0.16, delay: index * 0.09 });
      });
    },
    win() {
      [523, 659, 784, 1047, 1319].forEach((frequency, index) => {
        tone({ frequency, duration: 0.2, type: 'triangle', volume: 0.16, delay: index * 0.11 });
      });
    },
    gameOver() {
      [392, 330, 262, 196].forEach((frequency, index) => {
        tone({ frequency, duration: 0.22, type: 'sine', volume: 0.16, delay: index * 0.14 });
      });
    },
  };
}
