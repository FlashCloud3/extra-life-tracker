/**
 * =============================================================================
 * EXTRA LIFE TRACKER - USE AUDIO ALERTS HOOK
 * =============================================================================
 * Manages toast notifications queue, celebration animations, Web Audio context
 * unlocking on user interaction, and audio playback.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { MAX_VISIBLE_TOASTS } from '../constants.js';
import {
  dataUrlToArrayBuffer,
  playSynthesizedSound,
  stopAudioSources
} from '../audio-utils.js';

export function useAudioAlerts({ config }) {
  const [activeToasts, setActiveToasts] = useState([]);
  const [toastQueue, setToastQueue] = useState([]);
  const [celebrationKey, setCelebrationKey] = useState(0);

  const audioCtxRef = useRef(null);
  const activeSourcesRef = useRef(new Set());
  const configRef = useRef(config);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Audio Context unlocker (handles browser autoplay policies)
  useEffect(() => {
    const unlockAudio = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().then(() => {
          document.removeEventListener('click', unlockAudio);
          document.removeEventListener('keydown', unlockAudio);
        }).catch(console.warn);
      }
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);
    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  const stopAllSounds = useCallback(() => {
    stopAudioSources(activeSourcesRef.current);
  }, []);

  const playSpecificSound = useCallback(async (soundId) => {
    const currentConfig = configRef.current;
    if (!currentConfig.isSoundEnabled) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (e) {}
    }

    const startTime = ctx.currentTime + 0.05;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(currentConfig.notificationVolume, startTime);
    masterGain.connect(ctx.destination);

    // Check if sound is one of the built-in synthesized presets (coin, milestone, powerup, laser)
    const wasSynthesized = playSynthesizedSound(ctx, masterGain, soundId, startTime, activeSourcesRef.current);
    if (wasSynthesized) return;

    // Custom sound file from memory or server
    const sound = currentConfig.customSounds?.find(s => s.id === soundId);
    if (!sound) return;

    let soundUrl = sound.data;
    if (!soundUrl.startsWith('data:') && !soundUrl.startsWith('http://') && !soundUrl.startsWith('https://')) {
      soundUrl = soundUrl.replace(/^\.?\/?sounds\//, '');
      soundUrl = `sounds/${soundUrl}`;
    }

    const volume = Math.max(0, Math.min(1, Number(currentConfig.notificationVolume) || 0.5));

    // Try HTML5 Audio first (native MP3/WAV playback)
    try {
      const audio = new Audio();
      audio.volume = volume;
      audio.src = soundUrl;
      activeSourcesRef.current.add(audio);
      audio.onended = () => {
        activeSourcesRef.current.delete(audio);
      };
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
        return;
      }
    } catch (e) {}

    // Fallback to Web Audio API
    try {
      let arrayBuffer;
      if (soundUrl.startsWith('data:')) {
        arrayBuffer = dataUrlToArrayBuffer(soundUrl);
      } else {
        const response = await fetch(soundUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        arrayBuffer = await response.arrayBuffer();
      }
      const decodePromise = new Promise((resolve, reject) => {
        ctx.decodeAudioData(arrayBuffer, resolve, reject);
      });
      const audioBuffer = await decodePromise;
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(masterGain);
      activeSourcesRef.current.add(source);
      source.onended = () => {
        activeSourcesRef.current.delete(source);
      };
      source.start(startTime);
    } catch (err) {
      console.warn('Custom sound playback error:', err);
    }
  }, []);

  const recentToastIdsRef = useRef(new Set());

  // Toast Queue Pacer: advances toast after 8 seconds
  useEffect(() => {
    if (activeToasts.length < MAX_VISIBLE_TOASTS && toastQueue.length > 0) {
      const nextToast = toastQueue[0];
      setToastQueue(prev => prev.slice(1));
      setActiveToasts(prev => {
        // Prevent duplicate toasts in active list
        if (prev.some(t => t.donationID === nextToast.donationID)) return prev;
        return [...prev, nextToast];
      });
      setTimeout(() => {
        setActiveToasts(current => current.filter(t => t.donationID !== nextToast.donationID));
      }, 8000);
    }
  }, [activeToasts, toastQueue]);

  const triggerDonationToast = useCallback((donation, playAudio = true) => {
    if (!donation) return;
    const donId = donation.donationID;

    // Deduplicate: ignore if this donation was recently queued or displayed
    if (donId && recentToastIdsRef.current.has(donId)) {
      return;
    }
    if (donId) {
      recentToastIdsRef.current.add(donId);
      // Keep recent set bounded to 500 items to avoid memory growth
      if (recentToastIdsRef.current.size > 500) {
        const first = recentToastIdsRef.current.values().next().value;
        recentToastIdsRef.current.delete(first);
      }
    }

    setToastQueue(prev => {
      if (donId && prev.some(t => t.donationID === donId)) return prev;
      return [...prev, donation];
    });

    if (playAudio) {
      playSpecificSound(configRef.current.selectedSound);
    }
  }, [playSpecificSound]);

  const triggerCelebration = useCallback((type = 'milestone') => {
    setCelebrationKey(Date.now());
    if (type === 'milestone') {
      playSpecificSound(configRef.current.selectedMilestoneSound);
    } else {
      playSpecificSound(configRef.current.selectedSound);
    }
  }, [playSpecificSound]);

  const clearAlerts = useCallback(() => {
    recentToastIdsRef.current.clear();
    setActiveToasts([]);
    setToastQueue([]);
    setCelebrationKey(0);
    stopAllSounds();
  }, [stopAllSounds]);

  const previewSound = useCallback(async (urlOrFilename) => {
    if (!urlOrFilename) return;
    const currentConfig = configRef.current;
    if (!currentConfig.isSoundEnabled) return;

    let targetUrl = urlOrFilename;
    if (!targetUrl.startsWith('data:') && !targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      // Normalize to relative sounds/ path
      targetUrl = targetUrl.replace(/^\.?\/?sounds\//, '');
      targetUrl = `sounds/${targetUrl}`;
    }

    const volume = Math.max(0, Math.min(1, Number(currentConfig.notificationVolume) || 0.5));

    // Method 1: HTML5 Audio (native hardware-accelerated playback for MP3/WAV/OGG, immune to WebAudio decode quirks)
    try {
      const audio = new Audio();
      audio.volume = volume;
      audio.src = targetUrl;
      activeSourcesRef.current.add(audio);
      audio.onended = () => {
        activeSourcesRef.current.delete(audio);
      };
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
        return;
      }
    } catch (html5Err) {
      // Fallback to Web Audio API if HTML5 Audio fails
    }

    // Method 2: Web Audio API Fallback
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        try { await ctx.resume(); } catch (e) {}
      }

      const startTime = ctx.currentTime + 0.05;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume, startTime);
      masterGain.connect(ctx.destination);

      let arrayBuffer;
      if (targetUrl.startsWith('data:')) {
        arrayBuffer = dataUrlToArrayBuffer(targetUrl);
      } else {
        const response = await fetch(targetUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        arrayBuffer = await response.arrayBuffer();
      }

      const decodePromise = new Promise((resolve, reject) => {
        ctx.decodeAudioData(arrayBuffer, resolve, reject);
      });
      const audioBuffer = await decodePromise;

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(masterGain);
      activeSourcesRef.current.add(source);
      source.onended = () => {
        activeSourcesRef.current.delete(source);
      };
      source.start(startTime);
    } catch (err) {
      console.warn('Audio preview error:', err);
    }
  }, []);

  return {
    activeToasts,
    toastQueue,
    celebrationKey,
    audioCtxRef,
    setCelebrationKey,
    setActiveToasts,
    setToastQueue,
    playSpecificSound,
    stopAllSounds,
    previewSound,
    triggerDonationToast,
    triggerCelebration,
    clearAlerts
  };
}
