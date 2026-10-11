/**
 * =============================================================================
 * EXTRA LIFE TRACKER - USE TWITCH INTEGRATION HOOK
 * =============================================================================
 * Handles Twitch OAuth redirects, IRC chat bot connection (tmi.js),
 * chat command listeners (!total, !goal, !milestone, and custom commands),
 * and automatic chat alerts when donations are received.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import tmi from 'tmi.js';
import { TWITCH_CLIENT_ID } from '../constants.js';

export function useTwitchIntegration({
  config,
  totalRaised,
  goal,
  milestones,
  convertAmount,
  currencyPrefix,
  t
}) {
  const [pendingTwitchToken, setPendingTwitchToken] = useState(null);
  const twitchClientRef = useRef(null);

  const totalRaisedRef = useRef(totalRaised);
  useEffect(() => { totalRaisedRef.current = totalRaised; }, [totalRaised]);

  const goalRef = useRef(goal);
  useEffect(() => { goalRef.current = goal; }, [goal]);

  const milestonesRef = useRef(milestones);
  useEffect(() => { milestonesRef.current = milestones; }, [milestones]);

  const configRef = useRef(config);
  useEffect(() => { configRef.current = config; }, [config]);

  // Handle OAuth Redirect from Twitch (hash parameter access_token)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      const state = params.get('state');

      if (token) {
        const urlParams = new URLSearchParams(window.location.search);
        const urlProfile = urlParams.get('profile');

        // If state matches another profile, redirect preserving hash
        if (state && state !== 'default' && state !== urlProfile) {
          window.location.href = `${window.location.origin}/?profile=${encodeURIComponent(state)}${hash}`;
          return;
        }

        setPendingTwitchToken(`oauth:${token}`);
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, []);

  // Client-side Twitch IRC Client via tmi.js
  useEffect(() => {
    if (!config.twitchEnabled || !config.twitchChannel || !config.twitchToken) {
      if (twitchClientRef.current) {
        try { twitchClientRef.current.disconnect(); } catch (e) {}
        twitchClientRef.current = null;
      }
      return;
    }

    const tmiModule = tmi || (typeof window !== 'undefined' ? window.tmi : null);
    const ClientConstructor = tmiModule?.Client || tmiModule?.client || (typeof window !== 'undefined' ? window.tmi?.Client : null);
    if (!ClientConstructor) return;

    let client = null;
    try {
      const cleanToken = config.twitchToken.startsWith('oauth:') ? config.twitchToken : `oauth:${config.twitchToken}`;
      client = new ClientConstructor({
        options: { debug: false },
        identity: {
          username: config.twitchChannel.toLowerCase(),
          password: cleanToken
        },
        channels: [config.twitchChannel.toLowerCase()]
      });

      client.connect().then(() => {
        console.log('Connected to Twitch channel:', config.twitchChannel);
        twitchClientRef.current = client;
      }).catch(console.error);

      client.on('message', (channel, tags, message, self) => {
        if (self) return;
        const currentConf = configRef.current;
        if (!currentConf.twitchEnableCommands) return;

        const cleanMsg = (message || '').trim().toLowerCase();

        // Built-in command: !total
        if (cleanMsg === '!total') {
          const amt = `${currencyPrefix}${convertAmount(totalRaisedRef.current).toFixed(2)}`;
          client.say(channel, `Total raised: ${amt} for Extra Life!`);
        } else if (cleanMsg === '!goal') {
          // Built-in command: !goal
          const amt = `${currencyPrefix}${convertAmount(goalRef.current).toFixed(2)}`;
          client.say(channel, `Fundraising goal: ${amt}`);
        } else if (cleanMsg === '!milestone' || cleanMsg === '!next') {
          // Built-in command: !milestone
          const currentTotal = totalRaisedRef.current;
          const next = milestonesRef.current?.find(m => currentTotal < (m.fundraisingGoal || 0));
          if (next) {
            const nextGoalAmt = `${currencyPrefix}${convertAmount(next.fundraisingGoal).toFixed(2)}`;
            const rem = `${currencyPrefix}${convertAmount(Math.max(0, next.fundraisingGoal - currentTotal)).toFixed(2)}`;
            client.say(channel, `Next milestone at ${nextGoalAmt}: "${next.description}" (${rem} to go!)`);
          } else {
            client.say(channel, `All milestones completed or none configured!`);
          }
        } else if (currentConf.customCommands && Array.isArray(currentConf.customCommands)) {
          // Custom commands
          const match = currentConf.customCommands.find(c => c.trigger.toLowerCase() === cleanMsg);
          if (match && match.response) {
            client.say(channel, match.response);
          }
        }
      });
    } catch (e) {
      console.warn('Twitch client connection error:', e);
    }

    return () => {
      try { client?.disconnect(); } catch (e) {}
      twitchClientRef.current = null;
    };
  }, [
    config.twitchEnabled,
    config.twitchChannel,
    config.twitchToken,
    config.twitchEnableCommands,
    config.customCommands,
    currencyPrefix,
    convertAmount
  ]);

  const sendTwitchAlert = useCallback((donation, cRate = 1) => {
    const currentConf = configRef.current;
    if (currentConf.twitchEnabled && currentConf.twitchEnableAlerts && twitchClientRef.current) {
      try {
        const donor = donation.displayName === 'Anonymous' ? 'Anonymous' : donation.displayName;
        const amt = `${currentConf.currency === 'USD' ? '$' : 'C$'}${(donation.amount * (currentConf.currency === 'CAD' ? cRate : 1)).toFixed(2)}`;
        const msg = donation.message ? ` "${donation.message}"` : '';
        twitchClientRef.current.say(
          currentConf.twitchChannel,
          `🎉 New Extra Life Donation! ${donor} donated ${amt}!${msg} Thank you!`
        );
      } catch (e) {
        console.warn('Twitch alert send failed:', e);
      }
    }
  }, []);

  const handleGetTwitchToken = useCallback((currentProfile = 'default') => {
    if (typeof window === 'undefined') return;
    const redirectUri = `${window.location.origin}${window.location.pathname}`;
    const scopes = 'chat:read+chat:edit';
    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${TWITCH_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${scopes}&state=${encodeURIComponent(currentProfile)}`;
    window.location.href = authUrl;
  }, []);

  return {
    pendingTwitchToken,
    setPendingTwitchToken,
    twitchClientRef,
    sendTwitchAlert,
    handleGetTwitchToken
  };
}
