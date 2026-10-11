import React, { useRef } from 'react';
import { CollapsibleSection, QRCodeSvg } from './overlays.js';
import { COLOR_PRESETS } from './constants.js';
import { downloadQRCodePng, downloadQRCodeSvg } from './qr-code.js';

// ==========================================
// 1. LANDING PAGE VIEW
// ==========================================

export const LandingPageView = ({
  styles,
  dynamicStyles,
  config,
  profileInput,
  setProfileInput,
  handleSwitchProfile,
  isStandaloneMode,
  isConnected,
  t
}) => {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, dynamicStyles), /*#__PURE__*/React.createElement("div", {
    style: {
      ...styles.container,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '20px',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...styles.statHero,
      maxWidth: '600px',
      width: '100%',
      padding: '40px'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      ...styles.header,
      marginBottom: '20px'
    }
  }, t('appTitle')), /*#__PURE__*/React.createElement("p", {
    style: {
      color: config.textColor,
      marginBottom: '30px',
      lineHeight: '1.5'
    }
  }, t('welcomeSubtitle')), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSwitchProfile,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: profileInput,
    onChange: e => setProfileInput(e.target.value),
    placeholder: t('enterId'),
    style: {
      ...styles.input,
      fontSize: '1.2rem',
      padding: '15px',
      textAlign: 'center'
    },
    autoFocus: true
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.8rem',
      color: config.textColor,
      opacity: 0.6
    }
  }, t('idHint')), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    style: {
      ...styles.button,
      backgroundColor: config.successColor,
      color: config.buttonTextColor,
      fontSize: '1.2rem',
      padding: '15px'
    }
  }, t('startTracking'))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '30px',
      fontSize: '0.8rem',
      color: config.textColor,
      opacity: 0.7
    }
  }, isStandaloneMode ? `● ${t('standaloneMode')}` : isConnected ? `● ${t('connectedServer')}` : `○ ${t('connecting')}`))));
};

// ==========================================
// 2. DASHBOARD HEADER & PROFILE SWITCHER
// ==========================================

export const HeaderBar = ({
  styles,
  config,
  isStandaloneMode,
  isConnected,
  lastFetchedAt,
  formatLastFetched,
  currentProfile,
  effSecondaryTextColor,
  effPrimaryButtonBgColor,
  effHighlightColor,
  hexToRgba,
  handleChangeId,
  dashboardView,
  setDashboardView,
  t
}) => {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: styles.header
  }, /*#__PURE__*/React.createElement("span", null, t('appTitle')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '15px',
      marginTop: '6px',
      flexWrap: 'wrap'
    }
  }, isStandaloneMode ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.5em',
      color: config.successColor,
      opacity: 0.9
    }
  }, "● ", t('standaloneMode')) : !isConnected ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.5em',
      color: config.errorColor
    }
  }, t('disconnected')) : /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.5em',
      color: config.successColor,
      opacity: 0.7
    }
  }, "● ", t('connected')), lastFetchedAt && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.45em',
      color: config.textColor,
      opacity: 0.75,
      fontFamily: 'monospace'
    }
  }, "⏱ ", t('lastFetched'), ": ", formatLastFetched(lastFetchedAt)))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...styles.card,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '1rem'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: effSecondaryTextColor
    }
  }, t('profile'), ": ", /*#__PURE__*/React.createElement("strong", null, currentProfile)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: handleChangeId,
    style: {
      ...styles.button,
      margin: 0,
      padding: '5px 15px',
      fontSize: '0.8rem',
      backgroundColor: config.panelColor,
      border: `1px solid ${config.errorColor}`,
      color: config.errorColor
    }
  }, t('changeId'))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '10px',
      marginBottom: '1.2rem',
      width: '100%',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    id: "tab-participant-dashboard",
    onClick: () => setDashboardView('participant'),
    style: {
      ...styles.button,
      flex: 1,
      minWidth: '150px',
      margin: 0,
      padding: '12px 15px',
      fontSize: '0.95rem',
      fontWeight: 'bold',
      backgroundColor: dashboardView === 'participant' ? effPrimaryButtonBgColor : config.panelColor,
      color: dashboardView === 'participant' ? config.buttonTextColor : config.textColor,
      border: `2px solid ${dashboardView === 'participant' ? effHighlightColor : hexToRgba(config.panelBorderColor, 0.4)}`,
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }
  }, "👤 ", t('participantDashboard')), /*#__PURE__*/React.createElement("button", {
    type: "button",
    id: "tab-team-dashboard",
    onClick: () => setDashboardView('team'),
    style: {
      ...styles.button,
      flex: 1,
      minWidth: '150px',
      margin: 0,
      padding: '12px 15px',
      fontSize: '0.95rem',
      fontWeight: 'bold',
      backgroundColor: dashboardView === 'team' ? effPrimaryButtonBgColor : config.panelColor,
      color: dashboardView === 'team' ? config.buttonTextColor : config.textColor,
      border: `2px solid ${dashboardView === 'team' ? effHighlightColor : hexToRgba(config.panelBorderColor, 0.4)}`,
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }
  }, "👥 ", t('teamDashboard')), /*#__PURE__*/React.createElement("button", {
    type: "button",
    id: "tab-settings",
    onClick: () => setDashboardView('settings'),
    style: {
      ...styles.button,
      flex: 1,
      minWidth: '150px',
      margin: 0,
      padding: '12px 15px',
      fontSize: '0.95rem',
      fontWeight: 'bold',
      backgroundColor: dashboardView === 'settings' ? effPrimaryButtonBgColor : config.panelColor,
      color: dashboardView === 'settings' ? config.buttonTextColor : config.textColor,
      border: `2px solid ${dashboardView === 'settings' ? effHighlightColor : hexToRgba(config.panelBorderColor, 0.4)}`,
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }
  }, "⚙️ ", t('settingsTab'))));
};

// ==========================================
// 3. HERO STATS VIEW
// ==========================================

export const HeroStatsView = ({
  styles,
  totalRaised,
  goal,
  progressPercentage,
  timeDisplay,
  currencyPrefix,
  convertAmount,
  t
}) => {
  return /*#__PURE__*/React.createElement("div", {
    style: styles.statHero
  }, /*#__PURE__*/React.createElement("h2", {
    style: styles.bigStat
  }, currencyPrefix, convertAmount(totalRaised).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })), /*#__PURE__*/React.createElement("p", {
    style: styles.secondaryStat
  }, t('goal'), ": ", currencyPrefix, convertAmount(goal).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }), " (", progressPercentage.toFixed(1), "%)"), timeDisplay && /*#__PURE__*/React.createElement("div", {
    style: {
      ...styles.timerText,
      fontSize: '0.9rem',
      opacity: 0.8
    }
  }, timeDisplay));
};

// ==========================================
// 4. DONATIONS FEED CARD
// ==========================================

export const DonationsFeedCard = ({
  styles,
  sortedDonations,
  currencyPrefix,
  convertAmount,
  effHighlightColor,
  effDividerColor,
  config,
  t
}) => {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...styles.card,
      border: `2px solid ${effHighlightColor}`
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '0 0 10px 0',
      color: effHighlightColor,
      borderBottom: `1px dashed ${effDividerColor}`,
      paddingBottom: '10px'
    }
  }, t('recentDonations')), /*#__PURE__*/React.createElement("div", {
    style: styles.feedContainer
  }, sortedDonations.length === 0 && /*#__PURE__*/React.createElement("p", {
    style: {
      color: config.textColor,
      opacity: 0.7
    }
  }, t('noDonations')), sortedDonations.map(d => /*#__PURE__*/React.createElement("div", {
    key: d.donationID,
    style: styles.donationItem
  }, /*#__PURE__*/React.createElement("div", {
    style: styles.donationHeader
  }, /*#__PURE__*/React.createElement("span", {
    style: styles.donationName
  }, d.displayName === 'Anonymous' ? t('anonymous') : d.displayName), /*#__PURE__*/React.createElement("span", {
    style: styles.donationAmount
  }, currencyPrefix, convertAmount(d.amount).toFixed(2))), d.message && /*#__PURE__*/React.createElement("div", {
    style: styles.donationMessage
  }, d.message), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.8rem',
      opacity: 0.5,
      marginTop: '5px',
      fontFamily: 'monospace',
      color: config.textColor
    }
  }, new Date(d.createdDateUTC).toLocaleString())))));
};

// ==========================================
// 5. QUICK ACTIONS CARD
// ==========================================

export const QuickActionsCard = ({
  styles,
  effSecondaryButtonBgColor,
  config,
  onTestDonation,
  onManualSync,
  onClearOverlays,
  t
}) => {
  return /*#__PURE__*/React.createElement("div", {
    style: styles.card
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '1rem',
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onTestDonation,
    style: {
      ...styles.button,
      backgroundColor: effSecondaryButtonBgColor,
      color: config.buttonTextColor,
      margin: 0,
      flex: 1,
      fontSize: '0.9rem',
      padding: '10px'
    }
  }, t('testDonation')), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onManualSync,
    style: {
      ...styles.button,
      backgroundColor: config.successColor,
      color: config.buttonTextColor,
      flex: 1,
      margin: 0,
      fontSize: '0.9rem',
      padding: '10px'
    }
  }, t('resyncData'))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClearOverlays,
    style: {
      ...styles.button,
      backgroundColor: config.errorColor,
      color: config.buttonTextColor,
      margin: 0,
      width: '100%',
      fontSize: '0.9rem',
      padding: '10px'
    }
  }, t('clearStop')));
};

// ==========================================
// 6. SECONDARY STATS CARD
// ==========================================

export const SecondaryStatsCard = ({
  styles,
  effSecondaryTextColor,
  teamTotalRaised,
  sortedDonations,
  currencyPrefix,
  convertAmount,
  t
}) => {
  return /*#__PURE__*/React.createElement("div", {
    style: styles.card
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: effSecondaryTextColor
    }
  }, t('teamRaised'), ": ", currencyPrefix, convertAmount(teamTotalRaised).toFixed(2)), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: effSecondaryTextColor,
      fontSize: '0.85rem',
      marginTop: '5px'
    }
  }, t('lastDonator'), ": ", sortedDonations.length > 0 ? sortedDonations[0].displayName === 'Anonymous' ? t('anonymous') : sortedDonations[0].displayName : t('none')));
};

// ==========================================
// 7. QR QUICK CARD
// ==========================================

export const QrQuickCard = ({
  styles,
  config,
  effHighlightColor,
  effHeaderColor,
  effSecondaryTextColor,
  effDividerColor,
  effPrimaryButtonBgColor,
  effSecondaryButtonBgColor,
  effectiveQrUrl,
  activeParticipantId,
  copyFeedback,
  hexToRgba,
  onCopyQrLink,
  openOverlay,
  t
}) => {
  if (config.qrShowCardInDashboard === false) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...styles.card,
      border: `2px solid ${effHighlightColor}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: `1px dashed ${effDividerColor}`,
      paddingBottom: '8px'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      color: effHeaderColor,
      fontSize: '0.95rem',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }
  }, "📱 ", t('qrCardTitle')), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.7rem',
      color: effHighlightColor,
      backgroundColor: hexToRgba(effHighlightColor, 0.15),
      padding: '2px 8px',
      borderRadius: '10px'
    }
  }, config.qrLinkType === 'page' ? t('qrLinkPage') : t('qrLinkDonation'))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '15px',
      alignItems: 'center',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginTop: '6px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px',
      backgroundColor: config.qrTransparentBg ? hexToRgba(config.panelColor, 0.8) : config.qrBgColor || '#ffffff',
      border: `1px solid ${hexToRgba(config.panelBorderColor, 0.5)}`,
      borderRadius: '8px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(QRCodeSvg, {
    url: effectiveQrUrl,
    size: 140,
    fgColor: config.qrFgColor || '#000000',
    bgColor: config.qrTransparentBg ? 'transparent' : config.qrBgColor || '#ffffff',
    errorCorrectionLevel: config.qrErrorCorrection || 'M',
    title: t('qrCardTitle')
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      flex: '1 1 200px'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: '0.78rem',
      color: effSecondaryTextColor,
      lineHeight: 1.4
    }
  }, t('qrScanInstructions')), /*#__PURE__*/React.createElement("div", {
    style: {
      backgroundColor: hexToRgba(config.panelBorderColor, 0.15),
      padding: '6px 8px',
      borderRadius: '4px',
      fontSize: '0.7rem',
      fontFamily: 'monospace',
      color: config.textColor,
      wordBreak: 'break-all',
      maxHeight: '44px',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, effectiveQrUrl), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '6px',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onCopyQrLink,
    style: {
      ...styles.button,
      margin: 0,
      padding: '6px 10px',
      fontSize: '0.75rem',
      backgroundColor: effPrimaryButtonBgColor,
      color: config.buttonTextColor,
      flex: 1
    }
  }, "📋 ", copyFeedback === 'qr-link' ? t('copied') : t('copyLink')), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => openOverlay('qrcode', 'width=450,height=520'),
    style: {
      ...styles.button,
      margin: 0,
      padding: '6px 10px',
      fontSize: '0.75rem',
      backgroundColor: config.panelColor,
      border: `1px solid ${effSecondaryButtonBgColor}`,
      color: config.textColor,
      flex: 1
    }
  }, "↗ ", t('openPopup')), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => downloadQRCodePng(effectiveQrUrl, `extralife-qr-${activeParticipantId}.png`, 1024, config.qrFgColor, config.qrBgColor, config.qrErrorCorrection),
    style: {
      ...styles.button,
      margin: 0,
      padding: '6px 10px',
      fontSize: '0.75rem',
      backgroundColor: hexToRgba(config.panelBorderColor, 0.2),
      border: `1px solid ${config.panelBorderColor}`,
      color: config.textColor,
      flex: 1
    }
  }, "💾 PNG")))));
};

// ==========================================
// 8. OVERLAY LINKS SECTION
// ==========================================

export const OverlayLinksSection = ({
  styles,
  config,
  effPrimaryButtonBgColor,
  effSecondaryButtonBgColor,
  hexToRgba,
  copyFeedback,
  openOverlay,
  handleCopyUrl,
  t
}) => {
  const overlaysList = [{
    title: t('progressBar'),
    fn: () => openOverlay('progress', 'width=800,height=150'),
    type: 'progress'
  }, {
    title: t('notifications'),
    fn: () => openOverlay('notifications', 'width=800,height=600'),
    type: 'notifications'
  }, {
    title: t('nextMilestone'),
    fn: () => openOverlay('milestone', 'width=800,height=180'),
    type: 'milestone'
  }, {
    title: t('teamHeaderOverlay'),
    fn: () => openOverlay('team-header', 'width=850,height=220'),
    type: 'team-header'
  }, {
    title: t('teamDonationsOverlay'),
    fn: () => openOverlay('team-donations', 'width=500,height=750'),
    type: 'team-donations'
  }, {
    title: t('teamDashboardOverlay'),
    fn: () => openOverlay('team-dashboard', 'width=1280,height=850'),
    type: 'team-dashboard'
  }, {
    title: t('qrCodeOverlayLink'),
    fn: () => openOverlay('qrcode', 'width=450,height=520'),
    type: 'qrcode'
  }, {
    title: t('celebration'),
    fn: () => openOverlay('celebration', 'width=1920,height=1080'),
    type: 'celebration'
  }, {
    title: t('schedule'),
    fn: () => openOverlay('schedule', 'width=600,height=400'),
    type: 'schedule'
  }, {
    title: t('sponsorsOverlay'),
    fn: () => openOverlay('sponsors', 'width=300,height=150'),
    type: 'sponsors'
  }, {
    title: t('textOverlayLink'),
    fn: () => openOverlay('text', 'width=800,height=600'),
    type: 'text'
  }];
  return /*#__PURE__*/React.createElement(CollapsibleSection, {
    title: t('overlayLinks'),
    isInitiallyCollapsed: true,
    styles: styles
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '0.5rem',
      width: '100%'
    }
  }, overlaysList.map(overlay => /*#__PURE__*/React.createElement("div", {
    key: overlay.title,
    style: {
      ...styles.card,
      padding: '10px',
      gap: '5px',
      backgroundColor: hexToRgba(config.panelColor, 0.5)
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: '0',
      color: config.textColor,
      textAlign: 'left',
      fontSize: '0.8rem'
    }
  }, overlay.title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '5px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: overlay.fn,
    style: {
      ...styles.button,
      backgroundColor: config.panelColor,
      border: `1px solid ${effSecondaryButtonBgColor}`,
      color: config.textColor,
      marginTop: 0,
      flex: 1,
      fontSize: '0.7rem',
      padding: '5px'
    }
  }, t('openPopup')), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => handleCopyUrl(overlay.type),
    style: {
      ...styles.button,
      backgroundColor: effPrimaryButtonBgColor,
      color: config.buttonTextColor,
      marginTop: 0,
      flex: 1,
      fontSize: '0.7rem',
      padding: '5px'
    }
  }, copyFeedback === overlay.type ? t('copied') : t('copyLink')))))));
};

// ==========================================
// 9. CORE SETUP SECTION
// ==========================================

export const CoreSetupSection = ({
  styles,
  config,
  currentProfile,
  participantIdInput,
  setParticipantIdInput,
  teamIdInput,
  setTeamIdInput,
  updateConfig,
  fetchClientSideData,
  lastFetchTimeRef,
  conversionRate,
  effectiveRate,
  websiteTotalInput,
  setWebsiteTotalInput,
  fetchConversionRate,
  totalRaised,
  goal,
  effSecondaryTextColor,
  effSecondaryButtonBgColor,
  hexToRgba,
  t
}) => {
  const [internalWebsiteTotal, setInternalWebsiteTotal] = React.useState('');
  const currentWebsiteTotal = websiteTotalInput !== undefined ? websiteTotalInput : internalWebsiteTotal;
  const updateWebsiteTotal = setWebsiteTotalInput || setInternalWebsiteTotal;
  const handleResetRate = () => {
    updateWebsiteTotal('');
    updateConfig({
      customExchangeRate: 0
    });
    fetchConversionRate?.(true);
  };
  return /*#__PURE__*/React.createElement(CollapsibleSection, {
    title: t('coreSetup'),
    isInitiallyCollapsed: true,
    styles: styles
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('language')), /*#__PURE__*/React.createElement("select", {
    value: config.language,
    onChange: e => updateConfig({
      language: e.target.value
    }),
    style: styles.input
  }, /*#__PURE__*/React.createElement("option", {
    value: "en"
  }, "English"), /*#__PURE__*/React.createElement("option", {
    value: "fr"
  }, "Français")), /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('participantId')), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: participantIdInput,
    onChange: e => setParticipantIdInput(e.target.value),
    style: {
      ...styles.input,
      ...(currentProfile !== 'default' && {
        opacity: 0.6,
        cursor: 'not-allowed'
      })
    },
    placeholder: t('enterId'),
    readOnly: currentProfile !== 'default',
    title: currentProfile !== 'default' ? t('managedByProfile') : ''
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: config.useParticipantTeamId,
    onChange: e => {
      const checked = e.target.checked;
      updateConfig({
        useParticipantTeamId: checked
      });
      if (checked) {
        if (lastFetchTimeRef) {
          lastFetchTimeRef.current = 0;
        }
        setTimeout(fetchClientSideData, 50);
      }
    }
  }), /*#__PURE__*/React.createElement("label", {
    style: {
      ...styles.label,
      opacity: 1,
      cursor: 'pointer',
      flexGrow: 1
    }
  }, t('autoDetect'))), /*#__PURE__*/React.createElement("label", {
    style: config.useParticipantTeamId ? {
      ...styles.label,
      opacity: 0.75
    } : styles.label
  }, t('teamId')), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: config.useParticipantTeamId ? config.teamId || teamIdInput : teamIdInput,
    onChange: e => {
      setTeamIdInput(e.target.value);
      updateConfig({
        teamId: e.target.value
      });
    },
    placeholder: config.useParticipantTeamId ? config.teamId || t('autoDetect') : t('teamId'),
    style: {
      ...styles.input,
      ...(config.useParticipantTeamId && {
        backgroundColor: hexToRgba(config.panelColor, 0.5),
        cursor: 'not-allowed'
      })
    },
    disabled: config.useParticipantTeamId
  }), /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('refreshSeconds')), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: config.refreshInterval === 0 ? '' : config.refreshInterval,
    onChange: e => {
      const val = e.target.value;
      const parsed = val === '' ? 0 : parseInt(val, 10);
      updateConfig({
        refreshInterval: isNaN(parsed) ? 60 : parsed
      });
    },
    onBlur: () => {
      if (!config.refreshInterval || config.refreshInterval < 60) {
        updateConfig({
          refreshInterval: 60
        });
      }
    },
    style: styles.input,
    min: 60,
    placeholder: "60"
  }), /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('currency')), /*#__PURE__*/React.createElement("select", {
    value: config.currency,
    onChange: e => updateConfig({
      currency: e.target.value
    }),
    style: styles.input
  }, /*#__PURE__*/React.createElement("option", {
    value: "USD"
  }, "USD ($)"), /*#__PURE__*/React.createElement("option", {
    value: "CAD"
  }, "CAD (C$)")), config.currency === 'CAD' && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '8px',
      marginBottom: '14px',
      padding: '10px',
      backgroundColor: hexToRgba(config.panelBorderColor, 0.1),
      border: `1px solid ${hexToRgba(config.panelBorderColor, 0.3)}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px',
      flexWrap: 'wrap',
      gap: '6px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.85rem',
      color: effSecondaryTextColor
    }
  }, t('exchangeRate'), ": ", /*#__PURE__*/React.createElement("strong", null, "1 USD = ", effectiveRate.toFixed(4), " CAD"), config.customExchangeRate > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: '6px',
      fontSize: '0.72rem',
      opacity: 0.8,
      color: config.textColor
    }
  }, "(", t('customExchangeRate'), ")")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '6px'
    }
  }, Boolean(config.customExchangeRate || currentWebsiteTotal) && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: handleResetRate,
    style: {
      ...styles.button,
      margin: 0,
      padding: '3px 8px',
      fontSize: '0.75rem',
      backgroundColor: hexToRgba(config.panelBorderColor, 0.2),
      border: `1px solid ${config.panelBorderColor}`,
      color: config.textColor
    },
    title: t('clearRateTitle')
  }, "✕ ", t('clearExchangeRate')), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: handleResetRate,
    style: {
      ...styles.button,
      margin: 0,
      padding: '3px 8px',
      fontSize: '0.75rem',
      backgroundColor: config.panelColor,
      border: `1px solid ${effSecondaryButtonBgColor}`,
      color: effSecondaryButtonBgColor
    },
    title: t('refreshRateTitle')
  }, "↻ ", t('refreshRate'), " (", t('live'), ")"))), /*#__PURE__*/React.createElement("label", {
    style: {
      ...styles.label,
      fontSize: '0.75rem',
      margin: '6px 0 3px 0'
    }
  }, t('customExchangeRate'), " (", t('customRateHelp'), ")"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.0001",
    value: config.customExchangeRate === 0 || !config.customExchangeRate ? '' : config.customExchangeRate,
    placeholder: t('liveRatePlaceholder', {
      rate: conversionRate > 1 ? conversionRate.toFixed(4) : '1.36'
    }),
    onChange: e => {
      const val = e.target.value;
      updateWebsiteTotal('');
      updateConfig({
        customExchangeRate: val === '' ? 0 : parseFloat(val)
      });
    },
    style: {
      ...styles.input,
      marginBottom: '10px',
      fontSize: '0.85rem',
      padding: '6px'
    }
  }), /*#__PURE__*/React.createElement("label", {
    style: {
      ...styles.label,
      fontSize: '0.75rem',
      margin: '4px 0 3px 0'
    }
  }, t('websiteTotalLabel')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '6px',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.85rem',
      color: config.textColor,
      opacity: 0.8,
      fontWeight: 'bold'
    }
  }, "C$"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.01",
    value: currentWebsiteTotal,
    placeholder: totalRaised > 0 ? (totalRaised * effectiveRate).toFixed(2) : goal > 0 ? (goal * effectiveRate).toFixed(2) : 'e.g. 138.45',
    onChange: e => {
      const val = e.target.value;
      updateWebsiteTotal(val);
      const parsedCad = parseFloat(val);
      const baseUsd = totalRaised > 0 ? totalRaised : goal;
      if (!isNaN(parsedCad) && parsedCad > 0 && baseUsd > 0) {
        const calculated = parseFloat((parsedCad / baseUsd).toFixed(4));
        updateConfig({
          customExchangeRate: calculated
        });
      } else if (val === '') {
        updateConfig({
          customExchangeRate: 0
        });
      }
    },
    style: {
      ...styles.input,
      marginBottom: 0,
      fontSize: '0.85rem',
      padding: '6px',
      flex: 1
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '6px',
      flexWrap: 'wrap',
      gap: '4px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.72rem',
      color: effSecondaryTextColor,
      opacity: 0.85
    }
  }, totalRaised > 0 ? `${t('calculatedRateNotice', {
    usd: totalRaised.toFixed(2)
  })}` : goal > 0 ? `${t('calculatedRateNotice', {
    usd: goal.toFixed(2)
  })}` : t('websiteTotalHelp')), Boolean(config.customExchangeRate || currentWebsiteTotal) && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: handleResetRate,
    style: {
      ...styles.button,
      margin: 0,
      padding: '2px 6px',
      fontSize: '0.7rem',
      backgroundColor: 'transparent',
      border: `1px solid ${config.panelBorderColor}`,
      color: config.textColor,
      cursor: 'pointer'
    }
  }, "✕ ", t('clearExchangeRate')))), /*#__PURE__*/React.createElement("label", {
    style: {
      ...styles.label,
      marginTop: '12px'
    }
  }, t('milestoneCalculation')), /*#__PURE__*/React.createElement("select", {
    value: config.milestoneProgressMode || 'cumulative',
    onChange: e => updateConfig({
      milestoneProgressMode: e.target.value
    }),
    style: styles.input
  }, /*#__PURE__*/React.createElement("option", {
    value: "cumulative"
  }, t('milestoneCumulative')), /*#__PURE__*/React.createElement("option", {
    value: "relative"
  }, t('milestoneStep'))));
};

// ==========================================
// 10. QR CODE SETTINGS SECTION
// ==========================================

export const QrCodeSection = ({
  styles,
  config,
  updateConfig,
  effectiveQrUrl,
  activeParticipantId,
  copyFeedback,
  effHighlightColor,
  effHeaderColor,
  effSecondaryTextColor,
  effPrimaryButtonBgColor,
  effSecondaryButtonBgColor,
  hexToRgba,
  onCopyQrLink,
  openOverlay,
  t
}) => {
  return /*#__PURE__*/React.createElement(CollapsibleSection, {
    title: t('qrCodeSection'),
    isInitiallyCollapsed: true,
    styles: styles
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.85rem',
      color: effSecondaryTextColor,
      margin: '0 0 15px 0',
      lineHeight: 1.5
    }
  }, t('qrCodeSectionHelp')), /*#__PURE__*/React.createElement("label", {
    style: {
      ...styles.label,
      marginBottom: '8px'
    }
  }, t('qrLinkVersion')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      marginBottom: '16px'
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '12px',
      backgroundColor: config.qrLinkType === 'page' ? hexToRgba(effHighlightColor, 0.12) : hexToRgba(config.panelBorderColor, 0.1),
      border: `2px solid ${config.qrLinkType === 'page' ? effHighlightColor : hexToRgba(config.panelBorderColor, 0.3)}`,
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.15s ease'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: "qrLinkType",
    value: "page",
    checked: config.qrLinkType === 'page',
    onChange: () => updateConfig({
      qrLinkType: 'page'
    }),
    style: {
      marginTop: '3px'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '3px',
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 'bold',
      fontSize: '0.9rem',
      color: config.textColor
    }
  }, t('qrLinkPage')), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.78rem',
      color: effSecondaryTextColor
    }
  }, t('qrLinkPageDesc')), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.72rem',
      color: effHighlightColor,
      fontFamily: 'monospace',
      marginTop: '2px',
      wordBreak: 'break-all'
    }
  }, "https://dd.extra-life.org/participants/", activeParticipantId))), /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '12px',
      backgroundColor: config.qrLinkType === 'donation' || !config.qrLinkType ? hexToRgba(effHighlightColor, 0.12) : hexToRgba(config.panelBorderColor, 0.1),
      border: `2px solid ${config.qrLinkType === 'donation' || !config.qrLinkType ? effHighlightColor : hexToRgba(config.panelBorderColor, 0.3)}`,
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.15s ease'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: "qrLinkType",
    value: "donation",
    checked: config.qrLinkType === 'donation' || !config.qrLinkType,
    onChange: () => updateConfig({
      qrLinkType: 'donation'
    }),
    style: {
      marginTop: '3px'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '3px',
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 'bold',
      fontSize: '0.9rem',
      color: config.textColor
    }
  }, t('qrLinkDonation')), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.65rem',
      backgroundColor: config.successColor,
      color: config.buttonTextColor,
      padding: '2px 6px',
      borderRadius: '4px',
      fontWeight: 'bold'
    }
  }, "FAST DONATE")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.78rem',
      color: effSecondaryTextColor
    }
  }, t('qrLinkDonationDesc')), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.72rem',
      color: effHighlightColor,
      fontFamily: 'monospace',
      marginTop: '2px',
      wordBreak: 'break-all'
    }
  }, "https://dd.extra-life.org/index.cfm?fuseaction=twitchDonate.participant&participantID=", activeParticipantId))), /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '12px',
      backgroundColor: config.qrLinkType === 'custom' ? hexToRgba(effHighlightColor, 0.12) : hexToRgba(config.panelBorderColor, 0.1),
      border: `2px solid ${config.qrLinkType === 'custom' ? effHighlightColor : hexToRgba(config.panelBorderColor, 0.3)}`,
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.15s ease'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: "qrLinkType",
    value: "custom",
    checked: config.qrLinkType === 'custom',
    onChange: () => updateConfig({
      qrLinkType: 'custom'
    }),
    style: {
      marginTop: '3px'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '3px',
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 'bold',
      fontSize: '0.9rem',
      color: config.textColor
    }
  }, t('qrLinkCustom')), config.qrLinkType === 'custom' && /*#__PURE__*/React.createElement("input", {
    type: "url",
    value: config.qrCustomUrl || '',
    onChange: e => updateConfig({
      qrCustomUrl: e.target.value
    }),
    placeholder: t('qrLinkCustomPlaceholder'),
    style: {
      ...styles.input,
      fontSize: '0.85rem',
      padding: '6px 10px',
      marginTop: '6px'
    },
    onClick: e => e.stopPropagation()
  })))), /*#__PURE__*/React.createElement("label", {
    style: {
      ...styles.label,
      marginTop: '8px'
    }
  }, t('qrTargetUrl')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '8px',
      marginBottom: '16px',
      alignItems: 'stretch'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    readOnly: true,
    value: effectiveQrUrl,
    style: {
      ...styles.input,
      flex: 1,
      fontFamily: 'monospace',
      fontSize: '0.82rem',
      opacity: 0.9,
      backgroundColor: hexToRgba(config.panelBorderColor, 0.1)
    }
  }), /*#__PURE__*/React.createElement("a", {
    href: effectiveQrUrl,
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      ...styles.button,
      margin: 0,
      padding: '8px 12px',
      fontSize: '0.78rem',
      backgroundColor: config.panelColor,
      border: `1px solid ${effSecondaryButtonBgColor}`,
      color: config.textColor,
      display: 'flex',
      alignItems: 'center',
      textDecoration: 'none'
    }
  }, "↗ ", t('qrOpenUrl')), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onCopyQrLink,
    style: {
      ...styles.button,
      margin: 0,
      padding: '8px 12px',
      fontSize: '0.78rem',
      backgroundColor: effPrimaryButtonBgColor,
      color: config.buttonTextColor,
      whiteSpace: 'nowrap'
    }
  }, "📋 ", copyFeedback === 'qr-link' ? t('copied') : t('qrCopyUrl'))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '12px',
      marginBottom: '16px'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('qrTitleLabel')), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: config.qrTitle || '',
    onChange: e => updateConfig({
      qrTitle: e.target.value
    }),
    placeholder: t('qrDefaultTitle'),
    style: {
      ...styles.input,
      fontSize: '0.9rem'
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('qrSubtitleLabel')), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: config.qrSubtitle || '',
    onChange: e => updateConfig({
      qrSubtitle: e.target.value
    }),
    placeholder: t('qrSubtitlePlaceholder'),
    style: {
      ...styles.input,
      fontSize: '0.9rem'
    }
  }))), /*#__PURE__*/React.createElement("label", {
    style: {
      ...styles.label,
      marginBottom: '6px'
    }
  }, t('qrColors')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      marginBottom: '14px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => updateConfig({
      qrFgColor: '#000000',
      qrBgColor: '#ffffff',
      qrTransparentBg: false
    }),
    style: {
      ...styles.button,
      margin: 0,
      padding: '6px 12px',
      fontSize: '0.75rem',
      backgroundColor: '#ffffff',
      color: '#000000',
      border: '1px solid #cccccc'
    }
  }, "⚪ ", t('qrPresetContrast')), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => updateConfig({
      qrFgColor: effHighlightColor,
      qrBgColor: config.panelColor,
      qrTransparentBg: false
    }),
    style: {
      ...styles.button,
      margin: 0,
      padding: '6px 12px',
      fontSize: '0.75rem',
      backgroundColor: config.panelColor,
      color: effHighlightColor,
      border: `1px solid ${effHighlightColor}`
    }
  }, "🎨 ", t('qrPresetTheme')), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => updateConfig({
      qrFgColor: '#ffffff',
      qrBgColor: 'transparent',
      qrTransparentBg: true
    }),
    style: {
      ...styles.button,
      margin: 0,
      padding: '6px 12px',
      fontSize: '0.75rem',
      backgroundColor: 'rgba(255,255,255,0.1)',
      color: '#ffffff',
      border: '1px dashed #ffffff'
    }
  }, "✨ ", t('qrPresetInverted'))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '15px',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginBottom: '16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      ...styles.label,
      margin: 0,
      fontSize: '0.85rem'
    }
  }, t('qrFgColor'), ":"), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: config.qrFgColor || '#000000',
    onChange: e => updateConfig({
      qrFgColor: e.target.value
    }),
    style: styles.colorInput
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      opacity: config.qrTransparentBg ? 0.4 : 1
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      ...styles.label,
      margin: 0,
      fontSize: '0.85rem'
    }
  }, t('qrBgColor'), ":"), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: config.qrBgColor && config.qrBgColor !== 'transparent' ? config.qrBgColor : '#ffffff',
    onChange: e => updateConfig({
      qrBgColor: e.target.value,
      qrTransparentBg: false
    }),
    disabled: Boolean(config.qrTransparentBg),
    style: styles.colorInput
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    id: "checkbox-qr-transparent",
    checked: Boolean(config.qrTransparentBg),
    onChange: e => updateConfig({
      qrTransparentBg: e.target.checked
    })
  }), /*#__PURE__*/React.createElement("label", {
    htmlFor: "checkbox-qr-transparent",
    style: {
      ...styles.label,
      margin: 0,
      cursor: 'pointer',
      fontSize: '0.85rem'
    }
  }, t('qrTransparentBg')))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '15px',
      marginBottom: '18px'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('qrSizeLabel'), " (", config.qrSize || 220, "px)"), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "140",
    max: "360",
    step: "10",
    value: config.qrSize || 220,
    onChange: e => updateConfig({
      qrSize: Number(e.target.value)
    }),
    style: {
      width: '100%',
      cursor: 'pointer'
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '18px'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    id: "checkbox-qr-dashboard",
    checked: config.qrShowCardInDashboard !== false,
    onChange: e => updateConfig({
      qrShowCardInDashboard: e.target.checked
    })
  }), /*#__PURE__*/React.createElement("label", {
    htmlFor: "checkbox-qr-dashboard",
    style: {
      ...styles.label,
      margin: 0,
      cursor: 'pointer',
      fontSize: '0.85rem'
    }
  }, t('qrShowInDashboard'))))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...styles.card,
      backgroundColor: hexToRgba(config.panelBorderColor, 0.08),
      border: `2px solid ${effHighlightColor}`,
      padding: '16px',
      alignItems: 'center',
      gap: '14px'
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: 0,
      color: effHeaderColor,
      fontSize: '0.95rem'
    }
  }, t('qrPreview')), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px',
      backgroundColor: config.qrTransparentBg ? hexToRgba(config.panelColor, 0.9) : config.qrBgColor || '#ffffff',
      borderRadius: '10px',
      border: `1px solid ${hexToRgba(config.panelBorderColor, 0.4)}`,
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
    }
  }, config.qrTitle && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.9rem',
      fontWeight: 'bold',
      color: config.qrTransparentBg ? config.textColor : config.qrFgColor || '#000000',
      fontFamily: config.fontFamily,
      textAlign: 'center',
      marginBottom: '4px'
    }
  }, config.qrTitle), /*#__PURE__*/React.createElement(QRCodeSvg, {
    url: effectiveQrUrl,
    size: Math.min(220, config.qrSize || 220),
    fgColor: config.qrFgColor || '#000000',
    bgColor: config.qrTransparentBg ? 'transparent' : config.qrBgColor || '#ffffff',
    errorCorrectionLevel: config.qrErrorCorrection || 'M',
    title: config.qrTitle || 'Extra Life Donation QR'
  }), config.qrSubtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.72rem',
      color: config.qrTransparentBg ? effSecondaryTextColor : '#555555',
      textAlign: 'center',
      maxWidth: '200px'
    }
  }, config.qrSubtitle)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      justifyContent: 'center',
      width: '100%',
      maxWidth: '500px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => downloadQRCodePng(effectiveQrUrl, `extralife-donation-qr-${activeParticipantId}.png`, 1024, config.qrFgColor, config.qrTransparentBg ? 'transparent' : config.qrBgColor, config.qrErrorCorrection),
    style: {
      ...styles.button,
      margin: 0,
      padding: '8px 14px',
      fontSize: '0.8rem',
      backgroundColor: effPrimaryButtonBgColor,
      color: config.buttonTextColor,
      flex: 1
    }
  }, "💾 ", t('qrDownloadPng'), " (1024px)"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => downloadQRCodeSvg(effectiveQrUrl, `extralife-donation-qr-${activeParticipantId}.svg`, config.qrFgColor, config.qrTransparentBg ? 'transparent' : config.qrBgColor, config.qrErrorCorrection),
    style: {
      ...styles.button,
      margin: 0,
      padding: '8px 14px',
      fontSize: '0.8rem',
      backgroundColor: config.panelColor,
      border: `1px solid ${effSecondaryButtonBgColor}`,
      color: config.textColor,
      flex: 1
    }
  }, "📐 ", t('qrDownloadSvg')), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => openOverlay('qrcode', 'width=450,height=520'),
    style: {
      ...styles.button,
      margin: 0,
      padding: '8px 14px',
      fontSize: '0.8rem',
      backgroundColor: hexToRgba(config.panelBorderColor, 0.25),
      border: `1px solid ${config.panelBorderColor}`,
      color: config.textColor,
      flex: 1
    }
  }, "↗ ", t('openPopup')))));
};

// ==========================================
// 11. TWITCH INTEGRATION SECTION
// ==========================================

export const TwitchSection = ({
  styles,
  config,
  updateConfig,
  commandTrigger,
  setCommandTrigger,
  commandResponse,
  setCommandResponse,
  handleAddCommand,
  handleDeleteCommand,
  handleGetTwitchToken,
  effHighlightColor,
  effHeaderColor,
  effSecondaryTextColor,
  effPrimaryButtonBgColor,
  effDividerColor,
  t
}) => {
  return /*#__PURE__*/React.createElement(CollapsibleSection, {
    title: t('twitchIntegration'),
    isInitiallyCollapsed: true,
    styles: styles
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '20px',
      borderBottom: `1px dashed ${effDividerColor}`,
      paddingBottom: '10px'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: config.twitchEnabled,
    onChange: e => updateConfig({
      twitchEnabled: e.target.checked
    })
  }), /*#__PURE__*/React.createElement("label", {
    style: {
      ...styles.label,
      opacity: 1,
      cursor: 'pointer',
      fontWeight: 'bold'
    }
  }, t('twitchEnabled'))), /*#__PURE__*/React.createElement("div", {
    style: {
      opacity: config.twitchEnabled ? 1 : 0.5,
      pointerEvents: config.twitchEnabled ? 'auto' : 'none',
      transition: 'opacity 0.3s'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '10px'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: config.twitchEnableAlerts,
    onChange: e => updateConfig({
      twitchEnableAlerts: e.target.checked
    })
  }), /*#__PURE__*/React.createElement("label", {
    style: {
      ...styles.label,
      opacity: 1,
      cursor: 'pointer'
    }
  }, t('twitchEnableAlerts'))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '10px'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: config.twitchEnableCommands,
    onChange: e => updateConfig({
      twitchEnableCommands: e.target.checked
    })
  }), /*#__PURE__*/React.createElement("label", {
    style: {
      ...styles.label,
      opacity: 1,
      cursor: 'pointer'
    }
  }, t('twitchEnableCommands'))), /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('twitchChannel')), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: config.twitchChannel,
    onChange: e => updateConfig({
      twitchChannel: e.target.value
    }),
    style: styles.input
  }), /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('twitchToken')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '10px',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "password",
    value: config.twitchToken,
    onChange: e => updateConfig({
      twitchToken: e.target.value
    }),
    placeholder: "oauth:xxxxxxxxxxxxxx",
    style: {
      ...styles.input,
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: handleGetTwitchToken,
    style: {
      ...styles.button,
      backgroundColor: effPrimaryButtonBgColor,
      color: config.buttonTextColor,
      fontSize: '0.9rem',
      padding: '10px 14px',
      margin: 0,
      whiteSpace: 'nowrap'
    },
    title: t('getTwitchToken')
  }, "🔑 ", t('getTwitchToken'))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.75rem',
      opacity: 0.7,
      marginTop: '6px',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("span", null, t('twitchTokenHelp'), " "), /*#__PURE__*/React.createElement("a", {
    href: "https://twitchtokengenerator.com/",
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      color: effHighlightColor,
      textDecoration: 'underline'
    }
  }, t('twitchTokenExternalLink'))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: `2px dashed ${effDividerColor}`,
      margin: '20px 0'
    }
  }), /*#__PURE__*/React.createElement("h4", {
    style: {
      ...styles.label,
      opacity: 1,
      fontSize: '1.1rem',
      marginBottom: '10px'
    }
  }, t('chatCommands')), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: '15px'
    }
  }, /*#__PURE__*/React.createElement("h5", {
    style: {
      color: effHeaderColor,
      margin: '0 0 5px 0',
      fontSize: '0.9rem'
    }
  }, t('builtinCommands')), /*#__PURE__*/React.createElement("ul", {
    style: {
      color: config.textColor,
      fontSize: '0.85rem',
      margin: 0,
      paddingLeft: '20px',
      opacity: 0.8,
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("strong", null, "!total"), " - ", t('builtinTotalDesc')), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("strong", null, "!goal"), " - ", t('builtinGoalDesc')), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("strong", null, "!milestone"), " - ", t('builtinMilestoneDesc')))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h5", {
    style: {
      color: effHeaderColor,
      margin: '0 0 10px 0',
      fontSize: '0.9rem'
    }
  }, t('customCommands')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '10px',
      marginBottom: '10px'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: commandTrigger,
    onChange: e => setCommandTrigger(e.target.value),
    style: {
      ...styles.input,
      padding: '8px',
      flex: 1
    },
    placeholder: t('commandTrigger')
  }), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: commandResponse,
    onChange: e => setCommandResponse(e.target.value),
    style: {
      ...styles.input,
      padding: '8px',
      flex: 2
    },
    placeholder: t('commandResponse')
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: handleAddCommand,
    style: {
      ...styles.button,
      backgroundColor: effPrimaryButtonBgColor,
      color: config.buttonTextColor,
      fontSize: '0.9rem',
      padding: '8px',
      margin: '0 0 15px 0',
      width: '100%'
    }
  }, t('addCommand')), /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: '200px',
      overflowY: 'auto'
    }
  }, config.customCommands.length === 0 && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.8rem',
      opacity: 0.6
    }
  }, t('noCommands')), config.customCommands.map(cmd => /*#__PURE__*/React.createElement("div", {
    key: cmd.id,
    style: {
      ...styles.soundItem,
      padding: '8px 12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      overflow: 'hidden',
      marginRight: '10px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: effHighlightColor,
      fontWeight: 'bold'
    }
  }, cmd.trigger), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.8rem',
      opacity: 0.8,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      maxWidth: '100%'
    }
  }, cmd.response)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => handleDeleteCommand(cmd.id),
    style: {
      ...styles.soundButton,
      backgroundColor: config.errorColor
    }
  }, t('delete'))))))));
};

// ==========================================
// 12. EVENT TIMING SECTION
// ==========================================

export const EventTimingSection = ({
  styles,
  config,
  updateConfig,
  t
}) => {
  return /*#__PURE__*/React.createElement(CollapsibleSection, {
    title: t('eventTiming'),
    isInitiallyCollapsed: true,
    styles: styles
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('eventStartTime')), /*#__PURE__*/React.createElement("input", {
    type: "datetime-local",
    value: config.eventStartTime,
    onChange: e => updateConfig({
      eventStartTime: e.target.value
    }),
    style: styles.input
  }), /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('celebrationDuration')), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: config.celebrationDuration,
    onChange: e => updateConfig({
      celebrationDuration: Math.max(1, Number(e.target.value))
    }),
    style: styles.input,
    min: "1"
  }));
};

// ==========================================
// 13. STREAM SCHEDULE SECTION
// ==========================================

export const ScheduleSection = ({
  styles,
  config,
  schedTime,
  setSchedTime,
  schedDesc,
  setSchedDesc,
  handleAddScheduleItem,
  handleToggleItem,
  handleDeleteItem,
  effPrimaryButtonBgColor,
  t
}) => {
  return /*#__PURE__*/React.createElement(CollapsibleSection, {
    title: t('streamSchedule'),
    isInitiallyCollapsed: true,
    styles: styles
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      border: `2px dashed ${config.panelBorderColor}`,
      padding: '15px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '10px'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "datetime-local",
    value: schedTime,
    onChange: e => setSchedTime(e.target.value),
    style: {
      ...styles.input,
      padding: '8px',
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: schedDesc,
    onChange: e => setSchedDesc(e.target.value),
    style: {
      ...styles.input,
      padding: '8px',
      flex: 2
    },
    placeholder: t('description')
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: handleAddScheduleItem,
    style: {
      ...styles.button,
      backgroundColor: effPrimaryButtonBgColor,
      color: config.buttonTextColor,
      fontSize: '1rem',
      padding: '10px',
      margin: '10px auto 0 auto',
      width: '50%'
    }
  }, t('addItem'))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: '200px',
      overflowY: 'auto'
    }
  }, config.scheduleItems.map(item => {
    const date = new Date(item.time);
    const timeDisplay = isNaN(date.getTime()) ? item.time : date.toLocaleString(undefined, {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit'
    });
    return /*#__PURE__*/React.createElement("div", {
      key: item.id,
      style: {
        ...styles.soundItem,
        padding: '8px 12px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        opacity: item.isDone ? 0.6 : 1,
        textDecoration: item.isDone ? 'line-through' : 'none',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        marginRight: '10px'
      }
    }, /*#__PURE__*/React.createElement("strong", null, timeDisplay), " - ", item.description), /*#__PURE__*/React.createElement("div", {
      style: {
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => handleToggleItem(item.id),
      style: {
        ...styles.soundButton,
        backgroundColor: config.successColor,
        color: config.buttonTextColor
      }
    }, item.isDone ? t('undo') : t('done')), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => handleDeleteItem(item.id),
      style: {
        ...styles.soundButton,
        backgroundColor: config.errorColor
      }
    }, t('delete'))));
  })));
};

// ==========================================
// 14. THEMING & VISUALS SECTION
// ==========================================

export const ThemingSection = ({
  styles,
  config,
  updateConfig,
  selectedPreset,
  handlePresetChange,
  savedThemes,
  handleUpdateThemeProfile,
  handleExportThemeProfile,
  handleDeleteThemeProfile,
  newThemeNameInput,
  setNewThemeNameInput,
  handleSaveThemeProfile,
  handleImportThemeProfile,
  handleExportAllThemes,
  handleLoadSavedTheme,
  themeActionFeedback,
  handleResetProgressBarColors,
  handleResetAdvancedColors,
  showAdvancedColors,
  setShowAdvancedColors,
  effProgressBarColor,
  effProgressBarBgColor,
  effProgressBarTextColor,
  effProgressBarBorderColor,
  effMilestoneBarColor,
  effMilestoneBarBgColor,
  effMilestoneBarTextColor,
  effMilestoneBarBorderColor,
  effHeaderColor,
  effSecondaryTextColor,
  effPrimaryButtonBgColor,
  effSecondaryButtonBgColor,
  effDividerColor,
  effHighlightColor,
  effDonorNameColor,
  effToastBgColor,
  effToastBorderColor,
  effToastNameColor,
  effToastAmountColor,
  hexToRgba,
  t
}) => {
  const themeFileInputRef = useRef(null);
  return /*#__PURE__*/React.createElement(CollapsibleSection, {
    title: t('theming'),
    isInitiallyCollapsed: true,
    styles: styles
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      gap: '0px',
      marginBottom: '1rem'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    id: "tm1",
    name: "themingMode",
    checked: config.themingMode === 'simple',
    onChange: () => updateConfig({
      themingMode: 'simple'
    })
  }), /*#__PURE__*/React.createElement("label", {
    htmlFor: "tm1"
  }, t('simple')), /*#__PURE__*/React.createElement("input", {
    type: "radio",
    id: "tm2",
    name: "themingMode",
    checked: config.themingMode === 'advanced',
    onChange: () => updateConfig({
      themingMode: 'advanced'
    })
  }), /*#__PURE__*/React.createElement("label", {
    htmlFor: "tm2"
  }, t('advanced'))), config.themingMode === 'advanced' && /*#__PURE__*/React.createElement("div", {
    style: {
      border: `2px dashed ${config.panelBorderColor}`,
      padding: '15px',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      marginBottom: '1rem'
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('fontFamily')), /*#__PURE__*/React.createElement("select", {
    value: config.fontFamily,
    onChange: e => updateConfig({
      fontFamily: e.target.value
    }),
    style: styles.input
  }, /*#__PURE__*/React.createElement("option", {
    value: "'Press Start 2P', cursive"
  }, "Press Start 2P"), /*#__PURE__*/React.createElement("option", {
    value: "'Bungee', sans-serif"
  }, "Bungee"), /*#__PURE__*/React.createElement("option", {
    value: "'Roboto Mono', monospace"
  }, "Roboto Mono"), /*#__PURE__*/React.createElement("option", {
    value: "'VT323', monospace"
  }, "VT323"), /*#__PURE__*/React.createElement("option", {
    value: "'Cinzel', serif"
  }, "Cinzel (Fantasy)")), /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('notificationAnimation')), /*#__PURE__*/React.createElement("select", {
    value: config.notificationAnimation,
    onChange: e => updateConfig({
      notificationAnimation: e.target.value
    }),
    style: styles.input
  }, /*#__PURE__*/React.createElement("option", {
    value: "slide"
  }, t('slideIn')), /*#__PURE__*/React.createElement("option", {
    value: "fade"
  }, t('fadeIn')), /*#__PURE__*/React.createElement("option", {
    value: "bounce"
  }, t('bounceIn')), /*#__PURE__*/React.createElement("option", {
    value: "zoom"
  }, t('zoomIn')))), /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('colorPreset')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("select", {
    value: selectedPreset,
    onChange: handlePresetChange,
    style: {
      ...styles.input,
      flex: 1,
      minWidth: '220px'
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "custom"
  }, t('custom')), savedThemes.length > 0 && /*#__PURE__*/React.createElement("optgroup", {
    label: t('savedThemeProfiles')
  }, savedThemes.map(profile => /*#__PURE__*/React.createElement("option", {
    key: `profile:${profile.id}`,
    value: `profile:${profile.id}`
  }, "★ ", profile.name))), /*#__PURE__*/React.createElement("optgroup", {
    label: t('builtInPresets')
  }, Object.entries(COLOR_PRESETS).map(([key, {
    name
  }]) => /*#__PURE__*/React.createElement("option", {
    key: key,
    value: key
  }, name)))), selectedPreset.startsWith('profile:') && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '6px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: handleUpdateThemeProfile,
    style: {
      ...styles.button,
      margin: 0,
      padding: '8px 12px',
      fontSize: '0.8rem',
      backgroundColor: effSecondaryButtonBgColor,
      color: config.buttonTextColor
    },
    title: t('updateTheme')
  }, "💾 ", t('updateTheme')), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => handleExportThemeProfile(),
    style: {
      ...styles.button,
      margin: 0,
      padding: '8px 12px',
      fontSize: '0.8rem',
      backgroundColor: effPrimaryButtonBgColor,
      color: config.buttonTextColor
    },
    title: t('exportTheme')
  }, "📤 ", t('exportTheme')), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => handleDeleteThemeProfile(),
    style: {
      ...styles.button,
      margin: 0,
      padding: '8px 12px',
      fontSize: '0.8rem',
      backgroundColor: config.errorColor,
      color: '#ffffff'
    },
    title: t('deleteTheme')
  }, "✕ ", t('deleteTheme')))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '12px',
      padding: '14px',
      backgroundColor: hexToRgba(config.panelBorderColor, 0.1),
      border: `1px dashed ${config.panelBorderColor}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '10px',
      alignItems: 'center',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: newThemeNameInput,
    onChange: e => setNewThemeNameInput(e.target.value),
    placeholder: t('themeProfileName'),
    style: {
      ...styles.input,
      flex: 2,
      minWidth: '180px',
      padding: '8px'
    },
    onKeyDown: e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSaveThemeProfile();
      }
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: handleSaveThemeProfile,
    style: {
      ...styles.button,
      margin: 0,
      padding: '8px 14px',
      fontSize: '0.85rem',
      backgroundColor: effPrimaryButtonBgColor,
      color: config.buttonTextColor,
      whiteSpace: 'nowrap'
    }
  }, "+ ", t('saveAsNewThemeProfile'))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
      flexWrap: 'wrap',
      paddingTop: '10px',
      borderTop: `1px solid ${hexToRgba(config.panelBorderColor, 0.25)}`
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "file",
    ref: themeFileInputRef,
    accept: ".json,application/json",
    onChange: handleImportThemeProfile,
    style: {
      display: 'none'
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => themeFileInputRef.current?.click(),
    style: {
      ...styles.button,
      margin: 0,
      padding: '8px 14px',
      fontSize: '0.85rem',
      backgroundColor: effSecondaryButtonBgColor,
      color: config.buttonTextColor,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      cursor: 'pointer',
      whiteSpace: 'nowrap'
    },
    title: t('importThemeHelp')
  }, "📥 ", t('importTheme')), selectedPreset.startsWith('profile:') ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => handleExportThemeProfile(),
    style: {
      ...styles.button,
      margin: 0,
      padding: '8px 14px',
      fontSize: '0.85rem',
      backgroundColor: effPrimaryButtonBgColor,
      color: config.buttonTextColor,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      whiteSpace: 'nowrap'
    },
    title: t('exportThemeHelp')
  }, "📤 ", t('exportTheme')) : /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => handleExportThemeProfile(),
    style: {
      ...styles.button,
      margin: 0,
      padding: '8px 14px',
      fontSize: '0.85rem',
      backgroundColor: hexToRgba(effPrimaryButtonBgColor, 0.85),
      color: config.buttonTextColor,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      whiteSpace: 'nowrap'
    },
    title: t('exportCurrentTheme')
  }, "📤 ", t('exportCurrentTheme')), savedThemes.length > 1 && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: handleExportAllThemes,
    style: {
      ...styles.button,
      margin: 0,
      padding: '8px 14px',
      fontSize: '0.85rem',
      backgroundColor: 'transparent',
      border: `1px solid ${config.panelBorderColor}`,
      color: config.textColor,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      whiteSpace: 'nowrap'
    },
    title: t('exportAllThemes')
  }, "📦 ", t('exportAllThemes'), " (", savedThemes.length, ")")), savedThemes.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '4px',
      paddingTop: '10px',
      borderTop: `1px solid ${hexToRgba(config.panelBorderColor, 0.25)}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.78rem',
      color: effSecondaryTextColor,
      fontWeight: 'bold',
      textAlign: 'left'
    }
  }, t('savedThemeProfiles'), " (", savedThemes.length, "):"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      maxHeight: '180px',
      overflowY: 'auto'
    }
  }, savedThemes.map(theme => {
    const isActive = selectedPreset === `profile:${theme.id}`;
    return /*#__PURE__*/React.createElement("div", {
      key: theme.id,
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        padding: '6px 10px',
        backgroundColor: isActive ? hexToRgba(effHighlightColor, 0.15) : hexToRgba(config.panelColor, 0.6),
        border: isActive ? `1px solid ${effHighlightColor}` : `1px solid ${hexToRgba(config.panelBorderColor, 0.3)}`,
        borderRadius: '3px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: '14px',
        height: '14px',
        borderRadius: '2px',
        backgroundColor: theme.colors.backgroundColor,
        border: `1px solid ${theme.colors.panelBorderColor || '#fff'}`,
        flexShrink: 0
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '0.85rem',
        color: isActive ? effHighlightColor : config.textColor,
        fontWeight: isActive ? 'bold' : 'normal',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }, theme.name, " ", isActive && '(Active)')), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: '4px',
        flexShrink: 0
      }
    }, !isActive && /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => handleLoadSavedTheme(theme),
      style: {
        ...styles.button,
        margin: 0,
        padding: '3px 8px',
        fontSize: '0.72rem',
        backgroundColor: effSecondaryButtonBgColor,
        color: config.buttonTextColor
      },
      title: t('loadTheme')
    }, t('loadTheme')), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => handleExportThemeProfile(theme),
      style: {
        ...styles.button,
        margin: 0,
        padding: '3px 8px',
        fontSize: '0.72rem',
        backgroundColor: 'transparent',
        border: `1px solid ${config.panelBorderColor}`,
        color: config.textColor
      },
      title: t('exportTheme')
    }, "📤 ", t('exportTheme')), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => handleDeleteThemeProfile(theme.id),
      style: {
        ...styles.button,
        margin: 0,
        padding: '3px 8px',
        fontSize: '0.72rem',
        backgroundColor: hexToRgba(config.errorColor, 0.2),
        border: `1px solid ${config.errorColor}`,
        color: config.errorColor
      },
      title: t('deleteTheme')
    }, "✕")));
  })))), themeActionFeedback && /*#__PURE__*/React.createElement("div", {
    style: {
      color: config.successColor,
      fontSize: '0.85rem',
      marginTop: '6px',
      textAlign: 'center'
    }
  }, "✓ ", themeActionFeedback), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: `1px solid ${config.panelBorderColor}`,
      margin: '20px 0 10px 0'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '15px',
      padding: '16px',
      border: `2px solid ${effProgressBarColor}`,
      backgroundColor: hexToRgba(effProgressBarBgColor, 0.4),
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '8px',
      borderBottom: `1px solid ${hexToRgba(effProgressBarBorderColor, 0.4)}`,
      paddingBottom: '8px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '1.05rem',
      fontWeight: 'bold',
      color: effProgressBarColor,
      fontFamily: config.fontFamily
    }
  }, "📊 ", t('progressBarSection')), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.78rem',
      color: effSecondaryTextColor,
      opacity: 0.9,
      marginTop: '2px',
      fontFamily: config.fontFamily
    }
  }, t('progressBarSectionHelp'))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: handleResetProgressBarColors,
    style: {
      ...styles.button,
      margin: 0,
      padding: '6px 12px',
      fontSize: '0.75rem',
      backgroundColor: 'transparent',
      border: `1px solid ${effProgressBarBorderColor}`,
      color: config.textColor,
      opacity: 0.85,
      cursor: 'pointer'
    },
    title: t('resetProgressBarColors')
  }, "↺ ", t('resetProgressBarColors'))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.85rem',
      color: effSecondaryTextColor,
      marginBottom: '8px',
      fontWeight: 'bold',
      fontFamily: config.fontFamily,
      textAlign: 'left'
    }
  }, "🎯 ", t('mainProgressBarTitle')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
      gap: '1rem',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: styles.colorPickerContainer
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('progressBarColor')), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: config.progressBarColor || config.accentColor1,
    onChange: e => updateConfig({
      progressBarColor: e.target.value
    }),
    style: styles.colorInput
  })), /*#__PURE__*/React.createElement("div", {
    style: styles.colorPickerContainer
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('progressBarBgColor')), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: config.progressBarBgColor || config.panelColor,
    onChange: e => updateConfig({
      progressBarBgColor: e.target.value
    }),
    style: styles.colorInput
  })), /*#__PURE__*/React.createElement("div", {
    style: styles.colorPickerContainer
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('progressBarTextColor')), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: config.progressBarTextColor || config.buttonTextColor,
    onChange: e => updateConfig({
      progressBarTextColor: e.target.value
    }),
    style: styles.colorInput
  })), /*#__PURE__*/React.createElement("div", {
    style: styles.colorPickerContainer
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('progressBarBorderColor')), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: config.progressBarBorderColor || config.panelBorderColor,
    onChange: e => updateConfig({
      progressBarBorderColor: e.target.value
    }),
    style: styles.colorInput
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: `1px dashed ${hexToRgba(effProgressBarBorderColor, 0.35)}`,
      paddingTop: '12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '4px'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    id: "splitMilestoneColorsToggle",
    checked: config.splitMilestoneColors || false,
    onChange: e => updateConfig({
      splitMilestoneColors: e.target.checked
    }),
    style: {
      width: '18px',
      height: '18px',
      cursor: 'pointer',
      accentColor: effProgressBarColor
    }
  }), /*#__PURE__*/React.createElement("label", {
    htmlFor: "splitMilestoneColorsToggle",
    style: {
      ...styles.label,
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '0.85rem',
      opacity: 1,
      margin: 0
    }
  }, t('splitMilestoneColors'))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.75rem',
      color: effSecondaryTextColor,
      opacity: 0.85,
      textAlign: 'left',
      marginBottom: '10px',
      marginLeft: '26px',
      fontFamily: config.fontFamily
    }
  }, t('splitMilestoneColorsHelp')), config.splitMilestoneColors && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px',
      backgroundColor: hexToRgba(config.panelColor, 0.6),
      border: `1px solid ${effMilestoneBarBorderColor}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.85rem',
      color: effSecondaryTextColor,
      fontWeight: 'bold',
      fontFamily: config.fontFamily,
      textAlign: 'left'
    }
  }, "🚩 ", t('milestoneProgressBarTitle')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
      gap: '1rem',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: styles.colorPickerContainer
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('milestoneBarColor')), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: config.milestoneProgressBarColor || effProgressBarColor,
    onChange: e => updateConfig({
      milestoneProgressBarColor: e.target.value
    }),
    style: styles.colorInput
  })), /*#__PURE__*/React.createElement("div", {
    style: styles.colorPickerContainer
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('milestoneBarBgColor')), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: config.milestoneProgressBarBgColor || effProgressBarBgColor,
    onChange: e => updateConfig({
      milestoneProgressBarBgColor: e.target.value
    }),
    style: styles.colorInput
  })), /*#__PURE__*/React.createElement("div", {
    style: styles.colorPickerContainer
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('milestoneBarTextColor')), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: config.milestoneProgressBarTextColor || effProgressBarTextColor,
    onChange: e => updateConfig({
      milestoneProgressBarTextColor: e.target.value
    }),
    style: styles.colorInput
  })), /*#__PURE__*/React.createElement("div", {
    style: styles.colorPickerContainer
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('milestoneBarBorderColor')), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: config.milestoneProgressBarBorderColor || effProgressBarBorderColor,
    onChange: e => updateConfig({
      milestoneProgressBarBorderColor: e.target.value
    }),
    style: styles.colorInput
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '6px',
      padding: '10px',
      backgroundColor: config.backgroundColor,
      border: `1px solid ${effProgressBarBorderColor}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.72rem',
      color: effSecondaryTextColor,
      textAlign: 'left',
      fontFamily: config.fontFamily
    }
  }, t('livePreview'), " - ", t('mainProgressBarTitle')), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: '100%',
      height: '32px',
      backgroundColor: effProgressBarBgColor,
      border: `2px solid ${effProgressBarBorderColor}`,
      overflow: 'hidden',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '65%',
      height: '100%',
      backgroundColor: effProgressBarColor,
      transition: 'width 0.3s ease'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: effProgressBarTextColor,
      fontFamily: config.fontFamily,
      fontSize: '0.8rem',
      fontWeight: 'bold',
      pointerEvents: 'none'
    }
  }, "$1,300.00 / $2,000.00 (65.0%)")), config.splitMilestoneColors && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.72rem',
      color: effSecondaryTextColor,
      textAlign: 'left',
      fontFamily: config.fontFamily,
      marginTop: '4px'
    }
  }, t('livePreview'), " - ", t('milestoneProgressBarTitle')), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: '100%',
      height: '32px',
      backgroundColor: effMilestoneBarBgColor,
      border: `2px solid ${effMilestoneBarBorderColor}`,
      overflow: 'hidden',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '40%',
      height: '100%',
      backgroundColor: effMilestoneBarColor,
      transition: 'width 0.3s ease'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: effMilestoneBarTextColor,
      fontFamily: config.fontFamily,
      fontSize: '0.8rem',
      fontWeight: 'bold',
      pointerEvents: 'none'
    }
  }, "$200.00 / $500.00 (40.0%)"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '20px',
      padding: '16px',
      border: `1px solid ${config.panelBorderColor}`,
      backgroundColor: hexToRgba(config.panelColor, 0.4),
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '1rem',
      fontWeight: 'bold',
      color: effHeaderColor,
      fontFamily: config.fontFamily,
      textAlign: 'left',
      borderBottom: `1px solid ${config.panelBorderColor}`,
      paddingBottom: '6px'
    }
  }, "🎨 ", t('generalColorsSection')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: '1rem',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: styles.colorPickerContainer
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('background')), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: config.backgroundColor,
    onChange: e => updateConfig({
      backgroundColor: e.target.value
    }),
    style: styles.colorInput
  })), /*#__PURE__*/React.createElement("div", {
    style: styles.colorPickerContainer
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('panel')), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: config.panelColor,
    onChange: e => updateConfig({
      panelColor: e.target.value
    }),
    style: styles.colorInput
  })), /*#__PURE__*/React.createElement("div", {
    style: styles.colorPickerContainer
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('text')), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: config.textColor,
    onChange: e => updateConfig({
      textColor: e.target.value
    }),
    style: styles.colorInput
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: '1rem',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: styles.colorPickerContainer
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('accent1')), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: config.accentColor1,
    onChange: e => updateConfig({
      accentColor1: e.target.value
    }),
    style: styles.colorInput
  })), /*#__PURE__*/React.createElement("div", {
    style: styles.colorPickerContainer
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('accent2')), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: config.accentColor2,
    onChange: e => updateConfig({
      accentColor2: e.target.value
    }),
    style: styles.colorInput
  })), /*#__PURE__*/React.createElement("div", {
    style: styles.colorPickerContainer
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('border')), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: config.panelBorderColor,
    onChange: e => updateConfig({
      panelBorderColor: e.target.value
    }),
    style: styles.colorInput
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: '1rem',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: styles.colorPickerContainer
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('success')), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: config.successColor,
    onChange: e => updateConfig({
      successColor: e.target.value
    }),
    style: styles.colorInput
  })), /*#__PURE__*/React.createElement("div", {
    style: styles.colorPickerContainer
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('error')), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: config.errorColor,
    onChange: e => updateConfig({
      errorColor: e.target.value
    }),
    style: styles.colorInput
  }))), config.themingMode === 'advanced' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: `1px dashed ${config.panelBorderColor}`,
      margin: '10px 0'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '10px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setShowAdvancedColors(!showAdvancedColors),
    style: {
      ...styles.button,
      margin: 0,
      padding: '8px 12px',
      fontSize: '0.85rem',
      backgroundColor: 'transparent',
      border: `2px solid ${effSecondaryButtonBgColor}`,
      color: effSecondaryButtonBgColor,
      cursor: 'pointer'
    }
  }, showAdvancedColors ? '▼ ' : '► ', " ", t('advancedColorControls')), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: handleResetAdvancedColors,
    style: {
      ...styles.button,
      margin: 0,
      padding: '8px 12px',
      fontSize: '0.8rem',
      backgroundColor: 'transparent',
      border: `1px solid ${config.panelBorderColor}`,
      color: config.textColor,
      opacity: 0.8
    },
    title: t('resetAdvancedColors')
  }, "↺ ", t('resetAdvancedColors'))), showAdvancedColors && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '12px',
      padding: '15px',
      border: `1px solid ${config.panelBorderColor}`,
      backgroundColor: hexToRgba(config.panelColor, 0.5),
      display: 'flex',
      flexDirection: 'column',
      gap: '15px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
      gap: '1rem',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: styles.colorPickerContainer
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('headerColor')), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: config.headerColor || config.accentColor1,
    onChange: e => updateConfig({
      headerColor: e.target.value
    }),
    style: styles.colorInput
  })), /*#__PURE__*/React.createElement("div", {
    style: styles.colorPickerContainer
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('secondaryTextColor')), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: config.secondaryTextColor || config.accentColor2,
    onChange: e => updateConfig({
      secondaryTextColor: e.target.value
    }),
    style: styles.colorInput
  })), /*#__PURE__*/React.createElement("div", {
    style: styles.colorPickerContainer
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('buttonTextColor')), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: config.buttonTextColor || '#0d0d0d',
    onChange: e => updateConfig({
      buttonTextColor: e.target.value
    }),
    style: styles.colorInput
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
      gap: '1rem',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: styles.colorPickerContainer
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('primaryButtonBgColor')), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: config.primaryButtonBgColor || config.accentColor1,
    onChange: e => updateConfig({
      primaryButtonBgColor: e.target.value
    }),
    style: styles.colorInput
  })), /*#__PURE__*/React.createElement("div", {
    style: styles.colorPickerContainer
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('secondaryButtonBgColor')), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: config.secondaryButtonBgColor || config.accentColor2,
    onChange: e => updateConfig({
      secondaryButtonBgColor: e.target.value
    }),
    style: styles.colorInput
  })), /*#__PURE__*/React.createElement("div", {
    style: styles.colorPickerContainer
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('dividerColor')), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: config.dividerColor || config.accentColor2,
    onChange: e => updateConfig({
      dividerColor: e.target.value
    }),
    style: styles.colorInput
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
      gap: '1rem',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: styles.colorPickerContainer
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('highlightColor')), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: config.highlightColor || config.accentColor1,
    onChange: e => updateConfig({
      highlightColor: e.target.value
    }),
    style: styles.colorInput
  })), /*#__PURE__*/React.createElement("div", {
    style: styles.colorPickerContainer
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('donorNameColor')), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: config.donorNameColor || config.highlightColor || config.accentColor1,
    onChange: e => updateConfig({
      donorNameColor: e.target.value
    }),
    style: styles.colorInput
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
      gap: '1rem',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: styles.colorPickerContainer
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('toastBgColor')), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: config.toastBgColor || config.panelColor,
    onChange: e => updateConfig({
      toastBgColor: e.target.value
    }),
    style: styles.colorInput
  })), /*#__PURE__*/React.createElement("div", {
    style: styles.colorPickerContainer
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('toastBorderColor')), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: config.toastBorderColor || config.accentColor1,
    onChange: e => updateConfig({
      toastBorderColor: e.target.value
    }),
    style: styles.colorInput
  })), /*#__PURE__*/React.createElement("div", {
    style: styles.colorPickerContainer
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('toastNameColor')), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: config.toastNameColor || config.accentColor1,
    onChange: e => updateConfig({
      toastNameColor: e.target.value
    }),
    style: styles.colorInput
  })), /*#__PURE__*/React.createElement("div", {
    style: styles.colorPickerContainer
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('toastAmountColor')), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: config.toastAmountColor || config.accentColor2,
    onChange: e => updateConfig({
      toastAmountColor: e.target.value
    }),
    style: styles.colorInput
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
      gap: '1rem',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: styles.colorPickerContainer
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('inputBgColor')), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: config.inputBgColor || config.panelColor,
    onChange: e => updateConfig({
      inputBgColor: e.target.value
    }),
    style: styles.colorInput
  })), /*#__PURE__*/React.createElement("div", {
    style: styles.colorPickerContainer
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('inputBorderColor')), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: config.inputBorderColor || config.accentColor2,
    onChange: e => updateConfig({
      inputBorderColor: e.target.value
    }),
    style: styles.colorInput
  })))))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: `1px solid ${config.panelBorderColor}`,
      margin: '20px 0 10px 0'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'left',
      marginTop: '10px'
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      ...styles.label,
      marginBottom: '8px',
      display: 'block',
      fontWeight: 'bold'
    }
  }, t('livePreview')), /*#__PURE__*/React.createElement("div", {
    style: {
      backgroundColor: config.backgroundColor,
      border: `2px solid ${config.panelBorderColor}`,
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: effHeaderColor,
      fontSize: '1.2rem',
      fontFamily: config.fontFamily,
      textAlign: 'center'
    }
  }, t('sampleHeader')), /*#__PURE__*/React.createElement("div", {
    style: {
      color: effSecondaryTextColor,
      fontSize: '0.85rem',
      fontFamily: config.fontFamily,
      textAlign: 'center'
    }
  }, "Goal: $2,000.00 | Total Raised: $1,250.00"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      backgroundColor: effProgressBarBgColor,
      border: `3px solid ${effProgressBarBorderColor}`,
      padding: '4px',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: '100%',
      height: '24px',
      backgroundColor: effProgressBarBgColor,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '62%',
      height: '100%',
      backgroundColor: effProgressBarColor
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: effProgressBarTextColor,
      fontSize: '0.75rem',
      fontFamily: config.fontFamily,
      whiteSpace: 'nowrap',
      fontWeight: 'bold',
      pointerEvents: 'none'
    }
  }, "$1,250.00 (62%)"))), config.splitMilestoneColors && /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      backgroundColor: effMilestoneBarBgColor,
      border: `3px solid ${effMilestoneBarBorderColor}`,
      padding: '4px',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: '100%',
      height: '22px',
      backgroundColor: effMilestoneBarBgColor,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '45%',
      height: '100%',
      backgroundColor: effMilestoneBarColor
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: effMilestoneBarTextColor,
      fontSize: '0.7rem',
      fontFamily: config.fontFamily,
      whiteSpace: 'nowrap',
      fontWeight: 'bold',
      pointerEvents: 'none'
    }
  }, "Milestone: $450.00 (45%)"))), /*#__PURE__*/React.createElement("div", {
    style: {
      backgroundColor: hexToRgba(effToastBgColor, 0.95),
      border: `2px solid ${effToastBorderColor}`,
      padding: '10px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: effToastNameColor,
      fontWeight: 'bold',
      fontSize: '0.9rem',
      fontFamily: config.fontFamily
    }
  }, t('sampleDonor'), ' '), /*#__PURE__*/React.createElement("span", {
    style: {
      color: effToastAmountColor,
      fontSize: '1rem',
      fontFamily: config.fontFamily
    }
  }, t('sampleDonated'))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'center',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      backgroundColor: effPrimaryButtonBgColor,
      color: config.buttonTextColor,
      padding: '8px 16px',
      fontSize: '0.85rem',
      fontFamily: config.fontFamily,
      textTransform: 'uppercase'
    }
  }, "Primary Action"), /*#__PURE__*/React.createElement("div", {
    style: {
      backgroundColor: effSecondaryButtonBgColor,
      color: config.buttonTextColor,
      padding: '8px 16px',
      fontSize: '0.85rem',
      fontFamily: config.fontFamily,
      textTransform: 'uppercase'
    }
  }, "Secondary Action")), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: `1px dashed ${effDividerColor}`,
      paddingTop: '8px',
      textAlign: 'center',
      fontSize: '0.85rem',
      color: effHighlightColor,
      fontFamily: config.fontFamily
    }
  }, t('sampleDonor'), ": ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: effDonorNameColor,
      fontWeight: 'bold'
    }
  }, "HeroDonor42")))));
};

// ==========================================
// 15. SOUND SETTINGS SECTION
// ==========================================

export const SoundSettingsSection = ({
  styles,
  config,
  updateConfig,
  playSpecificSound,
  handleDeleteSound,
  handleAddSound,
  selectedSoundFile,
  setSelectedSoundFile,
  availableSoundFiles,
  handlePreviewLocalSound,
  handleAddSoundFromList,
  formError,
  effPrimaryButtonBgColor,
  effDividerColor,
  t
}) => {
  const soundFileInputRef = useRef(null);
  return /*#__PURE__*/React.createElement(CollapsibleSection, {
    title: t('soundSettings'),
    isInitiallyCollapsed: true,
    styles: styles
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: config.isSoundEnabled,
    onChange: e => updateConfig({
      isSoundEnabled: e.target.checked
    })
  }), /*#__PURE__*/React.createElement("label", {
    style: {
      ...styles.label,
      opacity: 1,
      cursor: 'pointer'
    }
  }, t('enableSound'))), /*#__PURE__*/React.createElement("label", {
    style: config.isSoundEnabled ? styles.label : {
      ...styles.label,
      opacity: 0.5
    }
  }, t('volume')), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "0",
    max: "1",
    step: "0.01",
    value: config.notificationVolume,
    onChange: e => updateConfig({
      notificationVolume: Number(e.target.value)
    }),
    style: {
      width: '100%',
      cursor: config.isSoundEnabled ? 'pointer' : 'default'
    },
    disabled: !config.isSoundEnabled
  }), /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('donationSound')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '10px',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("select", {
    value: config.selectedSound,
    onChange: e => updateConfig({
      selectedSound: e.target.value
    }),
    style: {
      ...styles.input,
      flexGrow: 1,
      width: 'auto',
      ...(!config.isSoundEnabled && {
        opacity: 0.5
      })
    },
    disabled: !config.isSoundEnabled
  }, /*#__PURE__*/React.createElement("option", {
    value: "default"
  }, t('defaultCoin')), config.customSounds.map(sound => /*#__PURE__*/React.createElement("option", {
    key: sound.id,
    value: sound.id
  }, sound.name))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => playSpecificSound(config.selectedSound),
    disabled: !config.isSoundEnabled,
    style: styles.previewButton
  }, t('preview'))), /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('milestoneSound')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '10px',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("select", {
    value: config.selectedMilestoneSound,
    onChange: e => updateConfig({
      selectedMilestoneSound: e.target.value
    }),
    style: {
      ...styles.input,
      flexGrow: 1,
      width: 'auto',
      ...(!config.isSoundEnabled && {
        opacity: 0.5
      })
    },
    disabled: !config.isSoundEnabled
  }, /*#__PURE__*/React.createElement("option", {
    value: "default-milestone"
  }, t('defaultFanfare')), config.customSounds.map(sound => /*#__PURE__*/React.createElement("option", {
    key: sound.id,
    value: sound.id
  }, sound.name))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => playSpecificSound(config.selectedMilestoneSound),
    disabled: !config.isSoundEnabled,
    style: styles.previewButton
  }, t('preview'))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: `2px dashed ${effDividerColor}`,
      margin: '20px 0 0 0'
    }
  }), /*#__PURE__*/React.createElement("h4", {
    style: {
      ...styles.label,
      opacity: 1,
      fontSize: '1.1rem',
      marginBottom: '0'
    }
  }, t('customSoundLibrary')), /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: '200px',
      overflowY: 'auto'
    }
  }, config.customSounds.map(sound => /*#__PURE__*/React.createElement("div", {
    key: sound.id,
    style: styles.soundItem
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      marginRight: '10px'
    }
  }, sound.name), /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => playSpecificSound(sound.id),
    style: styles.soundButton
  }, t('preview')), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => handleDeleteSound(sound.id),
    style: {
      ...styles.soundButton,
      backgroundColor: config.errorColor
    }
  }, t('delete')))))), /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('uploadSound')), /*#__PURE__*/React.createElement("input", {
    type: "file",
    ref: soundFileInputRef,
    onChange: handleAddSound,
    accept: "audio/mp3,audio/wav,audio/ogg",
    style: {
      display: 'none'
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => soundFileInputRef.current?.click(),
    style: {
      ...styles.button,
      backgroundColor: effPrimaryButtonBgColor,
      color: config.buttonTextColor,
      fontSize: '1rem',
      padding: '10px 20px',
      margin: 0
    }
  }, t('uploadNewSound')), /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('addSoundFromFolder')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '10px'
    }
  }, /*#__PURE__*/React.createElement("select", {
    value: selectedSoundFile,
    onChange: e => setSelectedSoundFile(e.target.value),
    style: {
      ...styles.input,
      flexGrow: 1
    }
  }, availableSoundFiles.length === 0 && /*#__PURE__*/React.createElement("option", {
    value: ""
  }, t('noSoundsFound')), availableSoundFiles.map(file => /*#__PURE__*/React.createElement("option", {
    key: file,
    value: file
  }, file))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: handlePreviewLocalSound,
    disabled: !selectedSoundFile || !config.isSoundEnabled,
    style: styles.previewButton
  }, t('preview')), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: handleAddSoundFromList,
    disabled: availableSoundFiles.length === 0 || !selectedSoundFile,
    style: {
      ...styles.button,
      backgroundColor: effPrimaryButtonBgColor,
      color: config.buttonTextColor,
      fontSize: '1rem',
      padding: '10px 20px',
      margin: 0
    }
  }, t('add'))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.8rem',
      color: config.textColor,
      opacity: 0.7,
      marginTop: '5px',
      marginBottom: '15px'
    }
  }, t('soundFolderHint')), formError && /*#__PURE__*/React.createElement("p", {
    style: {
      ...styles.error,
      marginTop: 0,
      marginBottom: '0'
    },
    role: "alert"
  }, formError));
};

// ==========================================
// 16. SPONSORS CAROUSEL SECTION
// ==========================================

export const SponsorsSection = ({
  styles,
  config,
  updateConfig,
  sponsorNameInput,
  setSponsorNameInput,
  sponsorUrlInput,
  setSponsorUrlInput,
  handleAddSponsorFromUrl,
  handleUploadSponsorFile,
  availableSponsorFiles,
  selectedSponsorFile,
  setSelectedSponsorFile,
  handleAddSponsorFromList,
  handleDeleteSponsor,
  t
}) => {
  return /*#__PURE__*/React.createElement(CollapsibleSection, {
    title: t('sponsors'),
    isInitiallyCollapsed: true,
    styles: styles
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('slideDuration')), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: config.sponsorDisplayDuration,
    onChange: e => updateConfig({
      sponsorDisplayDuration: Math.max(1, Number(e.target.value))
    }),
    style: {
      ...styles.input,
      marginBottom: '1rem'
    },
    min: "1"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: '250px',
      overflowY: 'auto',
      marginBottom: '15px'
    }
  }, config.sponsors.length === 0 && /*#__PURE__*/React.createElement("p", {
    style: {
      color: config.textColor,
      opacity: 0.6
    }
  }, t('noSponsorsAdded')), config.sponsors.map(sponsor => /*#__PURE__*/React.createElement("div", {
    key: sponsor.id,
    style: {
      ...styles.soundItem,
      height: 'auto',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '50px',
      height: '50px',
      marginRight: '15px',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#000'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: sponsor.imageUrl,
    alt: sponsor.name,
    style: {
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: 'contain'
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flexGrow: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, sponsor.name), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => handleDeleteSponsor(sponsor.id),
    style: {
      ...styles.soundButton,
      backgroundColor: config.errorColor
    }
  }, t('delete'))))), /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('addSponsor')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '10px',
      marginBottom: '10px',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: t('sponsorName'),
    value: sponsorNameInput,
    onChange: e => setSponsorNameInput(e.target.value),
    style: {
      ...styles.input,
      flex: '1 1 120px'
    }
  }), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: t('imageUrlPlaceholder'),
    value: sponsorUrlInput,
    onChange: e => setSponsorUrlInput(e.target.value),
    style: {
      ...styles.input,
      flex: '2 1 200px'
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: handleAddSponsorFromUrl,
    disabled: !sponsorUrlInput.trim(),
    style: {
      ...styles.button,
      backgroundColor: config.accentColor1,
      color: config.buttonTextColor,
      fontSize: '0.9rem',
      padding: '10px 15px',
      margin: 0
    }
  }, t('add'))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '15px'
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      ...styles.label,
      margin: 0
    }
  }, t('orUploadImage'), ":"), /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/*",
    onChange: handleUploadSponsorFile,
    style: {
      fontSize: '0.8rem',
      color: config.textColor
    }
  })), availableSponsorFiles.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('addSponsorFromFolder')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '10px'
    }
  }, /*#__PURE__*/React.createElement("select", {
    value: selectedSponsorFile,
    onChange: e => setSelectedSponsorFile(e.target.value),
    style: {
      ...styles.input,
      flexGrow: 1
    }
  }, availableSponsorFiles.map(file => /*#__PURE__*/React.createElement("option", {
    key: file,
    value: file
  }, file))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: handleAddSponsorFromList,
    disabled: !selectedSponsorFile,
    style: {
      ...styles.button,
      backgroundColor: config.accentColor1,
      color: config.buttonTextColor,
      fontSize: '1rem',
      padding: '10px 20px',
      margin: 0
    }
  }, t('add'))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.8rem',
      color: config.textColor,
      opacity: 0.7,
      marginTop: '5px'
    }
  }, t('sponsorFolderHint'))));
};

// ==========================================
// 17. TEXT OVERLAY SECTION
// ==========================================

export const TextOverlaySection = ({
  styles,
  config,
  updateConfig,
  handleUploadTextFile,
  availableTextFiles,
  t
}) => {
  return /*#__PURE__*/React.createElement(CollapsibleSection, {
    title: t('textOverlay'),
    isInitiallyCollapsed: true,
    styles: styles
  }, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('customTextLabel')), /*#__PURE__*/React.createElement("textarea", {
    value: config.customTextContent || '',
    onChange: e => updateConfig({
      customTextContent: e.target.value
    }),
    placeholder: t('customTextPlaceholder'),
    rows: 3,
    style: {
      ...styles.input,
      resize: 'vertical',
      marginBottom: '0.8rem'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '1rem'
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      ...styles.label,
      margin: 0
    }
  }, t('uploadTextFile'), ":"), /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: ".txt,.md",
    onChange: handleUploadTextFile,
    style: {
      fontSize: '0.8rem',
      color: config.textColor
    }
  })), availableTextFiles.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("label", {
    style: styles.label
  }, t('selectTextFile')), /*#__PURE__*/React.createElement("select", {
    value: config.selectedTextFile || '',
    onChange: e => updateConfig({
      selectedTextFile: e.target.value
    }),
    style: {
      ...styles.input,
      marginBottom: '0.5rem'
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "-- ", t('none'), " --"), availableTextFiles.map(file => /*#__PURE__*/React.createElement("option", {
    key: file,
    value: file
  }, file))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.8rem',
      color: config.textColor,
      opacity: 0.7,
      marginTop: '5px'
    }
  }, t('textFolderHint'))), /*#__PURE__*/React.createElement("label", {
    style: {
      ...styles.label,
      marginTop: '1rem'
    }
  }, t('textAlignment')), /*#__PURE__*/React.createElement("select", {
    value: config.textOverlayAlignment || 'top-left',
    onChange: e => updateConfig({
      textOverlayAlignment: e.target.value
    }),
    style: styles.input
  }, /*#__PURE__*/React.createElement("option", {
    value: "top-left"
  }, t('topLeft')), /*#__PURE__*/React.createElement("option", {
    value: "top-center"
  }, t('topCenter')), /*#__PURE__*/React.createElement("option", {
    value: "top-right"
  }, t('topRight')), /*#__PURE__*/React.createElement("option", {
    value: "center-left"
  }, t('centerLeft')), /*#__PURE__*/React.createElement("option", {
    value: "center"
  }, t('center')), /*#__PURE__*/React.createElement("option", {
    value: "center-right"
  }, t('centerRight')), /*#__PURE__*/React.createElement("option", {
    value: "bottom-left"
  }, t('bottomLeft')), /*#__PURE__*/React.createElement("option", {
    value: "bottom-center"
  }, t('bottomCenter')), /*#__PURE__*/React.createElement("option", {
    value: "bottom-right"
  }, t('bottomRight'))), /*#__PURE__*/React.createElement("label", {
    style: {
      ...styles.label,
      marginTop: '1rem'
    }
  }, t('fontSize')), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "0.5",
    max: "5.0",
    step: "0.1",
    value: config.textOverlayFontSize || 1.5,
    onChange: e => updateConfig({
      textOverlayFontSize: Number(e.target.value)
    }),
    style: styles.input
  }));
};

// ==========================================
// 18. PROFILE BACKUP SECTION
// ==========================================

export const ProfileBackupSection = ({
  styles,
  config,
  handleExportConfig,
  handleImportConfig,
  importSuccessMsg,
  effPrimaryButtonBgColor,
  effSecondaryButtonBgColor,
  t
}) => {
  return /*#__PURE__*/React.createElement(CollapsibleSection, {
    title: t('profileBackup'),
    isInitiallyCollapsed: true,
    styles: styles
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: handleExportConfig,
    style: {
      ...styles.button,
      backgroundColor: effSecondaryButtonBgColor,
      color: config.buttonTextColor,
      fontSize: '0.9rem',
      padding: '10px 15px',
      margin: 0,
      flex: 1
    }
  }, t('exportConfig')), /*#__PURE__*/React.createElement("label", {
    style: {
      ...styles.button,
      backgroundColor: effPrimaryButtonBgColor,
      color: config.buttonTextColor,
      fontSize: '0.9rem',
      padding: '10px 15px',
      margin: 0,
      flex: 1,
      textAlign: 'center',
      cursor: 'pointer'
    }
  }, t('importConfig'), /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: ".json",
    onChange: handleImportConfig,
    style: {
      display: 'none'
    }
  }))), importSuccessMsg && /*#__PURE__*/React.createElement("p", {
    style: {
      color: config.successColor,
      fontSize: '0.85rem',
      marginTop: '10px'
    }
  }, importSuccessMsg));
};

// ==========================================
// 19. RE-EXPORTS FOR CONVENIENCE
// ==========================================
export { CollapsibleSection };