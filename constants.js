/**
 * =============================================================================
 * EXTRA LIFE TRACKER - CONSTANTS & COLOR PRESETS
 * =============================================================================
 * Compatible with Node.js, static GitHub Pages, and in-browser ES modules.
 */

export const COLOR_PRESETS = {
  'neon-vibe': {
    name: 'Neon Vibe',
    colors: {
      backgroundColor: '#0d0d0d',
      textColor: '#ffffff',
      panelColor: '#1a1a1a',
      panelBorderColor: '#00ffff',
      accentColor1: '#ff00ff',
      accentColor2: '#00ffff',
      successColor: '#00ff00',
      errorColor: '#ff3333',
      buttonTextColor: '#0d0d0d',
    },
  },
  'solarized-dark': {
    name: 'Solarized Dark',
    colors: {
      backgroundColor: '#002b36',
      textColor: '#839496',
      panelColor: '#073642',
      panelBorderColor: '#586e75',
      accentColor1: '#268bd2',
      accentColor2: '#2aa198',
      successColor: '#859900',
      errorColor: '#dc322f',
      buttonTextColor: '#002b36',
    },
  },
  'hacker-green': {
    name: 'Hacker Green',
    colors: {
      backgroundColor: '#000000',
      textColor: '#ffffff',
      panelColor: '#0F0F0F',
      panelBorderColor: '#39ff14',
      accentColor1: '#39ff14',
      accentColor2: '#00ff00',
      successColor: '#7fff00',
      errorColor: '#ff0000',
      buttonTextColor: '#000000',
    },
  },
  'synthwave': {
    name: 'Synthwave',
    colors: {
      backgroundColor: '#200a40',
      textColor: '#ffffff',
      panelColor: '#301858',
      panelBorderColor: '#00f9f8',
      accentColor1: '#f923e9',
      accentColor2: '#00f9f8',
      successColor: '#f6ff00',
      errorColor: '#ff3366',
      buttonTextColor: '#200a40',
    },
  },
  'final-fantasy': {
    name: 'Final Fantasy',
    colors: {
      backgroundColor: '#000020',
      textColor: '#ffffff',
      panelColor: '#000080',
      panelBorderColor: '#ffffff',
      accentColor1: '#ffff00',
      accentColor2: '#add8e6',
      successColor: '#ffff00',
      errorColor: '#ff4444',
      buttonTextColor: '#000020',
    },
  },
  'ffxiv': {
    name: 'Final Fantasy XIV',
    colors: {
      backgroundColor: '#121212',
      textColor: '#e0e0e0',
      panelColor: '#1e1e24',
      panelBorderColor: '#d4af37',
      accentColor1: '#d4af37',
      accentColor2: '#58a6ff',
      successColor: '#4caf50',
      errorColor: '#f44336',
      buttonTextColor: '#000000',
    },
  },
  'dwarf-fortress': {
    name: 'Dwarf Fortress',
    colors: {
      backgroundColor: '#000000',
      textColor: '#c0c0c0',
      panelColor: '#101010',
      panelBorderColor: '#808080',
      accentColor1: '#ff0000',
      accentColor2: '#008080',
      successColor: '#00ff00',
      errorColor: '#ff0000',
      buttonTextColor: '#ffffff',
    },
  },
};

export const findMatchingPreset = (colors) => {
  if (!colors || typeof colors !== 'object') return undefined;
  return Object.keys(COLOR_PRESETS).find(key => {
    const presetColors = COLOR_PRESETS[key].colors;
    return Object.keys(presetColors).every(colorKey => 
      presetColors[colorKey] === colors[colorKey]
    );
  });
};

export const MIN_REFRESH_INTERVAL = 60; // Extra Life / DonorDrive API minimum refresh interval to avoid rate limiting
export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
export const MAX_VISIBLE_TOASTS = 4;
export const TWITCH_CLIENT_ID = 'kp59hwgkiqrl7zntjotsnfovrmauoz';
export const STORAGE_PREFIX = 'extralife_tracker_';
export const THEMES_STORAGE_KEY = `${STORAGE_PREFIX}custom_theme_profiles`;

export const SERVER_URL = typeof window !== 'undefined' ? window.location.origin : '';

export const isGitHubPagesHost = typeof window !== 'undefined' && (
  window.location.hostname.endsWith('github.io') || 
  window.location.protocol === 'file:'
);

/**
 * Converts a hex color string (e.g. #00ffff) to rgba() string with specified alpha.
 */
export const hexToRgba = (hex, alpha) => {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
    return hex || 'transparent';
  }
  let clean = hex.slice(1);
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const r = parseInt(clean.slice(0, 2), 16) || 0;
  const g = parseInt(clean.slice(2, 4), 16) || 0;
  const b = parseInt(clean.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const DEFAULT_CONFIG = {
  participantId: '',
  teamId: '',
  useParticipantTeamId: false,
  theme: 'neon-vibe',
  refreshInterval: 60,
  currency: 'USD',
  customExchangeRate: 0,
  eventStartTime: '',
  celebrationDuration: 15,
  language: 'en',
  milestoneProgressMode: 'cumulative',
  
  // Twitch
  twitchEnabled: false,
  twitchChannel: '',
  twitchToken: '',
  twitchEnableAlerts: true,
  twitchEnableCommands: true,
  customCommands: [],

  backgroundColor: '#0d0d0d',
  textColor: '#ffffff',
  panelColor: '#1a1a1a',
  panelBorderColor: '#00ffff',
  accentColor1: '#ff00ff',
  accentColor2: '#00ffff',
  successColor: '#00ff00',
  errorColor: '#ff3333',
  buttonTextColor: '#0d0d0d',

  // Expanded & split color controls
  headerColor: '',
  secondaryTextColor: '',
  primaryButtonBgColor: '',
  secondaryButtonBgColor: '',
  dividerColor: '',
  highlightColor: '',
  donorNameColor: '',
  progressBarColor: '',
  progressBarBgColor: '',
  progressBarTextColor: '',
  progressBarBorderColor: '',
  splitMilestoneColors: false,
  milestoneProgressBarColor: '',
  milestoneProgressBarBgColor: '',
  milestoneProgressBarTextColor: '',
  milestoneProgressBarBorderColor: '',
  toastBgColor: '',
  toastBorderColor: '',
  toastNameColor: '',
  toastAmountColor: '',
  inputBgColor: '',
  inputBorderColor: '',

  fontFamily: "'Press Start 2P', cursive",
  themingMode: 'simple',
  notificationAnimation: 'slide',
  
  isSoundEnabled: true,
  notificationVolume: 0.5,
  selectedSound: 'default',
  selectedMilestoneSound: 'default-milestone',
  customSounds: [],
  scheduleItems: [],
  sponsors: [],
  sponsorDisplayDuration: 5,

  selectedTextFile: '',
  customTextContent: '',
  textOverlayAlignment: 'top-left',
  textOverlayFontSize: 1.5,

  // QR Code Generator Settings
  qrLinkType: 'donation',
  qrCustomUrl: '',
  qrTitle: 'SCAN TO DONATE',
  qrSubtitle: '',
  qrFgColor: '#000000',
  qrBgColor: '#ffffff',
  qrTransparentBg: false,
  qrSize: 220,
  qrErrorCorrection: 'M',
  qrShowCardInDashboard: true,
  graphTransparentBg: false,
};
