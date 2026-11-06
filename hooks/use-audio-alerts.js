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
    try {
      let arrayBuffer;
      if (sound.data.startsWith('data:')) {
        arrayBuffer = dataUrlToArrayBuffer(sound.data);
      } else {
        const response = await fetch(sound.data);
        arrayBuffer = await response.arrayBuffer();
      }
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(masterGain);
      activeSourcesRef.current.add(source);
      source.onended = () => {
        activeSourcesRef.current.delete(source);
      };
      source.start(startTime);
    } catch (err) {}
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

    const url = urlOrFilename.startsWith('data:') || urlOrFilename.startsWith('/') || urlOrFilename.startsWith('http')
      ? urlOrFilename
      : `/sounds/${urlOrFilename}`;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      try { await ctx.resume(); } catch (e) {}
    }

    const startTime = ctx.currentTime + 0.05;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(currentConfig.notificationVolume, startTime);
    masterGain.connect(ctx.destination);

    try {
      let arrayBuffer;
      if (url.startsWith('data:')) {
        arrayBuffer = dataUrlToArrayBuffer(url);
      } else {
        const response = await fetch(url);
        arrayBuffer = await response.arrayBuffer();
      }
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(masterGain);
      activeSourcesRef.current.add(source);
      source.onended = () => {
        activeSourcesRef.current.delete(source);
      };
      source.start(startTime);
    } catch (err) {}
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
