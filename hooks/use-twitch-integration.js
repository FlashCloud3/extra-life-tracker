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
  const [twitchStatus, setTwitchStatus] = useState('disabled'); // 'connected' | 'connecting' | 'disconnected' | 'disabled' | 'error'
  const [twitchStatusMessage, setTwitchStatusMessage] = useState('');
  const [lastActivity, setLastActivity] = useState(null);
  const [commandsHandledCount, setCommandsHandledCount] = useState(0);
  const [alertsSentCount, setAlertsSentCount] = useState(0);
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [reconnectTrigger, setReconnectTrigger] = useState(0);
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
      let state = params.get('state');

      if (token) {
        const fullToken = `oauth:${token}`;
        setPendingTwitchToken(fullToken);

        const urlParams = new URLSearchParams(window.location.search);
        let urlProfile = urlParams.get('profile');

        // Sanitize state: reject [object Object] or invalid values
        if (state && (state.includes('[object') || state === 'null' || state === 'undefined')) {
          state = null;
        }

        // If the URL search had a corrupted profile, clean it out
        if (urlProfile && (urlProfile.includes('[object') || urlProfile === 'null' || urlProfile === 'undefined')) {
          urlParams.delete('profile');
          urlProfile = null;
        }

        // If state matches a valid custom profile and we are not currently on that profile, preserve it
        if (state && state !== 'default' && state !== urlProfile) {
          urlParams.set('profile', state);
        }

        // Clean the hash (and sanitize search params) from the address bar without page reload
        const cleanSearch = urlParams.toString() ? `?${urlParams.toString()}` : '';
        window.history.replaceState(null, '', window.location.pathname + cleanSearch);
      }
    }
  }, []);

  // Client-side Twitch IRC Client via tmi.js
  useEffect(() => {
    if (!config.twitchEnabled) {
      setTwitchStatus('disabled');
      setTwitchStatusMessage('');
      if (twitchClientRef.current) {
        try { twitchClientRef.current.disconnect(); } catch (e) {}
        twitchClientRef.current = null;
      }
      return;
    }

    if (!config.twitchChannel || !config.twitchToken) {
      setTwitchStatus('disconnected');
      setTwitchStatusMessage(t ? t('twitchStatusMissingConfigDesc') : 'Channel name and OAuth token required');
      if (twitchClientRef.current) {
        try { twitchClientRef.current.disconnect(); } catch (e) {}
        twitchClientRef.current = null;
      }
      return;
    }

    const tmiModule = tmi || (typeof window !== 'undefined' ? window.tmi : null);
    const ClientConstructor = tmiModule?.Client || tmiModule?.client || (typeof window !== 'undefined' ? window.tmi?.Client : null);
    if (!ClientConstructor) {
      setTwitchStatus('disconnected');
      setTwitchStatusMessage('tmi.js IRC library not loaded');
      return;
    }

    let client = null;
    let isSubscribed = true;
    const cleanToken = config.twitchToken.startsWith('oauth:') ? config.twitchToken : `oauth:${config.twitchToken}`;
    const cleanChannel = config.twitchChannel.trim().toLowerCase().replace(/^#/, '');

    setTwitchStatus('connecting');
    setTwitchStatusMessage(`Connecting to #${cleanChannel}...`);

    try {
      client = new ClientConstructor({
        options: { debug: false },
        logger: {
          info: () => {},
          warn: (msg) => {
            if (typeof msg === 'string' && (msg.includes('Login authentication failed') || msg.includes('login_unsuccessful'))) return;
            console.warn('[Twitch]', msg);
          },
          error: (msg) => {
            if (typeof msg === 'string' && (msg.includes('Login authentication failed') || msg.includes('login_unsuccessful'))) return;
            console.warn('[Twitch]', msg);
          }
        },
        connection: {
          reconnect: false,
          maxReconnectAttempts: 2,
          maxReconnectInterval: 30000
        },
        identity: {
          username: cleanChannel,
          password: cleanToken
        },
        channels: [cleanChannel]
      });

      client.on('error', () => {
        // Suppress unhandled socket error events
      });

      client.on('connected', () => {
        if (!isSubscribed) return;
        setTwitchStatus('connected');
        setTwitchStatusMessage(`Connected to #${cleanChannel}`);
        setLastActivity(`Connected to #${cleanChannel} at ${new Date().toLocaleTimeString()}`);
      });

      client.on('disconnected', (reason) => {
        if (!isSubscribed) return;
        setTwitchStatus('disconnected');
        setTwitchStatusMessage(reason ? `Disconnected: ${reason}` : 'Disconnected');
      });

      client.on('reconnect', () => {
        if (!isSubscribed) return;
        setTwitchStatus('connecting');
        setTwitchStatusMessage('Reconnecting...');
      });

      client.on('notice', (channel, msgid) => {
        if (!isSubscribed) return;
        if (msgid === 'login_unsuccessful') {
          setTwitchStatus('error');
          setTwitchStatusMessage(`Login failed: Invalid OAuth token for #${cleanChannel}`);
          try { client?.disconnect(); } catch (e) {}
        }
      });

      client.connect().then(() => {
        if (!isSubscribed) return;
        setTwitchStatus('connected');
        setTwitchStatusMessage(`Connected to #${cleanChannel}`);
        setLastActivity(`Connected to #${cleanChannel} at ${new Date().toLocaleTimeString()}`);
        twitchClientRef.current = client;
      }).catch(err => {
        if (!isSubscribed) return;
        setTwitchStatus('error');
        const errStr = typeof err === 'string' ? err : (err?.message || 'Connection failed');
        setTwitchStatusMessage(errStr.includes('Login authentication failed') ? 'Login authentication failed. Please verify your channel name and OAuth token.' : errStr);
        twitchClientRef.current = null;
        try { client?.disconnect(); } catch (e) {}
      });

      client.on('message', (channel, tags, message, self) => {
        if (self) return;
        const currentConf = configRef.current;
        if (!currentConf.twitchEnableCommands) return;

        const cleanMsg = (message || '').trim().toLowerCase();

        // Built-in command: !total
        if (cleanMsg === '!total') {
          const amt = `${currencyPrefix}${convertAmount(totalRaisedRef.current).toFixed(2)}`;
          client.say(channel, `Total raised: ${amt} for Extra Life!`);
          setCommandsHandledCount(prev => prev + 1);
          setLastActivity(`Responded to !total in #${channel} (${new Date().toLocaleTimeString()})`);
        } else if (cleanMsg === '!goal') {
          // Built-in command: !goal
          const amt = `${currencyPrefix}${convertAmount(goalRef.current).toFixed(2)}`;
          client.say(channel, `Fundraising goal: ${amt}`);
          setCommandsHandledCount(prev => prev + 1);
          setLastActivity(`Responded to !goal in #${channel} (${new Date().toLocaleTimeString()})`);
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
          setCommandsHandledCount(prev => prev + 1);
          setLastActivity(`Responded to !milestone in #${channel} (${new Date().toLocaleTimeString()})`);
        } else if (currentConf.customCommands && Array.isArray(currentConf.customCommands)) {
          // Custom commands
          const match = currentConf.customCommands.find(c => c.trigger.toLowerCase() === cleanMsg);
          if (match && match.response) {
            client.say(channel, match.response);
            setCommandsHandledCount(prev => prev + 1);
            setLastActivity(`Responded to ${match.trigger} in #${channel} (${new Date().toLocaleTimeString()})`);
          }
        }
      });
    } catch (e) {
      console.warn('Twitch client connection error:', e);
      setTwitchStatus('error');
      setTwitchStatusMessage(e?.message || 'Twitch client error');
    }

    return () => {
      isSubscribed = false;
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
    convertAmount,
    reconnectTrigger,
    t
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
        setAlertsSentCount(prev => prev + 1);
        setLastActivity(`Sent donation alert for ${donor} (${amt}) (${new Date().toLocaleTimeString()})`);
      } catch (e) {
        console.warn('Twitch alert send failed:', e);
      }
    }
  }, []);

  const sendTwitchTestMessage = useCallback(async () => {
    setIsTesting(true);
    setTestResult(null);
    const client = twitchClientRef.current;
    const channel = configRef.current?.twitchChannel?.trim().toLowerCase().replace(/^#/, '');

    if (!configRef.current?.twitchEnabled) {
      setIsTesting(false);
      setTestResult({ success: false, message: t ? t('twitchStatusDisabled') : 'Twitch integration is disabled in settings.' });
      return false;
    }

    if (!channel) {
      setIsTesting(false);
      setTestResult({ success: false, message: 'Channel name is missing.' });
      return false;
    }

    if (!client || (client.readyState && client.readyState() !== 'OPEN')) {
      setIsTesting(false);
      setTestResult({ success: false, message: 'Twitch bot is not connected. Check your OAuth token and channel name.' });
      return false;
    }

    try {
      const timeStr = new Date().toLocaleTimeString();
      await client.say(channel, `🎮 [Extra Life Tracker] Test message: Twitch integration is connected and working! (${timeStr})`);
      setTestResult({
        success: true,
        message: t ? t('twitchTestSuccess', { channel }) : `Test message sent to #${channel} successfully!`
      });
      setLastActivity(`Sent test message to #${channel} at ${timeStr}`);
      return true;
    } catch (err) {
      const errMsg = typeof err === 'string' ? err : (err?.message || 'Unknown error');
      setTestResult({
        success: false,
        message: `${t ? t('twitchTestError') : 'Failed to send test message:'} ${errMsg}`
      });
      return false;
    } finally {
      setIsTesting(false);
    }
  }, [t]);

  const reconnectTwitch = useCallback(() => {
    setReconnectTrigger(prev => prev + 1);
  }, []);

  const handleGetTwitchToken = useCallback((profileArg) => {
    if (typeof window === 'undefined') return;
    const redirectUri = `${window.location.origin}${window.location.pathname}`;
    const scopes = 'chat:read+chat:edit';

    // Safely resolve active profile name, ignoring any passed Event objects
    let profileName = 'default';
    if (typeof profileArg === 'string' && profileArg.trim() && !profileArg.includes('[object')) {
      profileName = profileArg.trim();
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      const urlProf = urlParams.get('profile');
      if (urlProf && !urlProf.includes('[object') && urlProf !== 'null' && urlProf !== 'undefined') {
        profileName = urlProf.trim();
      }
    }

    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${TWITCH_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${scopes}&state=${encodeURIComponent(profileName)}`;
    window.location.href = authUrl;
  }, []);

  return {
    pendingTwitchToken,
    setPendingTwitchToken,
    twitchClientRef,
    sendTwitchAlert,
    handleGetTwitchToken,
    twitchStatus,
    twitchStatusMessage,
    twitchLastActivity: lastActivity,
    twitchCommandsHandled: commandsHandledCount,
    twitchAlertsSent: alertsSentCount,
    sendTwitchTestMessage,
    twitchTestResult: testResult,
    isTwitchTesting: isTesting,
    reconnectTwitch
  };
}
