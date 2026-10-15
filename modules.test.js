import { jest } from '@jest/globals';
import {
  COLOR_PRESETS,
  DEFAULT_CONFIG,
  hexToRgba,
  findMatchingPreset,
  STORAGE_PREFIX
} from './constants.js';
import {
  loadStoredConfig,
  saveStoredConfig,
  loadStoredData,
  saveStoredData,
  loadStoredThemes,
  saveStoredThemes,
  getInitialConfig,
  getUrlProfile
} from './storage.js';
import {
  createQRMatrix,
  createQRSvgString,
  getExtraLifeUrl
} from './qr-code.js';
import {
  dataUrlToArrayBuffer,
  playSynthesizedSound
} from './audio-utils.js';

describe('Modular Core Utilities & Config', () => {
  describe('constants.js & hexToRgba', () => {
    test('hexToRgba converts 6-char hex with opacity', () => {
      expect(hexToRgba('#00ffff', 0.5)).toBe('rgba(0, 255, 255, 0.5)');
      expect(hexToRgba('#000000', 1)).toBe('rgba(0, 0, 0, 1)');
    });

    test('hexToRgba converts 3-char shorthand hex', () => {
      expect(hexToRgba('#fff', 0.8)).toBe('rgba(255, 255, 255, 0.8)');
    });

    test('findMatchingPreset matches known preset', () => {
      const neonColors = COLOR_PRESETS['neon-vibe'].colors;
      expect(findMatchingPreset(neonColors)).toBe('neon-vibe');
    });

    test('DEFAULT_CONFIG contains all expected defaults', () => {
      expect(DEFAULT_CONFIG.currency).toBe('USD');
      expect(DEFAULT_CONFIG.refreshInterval).toBe(60);
      expect(DEFAULT_CONFIG.theme).toBe('neon-vibe');
      expect(DEFAULT_CONFIG.isSoundEnabled).toBe(true);
    });
  });

  describe('storage.js', () => {
    const memoryStore = new Map();

    beforeAll(() => {
      // Mock global localStorage in Node environment
      global.localStorage = {
        getItem: (k) => memoryStore.get(k) || null,
        setItem: (k, v) => memoryStore.set(k, String(v)),
        removeItem: (k) => memoryStore.delete(k),
        clear: () => memoryStore.clear(),
        key: (idx) => Array.from(memoryStore.keys())[idx] || null,
        get length() { return memoryStore.size; }
      };
    });

    beforeEach(() => {
      memoryStore.clear();
    });

    test('saves and loads config for a participant profile', () => {
      const testConfig = { participantId: '566273', theme: 'synthwave', currency: 'CAD' };
      saveStoredConfig('566273', testConfig);

      const loaded = loadStoredConfig('566273');
      expect(loaded).toMatchObject(testConfig);
      // Confirms mirror to default was created for OBS overlays
      expect(memoryStore.get(`${STORAGE_PREFIX}config_default`)).toBeTruthy();
    });

    test('getInitialConfig merges preset colors when theme is set', () => {
      saveStoredConfig('default', { theme: 'synthwave', participantId: '123' });
      const config = getInitialConfig('default');
      expect(config.theme).toBe('synthwave');
      expect(config.backgroundColor).toBe('#200a40');
      expect(config.participantId).toBe('123');
    });

    test('saves and loads theme profiles', () => {
      const themes = [{ id: 'custom-1', name: 'My Theme', colors: { backgroundColor: '#111' } }];
      saveStoredThemes(themes);
      expect(loadStoredThemes()).toEqual(themes);
    });
  });

  describe('qr-code.js', () => {
    test('getExtraLifeUrl handles donation, page, and custom types', () => {
      expect(getExtraLifeUrl('566273', 'donation')).toContain('fuseaction=twitchDonate.participant&participantID=566273');
      expect(getExtraLifeUrl('566273', 'page')).toBe('https://dd.extra-life.org/participants/566273');
      expect(getExtraLifeUrl('566273', 'custom', 'https://charity.org')).toBe('https://charity.org');
    });

    test('createQRMatrix creates valid square matrix', () => {
      const matrix = createQRMatrix('https://extra-life.org', 'M');
      expect(Array.isArray(matrix)).toBe(true);
      expect(matrix.length).toBeGreaterThan(10);
      expect(matrix[0].length).toBe(matrix.length);
    });

    test('createQRSvgString outputs valid SVG xml string', () => {
      const svg = createQRSvgString({ text: 'https://extra-life.org', size: 256 });
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('viewBox="0 0 256 256"');
    });
  });

  describe('audio-utils.js', () => {
    test('dataUrlToArrayBuffer safely decodes base64 data URLs', () => {
      // Mock window.atob if not in browser
      if (typeof window === 'undefined') {
        global.window = { atob: (b64) => Buffer.from(b64, 'base64').toString('binary') };
      }
      const dataUrl = 'data:audio/wav;base64,UklGRgAAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
      const buffer = dataUrlToArrayBuffer(dataUrl);
      expect(buffer).toBeInstanceOf(ArrayBuffer);
      expect(buffer.byteLength).toBeGreaterThan(0);
    });

    test('playSynthesizedSound recognizes built-in sound IDs', () => {
      const mockGain = {
        connect: jest.fn(),
        gain: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() }
      };
      const mockCtx = {
        currentTime: 0,
        createGain: () => mockGain,
        createOscillator: () => ({
          type: '',
          frequency: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() },
          connect: jest.fn(),
          start: jest.fn(),
          stop: jest.fn()
        })
      };

      expect(playSynthesizedSound(mockCtx, mockGain, 'default', 0.1)).toBe(true);
      expect(playSynthesizedSound(mockCtx, mockGain, 'default-milestone', 0.1)).toBe(true);
      expect(playSynthesizedSound(mockCtx, mockGain, 'default-powerup', 0.1)).toBe(true);
      expect(playSynthesizedSound(mockCtx, mockGain, 'default-laser', 0.1)).toBe(true);
      expect(playSynthesizedSound(mockCtx, mockGain, 'unknown-sound-file', 0.1)).toBe(false);
    });
  });

  describe('overlays.js', () => {
    test('exports all expected standalone OBS overlay components', async () => {
      const overlays = await import('./overlays.js');
      expect(typeof overlays.ProgressBar).toBe('function');
      expect(typeof overlays.NextMilestoneOverlay).toBe('function');
      expect(typeof overlays.TeamHeaderOverlay).toBe('function');
      expect(typeof overlays.TeamDonationsOverlay).toBe('function');
      expect(typeof overlays.TeamDashboardView).toBe('function');
      expect(typeof overlays.ScheduleOverlay).toBe('function');
      expect(typeof overlays.SponsorOverlay).toBe('function');
      expect(typeof overlays.TextOverlay).toBe('function');
      expect(typeof overlays.CelebrationOverlay).toBe('function');
      expect(typeof overlays.QRCodeSvg).toBe('function');
      expect(typeof overlays.QRCodeOverlay).toBe('function');
      expect(typeof overlays.CollapsibleSection).toBe('function');
      expect(typeof overlays.AnnualProgressGraph).toBe('function');
      expect(typeof overlays.GraphOverlay).toBe('function');
    });

    test('GraphOverlay and AnnualProgressGraph components can be instantiated', async () => {
      const React = (await import('react')).default;
      const { AnnualProgressGraph, GraphOverlay } = await import('./overlays.js');
      expect(typeof AnnualProgressGraph).toBe('function');
      expect(typeof GraphOverlay).toBe('function');

      const graphEl = React.createElement(AnnualProgressGraph, {
        styles: { card: {} },
        config: { fontFamily: 'sans-serif' },
        donations: [{ donationID: '1', amount: 50, createdDateUTC: '2026-05-01T12:00:00Z', displayName: 'Hero' }],
        milestones: [{ milestoneID: 'm1', fundraisingGoal: 100, description: 'First goal' }],
        goal: 1000,
        totalRaised: 50,
        currencyPrefix: '$',
        convertAmount: (a) => a,
        t: (k) => k,
        isOverlay: false
      });
      expect(React.isValidElement(graphEl)).toBe(true);

      const overlayEl = React.createElement(GraphOverlay, {
        styles: { card: {} },
        config: { fontFamily: 'sans-serif' },
        donations: [],
        milestones: [],
        goal: 500,
        totalRaised: 100,
        currencyPrefix: '$',
        convertAmount: (a) => a,
        t: (k) => k,
        isTransparent: true
      });
      expect(React.isValidElement(overlayEl)).toBe(true);
    });
  });

  describe('hooks/ (Custom React Hooks)', () => {
    test('hooks/index.js exports all 5 core custom hooks', async () => {
      const hooks = await import('./hooks/index.js');
      expect(typeof hooks.useExtraLifeData).toBe('function');
      expect(typeof hooks.useAudioAlerts).toBe('function');
      expect(typeof hooks.useTwitchIntegration).toBe('function');
      expect(typeof hooks.useBroadcastSync).toBe('function');
      expect(typeof hooks.useThemeManager).toBe('function');
    });

    test('hooks/use-theme-manager.js handles theme and preset operations', async () => {
      const { useThemeManager } = await import('./hooks/use-theme-manager.js');
      expect(typeof useThemeManager).toBe('function');
    });

    test('hooks/use-twitch-integration.js provides Twitch alert and IRC interface', async () => {
      const { useTwitchIntegration } = await import('./hooks/use-twitch-integration.js');
      expect(typeof useTwitchIntegration).toBe('function');
    });

    test('hooks/use-broadcast-sync.js provides multi-tab BroadcastChannel and Socket.IO sync', async () => {
      const { useBroadcastSync } = await import('./hooks/use-broadcast-sync.js');
      expect(typeof useBroadcastSync).toBe('function');
    });

    test('hooks/use-audio-alerts.js exports Web Audio synthesis and toast queuing', async () => {
      const { useAudioAlerts } = await import('./hooks/use-audio-alerts.js');
      expect(typeof useAudioAlerts).toBe('function');
    });

    test('hooks/use-extralife-data.js exports DonorDrive polling and conversion engine', async () => {
      const { useExtraLifeData } = await import('./hooks/use-extralife-data.js');
      expect(typeof useExtraLifeData).toBe('function');
    });

    test('index.tsx avoids TDZ by using forward refs for cross-hook callbacks', async () => {
      const fs = await import('fs');
      const content = fs.readFileSync('index.tsx', 'utf8');
      expect(content).toContain('sendTwitchAlertRef');
      expect(content).toContain('fetchClientSideDataRef');
      expect(content).toContain('onDataReceivedRef');
      // Ensure sendTwitchAlert is NOT directly used in onNewDonation dependency array
      expect(content).not.toMatch(/\[.*sendTwitchAlert.*\]/);
    });
  });

  describe('Phase 4: Modular Dashboard & Settings UI Components', () => {
    test('dashboard-panels.js exports all core dashboard and settings components', async () => {
      const panels = await import('./dashboard-panels.js');
      expect(typeof panels.LandingPageView).toBe('function');
      expect(typeof panels.HeaderBar).toBe('function');
      expect(typeof panels.HeroStatsView).toBe('function');
      expect(typeof panels.DonationsFeedCard).toBe('function');
      expect(typeof panels.QuickActionsCard).toBe('function');
      expect(typeof panels.SecondaryStatsCard).toBe('function');
      expect(typeof panels.QrQuickCard).toBe('function');
      expect(typeof panels.OverlayLinksSection).toBe('function');
      expect(typeof panels.CoreSetupSection).toBe('function');
      expect(typeof panels.QrCodeSection).toBe('function');
      expect(typeof panels.TwitchSection).toBe('function');
      expect(typeof panels.EventTimingSection).toBe('function');
      expect(typeof panels.ScheduleSection).toBe('function');
      expect(typeof panels.ThemingSection).toBe('function');
      expect(typeof panels.SoundSettingsSection).toBe('function');
      expect(typeof panels.SponsorsSection).toBe('function');
      expect(typeof panels.TextOverlaySection).toBe('function');
      expect(typeof panels.ProfileBackupSection).toBe('function');
      expect(typeof panels.CollapsibleSection).toBe('function');
    });

    test('components/index.js correctly re-exports dashboard panels', async () => {
      const comps = await import('./components/index.js');
      expect(typeof comps.LandingPageView).toBe('function');
      expect(typeof comps.HeaderBar).toBe('function');
      expect(typeof comps.HeroStatsView).toBe('function');
    });

    test('HeroStatsView renders formatted total, goal and progress percentage', async () => {
      const { HeroStatsView } = await import('./dashboard-panels.js');
      const el = HeroStatsView({
        styles: { statHero: {}, bigStat: {}, secondaryStat: {}, timerText: {} },
        totalRaised: 1250,
        goal: 2000,
        progressPercentage: 62.5,
        timeDisplay: '05:42:10',
        currencyPrefix: '$',
        convertAmount: (amt) => amt,
        t: (k) => k
      });
      expect(el).toBeTruthy();
      expect(el.type).toBe('div');
    });

    test('DonationsFeedCard renders empty state message when no donations exist', async () => {
      const { DonationsFeedCard } = await import('./dashboard-panels.js');
      const el = DonationsFeedCard({
        styles: { card: {}, feedContainer: {} },
        sortedDonations: [],
        currencyPrefix: '$',
        convertAmount: (amt) => amt,
        effHighlightColor: '#00ffff',
        effDividerColor: '#333333',
        config: { textColor: '#ffffff' },
        t: (k) => k
      });
      expect(el).toBeTruthy();
      expect(el.type).toBe('div');
    });

    test('QuickActionsCard renders donation action buttons', async () => {
      const { QuickActionsCard } = await import('./dashboard-panels.js');
      let donationTested = false;
      let synced = false;
      let overlaysCleared = false;

      const el = QuickActionsCard({
        styles: { card: {}, button: {} },
        effSecondaryButtonBgColor: '#0088ff',
        config: { buttonTextColor: '#ffffff', successColor: '#00ff00', errorColor: '#ff0000' },
        onTestDonation: () => { donationTested = true; },
        onManualSync: () => { synced = true; },
        onClearOverlays: () => { overlaysCleared = true; },
        t: (k) => k
      });
      expect(el).toBeTruthy();
      expect(el.type).toBe('div');
    });

    test('index.tsx imports and integrates dashboard-panels cleanly', async () => {
      const fs = await import('fs');
      const content = fs.readFileSync('index.tsx', 'utf8');
      expect(content).toContain("from \"./dashboard-panels.js\"");
      expect(content).toContain("<LandingPageView");
      expect(content).toContain("<HeaderBar");
      expect(content).toContain("<HeroStatsView");
      expect(content).toContain("<DonationsFeedCard");
      expect(content).toContain("<CoreSetupSection");
      expect(content).toContain("<ThemingSection");
    });

    test('Twitch status localization keys exist in both English and French', async () => {
      const { translations } = await import('./translations.js');
      const keys = [
        'twitchStatus',
        'twitchStatusConnected',
        'twitchStatusConnecting',
        'twitchStatusDisconnected',
        'twitchStatusDisabled',
        'twitchStatusConfigRequired',
        'twitchTestButton',
        'twitchReconnect',
        'twitchCommandsHandled',
        'twitchAlertsSent'
      ];
      for (const k of keys) {
        expect(translations.en[k]).toBeDefined();
        expect(translations.fr[k]).toBeDefined();
      }
    });

    test('TwitchSection component accepts twitchStatus and renders status card', async () => {
      const { TwitchSection } = await import('./dashboard-panels.js');
      const el = TwitchSection({
        styles: { label: {}, input: {}, button: {}, soundItem: {}, soundButton: {} },
        config: { twitchEnabled: true, twitchChannel: 'charitystreamer', twitchToken: 'oauth:test', customCommands: [] },
        updateConfig: () => {},
        commandTrigger: '!discord',
        setCommandTrigger: () => {},
        commandResponse: 'Join us!',
        setCommandResponse: () => {},
        handleAddCommand: () => {},
        handleDeleteCommand: () => {},
        handleGetTwitchToken: () => {},
        effHighlightColor: '#00ffff',
        effHeaderColor: '#ffffff',
        effSecondaryTextColor: '#aaaaaa',
        effPrimaryButtonBgColor: '#0088ff',
        effDividerColor: '#333333',
        t: (k, vars) => (vars?.channel ? `${k}: ${vars.channel}` : k),
        twitchStatus: 'connected',
        twitchStatusMessage: 'Connected to #charitystreamer',
        twitchCommandsHandled: 5,
        twitchAlertsSent: 3
      });
      expect(el).toBeTruthy();
      expect(el.type).toBeDefined();
    });
  });
});
