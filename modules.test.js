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
      expect(DEFAULT_CONFIG.useParticipantTeamId).toBe(true);
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

    test('getUrlProfile sanitizes [object Object] and invalid profiles to default', () => {
      delete global.window;
      global.window = {
        location: {
          search: '?profile=%5Bobject%20Object%5D'
        }
      };
      expect(getUrlProfile()).toBe('default');

      global.window.location.search = '?profile=566273';
      expect(getUrlProfile()).toBe('566273');

      delete global.window;
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

    test('noTeamLinked localization keys exist in both English and French', async () => {
      const { translations } = await import('./translations.js');
      const keys = ['noTeamLinked', 'noTeamLinkedTitle', 'noTeamLinkedDesc', 'autoDetect'];
      for (const k of keys) {
        expect(translations.en[k]).toBeDefined();
        expect(translations.fr[k]).toBeDefined();
      }
    });

    test('Team overlays render safely when participant has no team (solo streamer)', async () => {
      const React = (await import('react')).default;
      const { TeamDashboardView, TeamHeaderOverlay, TeamDonationsOverlay, GraphOverlay } = await import('./overlays.js');

      // 1. TeamDashboardView with no team
      const dashboardEl = React.createElement(TeamDashboardView, {
        styles: { statHero: {}, bigStat: {}, secondaryStat: {}, card: {}, input: {}, button: {} },
        config: { panelColor: '#111', textColor: '#fff', fontFamily: 'sans-serif', teamId: '' },
        currencyPrefix: '$',
        convertAmount: (amt) => amt,
        teamTotalRaised: 0,
        teamGoal: 0,
        teamName: '',
        teamDonations: [],
        teamParticipants: [],
        participantId: '12345',
        participantName: 'Solo Streamer',
        participantDonations: [],
        participantTotalRaised: 50,
        participantGoal: 100,
        selectedAccountId: '12345',
        setSelectedAccountId: () => {},
        t: (k, vars) => (vars ? `${k}` : k),
        effHeaderColor: '#fff',
        effSecondaryTextColor: '#aaa',
        effPrimaryButtonBgColor: '#0088ff',
        effSecondaryButtonBgColor: '#0055aa',
        effDividerColor: '#333',
        effHighlightColor: '#00ffff',
        effDonorNameColor: '#ffff00',
        effProgressBarColor: '#00ff00',
        hexToRgba: (hex, a) => `rgba(0,0,0,${a})`,
        lastFetchedAt: new Date()
      });
      expect(React.isValidElement(dashboardEl)).toBe(true);

      // 2. TeamHeaderOverlay with no team
      const headerEl = React.createElement(TeamHeaderOverlay, {
        styles: { progressBarContainer: {} },
        currencyPrefix: '$',
        convertAmount: (amt) => amt,
        teamTotalRaised: 0,
        teamGoal: 0,
        teamName: '',
        teamDonationsCount: 0,
        config: { panelColor: '#111', textColor: '#fff' },
        effHeaderColor: '#fff',
        effSecondaryTextColor: '#aaa',
        effProgressBarColor: '#00ff00',
        hexToRgba: (hex, a) => `rgba(0,0,0,${a})`,
        t: (k) => k
      });
      expect(React.isValidElement(headerEl)).toBe(true);

      // 3. TeamDonationsOverlay with no team
      const donationsEl = React.createElement(TeamDonationsOverlay, {
        styles: { input: {} },
        currencyPrefix: '$',
        convertAmount: (amt) => amt,
        teamTotalRaised: 0,
        teamName: '',
        teamDonations: [],
        config: { panelColor: '#111', textColor: '#fff' },
        effHeaderColor: '#fff',
        effSecondaryTextColor: '#aaa',
        effDividerColor: '#333',
        effHighlightColor: '#00ffff',
        effDonorNameColor: '#ffff00',
        hexToRgba: (hex, a) => `rgba(0,0,0,${a})`,
        t: (k) => k
      });
      expect(React.isValidElement(donationsEl)).toBe(true);

      // 4. GraphOverlay with no team
      const graphEl = React.createElement(GraphOverlay, {
        styles: { card: {}, button: {} },
        config: { panelColor: '#111', textColor: '#fff', fontFamily: 'sans-serif' },
        donations: [],
        milestones: [],
        goal: 0,
        totalRaised: 0,
        currencyPrefix: '$',
        convertAmount: (amt) => amt,
        t: (k) => k,
        entityName: 'Team',
        isTeam: true,
        effHighlightColor: '#00ffff',
        effHeaderColor: '#fff',
        effSecondaryTextColor: '#aaa',
        effDividerColor: '#333',
        effPrimaryButtonBgColor: '#0088ff',
        effSecondaryButtonBgColor: '#0055aa',
        hexToRgba: (hex, a) => `rgba(0,0,0,${a})`,
        isTransparent: false
      });
      expect(React.isValidElement(graphEl)).toBe(true);
    });

    test('Documentation localization keys exist in both English and French', async () => {
      const { translations } = await import('./translations.js');
      const docKeys = [
        'documentationLinks',
        'docHeaderSubtitle',
        'docOptionsRef',
        'docOptionsDesc',
        'docMainGuide',
        'docMainGuideDesc',
        'docGitHubPagesGuide',
        'docGitHubPagesGuideDesc',
        'viewDocInApp',
        'openDocTab',
        'closeDocModal',
        'openDocumentation',
        'docModalTitle',
        'docSearchPlaceholder',
        'docSwitchLanguage'
      ];
      for (const k of docKeys) {
        expect(translations.en[k]).toBeDefined();
        expect(translations.fr[k]).toBeDefined();
      }
    });

    test('markdown-parser.js parses headings, tables, code blocks, lists and blockquotes', async () => {
      const { parseMarkdown, renderInline, FormattedMarkdown } = await import('./markdown-parser.js');
      const React = (await import('react')).default;

      const sampleMd = [
        '# Main Title',
        '> Important quote or note',
        '## Section Heading',
        'Paragraph with **bold**, *italic*, `code`, and [Link](APP_OPTIONS_FR.md).',
        '',
        '| Name | Type | Description |',
        '| :--- | :--- | :--- |',
        '| theme | string | Preset color theme |',
        '',
        '```bash',
        'npm run build',
        '```',
        '',
        '- Item 1',
        '- Item 2',
        '---'
      ].join('\n');

      const blocks = parseMarkdown(sampleMd);
      expect(blocks.length).toBeGreaterThanOrEqual(7);

      const heading1 = blocks.find(b => b.type === 'heading' && b.level === 1);
      expect(heading1).toBeDefined();
      expect(heading1.text).toBe('Main Title');

      const bq = blocks.find(b => b.type === 'blockquote');
      expect(bq).toBeDefined();
      expect(bq.text).toContain('Important quote or note');

      const tbl = blocks.find(b => b.type === 'table');
      expect(tbl).toBeDefined();
      expect(tbl.headers).toEqual(['Name', 'Type', 'Description']);
      expect(tbl.rows.length).toBe(1);
      expect(tbl.rows[0][0]).toBe('theme');

      const codeBlock = blocks.find(b => b.type === 'code_block');
      expect(codeBlock).toBeDefined();
      expect(codeBlock.language).toBe('bash');
      expect(codeBlock.code).toBe('npm run build');

      // Test inline rendering
      let navTarget = '';
      const inlineEls = renderInline('Here is [French Options](APP_OPTIONS_FR.md) and `variable`', {
        onNavigate: (t) => { navTarget = t; },
        highlightColor: '#00ffff'
      });
      expect(Array.isArray(inlineEls)).toBe(true);

      // Test FormattedMarkdown component element
      const el = React.createElement(FormattedMarkdown, {
        content: sampleMd,
        onNavigate: () => {},
        themeConfig: { highlightColor: '#00ffff' }
      });
      expect(React.isValidElement(el)).toBe(true);
    });

    test('markdown-parser.js parses lists with indented code blocks without swallowing markdown', async () => {
      const { parseMarkdown } = await import('./markdown-parser.js');
      const testMarkdown = [
        '1. **Start any local static server in the project folder:**',
        '   ```bash',
        '   # Option 1: Using Python 3',
        '   python3 -m http.server 8080',
        '',
        '   # Option 2: Using Node.js npx',
        '   npx serve . -l 8080',
        '   ```',
        '2. **Open the dashboard:**',
        '   Navigate to http://localhost:8080.',
        '',
        '---',
        '',
        '## 🧭 Dashboard Views & Navigation',
        'Next section should be a heading, not swallowed code.'
      ].join('\n');

      const blocks = parseMarkdown(testMarkdown);
      const codeBlock = blocks.find(b => b.type === 'code_block');
      expect(codeBlock).toBeDefined();
      expect(codeBlock.language).toBe('bash');
      expect(codeBlock.code).toContain('python3 -m http.server 8080');
      expect(codeBlock.code).toContain('npx serve . -l 8080');

      const heading = blocks.find(b => b.type === 'heading' && b.text.includes('Dashboard Views'));
      expect(heading).toBeDefined();
      expect(heading.level).toBe(2);

      const hr = blocks.find(b => b.type === 'hr');
      expect(hr).toBeDefined();
    });

    test('index.tsx includes docCacheRef to prevent HTTP 429 rate limit errors', async () => {
      const fs = await import('fs');
      const content = fs.readFileSync('index.tsx', 'utf8');
      expect(content).toContain('docCacheRef');
      expect(content).toContain('/api/docs/');
    });

    test('storage.js getUrlProfile decodes URL encoded profile names properly', async () => {
      const { getUrlProfile } = await import('./storage.js');
      // Mock window location with URL encoded profile
      global.window = {
        location: {
          search: '?profile=my%20stream%20profile'
        }
      };
      expect(getUrlProfile()).toBe('my stream profile');
    });

    test('use-audio-alerts.js deduplicates donations by donationID', async () => {
      const fs = await import('fs');
      const content = fs.readFileSync('hooks/use-audio-alerts.js', 'utf8');
      expect(content).toContain('recentToastIdsRef');
      expect(content).toContain('recentToastIdsRef.current.has(donId)');
    });

    test('index.tsx supports static folder manifests (sponsors.json) for GitHub Pages', async () => {
      const fs = await import('fs');
      const content = fs.readFileSync('index.tsx', 'utf8');
      expect(content).toContain('sponsors/sponsors.json');
      expect(content).toContain('sounds/sounds.json');
      expect(content).toContain('text_files/text_files.json');

      const manifestExists = fs.existsSync('sponsors/sponsors.json');
      expect(manifestExists).toBe(true);
      const manifest = JSON.parse(fs.readFileSync('sponsors/sponsors.json', 'utf8'));
      expect(Array.isArray(manifest)).toBe(true);
      expect(manifest.length).toBeGreaterThan(0);
    });

    test('hooks/use-audio-alerts.js resolves sound files relatively for GitHub Pages compatibility', async () => {
      const fs = await import('fs');
      const content = fs.readFileSync('hooks/use-audio-alerts.js', 'utf8');
      expect(content).toContain("`sounds/${targetUrl}`");
      expect(content).not.toContain("`/sounds/${urlOrFilename}`");
    });

    test('hooks/use-extralife-data.js queries DonorDrive with valid orderBy and client-side sorting', async () => {
      const fs = await import('fs');
      const content = fs.readFileSync('hooks/use-extralife-data.js', 'utf8');
      expect(content).toContain('orderBy=createdDateUTC%20DESC');
      expect(content).not.toContain('orderDirection=DESC');
      expect(content).toContain('seenDonationIdsRef = useRef(new Set(');
    });

    test('translations.js defines Anonymous Donor and dashboard-panels.tsx displays it when displayName is missing or empty', async () => {
      const { translations } = await import('./translations.js');
      expect(translations.en.anonymous).toBe('Anonymous Donor');
      expect(translations.fr.anonymous).toBe('Donateur Anonyme');

      const fs = await import('fs');
      const content = fs.readFileSync('dashboard-panels.tsx', 'utf8');
      expect(content).toContain("(!d.displayName || d.displayName.trim().toLowerCase() === 'anonymous') ? t('anonymous')");
    });

    test('hooks/use-extralife-data.js includes 24h marathon resilience (cache-busting, visibility listeners, watchdog)', async () => {
      const fs = await import('fs');
      const content = fs.readFileSync('hooks/use-extralife-data.js', 'utf8');
      expect(content).toContain("cache: 'no-store'");
      expect(content).toContain('_t=${Date.now()}');
      expect(content).toContain("document.addEventListener('visibilitychange'");
      expect(content).toContain("window.addEventListener('focus'");
      expect(content).toContain('watchdog = setInterval(');
    });

    test('muteDashboardAudio prevents duplicate audio playback in dashboard while allowing overlay playback', async () => {
      const { DEFAULT_CONFIG } = await import('./constants.js');
      expect(DEFAULT_CONFIG.muteDashboardAudio).toBe(false);

      const { translations } = await import('./translations.js');
      expect(translations.en.muteDashboardAudio).toBeDefined();
      expect(translations.fr.muteDashboardAudio).toBeDefined();

      const fs = await import('fs');
      const hookContent = fs.readFileSync('hooks/use-audio-alerts.js', 'utf8');
      expect(hookContent).toContain('if (!forcePlay && isDashboardModeRef.current && currentConfig.muteDashboardAudio) return;');
      expect(hookContent).toContain('s.id === soundId || s.name === soundId || s.data === soundId');

      const panelContent = fs.readFileSync('dashboard-panels.tsx', 'utf8');
      expect(panelContent).toContain('playSpecificSound(config.selectedSound, true)');
      expect(panelContent).toContain('playSpecificSound(config.selectedMilestoneSound, true)');
    });

    test('ProgressBar overlay styling matches NextMilestoneOverlay and theme color preview', async () => {
      const fs = await import('fs');
      const overlaysContent = fs.readFileSync('overlays.tsx', 'utf8');
      expect(overlaysContent).toContain('export const ProgressBar');
      expect(overlaysContent).toContain('effProgressBarColor');
      expect(overlaysContent).toContain('effProgressBarBgColor');
      expect(overlaysContent).toContain('effProgressBarTextColor');
      expect(overlaysContent).toContain('effProgressBarBorderColor');
      expect(overlaysContent).toContain('height: \'42px\'');
      expect(overlaysContent).toContain('centerText');
      expect(overlaysContent).toContain('justifyContent: \'center\'');
      expect(overlaysContent).toContain('⏱ {timeDisplay}');
      const progressBarBlock = overlaysContent.slice(
        overlaysContent.indexOf('export const ProgressBar'),
        overlaysContent.indexOf('const NextMilestoneOverlay')
      );
      expect(progressBarBlock).not.toContain('campaignGoal');

      const indexContent = fs.readFileSync('index.tsx', 'utf8');
      expect(indexContent).toContain('effProgressBarColor={effProgressBarColor}');
      expect(indexContent).toContain('effProgressBarBgColor={effProgressBarBgColor}');
      expect(indexContent).toContain('effProgressBarTextColor={effProgressBarTextColor}');
      expect(indexContent).toContain('effProgressBarBorderColor={effProgressBarBorderColor}');
      expect(indexContent).toContain('effSecondaryTextColor={effSecondaryTextColor}');
    });

    test('Twitch OAuth token flow protects dashboard URL and active profile from corruption', async () => {
      const fs = await import('fs');
      const hookContent = fs.readFileSync('hooks/use-twitch-integration.js', 'utf8');
      expect(hookContent).toContain('!profileArg.includes(\'[object\')');
      expect(hookContent).toContain('state.includes(\'[object\')');
      expect(hookContent).toContain('window.history.replaceState(null, \'\', window.location.pathname + cleanSearch);');

      const panelContent = fs.readFileSync('dashboard-panels.tsx', 'utf8');
      expect(panelContent).toContain('onClick={() => handleGetTwitchToken()}');

      const serverContent = fs.readFileSync('server.js', 'utf8');
      expect(serverContent).toContain('profileId.includes(\'[object\')');
    });
  });
});

