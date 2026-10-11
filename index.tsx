import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { io, Socket } from 'socket.io-client';
import tmi from 'tmi.js';
import { translations } from './translations.js';
import {
  createQRMatrix,
  createQRSvgString,
  getExtraLifeUrl,
  downloadQRCodePng,
  downloadQRCodeSvg
} from './qr-code.js';
import {
  COLOR_PRESETS,
  DEFAULT_CONFIG,
  MIN_REFRESH_INTERVAL,
  MAX_FILE_SIZE_BYTES,
  SERVER_URL,
  MAX_VISIBLE_TOASTS,
  TWITCH_CLIENT_ID,
  STORAGE_PREFIX,
  THEMES_STORAGE_KEY,
  isGitHubPagesHost,
  hexToRgba,
  findMatchingPreset
} from './constants.js';
import {
  loadStoredThemes,
  saveStoredThemes,
  loadStoredConfig,
  saveStoredConfig,
  loadStoredData,
  saveStoredData,
  getUrlProfile,
  getInitialConfig
} from './storage.js';
import {
  dataUrlToArrayBuffer,
  playSynthesizedSound,
  stopAudioSources
} from './audio-utils.js';
import {
  ProgressBar,
  NextMilestoneOverlay,
  TeamHeaderOverlay,
  TeamOverlay,
  TeamDonationsOverlay,
  TeamDashboardView,
  ScheduleOverlay,
  SponsorOverlay,
  TextOverlay,
  CelebrationOverlay,
  QRCodeSvg,
  QRCodeOverlay,
  CollapsibleSection
} from "./overlays.js";
import {
  useExtraLifeData,
  useAudioAlerts,
  useTwitchIntegration,
  useBroadcastSync,
  useThemeManager
} from "./hooks/index.js";
import {
  LandingPageView,
  HeaderBar,
  HeroStatsView,
  DonationsFeedCard,
  QuickActionsCard,
  SecondaryStatsCard,
  QrQuickCard,
  OverlayLinksSection,
  CoreSetupSection,
  QrCodeSection,
  TwitchSection,
  EventTimingSection,
  ScheduleSection,
  ThemingSection,
  SoundSettingsSection,
  SponsorsSection,
  TextOverlaySection,
  ProfileBackupSection
} from "./dashboard-panels.js";


const App = () => {
  // === TYPES ===
  type Donation = {
    donationID: string;
    displayName: string;
    amount: number; 
    message?: string;
    createdDateUTC: string;
  };
  
  type Milestone = {
    milestoneID: string;
    fundraisingGoal: number; 
    description: string;
  };

  type CustomSound = {
    id: string;
    name: string;
    data: string; 
  };
  
  type Sponsor = {
    id: string;
    name: string;
    imageUrl: string;
  };

  type ScheduleItem = {
    id: string;
    time: string;
    description: string;
    isDone: boolean;
  };

  type ChatCommand = {
      id: string;
      trigger: string;
      response: string;
  };

  type SavedThemeProfile = {
      id: string;
      name: string;
      colors: {
          backgroundColor: string;
          textColor: string;
          panelColor: string;
          panelBorderColor: string;
          accentColor1: string;
          accentColor2: string;
          successColor: string;
          errorColor: string;
          buttonTextColor?: string;
          headerColor?: string;
          secondaryTextColor?: string;
          primaryButtonBgColor?: string;
          secondaryButtonBgColor?: string;
          dividerColor?: string;
          highlightColor?: string;
          donorNameColor?: string;
          progressBarColor?: string;
          progressBarBgColor?: string;
          progressBarTextColor?: string;
          progressBarBorderColor?: string;
          splitMilestoneColors?: boolean;
          milestoneProgressBarColor?: string;
          milestoneProgressBarBgColor?: string;
          milestoneProgressBarTextColor?: string;
          milestoneProgressBarBorderColor?: string;
          toastBgColor?: string;
          toastBorderColor?: string;
          toastNameColor?: string;
          toastAmountColor?: string;
          inputBgColor?: string;
          inputBorderColor?: string;
      };
      fontFamily?: string;
      notificationAnimation?: string;
  };

  const initialProfile = getUrlProfile();
  const initialLoadedConfig = getInitialConfig(initialProfile);
  const initialLoadedData = loadStoredData(initialProfile) || {};

  // === STATE & REFS ===
  const [currentProfile, setCurrentProfile] = useState<string>(initialProfile);
  const [profileInput, setProfileInput] = useState<string>(initialLoadedConfig.participantId || '');
  const [config, setConfig] = useState(initialLoadedConfig);
  const configRef = useRef(config);
  useEffect(() => { configRef.current = config; }, [config]);
  const currentProfileRef = useRef(currentProfile);
  useEffect(() => { currentProfileRef.current = currentProfile; }, [currentProfile]);

  const [participantIdInput, setParticipantIdInput] = useState<string>(initialLoadedConfig.participantId || (initialProfile !== 'default' ? initialProfile : ''));
  const [teamIdInput, setTeamIdInput] = useState<string>(initialLoadedConfig.teamId || '');
  const [websiteTotalInput, setWebsiteTotalInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [overlayType, setOverlayType] = useState<'none' | 'progress' | 'notifications' | 'milestone' | 'team' | 'team-header' | 'team-donations' | 'team-dashboard' | 'celebration' | 'schedule' | 'sponsors' | 'text' | 'qrcode'>('none');
  const [dashboardView, setDashboardView] = useState<'participant' | 'team'>('participant');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(true);
  const [formError, setFormError] = useState('');
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [timeDisplay, setTimeDisplay] = useState<string>('');

  // File and media lists
  const [availableSponsorFiles, setAvailableSponsorFiles] = useState<string[]>([]);
  const [selectedSponsorFile, setSelectedSponsorFile] = useState<string>('');
  const [sponsorUrlInput, setSponsorUrlInput] = useState<string>('');
  const [sponsorNameInput, setSponsorNameInput] = useState<string>('');
  const [availableSoundFiles, setAvailableSoundFiles] = useState<string[]>([]);
  const [selectedSoundFile, setSelectedSoundFile] = useState<string>('');
  const [availableTextFiles, setAvailableTextFiles] = useState<string[]>([]);
  const [commandTrigger, setCommandTrigger] = useState('');
  const [commandResponse, setCommandResponse] = useState('');

  // Translations helper
  const t = useCallback((key: string, args?: Record<string, string | number>) => {
    const lang = (config.language || 'en') as keyof typeof translations;
    const langObj = translations[lang] || translations['en'];
    let text = langObj[key as keyof typeof langObj] || translations['en'][key as keyof typeof translations['en']] || key;
    if (args) {
      Object.entries(args).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  }, [config.language]);

  const formatLastFetched = useCallback((date: Date | null) => {
    if (!date) return t('never');
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }, [t]);

  // Forward references to decouple hook dependencies and prevent TDZ reference errors
  const sendTwitchAlertRef = useRef<(donation: any, cRate?: number) => void>(() => {});
  const fetchClientSideDataRef = useRef<() => void>(() => {});
  const onDataReceivedRef = useRef<(payload: any) => void>(() => {});

  // Hook 1: useAudioAlerts
  const {
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
  } = useAudioAlerts({ config });

  // Hook 2: useBroadcastSync
  const {
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
  } = useBroadcastSync({
    currentProfile,
    onConfigReceived: useCallback((newConfig: any) => {
      setConfig(newConfig);
      setParticipantIdInput(newConfig.participantId || '');
      setTeamIdInput(newConfig.teamId || '');
      setIsSaving(false);
      saveStoredConfig(currentProfile, newConfig);
    }, [currentProfile]),
    onDataReceived: useCallback((payload: any) => {
      onDataReceivedRef.current(payload);
    }, []),
    onDonationEvent: useCallback(({ donation, isMilestone }: any) => {
      setToastQueue(prev => [...prev, donation]);
      if (!isMilestone) {
        playSpecificSound(configRef.current.selectedSound);
      }
    }, [playSpecificSound, setToastQueue]),
    onCelebrationEvent: useCallback((payload: any) => {
      setCelebrationKey(Date.now());
      if (payload?.type === 'milestone') {
        playSpecificSound(configRef.current.selectedMilestoneSound);
      } else {
        playSpecificSound(configRef.current.selectedSound);
      }
    }, [playSpecificSound, setCelebrationKey]),
    onClearEvent: useCallback(() => {
      clearAlerts();
    }, [clearAlerts]),
    onTriggerSync: useCallback(() => {
      fetchClientSideDataRef.current();
    }, [])
  });

  const isStandaloneMode = isGitHubPagesHost || !socketRef.current?.connected;

  // Configuration Updater
  const updateConfig = useCallback((updates: Partial<typeof config>) => {
    setIsSaving(true);
    setConfig(prev => {
      const newConfig = { ...prev, ...updates };
      if (newConfig.refreshInterval !== undefined && newConfig.refreshInterval !== 0) {
        newConfig.refreshInterval = Math.max(MIN_REFRESH_INTERVAL, newConfig.refreshInterval);
      }
      configRef.current = newConfig;

      const activeProf = currentProfileRef.current || 'default';
      saveStoredConfig(activeProf, newConfig);

      // Broadcast updates
      broadcastConfig(newConfig);

      if (!socketRef.current?.connected) {
        setTimeout(() => setIsSaving(false), 200);
      }
      return newConfig;
    });
  }, [broadcastConfig, socketRef]);

  // Hook 3: useThemeManager
  const {
    savedThemes,
    setSavedThemes,
    selectedPreset,
    setSelectedPreset,
    newThemeNameInput,
    setNewThemeNameInput,
    themeActionFeedback,
    setThemeActionFeedback,
    showAdvancedColors,
    setShowAdvancedColors,
    handlePresetChange,
    handleSaveThemeProfile,
    handleUpdateThemeProfile,
    handleDeleteThemeProfile,
    handleLoadSavedTheme,
    handleExportThemeProfile,
    handleExportAllThemes,
    handleImportThemeProfile,
    handleResetProgressBarColors,
    handleResetAdvancedColors
  } = useThemeManager({ config, updateConfig, t, setFormError });

  // Hook 4: useExtraLifeData
  const {
    donations,
    milestones,
    totalRaised,
    goal,
    participantName,
    teamTotalRaised,
    teamGoal,
    teamName,
    teamDonations,
    teamParticipants,
    conversionRate,
    lastFetchedAt,
    effectiveRate,
    convertAmount,
    currencyPrefix,
    sortedDonations,
    progressPercentage,
    fetchClientSideData,
    fetchConversionRate,
    lastFetchTimeRef,
    setDonations,
    setMilestones,
    setTotalRaised,
    setGoal,
    setParticipantName,
    setTeamTotalRaised,
    setTeamGoal,
    setTeamName,
    setTeamDonations,
    setTeamParticipants,
    setConversionRate,
    setLastFetchedAt
  } = useExtraLifeData({
    config,
    currentProfile,
    isStandaloneMode,
    overlayType,
    socketConnected: isConnected,
    onNewDonation: useCallback((donation: any, cRate: number) => {
      triggerDonationToast(donation, true);
      broadcastDonation(donation, false);
      sendTwitchAlertRef.current(donation, cRate);
    }, [triggerDonationToast, broadcastDonation]),
    onMilestoneCrossed: useCallback(() => {
      triggerCelebration('milestone');
      broadcastCelebration('milestone');
    }, [triggerCelebration, broadcastCelebration]),
    onDataUpdated: useCallback((payload: any) => {
      broadcastData(payload);
    }, [broadcastData]),
    onAutoTeamDetected: useCallback((detectedTeamId: string) => {
      setTeamIdInput(detectedTeamId);
      updateConfig({ teamId: detectedTeamId, useParticipantTeamId: true });
    }, [updateConfig])
  });

  fetchClientSideDataRef.current = fetchClientSideData;
  onDataReceivedRef.current = (payload: any) => {
    if (payload.donations) setDonations(payload.donations);
    if (payload.milestones) setMilestones(payload.milestones);
    if (payload.totalRaised !== undefined) setTotalRaised(payload.totalRaised);
    if (payload.goal !== undefined) setGoal(payload.goal);
    if (payload.participantName !== undefined) setParticipantName(payload.participantName);
    if (payload.teamTotalRaised !== undefined) setTeamTotalRaised(payload.teamTotalRaised);
    if (payload.teamGoal !== undefined) setTeamGoal(payload.teamGoal);
    if (payload.teamName !== undefined) setTeamName(payload.teamName);
    if (payload.teamDonations) setTeamDonations(payload.teamDonations);
    if (payload.teamParticipants) setTeamParticipants(payload.teamParticipants);
    if (payload.conversionRate !== undefined) setConversionRate(payload.conversionRate);
    if (payload.lastFetchedAt) setLastFetchedAt(new Date(payload.lastFetchedAt));
    saveStoredData(currentProfile, payload);
  };

  // Hook 5: useTwitchIntegration
  const {
    pendingTwitchToken,
    setPendingTwitchToken,
    twitchClientRef,
    sendTwitchAlert,
    handleGetTwitchToken
  } = useTwitchIntegration({
    config,
    totalRaised,
    goal,
    milestones,
    convertAmount,
    currencyPrefix,
    t
  });

  sendTwitchAlertRef.current = sendTwitchAlert;

  // Sync Twitch Token once acquired (works in both WebSocket-connected local mode and standalone GitHub Pages mode)
  useEffect(() => {
    if (pendingTwitchToken) {
      updateConfig({ twitchToken: pendingTwitchToken, twitchEnabled: true });
      setPendingTwitchToken(null);
    }
  }, [pendingTwitchToken, updateConfig, setPendingTwitchToken]);

  // Fetch available sound and sponsor lists from server
  useEffect(() => {
    const fetchLists = () => {
      fetch('/api/list-sponsors')
        .then(res => res.ok ? res.json() : [])
        .then(files => {
          setAvailableSponsorFiles(files);
          if (files.length > 0 && !selectedSponsorFile) setSelectedSponsorFile(files[0]);
        })
        .catch(console.error);

      fetch('/api/list-sounds')
        .then(res => res.ok ? res.json() : [])
        .then(files => {
          setAvailableSoundFiles(files);
          if (files.length > 0 && !selectedSoundFile) setSelectedSoundFile(files[0]);
        })
        .catch(console.error);

      fetch('/api/list-text-files')
        .then(res => res.ok ? res.json() : [])
        .then(setAvailableTextFiles)
        .catch(console.error);
    };
    fetchLists();
  }, []);

  // Overlay Mode detection from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const overlayParam = params.get('overlay');
    const rootEl = document.getElementById('root');

    if (overlayParam && ['progress', 'notifications', 'milestone', 'team', 'team-header', 'team-donations', 'team-list', 'team-dashboard', 'celebration', 'schedule', 'sponsors', 'text', 'qrcode', 'qr'].includes(overlayParam)) {
      if (overlayParam === 'qr') {
        setOverlayType('qrcode');
      } else if (overlayParam === 'team-list') {
        setOverlayType('team-donations');
      } else if (overlayParam === 'team') {
        setOverlayType('team-header');
      } else {
        setOverlayType(overlayParam as any);
      }
      if (rootEl) rootEl.classList.remove('config-mode');
    } else {
      setOverlayType('none');
      if (rootEl) rootEl.classList.add('config-mode');
    }
  }, []);

  // Sync background styling with overlay mode
  useEffect(() => {
    if (overlayType !== 'none') {
      document.body.style.backgroundColor = 'transparent';
      document.body.style.backgroundImage = 'none';
    } else {
      document.body.style.backgroundColor = config.backgroundColor;
      document.body.style.backgroundImage = 'none';
    }
    document.body.style.fontFamily = config.fontFamily;
  }, [overlayType, config.backgroundColor, config.fontFamily]);

  // Event countdown display timer
  useEffect(() => {
    if (!config.eventStartTime) {
      setTimeDisplay('');
      return;
    }
    const intervalId = setInterval(() => {
      const startTime = new Date(config.eventStartTime).getTime();
      const now = new Date().getTime();
      if (isNaN(startTime)) { setTimeDisplay(''); return; }
      const diff = startTime - now;
      const prefix = diff > 0 ? t('startsIn') : t('timeElapsed');
      const totalSeconds = Math.abs(Math.floor(diff / 1000));
      const days = Math.floor(totalSeconds / (3600 * 24));
      const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const pad = (num: number) => String(num).padStart(2, '0');
      let formattedTime = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
      if (days > 0) formattedTime = `${days}d ${formattedTime}`;
      setTimeDisplay(prefix + formattedTime);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [config.eventStartTime, t]);

  // Auto-fill teamIdInput when configured or auto-detected
  useEffect(() => {
    if (config.teamId && (config.useParticipantTeamId || !teamIdInput)) {
      setTeamIdInput(config.teamId);
    }
  }, [config.teamId, config.useParticipantTeamId, teamIdInput]);

  // QR Code URL resolution
  const activeParticipantId = useMemo(() => {
    return String(config.participantId || participantIdInput || (currentProfile !== 'default' ? currentProfile : '566273')).trim() || '566273';
  }, [config.participantId, participantIdInput, currentProfile]);

  const effectiveQrUrl = useMemo(() => {
    return getExtraLifeUrl(activeParticipantId, config.qrLinkType || 'donation', config.qrCustomUrl);
  }, [activeParticipantId, config.qrLinkType, config.qrCustomUrl]);

  // Profile navigation handlers
  const handleSwitchProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileInput.trim()) return;
    window.location.href = `${window.location.pathname}?profile=${encodeURIComponent(profileInput.trim())}`;
  };

  const handleChangeId = () => {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}last_profile`);
    } catch (e) {}
    window.location.href = window.location.pathname;
  };

  const handleIdSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const currentConf = configRef.current;
    const effectiveTeamId = currentConf.useParticipantTeamId
      ? (currentConf.teamId || teamIdInput)
      : (teamIdInput || currentConf.teamId);

    const updates: Partial<typeof config> = {
      participantId: participantIdInput,
      teamId: effectiveTeamId,
      useParticipantTeamId: !!currentConf.useParticipantTeamId,
      theme: selectedPreset,
      language: currentConf.language,
      currency: currentConf.currency,
      refreshInterval: currentConf.refreshInterval
    };

    if (selectedPreset && selectedPreset !== 'custom' && (COLOR_PRESETS as any)[selectedPreset]) {
      Object.assign(updates, (COLOR_PRESETS as any)[selectedPreset].colors);
    }

    updateConfig(updates);
    setTimeout(fetchClientSideData, 50);
  };

  const handleExportConfig = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `extralife-config-${currentProfile || 'default'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported && typeof imported === 'object') {
          updateConfig(imported);
          setImportSuccessMsg(t('importSuccess'));
          setTimeout(() => setImportSuccessMsg(null), 3000);
        }
      } catch (err) {
        setFormError(t('importError'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCopyUrl = (type: string) => {
    const url = `${window.location.origin}${window.location.pathname}?overlay=${type}&profile=${currentProfile}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopyFeedback(type);
      setTimeout(() => setCopyFeedback(null), 2000);
    }).catch(() => {
      setFormError(t('failedToCopyUrl'));
    });
  };

  const handleCopyQrLink = () => {
    navigator.clipboard.writeText(effectiveQrUrl).then(() => {
      setCopyFeedback('qr-link');
      setTimeout(() => setCopyFeedback(null), 2000);
    }).catch(() => {
      setFormError(t('failedToCopyUrl'));
    });
  };

  const openOverlay = (overlayName: string, features: string) => {
    const url = `${window.location.origin}${window.location.pathname}?overlay=${overlayName}&profile=${currentProfile}`;
    window.open(url, `extralife${overlayName.charAt(0).toUpperCase() + overlayName.slice(1)}Overlay`, features);
  };

  const handleManualSync = () => {
    triggerSync();
    fetchClientSideData();
  };

  const handleTestDonation = () => {
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    const handledByServer = triggerTest();
    if (!handledByServer) {
      const testAmount = 25;
      const fakeDonation: Donation = {
        donationID: `test-${Date.now()}`,
        displayName: 'GenerousGamer',
        amount: testAmount,
        message: 'For the Kids! 🎮🕹️ (Test Donation)',
        createdDateUTC: new Date().toISOString()
      };

      const newTotal = totalRaised + testAmount;
      setTotalRaised(newTotal);
      setDonations(prev => [fakeDonation, ...prev]);
      triggerDonationToast(fakeDonation, true);

      const isMilestoneHit = milestones.some(m => totalRaised < m.fundraisingGoal && newTotal >= m.fundraisingGoal);
      if (isMilestoneHit || (goal > 0 && totalRaised < goal && newTotal >= goal)) {
        triggerCelebration('milestone');
        broadcastCelebration('milestone');
      }

      broadcastDonation(fakeDonation, false);
      const updatedPayload = {
        donations: [fakeDonation, ...donations],
        milestones,
        totalRaised: newTotal,
        goal,
        teamTotalRaised,
        teamName,
        conversionRate: effectiveRate
      };
      broadcastData(updatedPayload);
      saveStoredData(currentProfile, updatedPayload);
    }
  };

  const handleClearOverlays = () => {
    triggerClear();
    clearAlerts();
  };

  const handlePreviewLocalSound = () => {
    if (!selectedSoundFile) return;
    previewSound(selectedSoundFile);
  };

  const handleAddSound = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newSound: CustomSound = {
        id: `sound-${Date.now()}`,
        name: file.name,
        data: dataUrl
      };
      updateConfig({ customSounds: [...(config.customSounds || []), newSound] });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddSoundFromList = () => {
      if(!selectedSoundFile) return;
      const newSound: CustomSound = {
          id: `sound-${Date.now()}`,
          name: selectedSoundFile,
          data: `/sounds/${selectedSoundFile}`
      };
      updateConfig({ customSounds: [...config.customSounds, newSound] });
  };

  const handleDeleteSound = (soundId: string) => {
      const newSounds = config.customSounds.filter(s => s.id !== soundId);
      updateConfig({ customSounds: newSounds });
      if (config.selectedSound === soundId) updateConfig({ selectedSound: 'default' });
      if (config.selectedMilestoneSound === soundId) updateConfig({ selectedMilestoneSound: 'default-milestone' });
  };
  
  // Schedule Handlers
  const [schedTime, setSchedTime] = useState('');
  const [schedDesc, setSchedDesc] = useState('');

  const handleAddScheduleItem = () => {
      if (!schedDesc.trim()) return;
      const newItem: ScheduleItem = { id: `s-${Date.now()}`, time: schedTime, description: schedDesc, isDone: false };
      const newItems = [...config.scheduleItems, newItem].sort((a, b) => {
          const dateA = new Date(a.time).getTime();
          const dateB = new Date(b.time).getTime();
          if (isNaN(dateA)) return -1;
          if (isNaN(dateB)) return 1;
          return dateA - dateB;
      });
      updateConfig({ scheduleItems: newItems });
      setSchedTime('');
      setSchedDesc('');
  };
  const handleToggleItem = (id: string) => {
      const items = config.scheduleItems.map(i => i.id === id ? { ...i, isDone: !i.isDone } : i);
      updateConfig({ scheduleItems: items });
  };
  const handleDeleteItem = (id: string) => {
      updateConfig({ scheduleItems: config.scheduleItems.filter(i => i.id !== id) });
  };
  
  // Sponsor Handlers
  const handleAddSponsorFromList = () => {
      if(!selectedSponsorFile) return;
      const newSponsor: Sponsor = {
          id: `sp-${Date.now()}`,
          name: selectedSponsorFile,
          imageUrl: `/sponsors/${selectedSponsorFile}`
      };
      updateConfig({ sponsors: [...config.sponsors, newSponsor] });
  };
  const handleAddSponsorFromUrl = () => {
      if (!sponsorUrlInput.trim()) return;
      const newSponsor: Sponsor = {
          id: `sp-${Date.now()}`,
          name: sponsorNameInput.trim() || t('sponsorDefaultName'),
          imageUrl: sponsorUrlInput.trim()
      };
      updateConfig({ sponsors: [...config.sponsors, newSponsor] });
      setSponsorUrlInput('');
      setSponsorNameInput('');
  };
  const handleUploadSponsorFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > MAX_FILE_SIZE_BYTES) {
          setFormError(t('fileTooLarge'));
          return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
          const newSponsor: Sponsor = {
              id: `sp-${Date.now()}`,
              name: sponsorNameInput.trim() || file.name.replace(/\.[^/.]+$/, ''),
              imageUrl: ev.target?.result as string
          };
          updateConfig({ sponsors: [...config.sponsors, newSponsor] });
          setSponsorNameInput('');
      };
      reader.readAsDataURL(file);
      e.target.value = '';
  };
  const handleDeleteSponsor = (id: string) => {
      updateConfig({ sponsors: config.sponsors.filter(s => s.id !== id) });
  };

  // Text Overlay File Upload Handler
  const handleUploadTextFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
          const text = ev.target?.result as string;
          updateConfig({ customTextContent: text, selectedTextFile: file.name });
      };
      reader.readAsText(file);
      e.target.value = '';
  };
  
  // Custom Command Handlers
  const handleAddCommand = () => {
      if (!commandTrigger.trim() || !commandResponse.trim()) return;
      const newCmd: ChatCommand = {
          id: `cmd-${Date.now()}`,
          trigger: commandTrigger.trim(),
          response: commandResponse.trim()
      };
      updateConfig({ customCommands: [...config.customCommands, newCmd] });
      setCommandTrigger('');
      setCommandResponse('');
  };
  const handleDeleteCommand = (id: string) => {
      updateConfig({ customCommands: config.customCommands.filter(c => c.id !== id) });
  };


  // === STYLES ===
  const toastAnimations: { [key: string]: string } = {
    slide: 'slideIn 0.5s ease-out forwards, slideOut 0.5s ease-in 7s forwards',
    fade: 'fadeInToast 0.5s ease-out forwards, fadeOutToast 0.5s ease-in 7s forwards',
    bounce: 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards, fadeOutToast 0.5s ease-in 7s forwards',
    zoom: 'zoomIn 0.4s ease-out forwards, fadeOutToast 0.5s ease-in 7s forwards',
  };
  const currentToastAnimation = toastAnimations[config.notificationAnimation] || toastAnimations.slide;

  // === EFFECTIVE COLORS FOR GRANULAR THEMING & SPLIT ACCENTS ===
  const effHeaderColor = config.headerColor || config.accentColor1;
  const effSecondaryTextColor = config.secondaryTextColor || config.accentColor2;
  const effPrimaryButtonBgColor = config.primaryButtonBgColor || config.accentColor1;
  const effSecondaryButtonBgColor = config.secondaryButtonBgColor || config.accentColor2;
  const effDividerColor = config.dividerColor || config.accentColor2;
  const effHighlightColor = config.highlightColor || config.accentColor1;
  const effDonorNameColor = config.donorNameColor || config.highlightColor || config.accentColor1;

  // === EFFECTIVE PROGRESS BAR COLORS (SPLIT FROM REST OF THEME) ===
  const effProgressBarColor = config.progressBarColor || config.accentColor1;
  const effProgressBarBgColor = config.progressBarBgColor || config.panelColor;
  const effProgressBarTextColor = config.progressBarTextColor || config.textColor || '#ffffff';
  const effProgressBarBorderColor = config.progressBarBorderColor || config.panelBorderColor;

  const effMilestoneBarColor = (config.splitMilestoneColors && config.milestoneProgressBarColor)
    ? config.milestoneProgressBarColor
    : effProgressBarColor;
  const effMilestoneBarBgColor = (config.splitMilestoneColors && config.milestoneProgressBarBgColor)
    ? config.milestoneProgressBarBgColor
    : effProgressBarBgColor;
  const effMilestoneBarTextColor = (config.splitMilestoneColors && config.milestoneProgressBarTextColor)
    ? config.milestoneProgressBarTextColor
    : effProgressBarTextColor;
  const effMilestoneBarBorderColor = (config.splitMilestoneColors && config.milestoneProgressBarBorderColor)
    ? config.milestoneProgressBarBorderColor
    : effProgressBarBorderColor;

  const effToastBgColor = config.toastBgColor || config.panelColor;
  const effToastBorderColor = config.toastBorderColor || config.accentColor1;
  const effToastNameColor = config.toastNameColor || config.accentColor1;
  const effToastAmountColor = config.toastAmountColor || config.accentColor2;
  const effInputBgColor = config.inputBgColor || config.panelColor;
  const effInputBorderColor = config.inputBorderColor || config.accentColor2;

  const styles = {
    container: { width: '100%', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' as const },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: effHeaderColor, textShadow: `3px 3px ${config.backgroundColor}`, marginBottom: '1rem', fontFamily: config.fontFamily, flexDirection: 'column' as const },
    form: { display: 'flex', flexDirection: 'column' as const, gap: '1rem', backgroundColor: config.panelColor, border: `4px solid ${effHeaderColor}`, padding: '20px', marginBottom: '2rem' },
    input: { backgroundColor: effInputBgColor, border: `2px solid ${effInputBorderColor}`, color: config.textColor, padding: '10px', fontFamily: config.fontFamily, fontSize: '1rem', outline: 'none', width: '100%', boxSizing: 'border-box' as const },
    button: { border: 'none', padding: '15px', fontFamily: config.fontFamily, fontSize: '1.2rem', cursor: 'pointer', textTransform: 'uppercase' as const, marginTop: '1rem', backgroundColor: effPrimaryButtonBgColor, color: config.buttonTextColor },
    error: { color: config.errorColor, marginTop: '10px', fontSize: '0.9rem', backgroundColor: config.panelColor, padding: '15px', border: `2px solid ${config.errorColor}`, whiteSpace: 'pre-wrap' as const, fontFamily: config.fontFamily },
    loading: { fontSize: '1.2rem', color: effSecondaryTextColor, margin: '2rem 0', fontFamily: config.fontFamily },
    listContainer: { display: 'flex', flexDirection: 'column' as const, gap: '1rem' },
    donationItem: { backgroundColor: config.panelColor, border: `2px solid ${config.panelBorderColor}`, padding: '15px', textAlign: 'left' as const, animation: 'fadeIn 0.5s ease-in-out' },
    donationHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
    donationName: { fontSize: '1.2rem', color: effDonorNameColor, fontFamily: config.fontFamily },
    donationAmount: { fontSize: '1.2rem', color: config.successColor, fontFamily: config.fontFamily },
    donationMessage: { marginTop: '10px', color: config.textColor, fontSize: '0.9rem', fontStyle: 'italic' as const, opacity: 0.8, fontFamily: config.fontFamily },
    label: { fontSize: '1rem', color: config.textColor, textAlign: 'left' as const, opacity: 0.7, fontFamily: config.fontFamily },
    colorPickerContainer: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '5px' },
    colorInput: { WebkitAppearance: 'none' as const, MozAppearance: 'none' as const, appearance: 'none' as const, width: '50px', height: '50px', backgroundColor: 'transparent', border: `2px solid ${effInputBorderColor}`, cursor: 'pointer' },
    // Container for non-progress-bar overlays (Schedule, Sponsors, Text, Team)
    overlayContainer: { width: '100%', backgroundColor: config.panelColor, border: `4px solid ${config.panelBorderColor}`, padding: '10px', boxSizing: 'border-box' as const },
    // Overlay styles specifically for progress bars
    progressBarContainer: { width: '100%', backgroundColor: effProgressBarBgColor, border: `4px solid ${effProgressBarBorderColor}`, padding: '10px', boxSizing: 'border-box' as const },
    progressBar: { height: '40px', backgroundColor: effProgressBarColor, width: `0%`, transition: 'width 0.5s ease-in-out', display: 'flex', alignItems: 'center', justifyContent: 'center' as const, overflow: 'hidden' },
    progressText: { color: effProgressBarTextColor, textShadow: `1px 1px ${hexToRgba(config.textColor, 0.5)}`, fontSize: '1.2rem', fontFamily: config.fontFamily },
    goalText: { color: effSecondaryTextColor, marginTop: '10px', fontFamily: config.fontFamily },
    timerText: { color: effSecondaryTextColor, marginBottom: '10px', fontSize: '1.2rem', textShadow: `2px 2px ${config.backgroundColor}`, fontFamily: config.fontFamily },
    toastContainer: { position: 'fixed' as const, top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, display: 'flex', flexDirection: 'column' as const, gap: '10px', alignItems: 'center', width: '90%', maxWidth: '600px' },
    toast: { backgroundColor: hexToRgba(effToastBgColor, 0.95), border: `3px solid ${effToastBorderColor}`, color: config.textColor, padding: '20px', animation: currentToastAnimation, textAlign: 'center' as const, minWidth: '300px' },
    toastName: { fontSize: '1.2rem', color: effToastNameColor, fontWeight: 'bold' as const, fontFamily: config.fontFamily },
    toastAmount: { fontSize: '1.5rem', color: effToastAmountColor, margin: '10px 0', fontFamily: config.fontFamily },
    toastMessage: { fontSize: '0.9rem', color: config.textColor, fontStyle: 'italic' as const, opacity: 0.8, fontFamily: config.fontFamily },
    milestoneDescription: { fontSize: '1.2rem', color: config.textColor, margin: '0 0 10px 0', textShadow: `2px 2px ${config.backgroundColor}`, fontFamily: config.fontFamily },
    soundItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', border: `2px solid ${config.panelBorderColor}`, marginBottom: '10px', color: config.textColor, fontFamily: config.fontFamily },
    soundButton: { backgroundColor: effSecondaryButtonBgColor, border: 'none', color: config.buttonTextColor, padding: '5px 10px', fontFamily: config.fontFamily, fontSize: '0.8rem', cursor: 'pointer', marginLeft: '10px' },
    previewButton: { backgroundColor: effSecondaryButtonBgColor, border: 'none', color: config.buttonTextColor, padding: '12px 15px', fontFamily: config.fontFamily, fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0 },
    // Collapsible Section Styles
    collapsibleContainer: { borderTop: `2px dashed ${effDividerColor}`, margin: '0', paddingTop: '20px' },
    collapsibleHeader: { backgroundColor: 'transparent', border: 'none', color: effHeaderColor, cursor: 'pointer', fontFamily: config.fontFamily, fontSize: '1.2rem', padding: '0', margin: 0, textAlign: 'left' as const, width: '100%', display: 'flex', alignItems: 'center' },
    collapsibleChevron: { display: 'inline-block', marginRight: '15px', transition: 'transform 0.2s ease-in-out', fontSize: '1.2rem' },
    collapsibleContent: { overflow: 'hidden', transition: 'max-height 0.3s ease-out' },
    // New Card Styles
    card: { backgroundColor: config.panelColor, border: `2px solid ${config.panelBorderColor}`, padding: '15px', display: 'flex', flexDirection: 'column' as const, gap: '10px' },
    // Dashboard Specific Styles
    dashboardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', width: '100%', textAlign: 'left' as const, alignItems: 'start' },
    statHero: { backgroundColor: config.panelColor, border: `4px solid ${config.successColor}`, padding: '20px', textAlign: 'center' as const, marginBottom: '2rem', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: '10px' },
    bigStat: { fontSize: '3rem', color: config.successColor, textShadow: `3px 3px ${config.backgroundColor}`, margin: 0 },
    secondaryStat: { fontSize: '1rem', color: effSecondaryTextColor, margin: 0 },
    feedContainer: { maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' as const, paddingRight: '10px' }
  };

  const dynamicStyles = `
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideIn { from { opacity: 0; transform: translateY(-100px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-100px); } }
    @keyframes fadeInToast { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fadeOutToast { from { opacity: 1; } to { opacity: 0; } }
    @keyframes zoomIn { from { opacity: 0; transform: scale(0.3); } to { opacity: 1; transform: scale(1); } }
    @keyframes bounceIn {
      0% { opacity: 0; transform: scale(0.3) translateY(100px); }
      50% { transform: scale(1.05) translateY(-20px); }
      80% { transform: scale(0.95) translateY(5px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    input[type="color"]::-webkit-color-swatch { border-radius: 5px; border: none; }
    input[type="color"]::-moz-color-swatch { border-radius: 5px; border: none; }
    input[type="datetime-local"]::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; }
    input[type="checkbox"] {
      appearance: none; background-color: transparent; margin: 0; font: inherit; color: ${effInputBorderColor};
      width: 1.5em; height: 1.5em; border: 0.15em solid ${effInputBorderColor}; border-radius: 0.15em;
      transform: translateY(-0.075em); display: grid; place-content: center; cursor: pointer;
    }
    input[type="checkbox"]::before {
      content: ""; width: 0.8em; height: 0.8em; transform: scale(0); transition: 120ms transform ease-in-out;
      box-shadow: inset 1em 1em ${config.successColor}; transform-origin: bottom left;
      clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
    }
    input[type="checkbox"]:checked::before { transform: scale(1); }
    select {
      background-color: ${effInputBgColor};
      color: ${config.textColor};
      background-image: linear-gradient(45deg, transparent 50%, ${effInputBorderColor} 50%), linear-gradient(135deg, ${effInputBorderColor} 50%, transparent 50%);
      background-position: calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px);
      background-size: 5px 5px, 5px 5px; background-repeat: no-repeat;
      -webkit-appearance: none; -moz-appearance: none; appearance: none;
    }
    input[type="radio"] { display: none; }
    input[type="radio"] + label {
      cursor: pointer; padding: 10px 15px; border: 2px solid ${effSecondaryButtonBgColor}; color: ${effSecondaryButtonBgColor};
    }
    input[type="radio"]:checked + label {
      background-color: ${effSecondaryButtonBgColor}; color: ${config.buttonTextColor};
    }
    /* Custom Scrollbar for Dash */
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: ${config.panelColor}; }
    ::-webkit-scrollbar-thumb { background: ${effPrimaryButtonBgColor}; border-radius: 4px; }
  `;

  // === RENDER ===

  // If we are just visiting the root and NOT an overlay, show the LANDING PAGE
  if (overlayType === 'none' && (currentProfile === 'default' || !currentProfile)) {
    return (
      <LandingPageView
        styles={styles}
        dynamicStyles={dynamicStyles}
        config={config}
        profileInput={profileInput}
        setProfileInput={setProfileInput}
        handleSwitchProfile={handleSwitchProfile}
        isStandaloneMode={isStandaloneMode}
        isConnected={isConnected}
        t={t}
      />
    );
  }

  return (
    <>
      <style>{dynamicStyles}</style>
      
      {(overlayType === 'none' || overlayType === 'notifications') && (
        <div style={styles.toastContainer} aria-live="assertive">
            {activeToasts.map(toast => (
            <div key={toast.donationID} style={styles.toast} role="alert">
                <div style={styles.toastName}>{toast.displayName === 'Anonymous' ? t('anonymous') : toast.displayName}</div>
                <div style={styles.toastAmount}>{t('donated')} {currencyPrefix}{convertAmount(toast.amount).toFixed(2)}!</div>
                {toast.message && <div style={styles.toastMessage}>"{toast.message}"</div>}
            </div>
            ))}
        </div>
      )}

      <div style={overlayType === 'sponsors' || overlayType === 'text' || overlayType === 'team-donations' || overlayType === 'team-dashboard' ? {width: '100%'} : styles.container}>
        {overlayType === 'none' && (
          <>
            <HeaderBar
              styles={styles}
              config={config}
              isStandaloneMode={isStandaloneMode}
              isConnected={isConnected}
              lastFetchedAt={lastFetchedAt}
              formatLastFetched={formatLastFetched}
              currentProfile={currentProfile}
              effSecondaryTextColor={effSecondaryTextColor}
              effPrimaryButtonBgColor={effPrimaryButtonBgColor}
              effHighlightColor={effHighlightColor}
              hexToRgba={hexToRgba}
              handleChangeId={handleChangeId}
              dashboardView={dashboardView}
              setDashboardView={setDashboardView}
              t={t}
            />

            {dashboardView === 'team' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                <TeamDashboardView
                  styles={styles}
                  config={config}
                  currencyPrefix={currencyPrefix}
                  convertAmount={convertAmount}
                  teamTotalRaised={teamTotalRaised}
                  teamGoal={teamGoal}
                  teamName={teamName}
                  teamDonations={teamDonations}
                  teamParticipants={teamParticipants}
                  participantId={config.participantId}
                  participantName={participantName}
                  participantDonations={donations}
                  participantTotalRaised={totalRaised}
                  participantGoal={goal}
                  selectedAccountId={selectedAccountId}
                  setSelectedAccountId={setSelectedAccountId}
                  t={t}
                  isOverlay={false}
                  effHeaderColor={effHeaderColor}
                  effSecondaryTextColor={effSecondaryTextColor}
                  effPrimaryButtonBgColor={effPrimaryButtonBgColor}
                  effSecondaryButtonBgColor={effSecondaryButtonBgColor}
                  effDividerColor={effDividerColor}
                  effHighlightColor={effHighlightColor}
                  effDonorNameColor={effDonorNameColor}
                  effProgressBarColor={effProgressBarColor}
                  effProgressBarBgColor={effProgressBarBgColor}
                  effProgressBarTextColor={effProgressBarTextColor}
                  effProgressBarBorderColor={effProgressBarBorderColor}
                  hexToRgba={hexToRgba}
                  lastFetchedAt={lastFetchedAt}
                  onManualSync={handleManualSync}
                />

                {/* Team Dashboard Quick Actions & Overlays */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', textAlign: 'left' as const }}>
                    <QuickActionsCard
                      styles={styles}
                      effSecondaryButtonBgColor={effSecondaryButtonBgColor}
                      config={config}
                      onTestDonation={handleTestDonation}
                      onManualSync={handleManualSync}
                      onClearOverlays={handleClearOverlays}
                      t={t}
                    />
                    <div style={styles.card}>
                        <h4 style={{ margin: '0 0 10px 0', color: effHighlightColor, fontSize: '0.95rem' }}>{t('overlayLinks')}</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: hexToRgba(config.panelColor, 0.6), padding: '8px 12px', border: `1px solid ${hexToRgba(config.panelBorderColor, 0.4)}`, gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: config.textColor }}>
                                    📊 {t('teamHeaderOverlay')}
                                </span>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button type="button" onClick={() => openOverlay('team-header', 'width=850,height=220')} style={{...styles.button, backgroundColor: config.panelColor, border: `1px solid ${effSecondaryButtonBgColor}`, color: config.textColor, margin: 0, fontSize: '0.75rem', padding: '6px 10px' }}>
                                        ↗ {t('openPopup')}
                                    </button>
                                    <button type="button" onClick={() => handleCopyUrl('team-header')} style={{...styles.button, backgroundColor: effPrimaryButtonBgColor, color: config.buttonTextColor, margin: 0, fontSize: '0.75rem', padding: '6px 10px' }}>
                                        📋 {copyFeedback === 'team-header' ? t('copied') : t('copyLink')}
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: hexToRgba(config.panelColor, 0.6), padding: '8px 12px', border: `1px solid ${hexToRgba(config.panelBorderColor, 0.4)}`, gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: config.textColor }}>
                                    👥 {t('teamDonationsOverlay')}
                                </span>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button type="button" onClick={() => openOverlay('team-donations', 'width=500,height=750')} style={{...styles.button, backgroundColor: config.panelColor, border: `1px solid ${effSecondaryButtonBgColor}`, color: config.textColor, margin: 0, fontSize: '0.75rem', padding: '6px 10px' }}>
                                        ↗ {t('openPopup')}
                                    </button>
                                    <button type="button" onClick={() => handleCopyUrl('team-donations')} style={{...styles.button, backgroundColor: effPrimaryButtonBgColor, color: config.buttonTextColor, margin: 0, fontSize: '0.75rem', padding: '6px 10px' }}>
                                        📋 {copyFeedback === 'team-donations' ? t('copied') : t('copyLink')}
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: hexToRgba(config.panelColor, 0.6), padding: '8px 12px', border: `1px solid ${hexToRgba(config.panelBorderColor, 0.4)}`, gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: config.textColor }}>
                                    🖥️ {t('teamDashboardOverlay')}
                                </span>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button type="button" onClick={() => openOverlay('team-dashboard', 'width=1280,height=850')} style={{...styles.button, backgroundColor: config.panelColor, border: `1px solid ${effSecondaryButtonBgColor}`, color: config.textColor, margin: 0, fontSize: '0.75rem', padding: '6px 10px' }}>
                                        ↗ {t('openPopup')}
                                    </button>
                                    <button type="button" onClick={() => handleCopyUrl('team-dashboard')} style={{...styles.button, backgroundColor: effPrimaryButtonBgColor, color: config.buttonTextColor, margin: 0, fontSize: '0.75rem', padding: '6px 10px' }}>
                                        📋 {copyFeedback === 'team-dashboard' ? t('copied') : t('copyLink')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            ) : (
              <>
            {/* HERO STATS SECTION */}
            <HeroStatsView
              styles={styles}
              totalRaised={totalRaised}
              goal={goal}
              progressPercentage={progressPercentage}
              timeDisplay={timeDisplay}
              currencyPrefix={currencyPrefix}
              convertAmount={convertAmount}
              t={t}
            />

            {/* MAIN DASHBOARD GRID */}
            <div style={styles.dashboardGrid}>
                {/* COLUMN 1: LIVE FEED */}
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                    <DonationsFeedCard
                      styles={styles}
                      sortedDonations={sortedDonations}
                      currencyPrefix={currencyPrefix}
                      convertAmount={convertAmount}
                      effHighlightColor={effHighlightColor}
                      effDividerColor={effDividerColor}
                      config={config}
                      t={t}
                    />
                </div>

                {/* COLUMN 2: CONTROLS & SETTINGS */}
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                     <QuickActionsCard
                       styles={styles}
                       effSecondaryButtonBgColor={effSecondaryButtonBgColor}
                       config={config}
                       onTestDonation={handleTestDonation}
                       onManualSync={handleManualSync}
                       onClearOverlays={handleClearOverlays}
                       t={t}
                     />
                     <SecondaryStatsCard
                       styles={styles}
                       effSecondaryTextColor={effSecondaryTextColor}
                       teamTotalRaised={teamTotalRaised}
                       sortedDonations={sortedDonations}
                       currencyPrefix={currencyPrefix}
                       convertAmount={convertAmount}
                       t={t}
                     />
                     <QrQuickCard
                       styles={styles}
                       config={config}
                       effHighlightColor={effHighlightColor}
                       effHeaderColor={effHeaderColor}
                       effSecondaryTextColor={effSecondaryTextColor}
                       effDividerColor={effDividerColor}
                       effPrimaryButtonBgColor={effPrimaryButtonBgColor}
                       effSecondaryButtonBgColor={effSecondaryButtonBgColor}
                       effectiveQrUrl={effectiveQrUrl}
                       activeParticipantId={activeParticipantId}
                       copyFeedback={copyFeedback}
                       hexToRgba={hexToRgba}
                       onCopyQrLink={handleCopyQrLink}
                       openOverlay={openOverlay}
                       t={t}
                     />
                     <div style={styles.card}>
                         <OverlayLinksSection
                           styles={styles}
                           config={config}
                           effPrimaryButtonBgColor={effPrimaryButtonBgColor}
                           effSecondaryButtonBgColor={effSecondaryButtonBgColor}
                           hexToRgba={hexToRgba}
                           copyFeedback={copyFeedback}
                           openOverlay={openOverlay}
                           handleCopyUrl={handleCopyUrl}
                           t={t}
                         />
                     </div>
                     <div style={styles.card}>
                          <button
                             type="button"
                             onClick={() => setIsSettingsCollapsed(prev => !prev)}
                             style={{...styles.button, backgroundColor: 'transparent', border: `1px solid ${effPrimaryButtonBgColor}`, color: effPrimaryButtonBgColor, width: '100%', margin: 0, padding: '10px', fontSize: '1rem' }}
                             >
                             {isSettingsCollapsed ? t('showSettings') : t('hideSettings')}
                         </button>
                         {!isSettingsCollapsed && (
                         <form onSubmit={handleIdSubmit} style={{...styles.form, marginTop: '1rem', gap: 0, border: 'none', padding: 0}}>
                             <CoreSetupSection
                               styles={styles}
                               config={config}
                               currentProfile={currentProfile}
                               participantIdInput={participantIdInput}
                               setParticipantIdInput={setParticipantIdInput}
                               teamIdInput={teamIdInput}
                               setTeamIdInput={setTeamIdInput}
                               updateConfig={updateConfig}
                               fetchClientSideData={fetchClientSideData}
                               lastFetchTimeRef={lastFetchTimeRef}
                               conversionRate={conversionRate}
                               effectiveRate={effectiveRate}
                               websiteTotalInput={websiteTotalInput}
                               setWebsiteTotalInput={setWebsiteTotalInput}
                               fetchConversionRate={fetchConversionRate}
                               totalRaised={totalRaised}
                               goal={goal}
                               effSecondaryTextColor={effSecondaryTextColor}
                               effSecondaryButtonBgColor={effSecondaryButtonBgColor}
                               hexToRgba={hexToRgba}
                               t={t}
                             />
                             <QrCodeSection
                               styles={styles}
                               config={config}
                               updateConfig={updateConfig}
                               effectiveQrUrl={effectiveQrUrl}
                               activeParticipantId={activeParticipantId}
                               copyFeedback={copyFeedback}
                               effHighlightColor={effHighlightColor}
                               effHeaderColor={effHeaderColor}
                               effSecondaryTextColor={effSecondaryTextColor}
                               effPrimaryButtonBgColor={effPrimaryButtonBgColor}
                               effSecondaryButtonBgColor={effSecondaryButtonBgColor}
                               hexToRgba={hexToRgba}
                               onCopyQrLink={handleCopyQrLink}
                               openOverlay={openOverlay}
                               t={t}
                             />
                             <TwitchSection
                               styles={styles}
                               config={config}
                               updateConfig={updateConfig}
                               commandTrigger={commandTrigger}
                               setCommandTrigger={setCommandTrigger}
                               commandResponse={commandResponse}
                               setCommandResponse={setCommandResponse}
                               handleAddCommand={handleAddCommand}
                               handleDeleteCommand={handleDeleteCommand}
                               handleGetTwitchToken={handleGetTwitchToken}
                               effHighlightColor={effHighlightColor}
                               effHeaderColor={effHeaderColor}
                               effSecondaryTextColor={effSecondaryTextColor}
                               effPrimaryButtonBgColor={effPrimaryButtonBgColor}
                               effDividerColor={effDividerColor}
                               t={t}
                             />
                             <EventTimingSection
                               styles={styles}
                               config={config}
                               updateConfig={updateConfig}
                               t={t}
                             />
                             <ScheduleSection
                               styles={styles}
                               config={config}
                               schedTime={schedTime}
                               setSchedTime={setSchedTime}
                               schedDesc={schedDesc}
                               setSchedDesc={setSchedDesc}
                               handleAddScheduleItem={handleAddScheduleItem}
                               handleToggleItem={handleToggleItem}
                               handleDeleteItem={handleDeleteItem}
                               effPrimaryButtonBgColor={effPrimaryButtonBgColor}
                               t={t}
                             />
                             <ThemingSection
                               styles={styles}
                               config={config}
                               updateConfig={updateConfig}
                               selectedPreset={selectedPreset}
                               handlePresetChange={handlePresetChange}
                               savedThemes={savedThemes}
                               handleUpdateThemeProfile={handleUpdateThemeProfile}
                               handleExportThemeProfile={handleExportThemeProfile}
                               handleDeleteThemeProfile={handleDeleteThemeProfile}
                               newThemeNameInput={newThemeNameInput}
                               setNewThemeNameInput={setNewThemeNameInput}
                               handleSaveThemeProfile={handleSaveThemeProfile}
                               handleImportThemeProfile={handleImportThemeProfile}
                               handleExportAllThemes={handleExportAllThemes}
                               handleLoadSavedTheme={handleLoadSavedTheme}
                               themeActionFeedback={themeActionFeedback}
                               handleResetProgressBarColors={handleResetProgressBarColors}
                               handleResetAdvancedColors={handleResetAdvancedColors}
                               showAdvancedColors={showAdvancedColors}
                               setShowAdvancedColors={setShowAdvancedColors}
                               effProgressBarColor={effProgressBarColor}
                               effProgressBarBgColor={effProgressBarBgColor}
                               effProgressBarTextColor={effProgressBarTextColor}
                               effProgressBarBorderColor={effProgressBarBorderColor}
                               effMilestoneBarColor={effMilestoneBarColor}
                               effMilestoneBarBgColor={effMilestoneBarBgColor}
                               effMilestoneBarTextColor={effMilestoneBarTextColor}
                               effMilestoneBarBorderColor={effMilestoneBarBorderColor}
                               effHeaderColor={effHeaderColor}
                               effSecondaryTextColor={effSecondaryTextColor}
                               effPrimaryButtonBgColor={effPrimaryButtonBgColor}
                               effSecondaryButtonBgColor={effSecondaryButtonBgColor}
                               effDividerColor={effDividerColor}
                               effHighlightColor={effHighlightColor}
                               effDonorNameColor={effDonorNameColor}
                               effToastBgColor={effToastBgColor}
                               effToastBorderColor={effToastBorderColor}
                               effToastNameColor={effToastNameColor}
                               effToastAmountColor={effToastAmountColor}
                               hexToRgba={hexToRgba}
                               t={t}
                             />
                             <SoundSettingsSection
                               styles={styles}
                               config={config}
                               updateConfig={updateConfig}
                               playSpecificSound={playSpecificSound}
                               handleDeleteSound={handleDeleteSound}
                               handleAddSound={handleAddSound}
                               selectedSoundFile={selectedSoundFile}
                               setSelectedSoundFile={setSelectedSoundFile}
                               availableSoundFiles={availableSoundFiles}
                               handlePreviewLocalSound={handlePreviewLocalSound}
                               handleAddSoundFromList={handleAddSoundFromList}
                               formError={formError}
                               effPrimaryButtonBgColor={effPrimaryButtonBgColor}
                               effDividerColor={effDividerColor}
                               t={t}
                             />
                             <SponsorsSection
                               styles={styles}
                               config={config}
                               updateConfig={updateConfig}
                               sponsorNameInput={sponsorNameInput}
                               setSponsorNameInput={setSponsorNameInput}
                               sponsorUrlInput={sponsorUrlInput}
                               setSponsorUrlInput={setSponsorUrlInput}
                               handleAddSponsorFromUrl={handleAddSponsorFromUrl}
                               handleUploadSponsorFile={handleUploadSponsorFile}
                               availableSponsorFiles={availableSponsorFiles}
                               selectedSponsorFile={selectedSponsorFile}
                               setSelectedSponsorFile={setSelectedSponsorFile}
                               handleAddSponsorFromList={handleAddSponsorFromList}
                               handleDeleteSponsor={handleDeleteSponsor}
                               t={t}
                             />
                             <TextOverlaySection
                               styles={styles}
                               config={config}
                               updateConfig={updateConfig}
                               handleUploadTextFile={handleUploadTextFile}
                               availableTextFiles={availableTextFiles}
                               t={t}
                             />
                             <ProfileBackupSection
                               styles={styles}
                               config={config}
                               handleExportConfig={handleExportConfig}
                               handleImportConfig={handleImportConfig}
                               importSuccessMsg={importSuccessMsg}
                               effPrimaryButtonBgColor={effPrimaryButtonBgColor}
                               effSecondaryButtonBgColor={effSecondaryButtonBgColor}
                               t={t}
                             />
                             <button type="submit" style={{...styles.button, backgroundColor: config.successColor, color: config.buttonTextColor, marginTop: '2rem', width: '100%' }}>
                               {isSaving ? t('saving') : t('saveSettings')}
                             </button>
                         </form>
                         )}
                     </div>
                </div>
            </div>
              </>
            )}
          </>
        )}
        
        {(overlayType !== 'none') && (
          <>
            {overlayType === 'progress' && (
                <ProgressBar
                    totalRaised={totalRaised}
                    goal={goal}
                    timeDisplay={timeDisplay}
                    progressPercentage={progressPercentage}
                    currencyPrefix={currencyPrefix}
                    convertAmount={convertAmount}
                    styles={styles}
                    config={config}
                    t={t}
                />
            )}
            
            {overlayType === 'milestone' && (
              <NextMilestoneOverlay
                milestones={milestones}
                totalRaised={totalRaised}
                currencyPrefix={currencyPrefix}
                convertAmount={convertAmount}
                styles={styles}
                config={config}
                successColor={config.successColor}
                effProgressBarColor={effMilestoneBarColor}
                effProgressBarBgColor={effMilestoneBarBgColor}
                effProgressBarTextColor={effMilestoneBarTextColor}
                effProgressBarBorderColor={effMilestoneBarBorderColor}
                effSecondaryTextColor={effSecondaryTextColor}
                hexToRgba={hexToRgba}
                t={t}
              />
            )}
            {(overlayType === 'team' || overlayType === 'team-header') && (
              <TeamHeaderOverlay
                styles={styles}
                currencyPrefix={currencyPrefix}
                convertAmount={convertAmount}
                teamTotalRaised={teamTotalRaised}
                teamGoal={teamGoal}
                teamName={teamName}
                teamDonationsCount={teamDonations.length}
                config={config}
                effHeaderColor={effHeaderColor}
                effSecondaryTextColor={effSecondaryTextColor}
                effProgressBarColor={effProgressBarColor}
                effProgressBarBgColor={effProgressBarBgColor}
                effProgressBarTextColor={effProgressBarTextColor}
                effProgressBarBorderColor={effProgressBarBorderColor}
                hexToRgba={hexToRgba}
                t={t}
              />
            )}
            {overlayType === 'team-donations' && (
              <TeamDonationsOverlay
                styles={styles}
                currencyPrefix={currencyPrefix}
                convertAmount={convertAmount}
                teamTotalRaised={teamTotalRaised}
                teamName={teamName}
                teamDonations={teamDonations}
                config={config}
                effHeaderColor={effHeaderColor}
                effSecondaryTextColor={effSecondaryTextColor}
                effDividerColor={effDividerColor}
                effHighlightColor={effHighlightColor}
                effDonorNameColor={effDonorNameColor}
                hexToRgba={hexToRgba}
                t={t}
              />
            )}
            {overlayType === 'team-dashboard' && (
              <TeamDashboardView
                styles={styles}
                config={config}
                currencyPrefix={currencyPrefix}
                convertAmount={convertAmount}
                teamTotalRaised={teamTotalRaised}
                teamGoal={teamGoal}
                teamName={teamName}
                teamDonations={teamDonations}
                teamParticipants={teamParticipants}
                participantId={config.participantId}
                participantName={participantName}
                participantDonations={donations}
                participantTotalRaised={totalRaised}
                participantGoal={goal}
                selectedAccountId={selectedAccountId}
                setSelectedAccountId={setSelectedAccountId}
                t={t}
                isOverlay={true}
                effHeaderColor={effHeaderColor}
                effSecondaryTextColor={effSecondaryTextColor}
                effPrimaryButtonBgColor={effPrimaryButtonBgColor}
                effSecondaryButtonBgColor={effSecondaryButtonBgColor}
                effDividerColor={effDividerColor}
                effHighlightColor={effHighlightColor}
                effDonorNameColor={effDonorNameColor}
                effProgressBarColor={effProgressBarColor}
                effProgressBarBgColor={effProgressBarBgColor}
                effProgressBarTextColor={effProgressBarTextColor}
                effProgressBarBorderColor={effProgressBarBorderColor}
                hexToRgba={hexToRgba}
                lastFetchedAt={lastFetchedAt}
                onManualSync={handleManualSync}
              />
            )}
            {overlayType === 'celebration' && <CelebrationOverlay playSound={playSpecificSound} accentColor1={config.accentColor1} accentColor2={config.accentColor2} primaryColor={effPrimaryButtonBgColor} secondaryColor={effSecondaryButtonBgColor} successColor={config.successColor} celebrationDuration={config.celebrationDuration} activeCelebrationKey={celebrationKey} />}
            {overlayType === 'schedule' && <ScheduleOverlay items={config.scheduleItems} styles={styles} accentColor1={config.accentColor1} accentColor2={config.accentColor2} timeColor={effHighlightColor} dividerColor={effDividerColor} headerColor={effHeaderColor} textColor={config.textColor} fontFamily={config.fontFamily} t={t} />}
            {overlayType === 'sponsors' && <SponsorOverlay sponsors={config.sponsors} styles={styles} animationDuration={config.sponsorDisplayDuration} t={t} />}
            {overlayType === 'text' && <TextOverlay filename={config.selectedTextFile} customText={config.customTextContent} styles={styles} fontFamily={config.fontFamily} textColor={config.textColor} accentColor1={config.accentColor1} highlightColor={effHighlightColor} alignment={config.textOverlayAlignment} fontSize={config.textOverlayFontSize} t={t} />}
            {overlayType === 'qrcode' && (
              <QRCodeOverlay
                url={effectiveQrUrl}
                title={config.qrTitle || t('qrDefaultTitle')}
                subtitle={config.qrSubtitle || (participantName ? `${participantName} - Extra Life` : (config.qrLinkType === 'page' ? t('qrLinkPage') : t('qrLinkDonation')))}
                fgColor={config.qrFgColor || '#000000'}
                bgColor={config.qrBgColor || '#ffffff'}
                isTransparent={Boolean(config.qrTransparentBg)}
                size={config.qrSize || 240}
                fontFamily={config.fontFamily}
                textColor={config.textColor}
                accentColor1={config.accentColor1}
                panelColor={config.panelColor}
                panelBorderColor={config.panelBorderColor}
                t={t}
              />
            )}
          </>
        )}
      </div>
    </>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
