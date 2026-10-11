/**
 * =============================================================================
 * EXTRA LIFE TRACKER - WEB AUDIO UTILITIES
 * =============================================================================
 * Web Audio API synthesizer for 8-bit retro sounds (coin, fanfare, powerup, laser)
 * and custom sound buffer decoding. Compatible with browsers, OBS browser sources,
 * and static GitHub Pages.
 */

/**
 * Converts a base64 data URL to an ArrayBuffer for Web Audio decoding.
 */
export const dataUrlToArrayBuffer = (dataUrl) => {
  if (!dataUrl || typeof dataUrl !== 'string') return new ArrayBuffer(0);
  const parts = dataUrl.split(',');
  const base64 = parts[1] || parts[0];
  const binaryString = (typeof window !== 'undefined' && window.atob) ? window.atob(base64) : '';
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Retrieves or creates an AudioContext safely across browsers.
 */
export const getAudioContext = (existingCtx = null) => {
  if (existingCtx) return existingCtx;
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  return AudioCtx ? new AudioCtx() : null;
};

/**
 * Synthesizes retro 8-bit sound effects using native Web Audio oscillators.
 * Returns true if soundId was handled, false if custom sound file lookup needed.
 */
export const playSynthesizedSound = (ctx, masterGain, soundId, startTime, activeSources = null) => {
  if (!ctx || !masterGain) return false;

  if (soundId === 'default') {
    // 8-bit Coin Collect Sound
    const envelopeGain = ctx.createGain();
    envelopeGain.connect(masterGain);
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(1046.50, startTime);
    osc2.frequency.setValueAtTime(1244.51, startTime);
    envelopeGain.gain.setValueAtTime(1.0, startTime);
    envelopeGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
    osc1.connect(envelopeGain);
    osc2.connect(envelopeGain);
    if (activeSources) {
      activeSources.add(osc1);
      activeSources.add(osc2);
      osc1.onended = () => { activeSources.delete(osc1); };
      osc2.onended = () => { activeSources.delete(osc2); };
    }
    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + 0.5);
    osc2.stop(startTime + 0.5);
    return true;
  }

  if (soundId === 'default-milestone') {
    // 8-bit Level-Up / Milestone Fanfare
    const envelopeGain = ctx.createGain();
    envelopeGain.connect(masterGain);
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    const baseFreq = 261.63;
    osc.frequency.setValueAtTime(baseFreq, startTime);
    osc.frequency.setValueAtTime(baseFreq * 5/4, startTime + 0.1);
    osc.frequency.setValueAtTime(baseFreq * 3/2, startTime + 0.2);
    osc.frequency.setValueAtTime(baseFreq * 2, startTime + 0.3);
    envelopeGain.gain.setValueAtTime(1.0, startTime);
    envelopeGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);
    osc.connect(envelopeGain);
    if (activeSources) {
      activeSources.add(osc);
      osc.onended = () => { activeSources.delete(osc); };
    }
    osc.start(startTime);
    osc.stop(startTime + 0.8);
    return true;
  }

  if (soundId === 'default-powerup') {
    // 8-bit Powerup Jingle
    const envelopeGain = ctx.createGain();
    envelopeGain.connect(masterGain);
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(330, startTime);
    osc.frequency.exponentialRampToValueAtTime(880, startTime + 0.3);
    envelopeGain.gain.setValueAtTime(0.7, startTime);
    envelopeGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
    osc.connect(envelopeGain);
    if (activeSources) {
      activeSources.add(osc);
      osc.onended = () => { activeSources.delete(osc); };
    }
    osc.start(startTime);
    osc.stop(startTime + 0.35);
    return true;
  }

  if (soundId === 'default-laser') {
    // Retro Laser Pew
    const envelopeGain = ctx.createGain();
    envelopeGain.connect(masterGain);
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, startTime);
    osc.frequency.exponentialRampToValueAtTime(120, startTime + 0.25);
    envelopeGain.gain.setValueAtTime(0.8, startTime);
    envelopeGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);
    osc.connect(envelopeGain);
    if (activeSources) {
      activeSources.add(osc);
      osc.onended = () => { activeSources.delete(osc); };
    }
    osc.start(startTime);
    osc.stop(startTime + 0.25);
    return true;
  }

  return false;
};

/**
 * Safely stops all active audio source nodes.
 */
export const stopAudioSources = (activeSources) => {
  if (!activeSources) return;
  const sourcesToStop = Array.from(activeSources);
  sourcesToStop.forEach(source => {
    try {
      source.stop(0);
    } catch (e) {}
  });
  activeSources.clear();
};
