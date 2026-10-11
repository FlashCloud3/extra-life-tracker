import React, { useRef } from 'react';
import { CollapsibleSection, QRCodeSvg } from './overlays.js';
import { COLOR_PRESETS } from './constants.js';
import { downloadQRCodePng, downloadQRCodeSvg } from './qr-code.js';

// ==========================================
// 1. LANDING PAGE VIEW
// ==========================================
export interface LandingPageViewProps {
  styles: any;
  dynamicStyles: string;
  config: any;
  profileInput: string;
  setProfileInput: (val: string) => void;
  handleSwitchProfile: (e: React.FormEvent) => void;
  isStandaloneMode: boolean;
  isConnected: boolean;
  t: (key: string, vars?: any) => string;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
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
  return (
    <>
      <style>{dynamicStyles}</style>
      <div style={{
        ...styles.container,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        <div style={{ ...styles.statHero, maxWidth: '600px', width: '100%', padding: '40px' }}>
          <h1 style={{ ...styles.header, marginBottom: '20px' }}>{t('appTitle')}</h1>
          <p style={{ color: config.textColor, marginBottom: '30px', lineHeight: '1.5' }}>{t('welcomeSubtitle')}</p>

          <form onSubmit={handleSwitchProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            <input
              type="text"
              value={profileInput}
              onChange={e => setProfileInput(e.target.value)}
              placeholder={t('enterId')}
              style={{ ...styles.input, fontSize: '1.2rem', padding: '15px', textAlign: 'center' }}
              autoFocus
            />
            <p style={{ fontSize: '0.8rem', color: config.textColor, opacity: 0.6 }}>{t('idHint')}</p>
            <button
              type="submit"
              style={{ ...styles.button, backgroundColor: config.successColor, color: config.buttonTextColor, fontSize: '1.2rem', padding: '15px' }}
            >
              {t('startTracking')}
            </button>
          </form>

          <div style={{ marginTop: '30px', fontSize: '0.8rem', color: config.textColor, opacity: 0.7 }}>
            {isStandaloneMode ? `● ${t('standaloneMode')}` : (isConnected ? `● ${t('connectedServer')}` : `○ ${t('connecting')}`)}
          </div>
        </div>
      </div>
    </>
  );
};

// ==========================================
// 2. DASHBOARD HEADER & PROFILE SWITCHER
// ==========================================
export interface HeaderBarProps {
  styles: any;
  config: any;
  isStandaloneMode: boolean;
  isConnected: boolean;
  lastFetchedAt: Date | null;
  formatLastFetched: (date: Date | null) => string;
  currentProfile: string;
  effSecondaryTextColor: string;
  effPrimaryButtonBgColor: string;
  effHighlightColor: string;
  hexToRgba: (hex: string, alpha: number) => string;
  handleChangeId: () => void;
  dashboardView: 'participant' | 'team';
  setDashboardView: (view: 'participant' | 'team') => void;
  t: (key: string, vars?: any) => string;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
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
  return (
    <>
      <div style={styles.header}>
        <span>{t('appTitle')}</span>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginTop: '6px', flexWrap: 'wrap' }}>
          {isStandaloneMode ? (
            <span style={{ fontSize: '0.5em', color: config.successColor, opacity: 0.9 }}>
              ● {t('standaloneMode')}
            </span>
          ) : !isConnected ? (
            <span style={{ fontSize: '0.5em', color: config.errorColor }}>{t('disconnected')}</span>
          ) : (
            <span style={{ fontSize: '0.5em', color: config.successColor, opacity: 0.7 }}>● {t('connected')}</span>
          )}
          {lastFetchedAt && (
            <span style={{ fontSize: '0.45em', color: config.textColor, opacity: 0.75, fontFamily: 'monospace' }}>
              ⏱ {t('lastFetched')}: {formatLastFetched(lastFetchedAt)}
            </span>
          )}
        </div>
      </div>

      {/* CURRENT PROFILE DISPLAY & CHANGE BUTTON */}
      <div style={{ ...styles.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <span style={{ color: effSecondaryTextColor }}>{t('profile')}: <strong>{currentProfile}</strong></span>
        <button
          type="button"
          onClick={handleChangeId}
          style={{ ...styles.button, margin: 0, padding: '5px 15px', fontSize: '0.8rem', backgroundColor: config.panelColor, border: `1px solid ${config.errorColor}`, color: config.errorColor }}
        >
          {t('changeId')}
        </button>
      </div>

      {/* VIEW MODE TOGGLE (PARTICIPANT vs TEAM DASHBOARD) */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '1.2rem', width: '100%' }}>
        <button
          type="button"
          id="tab-participant-dashboard"
          onClick={() => setDashboardView('participant')}
          style={{
            ...styles.button,
            flex: 1,
            margin: 0,
            padding: '12px 15px',
            fontSize: '0.95rem',
            fontWeight: 'bold',
            backgroundColor: dashboardView === 'participant' ? effPrimaryButtonBgColor : config.panelColor,
            color: dashboardView === 'participant' ? config.buttonTextColor : config.textColor,
            border: `2px solid ${dashboardView === 'participant' ? effHighlightColor : hexToRgba(config.panelBorderColor, 0.4)}`,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          👤 {t('participantDashboard')}
        </button>
        <button
          type="button"
          id="tab-team-dashboard"
          onClick={() => setDashboardView('team')}
          style={{
            ...styles.button,
            flex: 1,
            margin: 0,
            padding: '12px 15px',
            fontSize: '0.95rem',
            fontWeight: 'bold',
            backgroundColor: dashboardView === 'team' ? effPrimaryButtonBgColor : config.panelColor,
            color: dashboardView === 'team' ? config.buttonTextColor : config.textColor,
            border: `2px solid ${dashboardView === 'team' ? effHighlightColor : hexToRgba(config.panelBorderColor, 0.4)}`,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          👥 {t('teamDashboard')}
        </button>
      </div>
    </>
  );
};

// ==========================================
// 3. HERO STATS VIEW
// ==========================================
export interface HeroStatsViewProps {
  styles: any;
  totalRaised: number;
  goal: number;
  progressPercentage: number;
  timeDisplay: string;
  currencyPrefix: string;
  convertAmount: (amt: number) => number;
  t: (key: string, vars?: any) => string;
}

export const HeroStatsView: React.FC<HeroStatsViewProps> = ({
  styles,
  totalRaised,
  goal,
  progressPercentage,
  timeDisplay,
  currencyPrefix,
  convertAmount,
  t
}) => {
  return (
    <div style={styles.statHero}>
      <h2 style={styles.bigStat}>
        {currencyPrefix}{convertAmount(totalRaised).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </h2>
      <p style={styles.secondaryStat}>
        {t('goal')}: {currencyPrefix}{convertAmount(goal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({progressPercentage.toFixed(1)}%)
      </p>
      {timeDisplay && <div style={{ ...styles.timerText, fontSize: '0.9rem', opacity: 0.8 }}>{timeDisplay}</div>}
    </div>
  );
};

// ==========================================
// 4. DONATIONS FEED CARD
// ==========================================
export interface DonationsFeedCardProps {
  styles: any;
  sortedDonations: any[];
  currencyPrefix: string;
  convertAmount: (amt: number) => number;
  effHighlightColor: string;
  effDividerColor: string;
  config: any;
  t: (key: string, vars?: any) => string;
}

export const DonationsFeedCard: React.FC<DonationsFeedCardProps> = ({
  styles,
  sortedDonations,
  currencyPrefix,
  convertAmount,
  effHighlightColor,
  effDividerColor,
  config,
  t
}) => {
  return (
    <div style={{ ...styles.card, border: `2px solid ${effHighlightColor}` }}>
      <h3 style={{ margin: '0 0 10px 0', color: effHighlightColor, borderBottom: `1px dashed ${effDividerColor}`, paddingBottom: '10px' }}>
        {t('recentDonations')}
      </h3>
      <div style={styles.feedContainer}>
        {sortedDonations.length === 0 && <p style={{ color: config.textColor, opacity: 0.7 }}>{t('noDonations')}</p>}
        {sortedDonations.map(d => (
          <div key={d.donationID} style={styles.donationItem}>
            <div style={styles.donationHeader}>
              <span style={styles.donationName}>{d.displayName === 'Anonymous' ? t('anonymous') : d.displayName}</span>
              <span style={styles.donationAmount}>{currencyPrefix}{convertAmount(d.amount).toFixed(2)}</span>
            </div>
            {d.message && <div style={styles.donationMessage}>{d.message}</div>}
            <div style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '5px', fontFamily: 'monospace', color: config.textColor }}>
              {new Date(d.createdDateUTC).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 5. QUICK ACTIONS CARD
// ==========================================
export interface QuickActionsCardProps {
  styles: any;
  effSecondaryButtonBgColor: string;
  config: any;
  onTestDonation: () => void;
  onManualSync: () => void;
  onClearOverlays: () => void;
  t: (key: string, vars?: any) => string;
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  styles,
  effSecondaryButtonBgColor,
  config,
  onTestDonation,
  onManualSync,
  onClearOverlays,
  t
}) => {
  return (
    <div style={styles.card}>
      <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
        <button
          type="button"
          onClick={onTestDonation}
          style={{ ...styles.button, backgroundColor: effSecondaryButtonBgColor, color: config.buttonTextColor, margin: 0, flex: 1, fontSize: '0.9rem', padding: '10px' }}
        >
          {t('testDonation')}
        </button>
        <button
          type="button"
          onClick={onManualSync}
          style={{ ...styles.button, backgroundColor: config.successColor, color: config.buttonTextColor, flex: 1, margin: 0, fontSize: '0.9rem', padding: '10px' }}
        >
          {t('resyncData')}
        </button>
      </div>
      <button
        type="button"
        onClick={onClearOverlays}
        style={{ ...styles.button, backgroundColor: config.errorColor, color: config.buttonTextColor, margin: 0, width: '100%', fontSize: '0.9rem', padding: '10px' }}
      >
        {t('clearStop')}
      </button>
    </div>
  );
};

// ==========================================
// 6. SECONDARY STATS CARD
// ==========================================
export interface SecondaryStatsCardProps {
  styles: any;
  effSecondaryTextColor: string;
  teamTotalRaised: number;
  sortedDonations: any[];
  currencyPrefix: string;
  convertAmount: (amt: number) => number;
  t: (key: string, vars?: any) => string;
}

export const SecondaryStatsCard: React.FC<SecondaryStatsCardProps> = ({
  styles,
  effSecondaryTextColor,
  teamTotalRaised,
  sortedDonations,
  currencyPrefix,
  convertAmount,
  t
}) => {
  return (
    <div style={styles.card}>
      <p style={{ margin: 0, color: effSecondaryTextColor }}>
        {t('teamRaised')}: {currencyPrefix}{convertAmount(teamTotalRaised).toFixed(2)}
      </p>
      <p style={{ margin: 0, color: effSecondaryTextColor, fontSize: '0.85rem', marginTop: '5px' }}>
        {t('lastDonator')}: {sortedDonations.length > 0 ? (sortedDonations[0].displayName === 'Anonymous' ? t('anonymous') : sortedDonations[0].displayName) : t('none')}
      </p>
    </div>
  );
};

// ==========================================
// 7. QR QUICK CARD
// ==========================================
export interface QrQuickCardProps {
  styles: any;
  config: any;
  effHighlightColor: string;
  effHeaderColor: string;
  effSecondaryTextColor: string;
  effDividerColor: string;
  effPrimaryButtonBgColor: string;
  effSecondaryButtonBgColor: string;
  effectiveQrUrl: string;
  activeParticipantId: string;
  copyFeedback: string | null;
  hexToRgba: (hex: string, alpha: number) => string;
  onCopyQrLink: () => void;
  openOverlay: (type: string, features?: string) => void;
  t: (key: string, vars?: any) => string;
}

export const QrQuickCard: React.FC<QrQuickCardProps> = ({
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

  return (
    <div style={{ ...styles.card, border: `2px solid ${effHighlightColor}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px dashed ${effDividerColor}`, paddingBottom: '8px' }}>
        <h3 style={{ margin: 0, color: effHeaderColor, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📱 {t('qrCardTitle')}
        </h3>
        <span style={{ fontSize: '0.7rem', color: effHighlightColor, backgroundColor: hexToRgba(effHighlightColor, 0.15), padding: '2px 8px', borderRadius: '10px' }}>
          {config.qrLinkType === 'page' ? t('qrLinkPage') : t('qrLinkDonation')}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', marginTop: '6px' }}>
        <div style={{
          padding: '10px',
          backgroundColor: config.qrTransparentBg ? hexToRgba(config.panelColor, 0.8) : (config.qrBgColor || '#ffffff'),
          border: `1px solid ${hexToRgba(config.panelBorderColor, 0.5)}`,
          borderRadius: '8px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <QRCodeSvg
            url={effectiveQrUrl}
            size={140}
            fgColor={config.qrFgColor || '#000000'}
            bgColor={config.qrTransparentBg ? 'transparent' : (config.qrBgColor || '#ffffff')}
            errorCorrectionLevel={config.qrErrorCorrection || 'M'}
            title={t('qrCardTitle')}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 200px' }}>
          <p style={{ margin: 0, fontSize: '0.78rem', color: effSecondaryTextColor, lineHeight: 1.4 }}>
            {t('qrScanInstructions')}
          </p>

          <div style={{
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
          }}>
            {effectiveQrUrl}
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onCopyQrLink}
              style={{ ...styles.button, margin: 0, padding: '6px 10px', fontSize: '0.75rem', backgroundColor: effPrimaryButtonBgColor, color: config.buttonTextColor, flex: 1 }}
            >
              📋 {copyFeedback === 'qr-link' ? t('copied') : t('copyLink')}
            </button>
            <button
              type="button"
              onClick={() => openOverlay('qrcode', 'width=450,height=520')}
              style={{ ...styles.button, margin: 0, padding: '6px 10px', fontSize: '0.75rem', backgroundColor: config.panelColor, border: `1px solid ${effSecondaryButtonBgColor}`, color: config.textColor, flex: 1 }}
            >
              ↗ {t('openPopup')}
            </button>
            <button
              type="button"
              onClick={() => downloadQRCodePng(effectiveQrUrl, `extralife-qr-${activeParticipantId}.png`, 1024, config.qrFgColor, config.qrBgColor, config.qrErrorCorrection)}
              style={{ ...styles.button, margin: 0, padding: '6px 10px', fontSize: '0.75rem', backgroundColor: hexToRgba(config.panelBorderColor, 0.2), border: `1px solid ${config.panelBorderColor}`, color: config.textColor, flex: 1 }}
            >
              💾 PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 8. OVERLAY LINKS SECTION
// ==========================================
export interface OverlayLinksSectionProps {
  styles: any;
  config: any;
  effPrimaryButtonBgColor: string;
  effSecondaryButtonBgColor: string;
  hexToRgba: (hex: string, alpha: number) => string;
  copyFeedback: string | null;
  openOverlay: (type: string, features?: string) => void;
  handleCopyUrl: (type: string) => void;
  t: (key: string, vars?: any) => string;
}

export const OverlayLinksSection: React.FC<OverlayLinksSectionProps> = ({
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
  const overlaysList = [
    { title: t('progressBar'), fn: () => openOverlay('progress', 'width=800,height=150'), type: 'progress' },
    { title: t('notifications'), fn: () => openOverlay('notifications', 'width=800,height=600'), type: 'notifications' },
    { title: t('nextMilestone'), fn: () => openOverlay('milestone', 'width=800,height=180'), type: 'milestone' },
    { title: t('teamHeaderOverlay'), fn: () => openOverlay('team-header', 'width=850,height=220'), type: 'team-header' },
    { title: t('teamDonationsOverlay'), fn: () => openOverlay('team-donations', 'width=500,height=750'), type: 'team-donations' },
    { title: t('teamDashboardOverlay'), fn: () => openOverlay('team-dashboard', 'width=1280,height=850'), type: 'team-dashboard' },
    { title: t('qrCodeOverlayLink'), fn: () => openOverlay('qrcode', 'width=450,height=520'), type: 'qrcode' },
    { title: t('celebration'), fn: () => openOverlay('celebration', 'width=1920,height=1080'), type: 'celebration' },
    { title: t('schedule'), fn: () => openOverlay('schedule', 'width=600,height=400'), type: 'schedule' },
    { title: t('sponsorsOverlay'), fn: () => openOverlay('sponsors', 'width=300,height=150'), type: 'sponsors' },
    { title: t('textOverlayLink'), fn: () => openOverlay('text', 'width=800,height=600'), type: 'text' }
  ];

  return (
    <CollapsibleSection title={t('overlayLinks')} isInitiallyCollapsed={true} styles={styles}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', width: '100%' }}>
        {overlaysList.map(overlay => (
          <div key={overlay.title} style={{ ...styles.card, padding: '10px', gap: '5px', backgroundColor: hexToRgba(config.panelColor, 0.5) }}>
            <h4 style={{ margin: '0', color: config.textColor, textAlign: 'left', fontSize: '0.8rem' }}>{overlay.title}</h4>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button
                type="button"
                onClick={overlay.fn}
                style={{ ...styles.button, backgroundColor: config.panelColor, border: `1px solid ${effSecondaryButtonBgColor}`, color: config.textColor, marginTop: 0, flex: 1, fontSize: '0.7rem', padding: '5px' }}
              >
                {t('openPopup')}
              </button>
              <button
                type="button"
                onClick={() => handleCopyUrl(overlay.type)}
                style={{ ...styles.button, backgroundColor: effPrimaryButtonBgColor, color: config.buttonTextColor, marginTop: 0, flex: 1, fontSize: '0.7rem', padding: '5px' }}
              >
                {copyFeedback === overlay.type ? t('copied') : t('copyLink')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
};

// ==========================================
// 9. CORE SETUP SECTION
// ==========================================
export interface CoreSetupSectionProps {
  styles: any;
  config: any;
  currentProfile: string;
  participantIdInput: string;
  setParticipantIdInput: (val: string) => void;
  teamIdInput: string;
  setTeamIdInput: (val: string) => void;
  updateConfig: (updates: any) => void;
  fetchClientSideData: () => void;
  lastFetchTimeRef?: React.MutableRefObject<number>;
  conversionRate: number;
  effectiveRate: number;
  websiteTotalInput?: string;
  setWebsiteTotalInput?: (val: string) => void;
  fetchConversionRate?: (force?: boolean) => void;
  totalRaised: number;
  goal: number;
  effSecondaryTextColor: string;
  effSecondaryButtonBgColor: string;
  hexToRgba: (hex: string, alpha: number) => string;
  t: (key: string, vars?: any) => string;
}

export const CoreSetupSection: React.FC<CoreSetupSectionProps> = ({
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
    updateConfig({ customExchangeRate: 0 });
    fetchConversionRate?.(true);
  };

  return (
    <CollapsibleSection title={t('coreSetup')} isInitiallyCollapsed={true} styles={styles}>
      <label style={styles.label}>{t('language')}</label>
      <select
        value={config.language}
        onChange={(e) => updateConfig({ language: e.target.value })}
        style={styles.input}
      >
        <option value="en">English</option>
        <option value="fr">Français</option>
      </select>

      <label style={styles.label}>{t('participantId')}</label>
      <input
        type="text"
        value={participantIdInput}
        onChange={(e) => setParticipantIdInput(e.target.value)}
        style={{
          ...styles.input,
          ...(currentProfile !== 'default' && { opacity: 0.6, cursor: 'not-allowed' })
        }}
        placeholder={t('enterId')}
        readOnly={currentProfile !== 'default'}
        title={currentProfile !== 'default' ? t('managedByProfile') : ''}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="checkbox"
          checked={config.useParticipantTeamId}
          onChange={e => {
            const checked = e.target.checked;
            updateConfig({ useParticipantTeamId: checked });
            if (checked) {
              if (lastFetchTimeRef) {
                lastFetchTimeRef.current = 0;
              }
              setTimeout(fetchClientSideData, 50);
            }
          }}
        />
        <label style={{ ...styles.label, opacity: 1, cursor: 'pointer', flexGrow: 1 }}>{t('autoDetect')}</label>
      </div>

      <label style={config.useParticipantTeamId ? { ...styles.label, opacity: 0.75 } : styles.label}>{t('teamId')}</label>
      <input
        type="text"
        value={config.useParticipantTeamId ? (config.teamId || teamIdInput) : teamIdInput}
        onChange={(e) => {
          setTeamIdInput(e.target.value);
          updateConfig({ teamId: e.target.value });
        }}
        placeholder={config.useParticipantTeamId ? (config.teamId || t('autoDetect')) : t('teamId')}
        style={{ ...styles.input, ...(config.useParticipantTeamId && { backgroundColor: hexToRgba(config.panelColor, 0.5), cursor: 'not-allowed' }) }}
        disabled={config.useParticipantTeamId}
      />

      <label style={styles.label}>{t('refreshSeconds')}</label>
      <input
        type="number"
        value={config.refreshInterval === 0 ? '' : config.refreshInterval}
        onChange={(e) => {
          const val = e.target.value;
          const parsed = val === '' ? 0 : parseInt(val, 10);
          updateConfig({ refreshInterval: isNaN(parsed) ? 60 : parsed });
        }}
        onBlur={() => {
          if (!config.refreshInterval || config.refreshInterval < 60) {
            updateConfig({ refreshInterval: 60 });
          }
        }}
        style={styles.input}
        min={60}
        placeholder="60"
      />

      <label style={styles.label}>{t('currency')}</label>
      <select
        value={config.currency}
        onChange={(e) => updateConfig({ currency: e.target.value as 'USD' | 'CAD' })}
        style={styles.input}
      >
        <option value="USD">USD ($)</option>
        <option value="CAD">CAD (C$)</option>
      </select>

      {config.currency === 'CAD' && (
        <div style={{ marginTop: '8px', marginBottom: '14px', padding: '10px', backgroundColor: hexToRgba(config.panelBorderColor, 0.1), border: `1px solid ${hexToRgba(config.panelBorderColor, 0.3)}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ fontSize: '0.85rem', color: effSecondaryTextColor }}>
              {t('exchangeRate')}: <strong>1 USD = {effectiveRate.toFixed(4)} CAD</strong>
              {config.customExchangeRate > 0 && (
                <span style={{ marginLeft: '6px', fontSize: '0.72rem', opacity: 0.8, color: config.textColor }}>
                  ({t('customExchangeRate')})
                </span>
              )}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {Boolean(config.customExchangeRate || currentWebsiteTotal) && (
                <button
                  type="button"
                  onClick={handleResetRate}
                  style={{ ...styles.button, margin: 0, padding: '3px 8px', fontSize: '0.75rem', backgroundColor: hexToRgba(config.panelBorderColor, 0.2), border: `1px solid ${config.panelBorderColor}`, color: config.textColor }}
                  title={t('clearRateTitle')}
                >
                  ✕ {t('clearExchangeRate')}
                </button>
              )}
              <button
                type="button"
                onClick={handleResetRate}
                style={{ ...styles.button, margin: 0, padding: '3px 8px', fontSize: '0.75rem', backgroundColor: config.panelColor, border: `1px solid ${effSecondaryButtonBgColor}`, color: effSecondaryButtonBgColor }}
                title={t('refreshRateTitle')}
              >
                ↻ {t('refreshRate')} ({t('live')})
              </button>
            </div>
          </div>

          <label style={{ ...styles.label, fontSize: '0.75rem', margin: '6px 0 3px 0' }}>
            {t('customExchangeRate')} ({t('customRateHelp')})
          </label>
          <input
            type="number"
            step="0.0001"
            value={config.customExchangeRate === 0 || !config.customExchangeRate ? '' : config.customExchangeRate}
            placeholder={t('liveRatePlaceholder', { rate: conversionRate > 1 ? conversionRate.toFixed(4) : '1.36' })}
            onChange={(e) => {
              const val = e.target.value;
              updateWebsiteTotal('');
              updateConfig({ customExchangeRate: val === '' ? 0 : parseFloat(val) });
            }}
            style={{ ...styles.input, marginBottom: '10px', fontSize: '0.85rem', padding: '6px' }}
          />

          <label style={{ ...styles.label, fontSize: '0.75rem', margin: '4px 0 3px 0' }}>
            {t('websiteTotalLabel')}
          </label>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: config.textColor, opacity: 0.8, fontWeight: 'bold' }}>C$</span>
            <input
              type="number"
              step="0.01"
              value={currentWebsiteTotal}
              placeholder={totalRaised > 0 ? (totalRaised * effectiveRate).toFixed(2) : (goal > 0 ? (goal * effectiveRate).toFixed(2) : 'e.g. 138.45')}
              onChange={(e) => {
                const val = e.target.value;
                updateWebsiteTotal(val);
                const parsedCad = parseFloat(val);
                const baseUsd = totalRaised > 0 ? totalRaised : goal;
                if (!isNaN(parsedCad) && parsedCad > 0 && baseUsd > 0) {
                  const calculated = parseFloat((parsedCad / baseUsd).toFixed(4));
                  updateConfig({ customExchangeRate: calculated });
                } else if (val === '') {
                  updateConfig({ customExchangeRate: 0 });
                }
              }}
              style={{ ...styles.input, marginBottom: 0, fontSize: '0.85rem', padding: '6px', flex: 1 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap', gap: '4px' }}>
            <div style={{ fontSize: '0.72rem', color: effSecondaryTextColor, opacity: 0.85 }}>
              {totalRaised > 0
                ? `${t('calculatedRateNotice', { usd: totalRaised.toFixed(2) })}`
                : (goal > 0
                  ? `${t('calculatedRateNotice', { usd: goal.toFixed(2) })}`
                  : t('websiteTotalHelp'))}
            </div>
            {Boolean(config.customExchangeRate || currentWebsiteTotal) && (
              <button
                type="button"
                onClick={handleResetRate}
                style={{ ...styles.button, margin: 0, padding: '2px 6px', fontSize: '0.7rem', backgroundColor: 'transparent', border: `1px solid ${config.panelBorderColor}`, color: config.textColor, cursor: 'pointer' }}
              >
                ✕ {t('clearExchangeRate')}
              </button>
            )}
          </div>
        </div>
      )}

      <label style={{ ...styles.label, marginTop: '12px' }}>{t('milestoneCalculation')}</label>
      <select
        value={config.milestoneProgressMode || 'cumulative'}
        onChange={(e) => updateConfig({ milestoneProgressMode: e.target.value as 'cumulative' | 'relative' })}
        style={styles.input}
      >
        <option value="cumulative">{t('milestoneCumulative')}</option>
        <option value="relative">{t('milestoneStep')}</option>
      </select>
    </CollapsibleSection>
  );
};

// ==========================================
// 10. QR CODE SETTINGS SECTION
// ==========================================
export interface QrCodeSectionProps {
  styles: any;
  config: any;
  updateConfig: (updates: any) => void;
  effectiveQrUrl: string;
  activeParticipantId: string;
  copyFeedback: string | null;
  effHighlightColor: string;
  effHeaderColor: string;
  effSecondaryTextColor: string;
  effPrimaryButtonBgColor: string;
  effSecondaryButtonBgColor: string;
  hexToRgba: (hex: string, alpha: number) => string;
  onCopyQrLink: () => void;
  openOverlay: (type: string, features?: string) => void;
  t: (key: string, vars?: any) => string;
}

export const QrCodeSection: React.FC<QrCodeSectionProps> = ({
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
  return (
    <CollapsibleSection title={t('qrCodeSection')} isInitiallyCollapsed={true} styles={styles}>
      <p style={{ fontSize: '0.85rem', color: effSecondaryTextColor, margin: '0 0 15px 0', lineHeight: 1.5 }}>
        {t('qrCodeSectionHelp')}
      </p>

      {/* Link destination choices */}
      <label style={{ ...styles.label, marginBottom: '8px' }}>{t('qrLinkVersion')}</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {/* Version 1: Participant Page */}
        <label style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '12px',
          backgroundColor: config.qrLinkType === 'page' ? hexToRgba(effHighlightColor, 0.12) : hexToRgba(config.panelBorderColor, 0.1),
          border: `2px solid ${config.qrLinkType === 'page' ? effHighlightColor : hexToRgba(config.panelBorderColor, 0.3)}`,
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}>
          <input
            type="radio"
            name="qrLinkType"
            value="page"
            checked={config.qrLinkType === 'page'}
            onChange={() => updateConfig({ qrLinkType: 'page' })}
            style={{ marginTop: '3px' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
            <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: config.textColor }}>
              {t('qrLinkPage')}
            </span>
            <span style={{ fontSize: '0.78rem', color: effSecondaryTextColor }}>
              {t('qrLinkPageDesc')}
            </span>
            <span style={{ fontSize: '0.72rem', color: effHighlightColor, fontFamily: 'monospace', marginTop: '2px', wordBreak: 'break-all' }}>
              https://dd.extra-life.org/participants/{activeParticipantId}
            </span>
          </div>
        </label>

        {/* Version 2: Direct Donation Page */}
        <label style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '12px',
          backgroundColor: config.qrLinkType === 'donation' || !config.qrLinkType ? hexToRgba(effHighlightColor, 0.12) : hexToRgba(config.panelBorderColor, 0.1),
          border: `2px solid ${config.qrLinkType === 'donation' || !config.qrLinkType ? effHighlightColor : hexToRgba(config.panelBorderColor, 0.3)}`,
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}>
          <input
            type="radio"
            name="qrLinkType"
            value="donation"
            checked={config.qrLinkType === 'donation' || !config.qrLinkType}
            onChange={() => updateConfig({ qrLinkType: 'donation' })}
            style={{ marginTop: '3px' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: config.textColor }}>
                {t('qrLinkDonation')}
              </span>
              <span style={{ fontSize: '0.65rem', backgroundColor: config.successColor, color: config.buttonTextColor, padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                FAST DONATE
              </span>
            </div>
            <span style={{ fontSize: '0.78rem', color: effSecondaryTextColor }}>
              {t('qrLinkDonationDesc')}
            </span>
            <span style={{ fontSize: '0.72rem', color: effHighlightColor, fontFamily: 'monospace', marginTop: '2px', wordBreak: 'break-all' }}>
              https://dd.extra-life.org/index.cfm?fuseaction=twitchDonate.participant&participantID={activeParticipantId}
            </span>
          </div>
        </label>

        {/* Version 3: Custom URL */}
        <label style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '12px',
          backgroundColor: config.qrLinkType === 'custom' ? hexToRgba(effHighlightColor, 0.12) : hexToRgba(config.panelBorderColor, 0.1),
          border: `2px solid ${config.qrLinkType === 'custom' ? effHighlightColor : hexToRgba(config.panelBorderColor, 0.3)}`,
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}>
          <input
            type="radio"
            name="qrLinkType"
            value="custom"
            checked={config.qrLinkType === 'custom'}
            onChange={() => updateConfig({ qrLinkType: 'custom' })}
            style={{ marginTop: '3px' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
            <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: config.textColor }}>
              {t('qrLinkCustom')}
            </span>
            {config.qrLinkType === 'custom' && (
              <input
                type="url"
                value={config.qrCustomUrl || ''}
                onChange={(e) => updateConfig({ qrCustomUrl: e.target.value })}
                placeholder={t('qrLinkCustomPlaceholder')}
                style={{ ...styles.input, fontSize: '0.85rem', padding: '6px 10px', marginTop: '6px' }}
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        </label>
      </div>

      {/* Resolved Target URL Preview & Actions */}
      <label style={{ ...styles.label, marginTop: '8px' }}>{t('qrTargetUrl')}</label>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'stretch' }}>
        <input
          type="text"
          readOnly
          value={effectiveQrUrl}
          style={{ ...styles.input, flex: 1, fontFamily: 'monospace', fontSize: '0.82rem', opacity: 0.9, backgroundColor: hexToRgba(config.panelBorderColor, 0.1) }}
        />
        <a
          href={effectiveQrUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
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
          }}
        >
          ↗ {t('qrOpenUrl')}
        </a>
        <button
          type="button"
          onClick={onCopyQrLink}
          style={{ ...styles.button, margin: 0, padding: '8px 12px', fontSize: '0.78rem', backgroundColor: effPrimaryButtonBgColor, color: config.buttonTextColor, whiteSpace: 'nowrap' }}
        >
          📋 {copyFeedback === 'qr-link' ? t('copied') : t('qrCopyUrl')}
        </button>
      </div>

      {/* Title & Subtitle */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <div>
          <label style={styles.label}>{t('qrTitleLabel')}</label>
          <input
            type="text"
            value={config.qrTitle || ''}
            onChange={(e) => updateConfig({ qrTitle: e.target.value })}
            placeholder={t('qrDefaultTitle')}
            style={{ ...styles.input, fontSize: '0.9rem' }}
          />
        </div>
        <div>
          <label style={styles.label}>{t('qrSubtitleLabel')}</label>
          <input
            type="text"
            value={config.qrSubtitle || ''}
            onChange={(e) => updateConfig({ qrSubtitle: e.target.value })}
            placeholder={t('qrSubtitlePlaceholder')}
            style={{ ...styles.input, fontSize: '0.9rem' }}
          />
        </div>
      </div>

      {/* Colors & Style Presets */}
      <label style={{ ...styles.label, marginBottom: '6px' }}>{t('qrColors')}</label>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <button
          type="button"
          onClick={() => updateConfig({ qrFgColor: '#000000', qrBgColor: '#ffffff', qrTransparentBg: false })}
          style={{
            ...styles.button,
            margin: 0,
            padding: '6px 12px',
            fontSize: '0.75rem',
            backgroundColor: '#ffffff',
            color: '#000000',
            border: '1px solid #cccccc'
          }}
        >
          ⚪ {t('qrPresetContrast')}
        </button>
        <button
          type="button"
          onClick={() => updateConfig({ qrFgColor: effHighlightColor, qrBgColor: config.panelColor, qrTransparentBg: false })}
          style={{
            ...styles.button,
            margin: 0,
            padding: '6px 12px',
            fontSize: '0.75rem',
            backgroundColor: config.panelColor,
            color: effHighlightColor,
            border: `1px solid ${effHighlightColor}`
          }}
        >
          🎨 {t('qrPresetTheme')}
        </button>
        <button
          type="button"
          onClick={() => updateConfig({ qrFgColor: '#ffffff', qrBgColor: 'transparent', qrTransparentBg: true })}
          style={{
            ...styles.button,
            margin: 0,
            padding: '6px 12px',
            fontSize: '0.75rem',
            backgroundColor: 'rgba(255,255,255,0.1)',
            color: '#ffffff',
            border: '1px dashed #ffffff'
          }}
        >
          ✨ {t('qrPresetInverted')}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ ...styles.label, margin: 0, fontSize: '0.85rem' }}>{t('qrFgColor')}:</label>
          <input
            type="color"
            value={config.qrFgColor || '#000000'}
            onChange={(e) => updateConfig({ qrFgColor: e.target.value })}
            style={styles.colorInput}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: config.qrTransparentBg ? 0.4 : 1 }}>
          <label style={{ ...styles.label, margin: 0, fontSize: '0.85rem' }}>{t('qrBgColor')}:</label>
          <input
            type="color"
            value={config.qrBgColor && config.qrBgColor !== 'transparent' ? config.qrBgColor : '#ffffff'}
            onChange={(e) => updateConfig({ qrBgColor: e.target.value, qrTransparentBg: false })}
            disabled={Boolean(config.qrTransparentBg)}
            style={styles.colorInput}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            id="checkbox-qr-transparent"
            checked={Boolean(config.qrTransparentBg)}
            onChange={(e) => updateConfig({ qrTransparentBg: e.target.checked })}
          />
          <label htmlFor="checkbox-qr-transparent" style={{ ...styles.label, margin: 0, cursor: 'pointer', fontSize: '0.85rem' }}>
            {t('qrTransparentBg')}
          </label>
        </div>
      </div>

      {/* Size & Dashboard Card Toggle */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '18px' }}>
        <div>
          <label style={styles.label}>{t('qrSizeLabel')} ({config.qrSize || 220}px)</label>
          <input
            type="range"
            min="140"
            max="360"
            step="10"
            value={config.qrSize || 220}
            onChange={(e) => updateConfig({ qrSize: Number(e.target.value) })}
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '18px' }}>
            <input
              type="checkbox"
              id="checkbox-qr-dashboard"
              checked={config.qrShowCardInDashboard !== false}
              onChange={(e) => updateConfig({ qrShowCardInDashboard: e.target.checked })}
            />
            <label htmlFor="checkbox-qr-dashboard" style={{ ...styles.label, margin: 0, cursor: 'pointer', fontSize: '0.85rem' }}>
              {t('qrShowInDashboard')}
            </label>
          </div>
        </div>
      </div>

      {/* Live Preview & Download Card */}
      <div style={{
        ...styles.card,
        backgroundColor: hexToRgba(config.panelBorderColor, 0.08),
        border: `2px solid ${effHighlightColor}`,
        padding: '16px',
        alignItems: 'center',
        gap: '14px'
      }}>
        <h4 style={{ margin: 0, color: effHeaderColor, fontSize: '0.95rem' }}>
          {t('qrPreview')}
        </h4>

        <div style={{
          padding: '16px',
          backgroundColor: config.qrTransparentBg ? hexToRgba(config.panelColor, 0.9) : (config.qrBgColor || '#ffffff'),
          borderRadius: '10px',
          border: `1px solid ${hexToRgba(config.panelBorderColor, 0.4)}`,
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
        }}>
          {config.qrTitle && (
            <div style={{
              fontSize: '0.9rem',
              fontWeight: 'bold',
              color: config.qrTransparentBg ? config.textColor : (config.qrFgColor || '#000000'),
              fontFamily: config.fontFamily,
              textAlign: 'center',
              marginBottom: '4px'
            }}>
              {config.qrTitle}
            </div>
          )}
          <QRCodeSvg
            url={effectiveQrUrl}
            size={Math.min(220, config.qrSize || 220)}
            fgColor={config.qrFgColor || '#000000'}
            bgColor={config.qrTransparentBg ? 'transparent' : (config.qrBgColor || '#ffffff')}
            errorCorrectionLevel={config.qrErrorCorrection || 'M'}
            title={config.qrTitle || 'Extra Life Donation QR'}
          />
          {config.qrSubtitle && (
            <div style={{
              fontSize: '0.72rem',
              color: config.qrTransparentBg ? effSecondaryTextColor : '#555555',
              textAlign: 'center',
              maxWidth: '200px'
            }}>
              {config.qrSubtitle}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '500px' }}>
          <button
            type="button"
            onClick={() => downloadQRCodePng(effectiveQrUrl, `extralife-donation-qr-${activeParticipantId}.png`, 1024, config.qrFgColor, config.qrTransparentBg ? 'transparent' : config.qrBgColor, config.qrErrorCorrection)}
            style={{ ...styles.button, margin: 0, padding: '8px 14px', fontSize: '0.8rem', backgroundColor: effPrimaryButtonBgColor, color: config.buttonTextColor, flex: 1 }}
          >
            💾 {t('qrDownloadPng')} (1024px)
          </button>
          <button
            type="button"
            onClick={() => downloadQRCodeSvg(effectiveQrUrl, `extralife-donation-qr-${activeParticipantId}.svg`, config.qrFgColor, config.qrTransparentBg ? 'transparent' : config.qrBgColor, config.qrErrorCorrection)}
            style={{ ...styles.button, margin: 0, padding: '8px 14px', fontSize: '0.8rem', backgroundColor: config.panelColor, border: `1px solid ${effSecondaryButtonBgColor}`, color: config.textColor, flex: 1 }}
          >
            📐 {t('qrDownloadSvg')}
          </button>
          <button
            type="button"
            onClick={() => openOverlay('qrcode', 'width=450,height=520')}
            style={{ ...styles.button, margin: 0, padding: '8px 14px', fontSize: '0.8rem', backgroundColor: hexToRgba(config.panelBorderColor, 0.25), border: `1px solid ${config.panelBorderColor}`, color: config.textColor, flex: 1 }}
          >
            ↗ {t('openPopup')}
          </button>
        </div>
      </div>
    </CollapsibleSection>
  );
};

// ==========================================
// 11. TWITCH INTEGRATION SECTION
// ==========================================
export interface TwitchSectionProps {
  styles: any;
  config: any;
  updateConfig: (updates: any) => void;
  commandTrigger: string;
  setCommandTrigger: (val: string) => void;
  commandResponse: string;
  setCommandResponse: (val: string) => void;
  handleAddCommand: () => void;
  handleDeleteCommand: (id: string) => void;
  handleGetTwitchToken: () => void;
  effHighlightColor: string;
  effHeaderColor: string;
  effSecondaryTextColor: string;
  effPrimaryButtonBgColor: string;
  effDividerColor: string;
  t: (key: string, vars?: any) => string;
}

export const TwitchSection: React.FC<TwitchSectionProps> = ({
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
  return (
    <CollapsibleSection title={t('twitchIntegration')} isInitiallyCollapsed={true} styles={styles}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: `1px dashed ${effDividerColor}`, paddingBottom: '10px' }}>
        <input
          type="checkbox"
          checked={config.twitchEnabled}
          onChange={e => updateConfig({ twitchEnabled: e.target.checked })}
        />
        <label style={{ ...styles.label, opacity: 1, cursor: 'pointer', fontWeight: 'bold' }}>{t('twitchEnabled')}</label>
      </div>

      <div style={{ opacity: config.twitchEnabled ? 1 : 0.5, pointerEvents: config.twitchEnabled ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <input
            type="checkbox"
            checked={config.twitchEnableAlerts}
            onChange={e => updateConfig({ twitchEnableAlerts: e.target.checked })}
          />
          <label style={{ ...styles.label, opacity: 1, cursor: 'pointer' }}>{t('twitchEnableAlerts')}</label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <input
            type="checkbox"
            checked={config.twitchEnableCommands}
            onChange={e => updateConfig({ twitchEnableCommands: e.target.checked })}
          />
          <label style={{ ...styles.label, opacity: 1, cursor: 'pointer' }}>{t('twitchEnableCommands')}</label>
        </div>
        <label style={styles.label}>{t('twitchChannel')}</label>
        <input
          type="text"
          value={config.twitchChannel}
          onChange={(e) => updateConfig({ twitchChannel: e.target.value })}
          style={styles.input}
        />

        <label style={styles.label}>{t('twitchToken')}</label>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="password"
            value={config.twitchToken}
            onChange={(e) => updateConfig({ twitchToken: e.target.value })}
            placeholder="oauth:xxxxxxxxxxxxxx"
            style={{ ...styles.input, flex: 1 }}
          />
          <button
            type="button"
            onClick={handleGetTwitchToken}
            style={{ ...styles.button, backgroundColor: effPrimaryButtonBgColor, color: config.buttonTextColor, fontSize: '0.9rem', padding: '10px 14px', margin: 0, whiteSpace: 'nowrap' }}
            title={t('getTwitchToken')}
          >
            🔑 {t('getTwitchToken')}
          </button>
        </div>
        <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '6px', textAlign: 'left' }}>
          <span>{t('twitchTokenHelp')} </span>
          <a
            href="https://twitchtokengenerator.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: effHighlightColor, textDecoration: 'underline' }}
          >
            {t('twitchTokenExternalLink')}
          </a>
        </div>

        <div style={{ borderTop: `2px dashed ${effDividerColor}`, margin: '20px 0' }} />

        <h4 style={{ ...styles.label, opacity: 1, fontSize: '1.1rem', marginBottom: '10px' }}>{t('chatCommands')}</h4>

        <div style={{ marginBottom: '15px' }}>
          <h5 style={{ color: effHeaderColor, margin: '0 0 5px 0', fontSize: '0.9rem' }}>{t('builtinCommands')}</h5>
          <ul style={{ color: config.textColor, fontSize: '0.85rem', margin: 0, paddingLeft: '20px', opacity: 0.8, textAlign: 'left' }}>
            <li><strong>!total</strong> - {t('builtinTotalDesc')}</li>
            <li><strong>!goal</strong> - {t('builtinGoalDesc')}</li>
            <li><strong>!milestone</strong> - {t('builtinMilestoneDesc')}</li>
          </ul>
        </div>

        <div>
          <h5 style={{ color: effHeaderColor, margin: '0 0 10px 0', fontSize: '0.9rem' }}>{t('customCommands')}</h5>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input type="text" value={commandTrigger} onChange={e => setCommandTrigger(e.target.value)} style={{ ...styles.input, padding: '8px', flex: 1 }} placeholder={t('commandTrigger')} />
            <input type="text" value={commandResponse} onChange={e => setCommandResponse(e.target.value)} style={{ ...styles.input, padding: '8px', flex: 2 }} placeholder={t('commandResponse')} />
          </div>
          <button type="button" onClick={handleAddCommand} style={{ ...styles.button, backgroundColor: effPrimaryButtonBgColor, color: config.buttonTextColor, fontSize: '0.9rem', padding: '8px', margin: '0 0 15px 0', width: '100%' }}>{t('addCommand')}</button>

          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {config.customCommands.length === 0 && <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>{t('noCommands')}</p>}
            {config.customCommands.map(cmd => (
              <div key={cmd.id} style={{ ...styles.soundItem, padding: '8px 12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', overflow: 'hidden', marginRight: '10px' }}>
                  <span style={{ color: effHighlightColor, fontWeight: 'bold' }}>{cmd.trigger}</span>
                  <span style={{ fontSize: '0.8rem', opacity: 0.8, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100%' }}>{cmd.response}</span>
                </div>
                <button type="button" onClick={() => handleDeleteCommand(cmd.id)} style={{ ...styles.soundButton, backgroundColor: config.errorColor }}>{t('delete')}</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
};

// ==========================================
// 12. EVENT TIMING SECTION
// ==========================================
export interface EventTimingSectionProps {
  styles: any;
  config: any;
  updateConfig: (updates: any) => void;
  t: (key: string, vars?: any) => string;
}

export const EventTimingSection: React.FC<EventTimingSectionProps> = ({
  styles,
  config,
  updateConfig,
  t
}) => {
  return (
    <CollapsibleSection title={t('eventTiming')} isInitiallyCollapsed={true} styles={styles}>
      <label style={styles.label}>{t('eventStartTime')}</label>
      <input
        type="datetime-local"
        value={config.eventStartTime}
        onChange={(e) => updateConfig({ eventStartTime: e.target.value })}
        style={styles.input}
      />

      <label style={styles.label}>{t('celebrationDuration')}</label>
      <input
        type="number"
        value={config.celebrationDuration}
        onChange={(e) => updateConfig({ celebrationDuration: Math.max(1, Number(e.target.value)) })}
        style={styles.input}
        min="1"
      />
    </CollapsibleSection>
  );
};

// ==========================================
// 13. STREAM SCHEDULE SECTION
// ==========================================
export interface ScheduleSectionProps {
  styles: any;
  config: any;
  schedTime: string;
  setSchedTime: (val: string) => void;
  schedDesc: string;
  setSchedDesc: (val: string) => void;
  handleAddScheduleItem: () => void;
  handleToggleItem: (id: string) => void;
  handleDeleteItem: (id: string) => void;
  effPrimaryButtonBgColor: string;
  t: (key: string, vars?: any) => string;
}

export const ScheduleSection: React.FC<ScheduleSectionProps> = ({
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
  return (
    <CollapsibleSection title={t('streamSchedule')} isInitiallyCollapsed={true} styles={styles}>
      <div style={{ border: `2px dashed ${config.panelBorderColor}`, padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="datetime-local" value={schedTime} onChange={e => setSchedTime(e.target.value)} style={{ ...styles.input, padding: '8px', flex: 1 }} />
          <input type="text" value={schedDesc} onChange={e => setSchedDesc(e.target.value)} style={{ ...styles.input, padding: '8px', flex: 2 }} placeholder={t('description')} />
        </div>
        <button
          type="button"
          onClick={handleAddScheduleItem}
          style={{ ...styles.button, backgroundColor: effPrimaryButtonBgColor, color: config.buttonTextColor, fontSize: '1rem', padding: '10px', margin: '10px auto 0 auto', width: '50%' }}
        >
          {t('addItem')}
        </button>
      </div>
      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {config.scheduleItems.map(item => {
          const date = new Date(item.time);
          const timeDisplay = isNaN(date.getTime())
            ? item.time
            : date.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' });

          return (
            <div key={item.id} style={{ ...styles.soundItem, padding: '8px 12px' }}>
              <span style={{
                opacity: item.isDone ? 0.6 : 1,
                textDecoration: item.isDone ? 'line-through' : 'none',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginRight: '10px'
              }}>
                <strong>{timeDisplay}</strong> - {item.description}
              </span>
              <div style={{ flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => handleToggleItem(item.id)}
                  style={{ ...styles.soundButton, backgroundColor: config.successColor, color: config.buttonTextColor }}
                >
                  {item.isDone ? t('undo') : t('done')}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteItem(item.id)}
                  style={{ ...styles.soundButton, backgroundColor: config.errorColor }}
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </CollapsibleSection>
  );
};

// ==========================================
// 14. THEMING & VISUALS SECTION
// ==========================================
export interface ThemingSectionProps {
  styles: any;
  config: any;
  updateConfig: (updates: any) => void;
  selectedPreset: string;
  handlePresetChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  savedThemes: any[];
  handleUpdateThemeProfile: () => void;
  handleExportThemeProfile: (profile?: any) => void;
  handleDeleteThemeProfile: (id?: string) => void;
  newThemeNameInput: string;
  setNewThemeNameInput: (val: string) => void;
  handleSaveThemeProfile: () => void;
  handleImportThemeProfile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExportAllThemes: () => void;
  handleLoadSavedTheme: (theme: any) => void;
  themeActionFeedback: string | null;
  handleResetProgressBarColors: () => void;
  handleResetAdvancedColors: () => void;
  showAdvancedColors: boolean;
  setShowAdvancedColors: (show: boolean) => void;
  effProgressBarColor: string;
  effProgressBarBgColor: string;
  effProgressBarTextColor: string;
  effProgressBarBorderColor: string;
  effMilestoneBarColor: string;
  effMilestoneBarBgColor: string;
  effMilestoneBarTextColor: string;
  effMilestoneBarBorderColor: string;
  effHeaderColor: string;
  effSecondaryTextColor: string;
  effPrimaryButtonBgColor: string;
  effSecondaryButtonBgColor: string;
  effDividerColor: string;
  effHighlightColor: string;
  effDonorNameColor: string;
  effToastBgColor: string;
  effToastBorderColor: string;
  effToastNameColor: string;
  effToastAmountColor: string;
  hexToRgba: (hex: string, alpha: number) => string;
  t: (key: string, vars?: any) => string;
}

export const ThemingSection: React.FC<ThemingSectionProps> = ({
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
  const themeFileInputRef = useRef<HTMLInputElement>(null);

  return (
    <CollapsibleSection title={t('theming')} isInitiallyCollapsed={true} styles={styles}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0px', marginBottom: '1rem' }}>
        <input type="radio" id="tm1" name="themingMode" checked={config.themingMode === 'simple'} onChange={() => updateConfig({ themingMode: 'simple' })} />
        <label htmlFor="tm1">{t('simple')}</label>
        <input type="radio" id="tm2" name="themingMode" checked={config.themingMode === 'advanced'} onChange={() => updateConfig({ themingMode: 'advanced' })} />
        <label htmlFor="tm2">{t('advanced')}</label>
      </div>

      {config.themingMode === 'advanced' && (
        <div style={{ border: `2px dashed ${config.panelBorderColor}`, padding: '15px', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
          <label style={styles.label}>{t('fontFamily')}</label>
          <select value={config.fontFamily} onChange={e => updateConfig({ fontFamily: e.target.value })} style={styles.input}>
            <option value="'Press Start 2P', cursive">Press Start 2P</option>
            <option value="'Bungee', sans-serif">Bungee</option>
            <option value="'Roboto Mono', monospace">Roboto Mono</option>
            <option value="'VT323', monospace">VT323</option>
            <option value="'Cinzel', serif">Cinzel (Fantasy)</option>
          </select>

          <label style={styles.label}>{t('notificationAnimation')}</label>
          <select value={config.notificationAnimation} onChange={e => updateConfig({ notificationAnimation: e.target.value })} style={styles.input}>
            <option value="slide">{t('slideIn')}</option>
            <option value="fade">{t('fadeIn')}</option>
            <option value="bounce">{t('bounceIn')}</option>
            <option value="zoom">{t('zoomIn')}</option>
          </select>
        </div>
      )}

      <label style={styles.label}>{t('colorPreset')}</label>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={selectedPreset} onChange={handlePresetChange} style={{ ...styles.input, flex: 1, minWidth: '220px' }}>
          <option value="custom">{t('custom')}</option>
          {savedThemes.length > 0 && (
            <optgroup label={t('savedThemeProfiles')}>
              {savedThemes.map(profile => (
                <option key={`profile:${profile.id}`} value={`profile:${profile.id}`}>
                  ★ {profile.name}
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label={t('builtInPresets')}>
            {Object.entries(COLOR_PRESETS).map(([key, { name }]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </optgroup>
        </select>

        {selectedPreset.startsWith('profile:') && (
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={handleUpdateThemeProfile}
              style={{ ...styles.button, margin: 0, padding: '8px 12px', fontSize: '0.8rem', backgroundColor: effSecondaryButtonBgColor, color: config.buttonTextColor }}
              title={t('updateTheme')}
            >
              💾 {t('updateTheme')}
            </button>
            <button
              type="button"
              onClick={() => handleExportThemeProfile()}
              style={{ ...styles.button, margin: 0, padding: '8px 12px', fontSize: '0.8rem', backgroundColor: effPrimaryButtonBgColor, color: config.buttonTextColor }}
              title={t('exportTheme')}
            >
              📤 {t('exportTheme')}
            </button>
            <button
              type="button"
              onClick={() => handleDeleteThemeProfile()}
              style={{ ...styles.button, margin: 0, padding: '8px 12px', fontSize: '0.8rem', backgroundColor: config.errorColor, color: '#ffffff' }}
              title={t('deleteTheme')}
            >
              ✕ {t('deleteTheme')}
            </button>
          </div>
        )}
      </div>

      {/* Theme Profile Management & Import / Export */}
      <div style={{
        marginTop: '12px',
        padding: '14px',
        backgroundColor: hexToRgba(config.panelBorderColor, 0.1),
        border: `1px dashed ${config.panelBorderColor}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {/* Save as new profile row */}
        <div style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <input
            type="text"
            value={newThemeNameInput}
            onChange={e => setNewThemeNameInput(e.target.value)}
            placeholder={t('themeProfileName')}
            style={{ ...styles.input, flex: 2, minWidth: '180px', padding: '8px' }}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSaveThemeProfile(); } }}
          />
          <button
            type="button"
            onClick={handleSaveThemeProfile}
            style={{
              ...styles.button,
              margin: 0,
              padding: '8px 14px',
              fontSize: '0.85rem',
              backgroundColor: effPrimaryButtonBgColor,
              color: config.buttonTextColor,
              whiteSpace: 'nowrap'
            }}
          >
            + {t('saveAsNewThemeProfile')}
          </button>
        </div>

        {/* Import / Export Theme Buttons */}
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          flexWrap: 'wrap',
          paddingTop: '10px',
          borderTop: `1px solid ${hexToRgba(config.panelBorderColor, 0.25)}`
        }}>
          <input
            type="file"
            ref={themeFileInputRef}
            accept=".json,application/json"
            onChange={handleImportThemeProfile}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => themeFileInputRef.current?.click()}
            style={{
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
            }}
            title={t('importThemeHelp')}
          >
            📥 {t('importTheme')}
          </button>

          {selectedPreset.startsWith('profile:') ? (
            <button
              type="button"
              onClick={() => handleExportThemeProfile()}
              style={{
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
              }}
              title={t('exportThemeHelp')}
            >
              📤 {t('exportTheme')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleExportThemeProfile()}
              style={{
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
              }}
              title={t('exportCurrentTheme')}
            >
              📤 {t('exportCurrentTheme')}
            </button>
          )}

          {savedThemes.length > 1 && (
            <button
              type="button"
              onClick={handleExportAllThemes}
              style={{
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
              }}
              title={t('exportAllThemes')}
            >
              📦 {t('exportAllThemes')} ({savedThemes.length})
            </button>
          )}
        </div>

        {/* List of Saved Themes for Quick Selection and Export */}
        {savedThemes.length > 0 && (
          <div style={{
            marginTop: '4px',
            paddingTop: '10px',
            borderTop: `1px solid ${hexToRgba(config.panelBorderColor, 0.25)}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ fontSize: '0.78rem', color: effSecondaryTextColor, fontWeight: 'bold', textAlign: 'left' as const }}>
              {t('savedThemeProfiles')} ({savedThemes.length}):
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
              {savedThemes.map(theme => {
                const isActive = selectedPreset === `profile:${theme.id}`;
                return (
                  <div
                    key={theme.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      padding: '6px 10px',
                      backgroundColor: isActive ? hexToRgba(effHighlightColor, 0.15) : hexToRgba(config.panelColor, 0.6),
                      border: isActive ? `1px solid ${effHighlightColor}` : `1px solid ${hexToRgba(config.panelBorderColor, 0.3)}`,
                      borderRadius: '3px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <div style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '2px',
                        backgroundColor: theme.colors.backgroundColor,
                        border: `1px solid ${theme.colors.panelBorderColor || '#fff'}`,
                        flexShrink: 0
                      }} />
                      <span style={{
                        fontSize: '0.85rem',
                        color: isActive ? effHighlightColor : config.textColor,
                        fontWeight: isActive ? 'bold' : 'normal',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {theme.name} {isActive && '(Active)'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => handleLoadSavedTheme(theme)}
                          style={{
                            ...styles.button,
                            margin: 0,
                            padding: '3px 8px',
                            fontSize: '0.72rem',
                            backgroundColor: effSecondaryButtonBgColor,
                            color: config.buttonTextColor
                          }}
                          title={t('loadTheme')}
                        >
                          {t('loadTheme')}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleExportThemeProfile(theme)}
                        style={{
                          ...styles.button,
                          margin: 0,
                          padding: '3px 8px',
                          fontSize: '0.72rem',
                          backgroundColor: 'transparent',
                          border: `1px solid ${config.panelBorderColor}`,
                          color: config.textColor
                        }}
                        title={t('exportTheme')}
                      >
                        📤 {t('exportTheme')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteThemeProfile(theme.id)}
                        style={{
                          ...styles.button,
                          margin: 0,
                          padding: '3px 8px',
                          fontSize: '0.72rem',
                          backgroundColor: hexToRgba(config.errorColor, 0.2),
                          border: `1px solid ${config.errorColor}`,
                          color: config.errorColor
                        }}
                        title={t('deleteTheme')}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {themeActionFeedback && (
        <div style={{ color: config.successColor, fontSize: '0.85rem', marginTop: '6px', textAlign: 'center' }}>
          ✓ {themeActionFeedback}
        </div>
      )}

      <div style={{ borderTop: `1px solid ${config.panelBorderColor}`, margin: '20px 0 10px 0' }} />

      {/* SECTION 1: PROGRESSION BARS COLORS (SPLIT FROM THE REST) */}
      <div style={{
        marginTop: '15px',
        padding: '16px',
        border: `2px solid ${effProgressBarColor}`,
        backgroundColor: hexToRgba(effProgressBarBgColor, 0.4),
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxSizing: 'border-box' as const
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: `1px solid ${hexToRgba(effProgressBarBorderColor, 0.4)}`, paddingBottom: '8px' }}>
          <div style={{ textAlign: 'left' as const }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: effProgressBarColor, fontFamily: config.fontFamily }}>
              📊 {t('progressBarSection')}
            </div>
            <div style={{ fontSize: '0.78rem', color: effSecondaryTextColor, opacity: 0.9, marginTop: '2px', fontFamily: config.fontFamily }}>
              {t('progressBarSectionHelp')}
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetProgressBarColors}
            style={{
              ...styles.button,
              margin: 0,
              padding: '6px 12px',
              fontSize: '0.75rem',
              backgroundColor: 'transparent',
              border: `1px solid ${effProgressBarBorderColor}`,
              color: config.textColor,
              opacity: 0.85,
              cursor: 'pointer'
            }}
            title={t('resetProgressBarColors')}
          >
            ↺ {t('resetProgressBarColors')}
          </button>
        </div>

        {/* Main Goal Progress Bar Colors */}
        <div>
          <div style={{ fontSize: '0.85rem', color: effSecondaryTextColor, marginBottom: '8px', fontWeight: 'bold', fontFamily: config.fontFamily, textAlign: 'left' as const }}>
            🎯 {t('mainProgressBarTitle')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', justifyContent: 'center' }}>
            <div style={styles.colorPickerContainer}>
              <label style={styles.label}>{t('progressBarColor')}</label>
              <input type="color" value={config.progressBarColor || config.accentColor1} onChange={e => updateConfig({ progressBarColor: e.target.value })} style={styles.colorInput} />
            </div>
            <div style={styles.colorPickerContainer}>
              <label style={styles.label}>{t('progressBarBgColor')}</label>
              <input type="color" value={config.progressBarBgColor || config.panelColor} onChange={e => updateConfig({ progressBarBgColor: e.target.value })} style={styles.colorInput} />
            </div>
            <div style={styles.colorPickerContainer}>
              <label style={styles.label}>{t('progressBarTextColor')}</label>
              <input type="color" value={config.progressBarTextColor || config.buttonTextColor} onChange={e => updateConfig({ progressBarTextColor: e.target.value })} style={styles.colorInput} />
            </div>
            <div style={styles.colorPickerContainer}>
              <label style={styles.label}>{t('progressBarBorderColor')}</label>
              <input type="color" value={config.progressBarBorderColor || config.panelBorderColor} onChange={e => updateConfig({ progressBarBorderColor: e.target.value })} style={styles.colorInput} />
            </div>
          </div>
        </div>

        {/* Split Milestone Colors Toggle & Controls */}
        <div style={{ borderTop: `1px dashed ${hexToRgba(effProgressBarBorderColor, 0.35)}`, paddingTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <input
              type="checkbox"
              id="splitMilestoneColorsToggle"
              checked={config.splitMilestoneColors || false}
              onChange={e => updateConfig({ splitMilestoneColors: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: effProgressBarColor }}
            />
            <label htmlFor="splitMilestoneColorsToggle" style={{ ...styles.label, cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', opacity: 1, margin: 0 }}>
              {t('splitMilestoneColors')}
            </label>
          </div>
          <div style={{ fontSize: '0.75rem', color: effSecondaryTextColor, opacity: 0.85, textAlign: 'left' as const, marginBottom: '10px', marginLeft: '26px', fontFamily: config.fontFamily }}>
            {t('splitMilestoneColorsHelp')}
          </div>

          {config.splitMilestoneColors && (
            <div style={{
              padding: '12px',
              backgroundColor: hexToRgba(config.panelColor, 0.6),
              border: `1px solid ${effMilestoneBarBorderColor}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ fontSize: '0.85rem', color: effSecondaryTextColor, fontWeight: 'bold', fontFamily: config.fontFamily, textAlign: 'left' as const }}>
                🚩 {t('milestoneProgressBarTitle')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', justifyContent: 'center' }}>
                <div style={styles.colorPickerContainer}>
                  <label style={styles.label}>{t('milestoneBarColor')}</label>
                  <input type="color" value={config.milestoneProgressBarColor || effProgressBarColor} onChange={e => updateConfig({ milestoneProgressBarColor: e.target.value })} style={styles.colorInput} />
                </div>
                <div style={styles.colorPickerContainer}>
                  <label style={styles.label}>{t('milestoneBarBgColor')}</label>
                  <input type="color" value={config.milestoneProgressBarBgColor || effProgressBarBgColor} onChange={e => updateConfig({ milestoneProgressBarBgColor: e.target.value })} style={styles.colorInput} />
                </div>
                <div style={styles.colorPickerContainer}>
                  <label style={styles.label}>{t('milestoneBarTextColor')}</label>
                  <input type="color" value={config.milestoneProgressBarTextColor || effProgressBarTextColor} onChange={e => updateConfig({ milestoneProgressBarTextColor: e.target.value })} style={styles.colorInput} />
                </div>
                <div style={styles.colorPickerContainer}>
                  <label style={styles.label}>{t('milestoneBarBorderColor')}</label>
                  <input type="color" value={config.milestoneProgressBarBorderColor || effProgressBarBorderColor} onChange={e => updateConfig({ milestoneProgressBarBorderColor: e.target.value })} style={styles.colorInput} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Mini Preview of Progression Bars inside this section */}
        <div style={{
          marginTop: '6px',
          padding: '10px',
          backgroundColor: config.backgroundColor,
          border: `1px solid ${effProgressBarBorderColor}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ fontSize: '0.72rem', color: effSecondaryTextColor, textAlign: 'left' as const, fontFamily: config.fontFamily }}>
            {t('livePreview')} - {t('mainProgressBarTitle')}
          </div>
          <div style={{
            position: 'relative',
            width: '100%',
            height: '32px',
            backgroundColor: effProgressBarBgColor,
            border: `2px solid ${effProgressBarBorderColor}`,
            overflow: 'hidden',
            boxSizing: 'border-box' as const
          }}>
            <div style={{
              width: '65%',
              height: '100%',
              backgroundColor: effProgressBarColor,
              transition: 'width 0.3s ease'
            }} />
            <div style={{
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
            }}>
              $1,300.00 / $2,000.00 (65.0%)
            </div>
          </div>

          {config.splitMilestoneColors && (
            <>
              <div style={{ fontSize: '0.72rem', color: effSecondaryTextColor, textAlign: 'left' as const, fontFamily: config.fontFamily, marginTop: '4px' }}>
                {t('livePreview')} - {t('milestoneProgressBarTitle')}
              </div>
              <div style={{
                position: 'relative',
                width: '100%',
                height: '32px',
                backgroundColor: effMilestoneBarBgColor,
                border: `2px solid ${effMilestoneBarBorderColor}`,
                overflow: 'hidden',
                boxSizing: 'border-box' as const
              }}>
                <div style={{
                  width: '40%',
                  height: '100%',
                  backgroundColor: effMilestoneBarColor,
                  transition: 'width 0.3s ease'
                }} />
                <div style={{
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
                }}>
                  $200.00 / $500.00 (40.0%)
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* SECTION 2: GENERAL THEME & COMPONENT COLORS ("THE REST") */}
      <div style={{
        marginTop: '20px',
        padding: '16px',
        border: `1px solid ${config.panelBorderColor}`,
        backgroundColor: hexToRgba(config.panelColor, 0.4),
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxSizing: 'border-box' as const
      }}>
        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: effHeaderColor, fontFamily: config.fontFamily, textAlign: 'left' as const, borderBottom: `1px solid ${config.panelBorderColor}`, paddingBottom: '6px' }}>
          🎨 {t('generalColorsSection')}
        </div>

        {/* Core Color Palette */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', justifyContent: 'center' }}>
          <div style={styles.colorPickerContainer}><label style={styles.label}>{t('background')}</label><input type="color" value={config.backgroundColor} onChange={e => updateConfig({ backgroundColor: e.target.value })} style={styles.colorInput} /></div>
          <div style={styles.colorPickerContainer}><label style={styles.label}>{t('panel')}</label><input type="color" value={config.panelColor} onChange={e => updateConfig({ panelColor: e.target.value })} style={styles.colorInput} /></div>
          <div style={styles.colorPickerContainer}><label style={styles.label}>{t('text')}</label><input type="color" value={config.textColor} onChange={e => updateConfig({ textColor: e.target.value })} style={styles.colorInput} /></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', justifyContent: 'center' }}>
          <div style={styles.colorPickerContainer}><label style={styles.label}>{t('accent1')}</label><input type="color" value={config.accentColor1} onChange={e => updateConfig({ accentColor1: e.target.value })} style={styles.colorInput} /></div>
          <div style={styles.colorPickerContainer}><label style={styles.label}>{t('accent2')}</label><input type="color" value={config.accentColor2} onChange={e => updateConfig({ accentColor2: e.target.value })} style={styles.colorInput} /></div>
          <div style={styles.colorPickerContainer}><label style={styles.label}>{t('border')}</label><input type="color" value={config.panelBorderColor} onChange={e => updateConfig({ panelBorderColor: e.target.value })} style={styles.colorInput} /></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', justifyContent: 'center' }}>
          <div style={styles.colorPickerContainer}><label style={styles.label}>{t('success')}</label><input type="color" value={config.successColor} onChange={e => updateConfig({ successColor: e.target.value })} style={styles.colorInput} /></div>
          <div style={styles.colorPickerContainer}><label style={styles.label}>{t('error')}</label><input type="color" value={config.errorColor} onChange={e => updateConfig({ errorColor: e.target.value })} style={styles.colorInput} /></div>
        </div>

        {/* Detailed / Granular Color Controls Toggle in Advanced Mode */}
        {config.themingMode === 'advanced' && (
          <>
            <div style={{ borderTop: `1px dashed ${config.panelBorderColor}`, margin: '10px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowAdvancedColors(!showAdvancedColors)}
                style={{
                  ...styles.button,
                  margin: 0,
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  backgroundColor: 'transparent',
                  border: `2px solid ${effSecondaryButtonBgColor}`,
                  color: effSecondaryButtonBgColor,
                  cursor: 'pointer'
                }}
              >
                {showAdvancedColors ? '▼ ' : '► '} {t('advancedColorControls')}
              </button>
              <button
                type="button"
                onClick={handleResetAdvancedColors}
                style={{
                  ...styles.button,
                  margin: 0,
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  backgroundColor: 'transparent',
                  border: `1px solid ${config.panelBorderColor}`,
                  color: config.textColor,
                  opacity: 0.8
                }}
                title={t('resetAdvancedColors')}
              >
                ↺ {t('resetAdvancedColors')}
              </button>
            </div>

            {showAdvancedColors && (
              <div style={{
                marginTop: '12px',
                padding: '15px',
                border: `1px solid ${config.panelBorderColor}`,
                backgroundColor: hexToRgba(config.panelColor, 0.5),
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', justifyContent: 'center' }}>
                  <div style={styles.colorPickerContainer}>
                    <label style={styles.label}>{t('headerColor')}</label>
                    <input type="color" value={config.headerColor || config.accentColor1} onChange={e => updateConfig({ headerColor: e.target.value })} style={styles.colorInput} />
                  </div>
                  <div style={styles.colorPickerContainer}>
                    <label style={styles.label}>{t('secondaryTextColor')}</label>
                    <input type="color" value={config.secondaryTextColor || config.accentColor2} onChange={e => updateConfig({ secondaryTextColor: e.target.value })} style={styles.colorInput} />
                  </div>
                  <div style={styles.colorPickerContainer}>
                    <label style={styles.label}>{t('buttonTextColor')}</label>
                    <input type="color" value={config.buttonTextColor || '#0d0d0d'} onChange={e => updateConfig({ buttonTextColor: e.target.value })} style={styles.colorInput} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', justifyContent: 'center' }}>
                  <div style={styles.colorPickerContainer}>
                    <label style={styles.label}>{t('primaryButtonBgColor')}</label>
                    <input type="color" value={config.primaryButtonBgColor || config.accentColor1} onChange={e => updateConfig({ primaryButtonBgColor: e.target.value })} style={styles.colorInput} />
                  </div>
                  <div style={styles.colorPickerContainer}>
                    <label style={styles.label}>{t('secondaryButtonBgColor')}</label>
                    <input type="color" value={config.secondaryButtonBgColor || config.accentColor2} onChange={e => updateConfig({ secondaryButtonBgColor: e.target.value })} style={styles.colorInput} />
                  </div>
                  <div style={styles.colorPickerContainer}>
                    <label style={styles.label}>{t('dividerColor')}</label>
                    <input type="color" value={config.dividerColor || config.accentColor2} onChange={e => updateConfig({ dividerColor: e.target.value })} style={styles.colorInput} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', justifyContent: 'center' }}>
                  <div style={styles.colorPickerContainer}>
                    <label style={styles.label}>{t('highlightColor')}</label>
                    <input type="color" value={config.highlightColor || config.accentColor1} onChange={e => updateConfig({ highlightColor: e.target.value })} style={styles.colorInput} />
                  </div>
                  <div style={styles.colorPickerContainer}>
                    <label style={styles.label}>{t('donorNameColor')}</label>
                    <input type="color" value={config.donorNameColor || config.highlightColor || config.accentColor1} onChange={e => updateConfig({ donorNameColor: e.target.value })} style={styles.colorInput} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', justifyContent: 'center' }}>
                  <div style={styles.colorPickerContainer}>
                    <label style={styles.label}>{t('toastBgColor')}</label>
                    <input type="color" value={config.toastBgColor || config.panelColor} onChange={e => updateConfig({ toastBgColor: e.target.value })} style={styles.colorInput} />
                  </div>
                  <div style={styles.colorPickerContainer}>
                    <label style={styles.label}>{t('toastBorderColor')}</label>
                    <input type="color" value={config.toastBorderColor || config.accentColor1} onChange={e => updateConfig({ toastBorderColor: e.target.value })} style={styles.colorInput} />
                  </div>
                  <div style={styles.colorPickerContainer}>
                    <label style={styles.label}>{t('toastNameColor')}</label>
                    <input type="color" value={config.toastNameColor || config.accentColor1} onChange={e => updateConfig({ toastNameColor: e.target.value })} style={styles.colorInput} />
                  </div>
                  <div style={styles.colorPickerContainer}>
                    <label style={styles.label}>{t('toastAmountColor')}</label>
                    <input type="color" value={config.toastAmountColor || config.accentColor2} onChange={e => updateConfig({ toastAmountColor: e.target.value })} style={styles.colorInput} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', justifyContent: 'center' }}>
                  <div style={styles.colorPickerContainer}>
                    <label style={styles.label}>{t('inputBgColor')}</label>
                    <input type="color" value={config.inputBgColor || config.panelColor} onChange={e => updateConfig({ inputBgColor: e.target.value })} style={styles.colorInput} />
                  </div>
                  <div style={styles.colorPickerContainer}>
                    <label style={styles.label}>{t('inputBorderColor')}</label>
                    <input type="color" value={config.inputBorderColor || config.accentColor2} onChange={e => updateConfig({ inputBorderColor: e.target.value })} style={styles.colorInput} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Live Theme Preview Box */}
      <div style={{ borderTop: `1px solid ${config.panelBorderColor}`, margin: '20px 0 10px 0' }} />
      <div style={{ textAlign: 'left', marginTop: '10px' }}>
        <label style={{ ...styles.label, marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>{t('livePreview')}</label>
        <div style={{
          backgroundColor: config.backgroundColor,
          border: `2px solid ${config.panelBorderColor}`,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ color: effHeaderColor, fontSize: '1.2rem', fontFamily: config.fontFamily, textAlign: 'center' }}>
            {t('sampleHeader')}
          </div>
          <div style={{ color: effSecondaryTextColor, fontSize: '0.85rem', fontFamily: config.fontFamily, textAlign: 'center' }}>
            Goal: $2,000.00 | Total Raised: $1,250.00
          </div>

          {/* Preview Bar */}
          <div style={{
            width: '100%',
            backgroundColor: effProgressBarBgColor,
            border: `3px solid ${effProgressBarBorderColor}`,
            padding: '4px',
            boxSizing: 'border-box'
          }}>
            <div style={{
              position: 'relative',
              width: '100%',
              height: '24px',
              backgroundColor: effProgressBarBgColor,
              overflow: 'hidden'
            }}>
              <div style={{
                width: '62%',
                height: '100%',
                backgroundColor: effProgressBarColor,
              }} />
              <div style={{
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
              }}>
                $1,250.00 (62%)
              </div>
            </div>
          </div>

          {config.splitMilestoneColors && (
            <div style={{
              width: '100%',
              backgroundColor: effMilestoneBarBgColor,
              border: `3px solid ${effMilestoneBarBorderColor}`,
              padding: '4px',
              boxSizing: 'border-box'
            }}>
              <div style={{
                position: 'relative',
                width: '100%',
                height: '22px',
                backgroundColor: effMilestoneBarBgColor,
                overflow: 'hidden'
              }}>
                <div style={{
                  width: '45%',
                  height: '100%',
                  backgroundColor: effMilestoneBarColor,
                }} />
                <div style={{
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
                }}>
                  Milestone: $450.00 (45%)
                </div>
              </div>
            </div>
          )}

          {/* Preview Toast Alert */}
          <div style={{
            backgroundColor: hexToRgba(effToastBgColor, 0.95),
            border: `2px solid ${effToastBorderColor}`,
            padding: '10px',
            textAlign: 'center'
          }}>
            <span style={{ color: effToastNameColor, fontWeight: 'bold', fontSize: '0.9rem', fontFamily: config.fontFamily }}>
              {t('sampleDonor')}{' '}
            </span>
            <span style={{ color: effToastAmountColor, fontSize: '1rem', fontFamily: config.fontFamily }}>
              {t('sampleDonated')}
            </span>
          </div>

          {/* Sample Button & Granular Highlights */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{
              backgroundColor: effPrimaryButtonBgColor,
              color: config.buttonTextColor,
              padding: '8px 16px',
              fontSize: '0.85rem',
              fontFamily: config.fontFamily,
              textTransform: 'uppercase'
            }}>
              Primary Action
            </div>
            <div style={{
              backgroundColor: effSecondaryButtonBgColor,
              color: config.buttonTextColor,
              padding: '8px 16px',
              fontSize: '0.85rem',
              fontFamily: config.fontFamily,
              textTransform: 'uppercase'
            }}>
              Secondary Action
            </div>
          </div>
          <div style={{ borderTop: `1px dashed ${effDividerColor}`, paddingTop: '8px', textAlign: 'center', fontSize: '0.85rem', color: effHighlightColor, fontFamily: config.fontFamily }}>
            {t('sampleDonor')}: <span style={{ color: effDonorNameColor, fontWeight: 'bold' }}>HeroDonor42</span>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
};

// ==========================================
// 15. SOUND SETTINGS SECTION
// ==========================================
export interface SoundSettingsSectionProps {
  styles: any;
  config: any;
  updateConfig: (updates: any) => void;
  playSpecificSound: (soundId: string) => void;
  handleDeleteSound: (id: string) => void;
  handleAddSound: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedSoundFile: string;
  setSelectedSoundFile: (val: string) => void;
  availableSoundFiles: string[];
  handlePreviewLocalSound: () => void;
  handleAddSoundFromList: () => void;
  formError: string | null;
  effPrimaryButtonBgColor: string;
  effDividerColor: string;
  t: (key: string, vars?: any) => string;
}

export const SoundSettingsSection: React.FC<SoundSettingsSectionProps> = ({
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
  const soundFileInputRef = useRef<HTMLInputElement>(null);

  return (
    <CollapsibleSection title={t('soundSettings')} isInitiallyCollapsed={true} styles={styles}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="checkbox"
          checked={config.isSoundEnabled}
          onChange={e => updateConfig({ isSoundEnabled: e.target.checked })}
        />
        <label style={{ ...styles.label, opacity: 1, cursor: 'pointer' }}>{t('enableSound')}</label>
      </div>
      <label style={config.isSoundEnabled ? styles.label : { ...styles.label, opacity: 0.5 }}>{t('volume')}</label>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={config.notificationVolume}
        onChange={e => updateConfig({ notificationVolume: Number(e.target.value) })}
        style={{ width: '100%', cursor: config.isSoundEnabled ? 'pointer' : 'default' }}
        disabled={!config.isSoundEnabled}
      />

      <label style={styles.label}>{t('donationSound')}</label>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <select
          value={config.selectedSound}
          onChange={e => updateConfig({ selectedSound: e.target.value })}
          style={{ ...styles.input, flexGrow: 1, width: 'auto', ...(!config.isSoundEnabled && { opacity: 0.5 }) }}
          disabled={!config.isSoundEnabled}
        >
          <option value="default">{t('defaultCoin')}</option>
          {config.customSounds.map(sound => (
            <option key={sound.id} value={sound.id}>{sound.name}</option>
          ))}
        </select>
        <button type="button" onClick={() => playSpecificSound(config.selectedSound)} disabled={!config.isSoundEnabled} style={styles.previewButton}>{t('preview')}</button>
      </div>

      <label style={styles.label}>{t('milestoneSound')}</label>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <select
          value={config.selectedMilestoneSound}
          onChange={e => updateConfig({ selectedMilestoneSound: e.target.value })}
          style={{ ...styles.input, flexGrow: 1, width: 'auto', ...(!config.isSoundEnabled && { opacity: 0.5 }) }}
          disabled={!config.isSoundEnabled}
        >
          <option value="default-milestone">{t('defaultFanfare')}</option>
          {config.customSounds.map(sound => (
            <option key={sound.id} value={sound.id}>{sound.name}</option>
          ))}
        </select>
        <button type="button" onClick={() => playSpecificSound(config.selectedMilestoneSound)} disabled={!config.isSoundEnabled} style={styles.previewButton}>{t('preview')}</button>
      </div>

      <div style={{ borderTop: `2px dashed ${effDividerColor}`, margin: '20px 0 0 0' }} />

      <h4 style={{ ...styles.label, opacity: 1, fontSize: '1.1rem', marginBottom: '0' }}>{t('customSoundLibrary')}</h4>
      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {config.customSounds.map(sound => (
          <div key={sound.id} style={styles.soundItem}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '10px' }}>{sound.name}</span>
            <div style={{ flexShrink: 0 }}>
              <button type="button" onClick={() => playSpecificSound(sound.id)} style={styles.soundButton}>{t('preview')}</button>
              <button type="button" onClick={() => handleDeleteSound(sound.id)} style={{ ...styles.soundButton, backgroundColor: config.errorColor }}>{t('delete')}</button>
            </div>
          </div>
        ))}
      </div>

      <label style={styles.label}>{t('uploadSound')}</label>
      <input
        type="file"
        ref={soundFileInputRef}
        onChange={handleAddSound}
        accept="audio/mp3,audio/wav,audio/ogg"
        style={{ display: 'none' }}
      />
      <button
        type="button"
        onClick={() => soundFileInputRef.current?.click()}
        style={{ ...styles.button, backgroundColor: effPrimaryButtonBgColor, color: config.buttonTextColor, fontSize: '1rem', padding: '10px 20px', margin: 0 }}
      >
        {t('uploadNewSound')}
      </button>

      <label style={styles.label}>{t('addSoundFromFolder')}</label>
      <div style={{ display: 'flex', gap: '10px' }}>
        <select
          value={selectedSoundFile}
          onChange={(e) => setSelectedSoundFile(e.target.value)}
          style={{ ...styles.input, flexGrow: 1 }}
        >
          {availableSoundFiles.length === 0 && <option value="">{t('noSoundsFound')}</option>}
          {availableSoundFiles.map(file => (
            <option key={file} value={file}>{file}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={handlePreviewLocalSound}
          disabled={!selectedSoundFile || !config.isSoundEnabled}
          style={styles.previewButton}
        >
          {t('preview')}
        </button>
        <button
          type="button"
          onClick={handleAddSoundFromList}
          disabled={availableSoundFiles.length === 0 || !selectedSoundFile}
          style={{ ...styles.button, backgroundColor: effPrimaryButtonBgColor, color: config.buttonTextColor, fontSize: '1rem', padding: '10px 20px', margin: 0 }}
        >
          {t('add')}
        </button>
      </div>
      <p style={{ fontSize: '0.8rem', color: config.textColor, opacity: 0.7, marginTop: '5px', marginBottom: '15px' }}>
        {t('soundFolderHint')}
      </p>
      {formError && <p style={{ ...styles.error, marginTop: 0, marginBottom: '0' }} role="alert">{formError}</p>}
    </CollapsibleSection>
  );
};

// ==========================================
// 16. SPONSORS CAROUSEL SECTION
// ==========================================
export interface SponsorsSectionProps {
  styles: any;
  config: any;
  updateConfig: (updates: any) => void;
  sponsorNameInput: string;
  setSponsorNameInput: (val: string) => void;
  sponsorUrlInput: string;
  setSponsorUrlInput: (val: string) => void;
  handleAddSponsorFromUrl: () => void;
  handleUploadSponsorFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  availableSponsorFiles: string[];
  selectedSponsorFile: string;
  setSelectedSponsorFile: (val: string) => void;
  handleAddSponsorFromList: () => void;
  handleDeleteSponsor: (id: string) => void;
  t: (key: string, vars?: any) => string;
}

export const SponsorsSection: React.FC<SponsorsSectionProps> = ({
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
  return (
    <CollapsibleSection title={t('sponsors')} isInitiallyCollapsed={true} styles={styles}>
      <label style={styles.label}>{t('slideDuration')}</label>
      <input
        type="number"
        value={config.sponsorDisplayDuration}
        onChange={(e) => updateConfig({ sponsorDisplayDuration: Math.max(1, Number(e.target.value)) })}
        style={{ ...styles.input, marginBottom: '1rem' }}
        min="1"
      />
      <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '15px' }}>
        {config.sponsors.length === 0 && <p style={{ color: config.textColor, opacity: 0.6 }}>{t('noSponsorsAdded')}</p>}
        {config.sponsors.map(sponsor => (
          <div key={sponsor.id} style={{ ...styles.soundItem, height: 'auto', alignItems: 'center' }}>
            <div style={{ width: '50px', height: '50px', marginRight: '15px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
              <img src={sponsor.imageUrl} alt={sponsor.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
            <span style={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sponsor.name}</span>
            <button type="button" onClick={() => handleDeleteSponsor(sponsor.id)} style={{ ...styles.soundButton, backgroundColor: config.errorColor }}>{t('delete')}</button>
          </div>
        ))}
      </div>

      <label style={styles.label}>{t('addSponsor')}</label>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder={t('sponsorName')}
          value={sponsorNameInput}
          onChange={e => setSponsorNameInput(e.target.value)}
          style={{ ...styles.input, flex: '1 1 120px' }}
        />
        <input
          type="text"
          placeholder={t('imageUrlPlaceholder')}
          value={sponsorUrlInput}
          onChange={e => setSponsorUrlInput(e.target.value)}
          style={{ ...styles.input, flex: '2 1 200px' }}
        />
        <button
          type="button"
          onClick={handleAddSponsorFromUrl}
          disabled={!sponsorUrlInput.trim()}
          style={{ ...styles.button, backgroundColor: config.accentColor1, color: config.buttonTextColor, fontSize: '0.9rem', padding: '10px 15px', margin: 0 }}
        >
          {t('add')}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
        <label style={{ ...styles.label, margin: 0 }}>{t('orUploadImage')}:</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleUploadSponsorFile}
          style={{ fontSize: '0.8rem', color: config.textColor }}
        />
      </div>

      {availableSponsorFiles.length > 0 && (
        <>
          <label style={styles.label}>{t('addSponsorFromFolder')}</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <select
              value={selectedSponsorFile}
              onChange={(e) => setSelectedSponsorFile(e.target.value)}
              style={{ ...styles.input, flexGrow: 1 }}
            >
              {availableSponsorFiles.map(file => (
                <option key={file} value={file}>{file}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddSponsorFromList}
              disabled={!selectedSponsorFile}
              style={{ ...styles.button, backgroundColor: config.accentColor1, color: config.buttonTextColor, fontSize: '1rem', padding: '10px 20px', margin: 0 }}
            >
              {t('add')}
            </button>
          </div>
          <p style={{ fontSize: '0.8rem', color: config.textColor, opacity: 0.7, marginTop: '5px' }}>
            {t('sponsorFolderHint')}
          </p>
        </>
      )}
    </CollapsibleSection>
  );
};

// ==========================================
// 17. TEXT OVERLAY SECTION
// ==========================================
export interface TextOverlaySectionProps {
  styles: any;
  config: any;
  updateConfig: (updates: any) => void;
  handleUploadTextFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  availableTextFiles: string[];
  t: (key: string, vars?: any) => string;
}

export const TextOverlaySection: React.FC<TextOverlaySectionProps> = ({
  styles,
  config,
  updateConfig,
  handleUploadTextFile,
  availableTextFiles,
  t
}) => {
  return (
    <CollapsibleSection title={t('textOverlay')} isInitiallyCollapsed={true} styles={styles}>
      <label style={styles.label}>{t('customTextLabel')}</label>
      <textarea
        value={config.customTextContent || ''}
        onChange={(e) => updateConfig({ customTextContent: e.target.value })}
        placeholder={t('customTextPlaceholder')}
        rows={3}
        style={{ ...styles.input, resize: 'vertical', marginBottom: '0.8rem' }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
        <label style={{ ...styles.label, margin: 0 }}>{t('uploadTextFile')}:</label>
        <input
          type="file"
          accept=".txt,.md"
          onChange={handleUploadTextFile}
          style={{ fontSize: '0.8rem', color: config.textColor }}
        />
      </div>

      {availableTextFiles.length > 0 && (
        <>
          <label style={styles.label}>{t('selectTextFile')}</label>
          <select
            value={config.selectedTextFile || ''}
            onChange={(e) => updateConfig({ selectedTextFile: e.target.value })}
            style={{ ...styles.input, marginBottom: '0.5rem' }}
          >
            <option value="">-- {t('none')} --</option>
            {availableTextFiles.map(file => (
              <option key={file} value={file}>{file}</option>
            ))}
          </select>
          <p style={{ fontSize: '0.8rem', color: config.textColor, opacity: 0.7, marginTop: '5px' }}>
            {t('textFolderHint')}
          </p>
        </>
      )}

      <label style={{ ...styles.label, marginTop: '1rem' }}>{t('textAlignment')}</label>
      <select
        value={config.textOverlayAlignment || 'top-left'}
        onChange={(e) => updateConfig({ textOverlayAlignment: e.target.value })}
        style={styles.input}
      >
        <option value="top-left">{t('topLeft')}</option>
        <option value="top-center">{t('topCenter')}</option>
        <option value="top-right">{t('topRight')}</option>
        <option value="center-left">{t('centerLeft')}</option>
        <option value="center">{t('center')}</option>
        <option value="center-right">{t('centerRight')}</option>
        <option value="bottom-left">{t('bottomLeft')}</option>
        <option value="bottom-center">{t('bottomCenter')}</option>
        <option value="bottom-right">{t('bottomRight')}</option>
      </select>

      <label style={{ ...styles.label, marginTop: '1rem' }}>{t('fontSize')}</label>
      <input
        type="number"
        min="0.5"
        max="5.0"
        step="0.1"
        value={config.textOverlayFontSize || 1.5}
        onChange={(e) => updateConfig({ textOverlayFontSize: Number(e.target.value) })}
        style={styles.input}
      />
    </CollapsibleSection>
  );
};

// ==========================================
// 18. PROFILE BACKUP SECTION
// ==========================================
export interface ProfileBackupSectionProps {
  styles: any;
  config: any;
  handleExportConfig: () => void;
  handleImportConfig: (e: React.ChangeEvent<HTMLInputElement>) => void;
  importSuccessMsg: string | null;
  effPrimaryButtonBgColor: string;
  effSecondaryButtonBgColor: string;
  t: (key: string, vars?: any) => string;
}

export const ProfileBackupSection: React.FC<ProfileBackupSectionProps> = ({
  styles,
  config,
  handleExportConfig,
  handleImportConfig,
  importSuccessMsg,
  effPrimaryButtonBgColor,
  effSecondaryButtonBgColor,
  t
}) => {
  return (
    <CollapsibleSection title={t('profileBackup')} isInitiallyCollapsed={true} styles={styles}>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleExportConfig}
          style={{ ...styles.button, backgroundColor: effSecondaryButtonBgColor, color: config.buttonTextColor, fontSize: '0.9rem', padding: '10px 15px', margin: 0, flex: 1 }}
        >
          {t('exportConfig')}
        </button>
        <label style={{ ...styles.button, backgroundColor: effPrimaryButtonBgColor, color: config.buttonTextColor, fontSize: '0.9rem', padding: '10px 15px', margin: 0, flex: 1, textAlign: 'center', cursor: 'pointer' }}>
          {t('importConfig')}
          <input
            type="file"
            accept=".json"
            onChange={handleImportConfig}
            style={{ display: 'none' }}
          />
        </label>
      </div>
      {importSuccessMsg && <p style={{ color: config.successColor, fontSize: '0.85rem', marginTop: '10px' }}>{importSuccessMsg}</p>}
    </CollapsibleSection>
  );
};

// ==========================================
// 19. RE-EXPORTS FOR CONVENIENCE
// ==========================================
export {
  CollapsibleSection
};
