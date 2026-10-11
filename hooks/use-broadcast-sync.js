/**
 * =============================================================================
 * EXTRA LIFE TRACKER - USE BROADCAST SYNC HOOK
 * =============================================================================
 * Manages inter-tab and OBS overlay real-time synchronization via BroadcastChannel
 * as well as Socket.IO connection for local backend server setups.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { SERVER_URL, isGitHubPagesHost } from '../constants.js';

export function useBroadcastSync({
  currentProfile,
  onConfigReceived,
  onDataReceived,
  onDonationEvent,
  onCelebrationEvent,
  onClearEvent,
  onTriggerSync
}) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const syncChannelRef = useRef(null);

  // BroadcastChannel Setup for Multi-Tab & OBS Overlays
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const channelName = `extralife_sync_${currentProfile || 'default'}`;
    const ch = new BroadcastChannel(channelName);
    syncChannelRef.current = ch;

    ch.onmessage = (event) => {
      const { type, payload } = event.data || {};
      if (type === 'config-updated' && payload) {
        onConfigReceived?.(payload);
      } else if (type === 'data-updated' && payload) {
        onDataReceived?.(payload);
      } else if (type === 'event:donation' && payload) {
        onDonationEvent?.(payload);
      } else if (type === 'event:celebration') {
        onCelebrationEvent?.(payload);
      } else if (type === 'event:clear') {
        onClearEvent?.();
      } else if (type === 'trigger-sync') {
        onTriggerSync?.();
      }
    };

    return () => {
      ch.close();
      syncChannelRef.current = null;
    };
  }, [
    currentProfile,
    onConfigReceived,
    onDataReceived,
    onDonationEvent,
    onCelebrationEvent,
    onClearEvent,
    onTriggerSync
  ]);

  // Socket.IO Setup for local server backend (skipped on GitHub Pages)
  useEffect(() => {
    if (isGitHubPagesHost) return;

    try {
      const socket = io(SERVER_URL, {
        reconnectionAttempts: 5,
        timeout: 5000
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        setIsConnected(true);
        if (currentProfile) {
          socket.emit('join-profile', currentProfile);
        }
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      socket.on('init-state', (state) => {
        if (state?.config) onConfigReceived?.(state.config);
        if (state?.data) onDataReceived?.(state.data);
      });

      socket.on('config-updated', (newConfig) => {
        onConfigReceived?.(newConfig);
      });
      socket.on('config-update', (newConfig) => {
        onConfigReceived?.(newConfig);
      });

      socket.on('data-updated', (data) => {
        onDataReceived?.(data);
      });
      socket.on('data-update', (data) => {
        onDataReceived?.(data);
      });

      socket.on('event:donation', (payload) => {
        onDonationEvent?.(payload);
      });

      socket.on('event:celebration', (payload) => {
        onCelebrationEvent?.(payload);
      });

      socket.on('event:clear', () => {
        onClearEvent?.();
      });

      return () => {
        socket.disconnect();
        socketRef.current = null;
      };
    } catch (e) {
      console.warn('Socket.IO connection notice:', e);
    }
  }, [currentProfile, onConfigReceived, onDataReceived, onDonationEvent, onCelebrationEvent, onClearEvent]);

  // Outgoing broadcast helper methods
  const broadcastConfig = useCallback((newConfig) => {
    try {
      syncChannelRef.current?.postMessage({ type: 'config-updated', payload: newConfig });
    } catch (e) {}

    if (socketRef.current?.connected) {
      socketRef.current.emit('update-config', {
        profileId: currentProfile || 'default',
        config: newConfig
      });
    }
  }, [currentProfile]);

  const broadcastData = useCallback((data) => {
    try {
      syncChannelRef.current?.postMessage({ type: 'data-updated', payload: data });
    } catch (e) {}
  }, []);

  const broadcastDonation = useCallback((donation, isMilestone = false) => {
    try {
      syncChannelRef.current?.postMessage({
        type: 'event:donation',
        payload: { donation, isMilestone }
      });
    } catch (e) {}
  }, []);

  const broadcastCelebration = useCallback((type = 'milestone') => {
    try {
      syncChannelRef.current?.postMessage({
        type: 'event:celebration',
        payload: { type }
      });
    } catch (e) {}
  }, []);

  const broadcastClear = useCallback(() => {
    try {
      syncChannelRef.current?.postMessage({ type: 'event:clear' });
    } catch (e) {}

    if (socketRef.current?.connected) {
      socketRef.current.emit('clear-events', { profileId: currentProfile || 'default' });
    }
  }, [currentProfile]);

  const broadcastTriggerSync = useCallback(() => {
    try {
      syncChannelRef.current?.postMessage({ type: 'trigger-sync' });
    } catch (e) {}
  }, []);

  const triggerTest = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('trigger-test', currentProfile || 'default');
      return true;
    }
    return false;
  }, [currentProfile]);

  const triggerSync = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('trigger-sync', currentProfile || 'default');
    }
    broadcastTriggerSync();
  }, [currentProfile, broadcastTriggerSync]);

  const triggerClear = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('trigger-clear', currentProfile || 'default');
    }
    broadcastClear();
  }, [currentProfile, broadcastClear]);

  return {
    isConnected,
    socketRef,
    syncChannelRef,
    broadcastConfig,
    broadcastData,
    broadcastDonation,
    broadcastCelebration,
    broadcastClear,
    broadcastTriggerSync,
    triggerTest,
    triggerSync,
    triggerClear
  };
}
