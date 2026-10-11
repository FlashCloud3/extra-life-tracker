/**
 * =============================================================================
 * EXTRA LIFE TRACKER - LOCAL STORAGE & PERSISTENCE
 * =============================================================================
 * Handles safe reading/writing of configurations, participant data caches,
 * and custom theme profiles across browser sessions and multi-profile setups.
 */

import { STORAGE_PREFIX, THEMES_STORAGE_KEY, DEFAULT_CONFIG, COLOR_PRESETS } from './constants.js';

/**
 * Load saved custom theme profiles from localStorage.
 */
export const loadStoredThemes = () => {
  try {
    if (typeof localStorage === 'undefined') return [];
    const item = localStorage.getItem(THEMES_STORAGE_KEY);
    if (item) return JSON.parse(item);
  } catch (e) {
    console.warn('Could not read stored themes from localStorage:', e);
  }
  return [];
};

/**
 * Save custom theme profiles to localStorage.
 */
export const saveStoredThemes = (themes) => {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(THEMES_STORAGE_KEY, JSON.stringify(themes));
  } catch (e) {
    console.warn('Could not write themes to localStorage:', e);
  }
};

/**
 * Load configuration for a specific profile ID (or fallback).
 */
export const loadStoredConfig = (profileId) => {
  try {
    if (typeof localStorage === 'undefined') return null;
    const item = localStorage.getItem(`${STORAGE_PREFIX}config_${profileId}`);
    if (item) return JSON.parse(item);

    // Fallback: If not found and profileId is not default, try loading default profile
    if (profileId !== 'default') {
      const defItem = localStorage.getItem(`${STORAGE_PREFIX}config_default`);
      if (defItem) {
        const parsed = JSON.parse(defItem);
        return { ...parsed, participantId: profileId };
      }
    } else {
      // If profileId is default, check if last_profile was saved
      const lastProf = localStorage.getItem(`${STORAGE_PREFIX}last_profile`);
      if (lastProf) {
        const lastItem = localStorage.getItem(`${STORAGE_PREFIX}config_${lastProf}`);
        if (lastItem) return JSON.parse(lastItem);
      }
      const defItem = localStorage.getItem(`${STORAGE_PREFIX}config_default`);
      if (defItem) return JSON.parse(defItem);

      // Check if any profile config exists in localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${STORAGE_PREFIX}config_`) && key !== `${STORAGE_PREFIX}config_default`) {
          const val = localStorage.getItem(key);
          if (val) return JSON.parse(val);
        }
      }
    }
  } catch (e) {
    console.warn('Could not load stored config:', e);
  }
  return null;
};

/**
 * Save configuration for a specific profile ID and update mirrors.
 */
export const saveStoredConfig = (profileId, cfg) => {
  try {
    if (typeof localStorage === 'undefined' || !cfg) return;
    const targetKey = `${STORAGE_PREFIX}config_${profileId || 'default'}`;
    localStorage.setItem(targetKey, JSON.stringify(cfg));

    // Mirror config to default so standalone OBS overlays can read the active settings
    if (profileId && profileId !== 'default') {
      localStorage.setItem(`${STORAGE_PREFIX}config_default`, JSON.stringify(cfg));
    }
    if (cfg?.participantId) {
      localStorage.setItem(`${STORAGE_PREFIX}config_${cfg.participantId}`, JSON.stringify(cfg));
      localStorage.setItem(`${STORAGE_PREFIX}last_profile`, String(cfg.participantId));
    }
  } catch (e) {
    console.warn('Could not save stored config:', e);
  }
};

/**
 * Load cached Extra Life data for a profile.
 */
export const loadStoredData = (profileId) => {
  try {
    if (typeof localStorage === 'undefined') return null;
    const item = localStorage.getItem(`${STORAGE_PREFIX}data_${profileId}`);
    if (item) return JSON.parse(item);
    if (profileId !== 'default') {
      const defItem = localStorage.getItem(`${STORAGE_PREFIX}data_default`);
      if (defItem) return JSON.parse(defItem);
    }
  } catch (e) {
    console.warn('Could not load stored data:', e);
  }
  return null;
};

/**
 * Save cached Extra Life data for a profile.
 */
export const saveStoredData = (profileId, data) => {
  try {
    if (typeof localStorage === 'undefined' || !data) return;
    const targetKey = `${STORAGE_PREFIX}data_${profileId || 'default'}`;
    localStorage.setItem(targetKey, JSON.stringify(data));
    if (profileId && profileId !== 'default') {
      localStorage.setItem(`${STORAGE_PREFIX}data_default`, JSON.stringify(data));
    }
  } catch (e) {
    console.warn('Could not save stored data:', e);
  }
};

/**
 * Detect current profile from URL or last active profile in localStorage.
 */
export const getUrlProfile = () => {
  if (typeof window === 'undefined') return 'default';
  const params = new URLSearchParams(window.location.search);
  const urlProf = params.get('profile');
  if (urlProf) return urlProf;
  try {
    if (typeof localStorage !== 'undefined') {
      const last = localStorage.getItem(`${STORAGE_PREFIX}last_profile`);
      if (last) return last;
    }
  } catch (e) {}
  return 'default';
};

/**
 * Resolves initial configuration merging defaults, stored values, and active theme preset colors.
 */
export const getInitialConfig = (profile) => {
  const stored = loadStoredConfig(profile);
  if (stored) {
    let merged = { ...DEFAULT_CONFIG, ...stored };
    if (stored.theme && stored.theme !== 'custom' && COLOR_PRESETS[stored.theme]) {
      const presetColors = COLOR_PRESETS[stored.theme].colors;
      merged = { ...merged, ...presetColors, ...stored };
    }
    if (profile !== 'default' && !merged.participantId) {
      merged.participantId = profile;
    }
    return merged;
  }
  return profile !== 'default' ? { ...DEFAULT_CONFIG, participantId: profile } : { ...DEFAULT_CONFIG };
};
