import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { io, Socket } from 'socket.io-client';
import tmi from 'tmi.js';
import { translations } from './translations.js';
import { createQRMatrix, createQRSvgString, getExtraLifeUrl } from './qr-code.js';

// === COLOR PRESETS ===
const COLOR_PRESETS = {
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
    }
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
     }
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
    }
  },
  'ffxiv': {
    name: 'Final Fantasy XIV',
    colors: {
      backgroundColor: '#121212', // Dark Grey/Black
      textColor: '#e0e0e0',       // Off-white
      panelColor: '#1e1e24',      // Dark slate/blue-grey
      panelBorderColor: '#d4af37', // Gold
      accentColor1: '#d4af37',     // Gold
      accentColor2: '#58a6ff',     // Crystal Blue (Aether)
      successColor: '#4caf50',     // Green
      errorColor: '#f44336',       // Red
      buttonTextColor: '#000000',
    }
  },
  'dwarf-fortress': {
    name: 'Dwarf Fortress',
    colors: {
      backgroundColor: '#000000', // Void
      textColor: '#c0c0c0',       // Standard Text
      panelColor: '#101010',      // Dark Stone
      panelBorderColor: '#808080', // Grey Walls
      accentColor1: '#ff0000',    // Magma
      accentColor2: '#008080',    // Teal/Adamantine/Water
      successColor: '#00ff00',    // Green
      errorColor: '#ff0000',      // Red
      buttonTextColor: '#ffffff',
    }
  }
};

const findMatchingPreset = (colors: { [key: string]: string; }) => {
    return Object.keys(COLOR_PRESETS).find(key => {
        const presetKey = key as keyof typeof COLOR_PRESETS;
        const presetColors = COLOR_PRESETS[presetKey].colors;
        return Object.keys(presetColors).every(colorKey => 
            presetColors[colorKey as keyof typeof presetColors] === colors[colorKey]
        );
    });
};

// === OVERLAY & UI COMPONENTS (defined outside App for stability) ===

const NextMilestoneOverlay = ({
    milestones,
    totalRaised,
    currencyPrefix,
    convertAmount,
    styles,
    config,
    successColor,
    effProgressBarColor,
    effProgressBarBgColor,
    effProgressBarTextColor,
    effProgressBarBorderColor,
    effSecondaryTextColor,
    hexToRgba,
    t
}: any) => {
    // Optional URL parameter override (&mode=step or &mode=relative vs &mode=cumulative)
    const urlMode = useMemo(() => {
        if (typeof window === 'undefined') return null;
        const p = new URLSearchParams(window.location.search).get('mode');
        if (p === 'step' || p === 'relative') return 'relative';
        if (p === 'cumulative' || p === 'total') return 'cumulative';
        return null;
    }, []);

    const progressMode = urlMode || config?.milestoneProgressMode || 'cumulative';

    // 1. Sanitize & sort milestones ascending by fundraisingGoal (safely handling strings and numbers)
    const sortedMilestones = useMemo(() => {
        if (!Array.isArray(milestones) || milestones.length === 0) return [];
        return milestones
            .map((m: any) => {
                const rawGoal = m?.fundraisingGoal ?? m?.goal;
                const goalNum = typeof rawGoal === 'number'
                    ? rawGoal
                    : parseFloat(String(rawGoal || '0').replace(/[^0-9.-]/g, ''));
                return {
                    ...m,
                    milestoneID: m?.milestoneID || m?.id || String(goalNum),
                    fundraisingGoal: isNaN(goalNum) ? 0 : goalNum,
                    description: m?.description || m?.title || m?.name || ''
                };
            })
            .filter((m: any) => m && m.fundraisingGoal > 0)
            .sort((a: any, b: any) => a.fundraisingGoal - b.fundraisingGoal);
    }, [milestones]);

    // Parse current total raised safely
    const numRaised = useMemo(() => {
        if (typeof totalRaised === 'number' && !isNaN(totalRaised)) return totalRaised;
        const parsed = parseFloat(String(totalRaised || '0').replace(/[^0-9.-]/g, ''));
        return isNaN(parsed) ? 0 : parsed;
    }, [totalRaised]);

    // 2. Find next uncompleted milestone
    const nextMilestone = useMemo(() => {
        return sortedMilestones.find((m: any) => numRaised < m.fundraisingGoal);
    }, [sortedMilestones, numRaised]);

    const barBg = effProgressBarBgColor || config?.milestoneProgressBarBgColor || config?.progressBarBgColor || '#1a1a1a';
    const barColor = effProgressBarColor || config?.milestoneProgressBarColor || config?.progressBarColor || config?.successColor || '#00ff00';
    const barTextColor = effProgressBarTextColor || config?.milestoneProgressBarTextColor || config?.progressBarTextColor || '#ffffff';
    const borderColor = effProgressBarBorderColor || config?.milestoneProgressBarBorderColor || config?.progressBarBorderColor || config?.panelBorderColor || '#00ffff';
    const secTextColor = effSecondaryTextColor || config?.secondaryTextColor || '#aaaaaa';
    const resolvedHexToRgba = hexToRgba || ((hex: string, alpha: number) => hex);

    // 3. If no milestones found at all
    if (sortedMilestones.length === 0) {
        return (
            <div style={{
                ...styles.progressBarContainer,
                backgroundColor: barBg,
                border: `4px solid ${borderColor}`,
                textAlign: 'center'
            }}>
                <h2 style={{...styles.milestoneDescription, color: secTextColor, margin: 0}}>
                    {t('noMilestones') || 'No Milestones Found'}
                </h2>
            </div>
        );
    }

    // 4. If all milestones have been reached
    if (!nextMilestone) {
        return (
            <div style={{
                ...styles.progressBarContainer,
                backgroundColor: barBg,
                border: `4px solid ${borderColor}`,
                textAlign: 'center'
            }}>
                <h2 style={{...styles.milestoneDescription, color: successColor || config?.successColor || '#00ff00', margin: 0}}>
                    {t('allMilestonesComplete')}
                </h2>
            </div>
        );
    }

    // 5. Determine previous milestone goal (for step/relative calculations)
    const milestoneIndex = sortedMilestones.findIndex((m: any) =>
        (m.milestoneID && nextMilestone.milestoneID && m.milestoneID === nextMilestone.milestoneID) ||
        m === nextMilestone
    );
    const previousMilestoneGoal = milestoneIndex > 0 ? sortedMilestones[milestoneIndex - 1].fundraisingGoal : 0;

    // 6. Calculations
    const targetGoal = nextMilestone.fundraisingGoal;
    const remainingTotal = Math.max(0, targetGoal - numRaised);

    // Cumulative percentage (0 to targetGoal)
    const cumulativePercentage = targetGoal > 0
        ? Math.min(100, Math.max(0, (numRaised / targetGoal) * 100))
        : 100;

    // Step/Relative percentage (previousMilestoneGoal to targetGoal)
    const stepGoal = Math.max(0, targetGoal - previousMilestoneGoal);
    const stepRaised = Math.min(stepGoal, Math.max(0, numRaised - previousMilestoneGoal));
    const stepPercentage = stepGoal > 0
        ? Math.min(100, Math.max(0, (stepRaised / stepGoal) * 100))
        : 100;

    // Active percentage used for bar fill
    const activePercentage = progressMode === 'relative' ? stepPercentage : cumulativePercentage;

    // Center text inside progress bar track
    const centerText = progressMode === 'relative'
        ? `${currencyPrefix}${convertAmount(stepRaised).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} / ${currencyPrefix}${convertAmount(stepGoal).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} (${activePercentage.toFixed(1)}%)`
        : `${currencyPrefix}${convertAmount(numRaised).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} / ${currencyPrefix}${convertAmount(targetGoal).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} (${activePercentage.toFixed(1)}%)`;

    return (
        <div style={{
            ...styles.progressBarContainer,
            backgroundColor: barBg,
            border: `4px solid ${borderColor}`
        }}>
            <h2 style={styles.milestoneDescription}>
                {t('nextGoal')}: {nextMilestone.description}
            </h2>

            {/* Progress Bar Track with Smooth Fill & Always-Visible Centered Text */}
            <div style={{
                position: 'relative',
                width: '100%',
                height: '42px',
                backgroundColor: barBg,
                border: `2px solid ${resolvedHexToRgba(borderColor, 0.4)}`,
                overflow: 'hidden',
                boxSizing: 'border-box' as const
            }}>
                <div style={{
                    height: '100%',
                    width: `${Math.min(100, Math.max(0, activePercentage))}%`,
                    backgroundColor: barColor,
                    transition: 'width 0.5s ease-in-out'
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
                    color: barTextColor,
                    fontFamily: config?.fontFamily || styles.progressBarContainer?.fontFamily,
                    fontSize: '1.15rem',
                    fontWeight: 'bold',
                    textShadow: `1px 1px 2px ${resolvedHexToRgba(config?.backgroundColor || '#000000', 0.85)}`,
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                    padding: '0 10px',
                    boxSizing: 'border-box' as const
                }}>
                    {centerText}
                </div>
            </div>

            {/* Goal & Remaining Info Bar */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '10px',
                color: secTextColor,
                fontSize: '0.95rem',
                fontFamily: config?.fontFamily || styles.progressBarContainer?.fontFamily,
                flexWrap: 'wrap' as const,
                gap: '8px'
            }}>
                <div>
                    {t('goal')}: <span style={{ color: config?.textColor || '#ffffff', fontWeight: 'bold' }}>{currencyPrefix}{convertAmount(targetGoal).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    {progressMode === 'relative' && previousMilestoneGoal > 0 && (
                        <span style={{ fontSize: '0.8rem', opacity: 0.75, marginLeft: '6px' }}>
                            ({t('teamTotal') ? t('teamTotal').split(' ')[0] : 'Total'}: {currencyPrefix}{convertAmount(numRaised).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})})
                        </span>
                    )}
                </div>
                {remainingTotal > 0 && (
                    <div style={{ opacity: 0.85 }}>
                        {currencyPrefix}{convertAmount(remainingTotal).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {t('toGo')}
                    </div>
                )}
            </div>
        </div>
    );
};

interface TeamHeaderOverlayProps {
  styles: any;
  currencyPrefix: string;
  convertAmount: (amount: number) => number;
  teamTotalRaised: number;
  teamGoal: number;
  teamName: string;
  teamDonationsCount?: number;
  config: any;
  effHeaderColor: string;
  effSecondaryTextColor: string;
  effProgressBarColor: string;
  effProgressBarBgColor?: string;
  effProgressBarTextColor?: string;
  effProgressBarBorderColor?: string;
  hexToRgba: (hex: string, alpha: number) => string;
  t: (key: string, vars?: any) => string;
}

const TeamHeaderOverlay: React.FC<TeamHeaderOverlayProps> = ({
  styles,
  currencyPrefix,
  convertAmount,
  teamTotalRaised,
  teamGoal,
  teamName,
  teamDonationsCount,
  config,
  effHeaderColor,
  effSecondaryTextColor,
  effProgressBarColor,
  effProgressBarBgColor,
  effProgressBarTextColor,
  effProgressBarBorderColor,
  hexToRgba,
  t
}) => {
  const pbBg = effProgressBarBgColor || config?.progressBarBgColor || '#1a1a1a';
  const pbFill = effProgressBarColor || config?.progressBarColor || config?.successColor || '#00ff00';
  const pbText = effProgressBarTextColor || config?.progressBarTextColor || '#ffffff';
  const pbBorder = effProgressBarBorderColor || config?.progressBarBorderColor || config?.panelBorderColor || '#00ffff';

  const teamProgress = teamGoal > 0 ? Math.min(100, Math.max(0, (teamTotalRaised / teamGoal) * 100)) : 0;
  const remaining = Math.max(0, teamGoal - teamTotalRaised);

  return (
    <div style={{
      ...styles.progressBarContainer,
      backgroundColor: config?.panelColor || pbBg,
      border: `4px solid ${pbBorder}`,
      padding: '16px 20px',
      boxSizing: 'border-box' as const,
      fontFamily: config?.fontFamily,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
      textAlign: 'left' as const
    }}>
      {/* Top Header Row: Team Identity & Status */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap' as const,
        gap: '8px'
      }}>
        <div style={{
          fontSize: '1.05rem',
          fontWeight: 'bold',
          color: effHeaderColor || config?.textColor,
          textShadow: `2px 2px ${config?.backgroundColor || '#000000'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          whiteSpace: 'nowrap'
        }}>
          👥 {teamName || t('teamTotal')}
        </div>
        <div style={{
          fontSize: '0.85rem',
          color: effSecondaryTextColor,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {typeof teamDonationsCount === 'number' && (
            <span>{teamDonationsCount} {t('donations')}</span>
          )}
          {teamGoal > 0 && (
            <span style={{
              backgroundColor: hexToRgba(pbFill, 0.18),
              color: pbFill,
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: 'bold',
              fontSize: '0.8rem'
            }}>
              {teamProgress.toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      {/* Primary Raised Amount Display */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        flexWrap: 'wrap' as const,
        gap: '6px',
        margin: '2px 0'
      }}>
        <span style={{
          fontSize: '2.4rem',
          fontWeight: 'bold',
          color: config?.successColor || '#00ff00',
          textShadow: `2px 2px 4px ${hexToRgba(config?.backgroundColor || '#000000', 0.85)}`,
          lineHeight: 1.1
        }}>
          {currencyPrefix}{convertAmount(teamTotalRaised).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        {teamGoal > 0 && (
          <span style={{
            fontSize: '0.95rem',
            color: effSecondaryTextColor
          }}>
            {t('teamGoal')}: <strong style={{ color: config?.textColor || '#ffffff' }}>{currencyPrefix}{convertAmount(teamGoal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </span>
        )}
      </div>

      {/* Progress Bar Track */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '40px',
        backgroundColor: pbBg,
        border: `2px solid ${pbBorder}`,
        overflow: 'hidden',
        boxSizing: 'border-box' as const
      }}>
        <div style={{
          height: '100%',
          width: `${teamGoal > 0 ? teamProgress : 100}%`,
          backgroundColor: pbFill,
          transition: 'width 0.5s ease-in-out'
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
          color: pbText,
          fontFamily: config?.fontFamily || styles?.progressBarContainer?.fontFamily,
          fontSize: '0.95rem',
          fontWeight: 'bold',
          textShadow: `1px 1px 3px ${hexToRgba(config?.backgroundColor || '#000000', 0.95)}`,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          padding: '0 10px',
          boxSizing: 'border-box' as const
        }}>
          {teamGoal > 0
            ? `${currencyPrefix}${convertAmount(teamTotalRaised).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${currencyPrefix}${convertAmount(teamGoal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${teamProgress.toFixed(1)}%)`
            : `${currencyPrefix}${convertAmount(teamTotalRaised).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          }
        </div>
      </div>

      {/* Objective / Remaining Target Info */}
      {teamGoal > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.85rem',
          color: effSecondaryTextColor,
          flexWrap: 'wrap' as const,
          gap: '8px'
        }}>
          <span>
            {t('teamGoal')}: <span style={{ color: config?.textColor || '#ffffff', fontWeight: 'bold' }}>{currencyPrefix}{convertAmount(teamGoal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </span>
          {remaining > 0 ? (
            <span style={{ color: pbFill, fontWeight: 'bold' }}>
              {currencyPrefix}{convertAmount(remaining).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {t('toGo')}
            </span>
          ) : (
            <span style={{ color: config?.successColor || '#00ff00', fontWeight: 'bold' }}>
              🎉 {t('goalReached') || 'Goal Reached!'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const TeamOverlay = TeamHeaderOverlay;

interface TeamDonationsOverlayProps {
  styles: any;
  currencyPrefix: string;
  convertAmount: (amount: number) => number;
  teamTotalRaised: number;
  teamName: string;
  teamDonations: any[];
  config: any;
  effHeaderColor: string;
  effSecondaryTextColor: string;
  effDividerColor: string;
  effHighlightColor: string;
  effDonorNameColor: string;
  hexToRgba: (hex: string, alpha: number) => string;
  t: (key: string, vars?: any) => string;
}

const TeamDonationsOverlay: React.FC<TeamDonationsOverlayProps> = ({
  styles,
  currencyPrefix,
  convertAmount,
  teamTotalRaised,
  teamName,
  teamDonations,
  config,
  effHeaderColor,
  effSecondaryTextColor,
  effDividerColor,
  effHighlightColor,
  effDonorNameColor,
  hexToRgba,
  t
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const sortedDonations = useMemo(() => {
    return [...(teamDonations || [])].sort((a, b) => new Date(b.createdDateUTC).getTime() - new Date(a.createdDateUTC).getTime());
  }, [teamDonations]);

  const filteredDonations = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return sortedDonations;
    return sortedDonations.filter(d => {
      const donor = (d.displayName || t('anonymous')).toLowerCase();
      const recipient = (d.recipientName || '').toLowerCase();
      const msg = (d.message || '').toLowerCase();
      const amt = String(d.amount);
      return donor.includes(q) || recipient.includes(q) || msg.includes(q) || amt.includes(q);
    });
  }, [sortedDonations, searchTerm, t]);

  return (
    <div style={{
      width: '100%',
      maxWidth: '650px',
      height: '100vh',
      margin: '0 auto',
      padding: '16px',
      boxSizing: 'border-box' as const,
      fontFamily: config?.fontFamily,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
      overflow: 'hidden'
    }}>
      {/* Header Panel */}
      <div style={{
        backgroundColor: config?.panelColor,
        border: `3px solid ${effHighlightColor}`,
        padding: '14px 16px',
        boxSizing: 'border-box' as const,
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px',
        textAlign: 'left' as const
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap' as const,
          gap: '8px',
          borderBottom: `1px dashed ${effDividerColor}`,
          paddingBottom: '8px'
        }}>
          <h3 style={{
            margin: 0,
            color: effHeaderColor || config?.textColor,
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textShadow: `1px 1px 2px ${config?.backgroundColor || '#000000'}`
          }}>
            👥 {teamName ? `${teamName} - ${t('teamDonations')}` : t('teamDonations')}
          </h3>
          <span style={{
            fontSize: '0.8rem',
            backgroundColor: hexToRgba(effHighlightColor, 0.15),
            color: effHighlightColor,
            padding: '3px 10px',
            borderRadius: '12px',
            fontWeight: 'bold'
          }}>
            {filteredDonations.length} {t('donations')}
          </span>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.85rem',
          color: effSecondaryTextColor
        }}>
          <span>{t('totalTeamRaised')}:</span>
          <span style={{ color: config?.successColor || '#00ff00', fontWeight: 'bold', fontSize: '1.05rem' }}>
            {currencyPrefix}{convertAmount(teamTotalRaised).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={t('searchDonations')}
            style={{
              ...styles.input,
              fontSize: '0.8rem',
              padding: '6px 10px',
              width: '100%',
              boxSizing: 'border-box' as const
            }}
          />
        </div>
      </div>

      {/* Scrollable Donations Feed */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '10px',
        paddingRight: '4px',
        textAlign: 'left' as const
      }}>
        {filteredDonations.length === 0 ? (
          <div style={{
            padding: '40px 15px',
            textAlign: 'center' as const,
            backgroundColor: hexToRgba(config?.panelColor || '#1a1a1a', 0.7),
            border: `2px dashed ${config?.panelBorderColor || '#555555'}`,
            color: effSecondaryTextColor,
            fontSize: '0.85rem'
          }}>
            {t('noTeamDonations')}
          </div>
        ) : (
          filteredDonations.map((d: any) => {
            const isAnonymous = !d.displayName || d.displayName.toLowerCase() === 'anonymous';
            const donorTitle = isAnonymous ? t('anonymous') : d.displayName;
            const formattedDate = d.createdDateUTC ? new Date(d.createdDateUTC).toLocaleString() : '';

            return (
              <div
                key={d.donationID || `${d.createdDateUTC}-${d.amount}`}
                style={{
                  backgroundColor: hexToRgba(config?.panelColor || '#1a1a1a', 0.85),
                  border: `2px solid ${hexToRgba(config?.panelBorderColor || '#444444', 0.4)}`,
                  padding: '12px 14px',
                  boxSizing: 'border-box' as const,
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    color: effDonorNameColor,
                    fontWeight: 'bold',
                    fontSize: '0.95rem',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}>
                    {donorTitle}
                  </span>
                  <span style={{
                    color: config?.successColor || '#00ff00',
                    fontWeight: 'bold',
                    fontSize: '1.05rem',
                    flexShrink: 0
                  }}>
                    {currencyPrefix}{convertAmount(d.amount).toFixed(2)}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap' as const,
                  gap: '4px',
                  marginTop: '6px',
                  fontSize: '0.78rem',
                  color: effSecondaryTextColor
                }}>
                  <span>
                    🎯 {t('forRecipient')} <strong>{d.recipientName || teamName || 'Team'}</strong>
                  </span>
                  {formattedDate && (
                    <span style={{ fontFamily: 'monospace', opacity: 0.7, fontSize: '0.72rem' }}>
                      {formattedDate}
                    </span>
                  )}
                </div>

                {d.message && (
                  <div style={{
                    marginTop: '8px',
                    padding: '6px 10px',
                    backgroundColor: hexToRgba(config?.backgroundColor || '#000000', 0.5),
                    borderRadius: '4px',
                    fontStyle: 'italic' as const,
                    fontSize: '0.82rem',
                    color: config?.textColor,
                    lineHeight: 1.4,
                    borderLeft: `3px solid ${effHighlightColor}`
                  }}>
                    "{d.message}"
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

interface TeamDashboardViewProps {
  styles: any;
  config: any;
  currencyPrefix: string;
  convertAmount: (amount: number) => number;
  teamTotalRaised: number;
  teamGoal: number;
  teamName: string;
  teamDonations: any[];
  teamParticipants: any[];
  participantId: string;
  participantName: string;
  participantDonations: Donation[];
  participantTotalRaised: number;
  participantGoal: number;
  selectedAccountId: string;
  setSelectedAccountId: (id: string) => void;
  t: (key: string, vars?: any) => string;
  isOverlay?: boolean;
  effHeaderColor: string;
  effSecondaryTextColor: string;
  effPrimaryButtonBgColor: string;
  effSecondaryButtonBgColor: string;
  effDividerColor: string;
  effHighlightColor: string;
  effDonorNameColor: string;
  effProgressBarColor: string;
  effProgressBarBgColor?: string;
  effProgressBarTextColor?: string;
  effProgressBarBorderColor?: string;
  hexToRgba: (hex: string, alpha: number) => string;
  lastFetchedAt: Date | null;
  onManualSync?: () => void;
}

const TeamDashboardView: React.FC<TeamDashboardViewProps> = ({
  styles,
  config,
  currencyPrefix,
  convertAmount,
  teamTotalRaised,
  teamGoal,
  teamName,
  teamDonations,
  teamParticipants,
  participantId,
  participantName,
  participantDonations,
  participantTotalRaised,
  participantGoal,
  selectedAccountId,
  setSelectedAccountId,
  t,
  isOverlay = false,
  effHeaderColor,
  effSecondaryTextColor,
  effPrimaryButtonBgColor,
  effSecondaryButtonBgColor,
  effDividerColor,
  effHighlightColor,
  effDonorNameColor,
  effProgressBarColor,
  effProgressBarBgColor,
  effProgressBarTextColor,
  effProgressBarBorderColor,
  hexToRgba,
  lastFetchedAt,
  onManualSync,
}) => {
  const pbBg = effProgressBarBgColor || config.progressBarBgColor || '#1a1a1a';
  const pbFill = effProgressBarColor || config.progressBarColor || config.successColor || '#00ff00';
  const pbText = effProgressBarTextColor || config.progressBarTextColor || '#ffffff';
  const pbBorder = effProgressBarBorderColor || config.progressBarBorderColor || config.panelBorderColor || '#00ffff';

  const [teamSearch, setTeamSearch] = useState('');
  const [accountSearch, setAccountSearch] = useState('');
  const [fetchedAccounts, setFetchedAccounts] = useState<Record<string, { donations: any[]; total: number; goal: number; name: string }>>({});
  const [loadingAccount, setLoadingAccount] = useState(false);

  // Active account ID defaults to the current participantId
  const activeAccountId = selectedAccountId || String(participantId || '');

  // Asynchronously fetch extra data for a team member if chosen
  useEffect(() => {
    if (!activeAccountId || activeAccountId === String(participantId)) return;
    if (fetchedAccounts[activeAccountId]) return;

    let isMounted = true;
    setLoadingAccount(true);

    Promise.all([
      fetch(`https://dd.extra-life.org/api/participants/${activeAccountId}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`https://dd.extra-life.org/api/participants/${activeAccountId}/donations?limit=100&orderBy=createdDateUTC&orderDirection=DESC`).then(r => r.ok ? r.json() : null).catch(() => null)
    ]).then(([partRes, donRes]) => {
      if (isMounted) {
        setFetchedAccounts(prev => ({
          ...prev,
          [activeAccountId]: {
            donations: Array.isArray(donRes) ? donRes : [],
            total: partRes?.sumDonations ?? 0,
            goal: partRes?.fundraisingGoal ?? 0,
            name: partRes?.displayName || ''
          }
        }));
        setLoadingAccount(false);
      }
    }).catch(() => {
      if (isMounted) setLoadingAccount(false);
    });

    return () => { isMounted = false; };
  }, [activeAccountId, participantId]);

  // Resolve active account details
  const activeMemberFromTeam = teamParticipants.find(p => String(p.participantID) === activeAccountId);
  const activeFetched = fetchedAccounts[activeAccountId];

  const activeAccountName = activeAccountId === String(participantId)
    ? (participantName || t('specificAccount'))
    : (activeFetched?.name || activeMemberFromTeam?.displayName || `Account ${activeAccountId}`);

  const activeAccountTotal = activeAccountId === String(participantId)
    ? participantTotalRaised
    : (activeFetched?.total ?? (activeMemberFromTeam?.sumDonations ?? 0));

  const activeAccountGoal = activeAccountId === String(participantId)
    ? participantGoal
    : (activeFetched?.goal ?? (activeMemberFromTeam?.fundraisingGoal ?? 0));

  // Resolve donations for active account
  const rawAccountDonations = useMemo(() => {
    if (activeAccountId === String(participantId)) {
      if (participantDonations && participantDonations.length > 0) {
        return participantDonations;
      }
      return teamDonations.filter(d => String(d.participantID) === String(participantId) || (participantName && d.recipientName === participantName));
    }
    if (activeFetched?.donations && activeFetched.donations.length > 0) {
      return activeFetched.donations;
    }
    return teamDonations.filter(d => 
      String(d.participantID) === activeAccountId || 
      (activeMemberFromTeam && d.recipientName === activeMemberFromTeam.displayName)
    );
  }, [activeAccountId, participantId, participantDonations, teamDonations, participantName, activeFetched, activeMemberFromTeam]);

  // Filtered team donations
  const filteredTeamDonations = useMemo(() => {
    const q = teamSearch.trim().toLowerCase();
    if (!q) return teamDonations;
    return teamDonations.filter(d => {
      const donor = (d.displayName || t('anonymous')).toLowerCase();
      const recipient = (d.recipientName || '').toLowerCase();
      const msg = (d.message || '').toLowerCase();
      const amt = String(d.amount);
      return donor.includes(q) || recipient.includes(q) || msg.includes(q) || amt.includes(q);
    });
  }, [teamDonations, teamSearch, t]);

  // Filtered account donations
  const filteredAccountDonations = useMemo(() => {
    const q = accountSearch.trim().toLowerCase();
    if (!q) return rawAccountDonations;
    return rawAccountDonations.filter(d => {
      const donor = (d.displayName || t('anonymous')).toLowerCase();
      const msg = (d.message || '').toLowerCase();
      const amt = String(d.amount);
      return donor.includes(q) || msg.includes(q) || amt.includes(q);
    });
  }, [rawAccountDonations, accountSearch, t]);

  // Progress calculations
  const teamProgress = teamGoal > 0 ? Math.min(100, (teamTotalRaised / teamGoal) * 100) : 0;
  const accountProgress = activeAccountGoal > 0 ? Math.min(100, (activeAccountTotal / activeAccountGoal) * 100) : 0;
  const accountContribution = teamTotalRaised > 0 ? Math.min(100, (activeAccountTotal / teamTotalRaised) * 100) : 0;

  return (
    <div style={{
      width: '100%',
      maxWidth: isOverlay ? '100%' : '1400px',
      margin: '0 auto',
      padding: isOverlay ? '16px' : '0',
      boxSizing: 'border-box' as const,
      fontFamily: config.fontFamily
    }}>
      {/* HERO STATS SECTION */}
      <div style={styles.statHero}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.95rem', color: effHighlightColor, fontWeight: 'bold' }}>
            👥 {teamName || t('teamDashboard')}
          </span>
          {lastFetchedAt && (
            <span style={{ fontSize: '0.8rem', opacity: 0.7, color: effSecondaryTextColor }}>
              • {t('live')}: {lastFetchedAt.toLocaleTimeString()}
            </span>
          )}
        </div>

        <h2 style={styles.bigStat}>
          {currencyPrefix}{convertAmount(teamTotalRaised).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h2>

        <p style={styles.secondaryStat}>
          {teamGoal > 0 
            ? `${t('teamGoal')}: ${currencyPrefix}${convertAmount(teamGoal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${teamProgress.toFixed(1)}%)`
            : `${t('totalDonations')}: ${teamDonations.length}`
          }
        </p>

        {teamGoal > 0 && (
          <div style={{
            width: '100%',
            maxWidth: '650px',
            backgroundColor: pbBg,
            border: `2px solid ${pbBorder}`,
            padding: '4px',
            boxSizing: 'border-box' as const,
            marginTop: '8px'
          }}>
            <div style={{
              position: 'relative',
              width: '100%',
              height: '32px',
              backgroundColor: pbBg,
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${teamProgress}%`,
                backgroundColor: pbFill,
                transition: 'width 0.5s ease-in-out'
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
                color: pbText,
                fontSize: '0.9rem',
                fontFamily: config.fontFamily,
                fontWeight: 'bold',
                textShadow: `1px 1px 2px ${hexToRgba(config.backgroundColor, 0.85)}`,
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                padding: '0 8px'
              }}>
                {currencyPrefix}{convertAmount(teamTotalRaised).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / {currencyPrefix}{convertAmount(teamGoal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({teamProgress.toFixed(1)}%)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4 SUMMARY METRIC TILES */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ ...styles.card, textAlign: 'center', padding: '14px' }}>
          <span style={{ fontSize: '0.8rem', color: effSecondaryTextColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t('totalDonationsCount')}
          </span>
          <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: effHighlightColor, marginTop: '4px' }}>
            {teamDonations.length}
          </span>
        </div>

        <div style={{ ...styles.card, textAlign: 'center', padding: '14px' }}>
          <span style={{ fontSize: '0.8rem', color: effSecondaryTextColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t('teamMembersCount')}
          </span>
          <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: effHighlightColor, marginTop: '4px' }}>
            {teamParticipants.length}
          </span>
        </div>

        <div style={{ ...styles.card, textAlign: 'center', padding: '14px' }}>
          <span style={{ fontSize: '0.8rem', color: effSecondaryTextColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t('specificAccount')}
          </span>
          <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: config.textColor, marginTop: '4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {activeAccountName}
          </span>
        </div>

        <div style={{ ...styles.card, textAlign: 'center', padding: '14px' }}>
          <span style={{ fontSize: '0.8rem', color: effSecondaryTextColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t('accountTotalRaised')}
          </span>
          <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: config.successColor, marginTop: '4px' }}>
            {currencyPrefix}{convertAmount(activeAccountTotal).toFixed(2)}
            <span style={{ fontSize: '0.8rem', opacity: 0.7, marginLeft: '6px', color: effSecondaryTextColor }}>
              ({accountContribution.toFixed(1)}%)
            </span>
          </span>
        </div>
      </div>

      {/* 2 COLUMNS LAYOUT */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px',
        width: '100%',
        alignItems: 'start'
      }}>
        {/* COLUMN 1: ALL DONATIONS RECEIVED BY THE TEAM */}
        <div style={{
          ...styles.card,
          border: `2px solid ${effHighlightColor}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '16px'
        }}>
          {/* Column 1 Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            borderBottom: `1px dashed ${effDividerColor}`,
            paddingBottom: '10px'
          }}>
            <h3 style={{ margin: 0, color: effHeaderColor, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              👥 {t('teamDonations')}
            </h3>
            <span style={{
              fontSize: '0.8rem',
              backgroundColor: hexToRgba(effHighlightColor, 0.15),
              color: effHighlightColor,
              padding: '3px 10px',
              borderRadius: '12px',
              fontWeight: 'bold'
            }}>
              {filteredTeamDonations.length} {t('donations')}
            </span>
          </div>

          {/* Search Filter for Team Donations */}
          <div>
            <input
              type="text"
              id="input-team-donations-filter"
              value={teamSearch}
              onChange={e => setTeamSearch(e.target.value)}
              placeholder={t('searchDonations')}
              style={{
                ...styles.input,
                fontSize: '0.85rem',
                padding: '8px 12px',
                width: '100%',
                boxSizing: 'border-box' as const
              }}
            />
          </div>

          {/* Team Donations Feed */}
          <div style={{
            maxHeight: isOverlay ? 'calc(100vh - 430px)' : '650px',
            minHeight: '260px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            paddingRight: '4px'
          }}>
            {filteredTeamDonations.length === 0 ? (
              <div style={{ padding: '30px 10px', textAlign: 'center', opacity: 0.7, color: config.textColor }}>
                <p style={{ margin: 0 }}>{t('noTeamDonations')}</p>
              </div>
            ) : (
              filteredTeamDonations.map((d: any) => {
                const isAnonymous = !d.displayName || d.displayName.toLowerCase() === 'anonymous';
                const donorTitle = isAnonymous ? t('anonymous') : d.displayName;
                const formattedDate = d.createdDateUTC ? new Date(d.createdDateUTC).toLocaleString() : '';

                return (
                  <div
                    key={d.donationID || `${d.createdDateUTC}-${d.amount}`}
                    style={{
                      backgroundColor: hexToRgba(config.panelColor, 0.75),
                      border: `1px solid ${hexToRgba(config.panelBorderColor, 0.35)}`,
                      borderRadius: '8px',
                      padding: '12px 14px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        color: effDonorNameColor,
                        fontWeight: 'bold',
                        fontSize: '0.95rem',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                      }}>
                        {donorTitle}
                      </span>
                      <span style={{
                        color: config.successColor,
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        flexShrink: 0
                      }}>
                        {currencyPrefix}{convertAmount(d.amount).toFixed(2)}
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '4px',
                      marginTop: '6px',
                      fontSize: '0.8rem',
                      color: effSecondaryTextColor
                    }}>
                      <span>
                        🎯 {t('forRecipient')} <strong>{d.recipientName || teamName || 'Team'}</strong>
                      </span>
                      {formattedDate && (
                        <span style={{ fontFamily: 'monospace', opacity: 0.7, fontSize: '0.75rem' }}>
                          {formattedDate}
                        </span>
                      )}
                    </div>

                    {d.message && (
                      <div style={{
                        marginTop: '8px',
                        padding: '6px 10px',
                        backgroundColor: hexToRgba(config.backgroundColor, 0.4),
                        borderRadius: '6px',
                        fontStyle: 'italic',
                        fontSize: '0.85rem',
                        color: config.textColor,
                        lineHeight: 1.4,
                        borderLeft: `2px solid ${effHighlightColor}`
                      }}>
                        "{d.message}"
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN 2: ONE FOR A SPECIFIC ACCOUNT */}
        <div style={{
          ...styles.card,
          border: `2px solid ${effHighlightColor}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '16px'
        }}>
          {/* Column 2 Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            borderBottom: `1px dashed ${effDividerColor}`,
            paddingBottom: '10px'
          }}>
            <h3 style={{ margin: 0, color: effHeaderColor, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              👤 {t('accountDonations')}
            </h3>
            <span style={{
              fontSize: '0.8rem',
              backgroundColor: hexToRgba(effHighlightColor, 0.15),
              color: effHighlightColor,
              padding: '3px 10px',
              borderRadius: '12px',
              fontWeight: 'bold'
            }}>
              {filteredAccountDonations.length} {t('donations')}
            </span>
          </div>

          {/* Account Selector Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="select-account" style={{ fontSize: '0.8rem', color: effSecondaryTextColor, fontWeight: 'bold' }}>
              {t('selectAccount')}:
            </label>
            <select
              id="select-account"
              value={activeAccountId}
              onChange={e => setSelectedAccountId(e.target.value)}
              style={{
                ...styles.input,
                fontSize: '0.85rem',
                padding: '8px 12px',
                width: '100%',
                backgroundColor: config.panelColor,
                color: config.textColor,
                cursor: 'pointer'
              }}
            >
              {/* Option 1: Profile participant */}
              {participantId && (
                <option value={String(participantId)}>
                  ⭐ {participantName || 'My Profile'} (ID: {participantId}) - {currencyPrefix}{convertAmount(participantTotalRaised).toFixed(2)}
                </option>
              )}
              {/* Team participants */}
              {teamParticipants
                .filter(p => String(p.participantID) !== String(participantId))
                .map(p => (
                  <option key={p.participantID} value={String(p.participantID)}>
                    {p.displayName || `ID ${p.participantID}`} (ID: {p.participantID}) - {currencyPrefix}{convertAmount(p.sumDonations || 0).toFixed(2)}
                  </option>
                ))}
            </select>
          </div>

          {/* Active Account Overview Card */}
          <div style={{
            backgroundColor: hexToRgba(effPrimaryButtonBgColor, 0.1),
            border: `1px solid ${hexToRgba(effHighlightColor, 0.3)}`,
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: config.textColor }}>
                {activeAccountName}
                {loadingAccount && <span style={{ fontSize: '0.75rem', opacity: 0.6, marginLeft: '6px' }}>({t('connecting')})</span>}
              </span>
              <span style={{ fontWeight: 'bold', fontSize: '1.05rem', color: config.successColor }}>
                {currencyPrefix}{convertAmount(activeAccountTotal).toFixed(2)}
              </span>
            </div>

            {activeAccountGoal > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: effSecondaryTextColor, marginBottom: '4px' }}>
                  <span>{t('goal')}: {currencyPrefix}{convertAmount(activeAccountGoal).toFixed(2)}</span>
                  <span>{accountProgress.toFixed(1)}%</span>
                </div>
                <div style={{
                  position: 'relative',
                  height: '16px',
                  backgroundColor: pbBg,
                  border: `1px solid ${pbBorder}`,
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${accountProgress}%`,
                    height: '100%',
                    backgroundColor: pbFill,
                    transition: 'width 0.4s ease'
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
                    color: pbText,
                    fontSize: '0.65rem',
                    fontFamily: config.fontFamily,
                    fontWeight: 'bold',
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap'
                  }}>
                    {currencyPrefix}{convertAmount(activeAccountTotal).toFixed(2)} / {currencyPrefix}{convertAmount(activeAccountGoal).toFixed(2)} ({accountProgress.toFixed(1)}%)
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Search Filter for Account Donations */}
          <div>
            <input
              type="text"
              id="input-account-donations-filter"
              value={accountSearch}
              onChange={e => setAccountSearch(e.target.value)}
              placeholder={t('searchDonations')}
              style={{
                ...styles.input,
                fontSize: '0.85rem',
                padding: '8px 12px',
                width: '100%',
                boxSizing: 'border-box' as const
              }}
            />
          </div>

          {/* Account Donations Feed */}
          <div style={{
            maxHeight: isOverlay ? 'calc(100vh - 540px)' : '530px',
            minHeight: '220px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            paddingRight: '4px'
          }}>
            {filteredAccountDonations.length === 0 ? (
              <div style={{ padding: '30px 10px', textAlign: 'center', opacity: 0.7, color: config.textColor }}>
                <p style={{ margin: 0 }}>{t('noAccountDonations')}</p>
              </div>
            ) : (
              filteredAccountDonations.map((d: any) => {
                const isAnonymous = !d.displayName || d.displayName.toLowerCase() === 'anonymous';
                const donorTitle = isAnonymous ? t('anonymous') : d.displayName;
                const formattedDate = d.createdDateUTC ? new Date(d.createdDateUTC).toLocaleString() : '';

                return (
                  <div
                    key={d.donationID || `${d.createdDateUTC}-${d.amount}`}
                    style={{
                      backgroundColor: hexToRgba(config.panelColor, 0.75),
                      border: `1px solid ${hexToRgba(config.panelBorderColor, 0.35)}`,
                      borderRadius: '8px',
                      padding: '12px 14px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        color: effDonorNameColor,
                        fontWeight: 'bold',
                        fontSize: '0.95rem',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                      }}>
                        {donorTitle}
                      </span>
                      <span style={{
                        color: config.successColor,
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        flexShrink: 0
                      }}>
                        {currencyPrefix}{convertAmount(d.amount).toFixed(2)}
                      </span>
                    </div>

                    {formattedDate && (
                      <div style={{
                        marginTop: '6px',
                        fontSize: '0.75rem',
                        color: effSecondaryTextColor,
                        fontFamily: 'monospace',
                        opacity: 0.7
                      }}>
                        {formattedDate}
                      </div>
                    )}

                    {d.message && (
                      <div style={{
                        marginTop: '8px',
                        padding: '6px 10px',
                        backgroundColor: hexToRgba(config.backgroundColor, 0.4),
                        borderRadius: '6px',
                        fontStyle: 'italic',
                        fontSize: '0.85rem',
                        color: config.textColor,
                        lineHeight: 1.4,
                        borderLeft: `2px solid ${effHighlightColor}`
                      }}>
                        "{d.message}"
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ScheduleOverlay = ({ items, styles, accentColor1, accentColor2, textColor, fontFamily, t, timeColor, dividerColor, headerColor }: { items: any[], styles: any, accentColor1?: string, accentColor2?: string, textColor: string, fontFamily: string, t: any, timeColor?: string, dividerColor?: string, headerColor?: string }) => {
    const effTimeColor = timeColor || accentColor1 || '#ff00ff';
    const effDivColor = dividerColor || accentColor2 || '#00ffff';
    const effHColor = headerColor || accentColor1 || '#ff00ff';

    const containerStyle = styles.overlayContainer || styles.progressBarContainer;

    if (!items || items.length === 0) {
        return <div style={{...containerStyle, textAlign: 'center', padding: '20px'}}>
            <h2 style={{...styles.milestoneDescription}}>{t('noScheduleSet')}</h2>
        </div>
    }
    return (
        <div style={{...containerStyle, padding: '20px'}}>
            <h2 style={{...styles.milestoneDescription, textAlign: 'center', borderBottom: `2px solid ${effDivColor}`, paddingBottom: '10px', marginBottom: '10px', color: effHColor }}>{t('streamSchedule')}</h2>
            <div style={{ maxHeight: 'calc(100vh - 80px)', overflowY: 'auto' }}>
                {items.map(item => {
                    const date = new Date(item.time);
                    const timeDisplay = isNaN(date.getTime()) 
                        ? item.time 
                        : date.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' });
                    
                    return (
                        <div key={item.id} style={{
                            display: 'flex',
                            gap: '15px',
                            padding: '8px 5px',
                            borderBottom: `1px dashed ${effDivColor}`,
                            opacity: item.isDone ? 0.6 : 1,
                            textDecoration: item.isDone ? 'line-through' : 'none',
                            transition: 'opacity 0.3s ease, text-decoration 0.3s ease',
                            alignItems: 'baseline',
                            flexWrap: 'wrap'
                        }}>
                            <span style={{ color: effTimeColor, flexShrink: 0, minWidth: '160px', whiteSpace: 'nowrap', fontFamily }}>{timeDisplay}</span>
                            <span style={{ color: textColor, flexGrow: 1, fontFamily }}>{item.description}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const SponsorOverlay = ({ sponsors, styles, animationDuration = 5, t }: any) => {
    const [index, setIndex] = useState(0);
    const containerStyle = styles.overlayContainer || styles.progressBarContainer;

    useEffect(() => {
        if (!sponsors || sponsors.length <= 1) return;
        const interval = setInterval(() => {
            setIndex(prev => (prev + 1) % sponsors.length);
        }, animationDuration * 1000);
        return () => clearInterval(interval);
    }, [sponsors, animationDuration]);

    if (!sponsors || sponsors.length === 0) {
        return (
             <div style={{...containerStyle, height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <span style={{...styles.label, opacity: 0.5}}>{t('noSponsorsAdded')}</span>
            </div>
        );
    }

    const currentSponsor = sponsors[index];

    return (
        <div style={{
            position: 'fixed',
            top: 0, 
            left: 0,
            width: '100vw', 
            height: '100vh', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            overflow: 'hidden', 
            padding: containerStyle.padding,
            backgroundColor: containerStyle.backgroundColor,
            border: containerStyle.border,
            boxSizing: 'border-box'
        }}>
             <img 
                key={currentSponsor.id} 
                src={currentSponsor.imageUrl} 
                alt={currentSponsor.name} 
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    animation: 'fadeIn 1s ease-in-out' 
                }} 
            />
        </div>
    );
};

const TextOverlay = ({ filename, customText, styles, fontFamily, textColor, accentColor1, highlightColor, alignment = 'top-left', fontSize = 1.5, t }: any) => {
    const [content, setContent] = useState(customText || '');
    const effTextHighlightColor = highlightColor || accentColor1;

    useEffect(() => {
        if (customText) {
            setContent(customText);
            return;
        }
        if (!filename) {
            setContent(t ? t('noTextConfigured') : 'No text configured');
            return;
        }

        const fetchText = () => {
            const url = (filename.startsWith('http://') || filename.startsWith('https://'))
                ? filename
                : `/api/read-text/${filename}`;
            fetch(url)
                .then(res => {
                    if (res.ok) return res.text();
                    throw new Error('Failed to read file');
                })
                .then(text => setContent(text))
                .catch(err => {
                    console.error(err);
                    setContent(t ? t('errorLoadingFile', { filename }) : `Error loading ${filename}`);
                });
        };

        fetchText();
        const interval = setInterval(fetchText, 3000);
        return () => clearInterval(interval);
    }, [filename, customText]);

    const getAlignmentStyles = () => {
        const style: React.CSSProperties = {
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            textAlign: 'left'
        };

        switch (alignment) {
            case 'top-left':
                style.justifyContent = 'flex-start';
                style.alignItems = 'flex-start';
                style.textAlign = 'left';
                break;
            case 'top-center':
                style.justifyContent = 'center';
                style.alignItems = 'flex-start';
                style.textAlign = 'center';
                break;
            case 'top-right':
                style.justifyContent = 'flex-end';
                style.alignItems = 'flex-start';
                style.textAlign = 'right';
                break;
            case 'center-left':
                style.justifyContent = 'flex-start';
                style.alignItems = 'center';
                style.textAlign = 'left';
                break;
            case 'center':
                style.justifyContent = 'center';
                style.alignItems = 'center';
                style.textAlign = 'center';
                break;
            case 'center-right':
                style.justifyContent = 'flex-end';
                style.alignItems = 'center';
                style.textAlign = 'right';
                break;
            case 'bottom-left':
                style.justifyContent = 'flex-start';
                style.alignItems = 'flex-end';
                style.textAlign = 'left';
                break;
            case 'bottom-center':
                style.justifyContent = 'center';
                style.alignItems = 'flex-end';
                style.textAlign = 'center';
                break;
            case 'bottom-right':
                style.justifyContent = 'flex-end';
                style.alignItems = 'flex-end';
                style.textAlign = 'right';
                break;
        }
        return style;
    };

    const alignStyle = getAlignmentStyles();
    const containerStyle = styles.overlayContainer || styles.progressBarContainer;

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            justifyContent: alignStyle.justifyContent,
            alignItems: alignStyle.alignItems,
            backgroundColor: containerStyle.backgroundColor,
            color: textColor,
            fontFamily: fontFamily,
            border: containerStyle.border,
            boxSizing: 'border-box',
            padding: '40px',
            overflow: 'hidden'
        }}>
            <pre style={{
                whiteSpace: 'pre-wrap',
                textAlign: alignStyle.textAlign as any,
                fontSize: `${fontSize}rem`,
                margin: 0,
                color: effTextHighlightColor,
                fontFamily: fontFamily, // Ensure pre tag uses the theme font
                maxWidth: '100%',
                maxHeight: '100%',
                overflow: 'auto'
            }}>
                {content}
            </pre>
        </div>
    );
};


const Confetti = ({ colors, triggerKey, duration, debug = false }: { colors: string[], triggerKey: number, duration: number, debug?: boolean }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);

    useEffect(() => {
        if (triggerKey <= 0) return;

        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Setup Canvas
        const updateSize = () => {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
        };
        updateSize();
        window.addEventListener('resize', updateSize);

        const width = canvas.width;
        const height = canvas.height;

        // --- SINGLE BLAST CONFIGURATION ---
        const particleCount = 300;
        const particles: any[] = [];
        
        for (let i = 0; i < particleCount; i++) {
            const startY = -Math.random() * 150 - 50; 
            const totalDistance = height - startY + 50; 
            const pDuration = (duration * 1000) * (0.5 + Math.random() * 0.5);
            const speed = totalDistance / pDuration;

            particles.push({
                startX: Math.random() * width,
                startY: startY,
                size: Math.random() * 10 + 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                speed: speed,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                oscillationPhase: Math.random() * Math.PI * 2,
                oscillationSpeed: 0.002 + Math.random() * 0.005
            });
        }

        startTimeRef.current = performance.now();

        const animate = (time: number) => {
            const elapsed = time - startTimeRef.current;

            if (elapsed > duration * 1000) {
                ctx.clearRect(0, 0, width, height);
                return;
            }

            ctx.clearRect(0, 0, width, height);

            particles.forEach(p => {
                const currentY = p.startY + (p.speed * elapsed);
                if (currentY > height + 50) return;

                const currentOsc = p.oscillationPhase + (p.oscillationSpeed * elapsed);
                const currentRot = p.rotation + (p.rotationSpeed * elapsed);
                const currentX = p.startX + Math.sin(currentOsc) * 20;

                ctx.save();
                ctx.fillStyle = p.color;
                ctx.translate(currentX, currentY);
                ctx.rotate(currentRot * Math.PI / 180);
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            });

            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', updateSize);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (canvasRef.current) {
                const c = canvasRef.current.getContext('2d');
                c?.clearRect(0, 0, width, height);
            }
        };
    }, [triggerKey, colors, duration]);

    return (
      <div ref={containerRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9998 }}>
        <canvas ref={canvasRef} />
      </div>
    );
};
  
const CelebrationOverlay = ({ playSound, accentColor1, accentColor2, primaryColor, secondaryColor, successColor, celebrationDuration, activeCelebrationKey }: any) => {
    const c1 = primaryColor || accentColor1;
    const c2 = secondaryColor || accentColor2;
    const colors = useMemo(() => [c1, c2, successColor], [c1, c2, successColor]);

    return (
        <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <Confetti 
                colors={colors} 
                triggerKey={activeCelebrationKey} 
                duration={celebrationDuration}
            />
        </div>
    );
};

// === QR CODE COMPONENTS & HELPERS ===

const downloadQRCodePng = (
  url: string,
  filename: string,
  targetSize = 1024,
  fgColor = '#000000',
  bgColor = '#ffffff',
  errorCorrectionLevel = 'M'
) => {
  try {
    const matrix = createQRMatrix(url || 'https://dd.extra-life.org', errorCorrectionLevel as any);
    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const margin = 2;
    const fullSize = matrix.length + margin * 2;
    const cell = targetSize / fullSize;
    if (bgColor && bgColor !== 'transparent') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, targetSize, targetSize);
    } else {
      ctx.clearRect(0, 0, targetSize, targetSize);
    }
    ctx.fillStyle = fgColor || '#000000';
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix.length; c++) {
        if (matrix[r][c]) {
          ctx.fillRect((c + margin) * cell, (r + margin) * cell, cell + 0.1, cell + 0.1);
        }
      }
    }
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename || 'extralife-donation-qr.png';
    a.click();
  } catch (e) {
    console.error('Download QR PNG failed:', e);
  }
};

const downloadQRCodeSvg = (
  url: string,
  filename: string,
  fgColor = '#000000',
  bgColor = '#ffffff',
  errorCorrectionLevel = 'M'
) => {
  try {
    const svgStr = createQRSvgString({
      text: url,
      size: 512,
      margin: 2,
      fgColor: fgColor || '#000000',
      bgColor: bgColor || '#ffffff',
      errorCorrectionLevel: errorCorrectionLevel as any
    });
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename || 'extralife-donation-qr.svg';
    a.click();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch (e) {
    console.error('Download QR SVG failed:', e);
  }
};

const QRCodeSvg = ({
  url,
  size = 200,
  fgColor = '#000000',
  bgColor = '#ffffff',
  margin = 2,
  errorCorrectionLevel = 'M',
  title = ''
}: {
  url: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  title?: string;
}) => {
  const { pathD, moduleCount } = useMemo(() => {
    try {
      const matrix = createQRMatrix(url || 'https://dd.extra-life.org', errorCorrectionLevel);
      const count = matrix.length;
      const fullSize = count + margin * 2;
      const cell = size / fullSize;
      let d = '';
      for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
          if (matrix[r][c]) {
            const x = (c + margin) * cell;
            const y = (r + margin) * cell;
            d += `M${x.toFixed(2)},${y.toFixed(2)}h${cell.toFixed(2)}v${cell.toFixed(2)}h-${cell.toFixed(2)}z `;
          }
        }
      }
      return { pathD: d.trim(), moduleCount: count };
    } catch (e) {
      console.error('Error generating QR matrix:', e);
      return { pathD: '', moduleCount: 0 };
    }
  }, [url, size, margin, errorCorrectionLevel]);

  if (!pathD) {
    return (
      <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: bgColor, color: fgColor, fontSize: '0.8rem', padding: '10px', textAlign: 'center' }}>
        Invalid URL
      </div>
    );
  }

  const isTransparent = !bgColor || bgColor === 'transparent';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
      shapeRendering="crispEdges"
      role="img"
      aria-label={title || `QR Code for ${url}`}
    >
      {!isTransparent && <rect width={size} height={size} fill={bgColor} />}
      <path d={pathD} fill={fgColor} />
    </svg>
  );
};

const QRCodeOverlay = ({
  url,
  title,
  subtitle,
  fgColor,
  bgColor,
  isTransparent,
  size,
  fontFamily,
  textColor,
  accentColor1,
  panelColor,
  panelBorderColor,
  t
}: any) => {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
      padding: '20px',
      boxSizing: 'border-box' as const,
      overflow: 'hidden'
    }}>
      <div style={{
        backgroundColor: isTransparent ? 'transparent' : panelColor,
        border: isTransparent ? 'none' : `3px solid ${panelBorderColor || accentColor1}`,
        borderRadius: '12px',
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '14px',
        boxShadow: isTransparent ? 'none' : '0 10px 30px rgba(0,0,0,0.6)',
        maxWidth: '90%',
        boxSizing: 'border-box' as const
      }}>
        {title && (
          <h2 style={{
            margin: 0,
            color: accentColor1 || textColor,
            fontFamily: fontFamily,
            fontSize: '1.25rem',
            textAlign: 'center' as const,
            letterSpacing: '1px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
          }}>
            {title}
          </h2>
        )}
        <div style={{
          padding: '12px',
          backgroundColor: isTransparent ? 'transparent' : (bgColor || '#ffffff'),
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: isTransparent ? 'none' : '0 4px 12px rgba(0,0,0,0.25)'
        }}>
          <QRCodeSvg
            url={url}
            size={size || 220}
            fgColor={fgColor || '#000000'}
            bgColor={isTransparent ? 'transparent' : (bgColor || '#ffffff')}
            title={title || 'Extra Life Donation QR Code'}
          />
        </div>
        {subtitle && (
          <p style={{
            margin: 0,
            color: textColor,
            fontFamily: fontFamily,
            fontSize: '0.8rem',
            opacity: 0.85,
            textAlign: 'center' as const,
            maxWidth: '260px',
            lineHeight: 1.4
          }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

const CollapsibleSection = ({ title, children, isInitiallyCollapsed = false, styles }: { title: string, children: React.ReactNode, isInitiallyCollapsed?: boolean, styles: any }) => {
    const [isCollapsed, setIsCollapsed] = useState(isInitiallyCollapsed);
    const contentRef = useRef<HTMLDivElement>(null);
    const uniqueId = `section-content-${title.replace(/\s+/g, '-')}`;

    return (
        <div style={styles.collapsibleContainer}>
            <h3 style={{margin: 0, padding: 0}}>
                <button
                    type="button"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    style={styles.collapsibleHeader}
                    aria-expanded={!isCollapsed}
                    aria-controls={uniqueId}
                >
                    <span style={{...styles.collapsibleChevron, transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)'}}>▸</span>
                    {title}
                </button>
            </h3>
            <div
                ref={contentRef}
                id={uniqueId}
                style={{
                    ...styles.collapsibleContent,
                    maxHeight: isCollapsed ? '0' : '1200px', 
                }}
            >
               <div style={{paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                 {children}
               </div>
            </div>
        </div>
    );
};


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

  // === HELPERS ===
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const dataUrlToArrayBuffer = (dataUrl: string) => {
    const base64 = dataUrl.split(',')[1];
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  // === CONSTANTS ===
  const MIN_REFRESH_INTERVAL = 60; // Extra Life / DonorDrive API recommends at least 60 seconds to prevent rate limiting
  const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
  const SERVER_URL = window.location.origin; 
  const MAX_VISIBLE_TOASTS = 4;
  const TWITCH_CLIENT_ID = 'kp59hwgkiqrl7zntjotsnfovrmauoz';
  const STORAGE_PREFIX = 'extralife_tracker_';
  const THEMES_STORAGE_KEY = `${STORAGE_PREFIX}custom_theme_profiles`;

  const isGitHubPagesHost = typeof window !== 'undefined' && (
      window.location.hostname.endsWith('github.io') || 
      window.location.protocol === 'file:'
  );

  const loadStoredThemes = (): SavedThemeProfile[] => {
      try {
          const item = localStorage.getItem(THEMES_STORAGE_KEY);
          if (item) return JSON.parse(item);
      } catch (e) {}
      return [];
  };

  const saveStoredThemes = (themes: SavedThemeProfile[]) => {
      try {
          localStorage.setItem(THEMES_STORAGE_KEY, JSON.stringify(themes));
      } catch (e) {}
  };

  const loadStoredConfig = (profileId: string) => {
      try {
          const item = localStorage.getItem(`${STORAGE_PREFIX}config_${profileId}`);
          if (item) return JSON.parse(item);
      } catch (e) {}
      return null;
  };
  const saveStoredConfig = (profileId: string, cfg: any) => {
      try {
          localStorage.setItem(`${STORAGE_PREFIX}config_${profileId}`, JSON.stringify(cfg));
      } catch (e) {}
  };
  const loadStoredData = (profileId: string) => {
      try {
          const item = localStorage.getItem(`${STORAGE_PREFIX}data_${profileId}`);
          if (item) return JSON.parse(item);
      } catch (e) {}
      return null;
  };
  const saveStoredData = (profileId: string, data: any) => {
      try {
          localStorage.setItem(`${STORAGE_PREFIX}data_${profileId}`, JSON.stringify(data));
      } catch (e) {}
  };

  // === STATE ===
  const [isConnected, setIsConnected] = useState(false);
  const [isStandaloneMode, setIsStandaloneMode] = useState<boolean>(isGitHubPagesHost);
  const socketRef = useRef<Socket | null>(null);
  const syncChannelRef = useRef<BroadcastChannel | null>(null);
  const twitchClientRef = useRef<any>(null);
  const seenDonationIdsRef = useRef<Set<string>>(new Set());

  // Profile
  const [currentProfile, setCurrentProfile] = useState<string>('default');
  const [profileInput, setProfileInput] = useState<string>('');

  // Data State
  const [donations, setDonations] = useState<Donation[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [totalRaised, setTotalRaised] = useState<number>(0);
  const [teamTotalRaised, setTeamTotalRaised] = useState<number>(0);
  const [teamGoal, setTeamGoal] = useState<number>(0);
  const [teamName, setTeamName] = useState<string>('');
  const [teamDonations, setTeamDonations] = useState<any[]>([]);
  const [teamParticipants, setTeamParticipants] = useState<any[]>([]);
  const [participantName, setParticipantName] = useState<string>('');
  
  // Notification Queue System
  const [activeToasts, setActiveToasts] = useState<Donation[]>([]);
  const [toastQueue, setToastQueue] = useState<Donation[]>([]);
  
  const [goal, setGoal] = useState<number>(0); 
  const [conversionRate, setConversionRate] = useState<number>(1.0); 
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

  // UI/Config State
  const [overlayType, setOverlayType] = useState<'none' | 'progress' | 'notifications' | 'milestone' | 'team' | 'team-header' | 'team-donations' | 'team-dashboard' | 'celebration' | 'schedule' | 'sponsors' | 'text' | 'qrcode'>('none');
  const [dashboardView, setDashboardView] = useState<'participant' | 'team'>('participant');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(true);
  const [formError, setFormError] = useState('');
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [timeDisplay, setTimeDisplay] = useState<string>('');
  const [celebrationKey, setCelebrationKey] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [availableSponsorFiles, setAvailableSponsorFiles] = useState<string[]>([]);
  const [selectedSponsorFile, setSelectedSponsorFile] = useState<string>('');
  const [sponsorUrlInput, setSponsorUrlInput] = useState<string>('');
  const [sponsorNameInput, setSponsorNameInput] = useState<string>('');
  const [availableSoundFiles, setAvailableSoundFiles] = useState<string[]>([]);
  const [selectedSoundFile, setSelectedSoundFile] = useState<string>('');
  const [availableTextFiles, setAvailableTextFiles] = useState<string[]>([]);
  const [pendingTwitchToken, setPendingTwitchToken] = useState<string | null>(null);

  // Configuration State (Synced with Server)
  const [config, setConfig] = useState({
    participantId: '',
    teamId: '',
    useParticipantTeamId: false,
    refreshInterval: 60,
    currency: 'USD',
    customExchangeRate: 0,
    eventStartTime: '',
    celebrationDuration: 15,
    language: 'en',
    milestoneProgressMode: 'cumulative' as 'cumulative' | 'relative',
    
    // Twitch
    twitchEnabled: false,
    twitchChannel: '',
    twitchToken: '',
    twitchEnableAlerts: true,
    twitchEnableCommands: true,
    customCommands: [] as ChatCommand[],

    backgroundColor: '#0d0d0d',
    textColor: '#ffffff',
    panelColor: '#1a1a1a',
    panelBorderColor: '#00ffff',
    accentColor1: '#ff00ff',
    accentColor2: '#00ffff',
    successColor: '#00ff00',
    errorColor: '#ff3333',
    buttonTextColor: '#0d0d0d',

    // Expanded & split color controls:
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
    customSounds: [] as CustomSound[],
    scheduleItems: [] as ScheduleItem[],
    sponsors: [] as Sponsor[],
    sponsorDisplayDuration: 5,

    selectedTextFile: '',
    customTextContent: '',
    textOverlayAlignment: 'top-left', // New option
    textOverlayFontSize: 1.5, // New option, defaults to 1.5rem

    // QR Code Generator Settings
    qrLinkType: 'donation' as 'page' | 'donation' | 'custom',
    qrCustomUrl: '',
    qrTitle: 'SCAN TO DONATE',
    qrSubtitle: '',
    qrFgColor: '#000000',
    qrBgColor: '#ffffff',
    qrTransparentBg: false,
    qrSize: 220,
    qrErrorCorrection: 'M' as 'L' | 'M' | 'Q' | 'H',
    qrShowCardInDashboard: true,
  });

  // Local input state for form (debounced by user action essentially)
  const [participantIdInput, setParticipantIdInput] = useState('');
  const [teamIdInput, setTeamIdInput] = useState('');
  const [commandTrigger, setCommandTrigger] = useState('');
  const [commandResponse, setCommandResponse] = useState('');
  const [websiteTotalInput, setWebsiteTotalInput] = useState('');

  // Theme Profile state
  const [savedThemes, setSavedThemes] = useState<SavedThemeProfile[]>(loadStoredThemes);
  const [newThemeNameInput, setNewThemeNameInput] = useState<string>('');
  const [themeActionFeedback, setThemeActionFeedback] = useState<string | null>(null);
  const [showAdvancedColors, setShowAdvancedColors] = useState<boolean>(false);

  const [selectedPreset, setSelectedPreset] = useState<string>('custom');
  
  // === REFS ===
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<Set<AudioScheduledSourceNode>>(new Set());
  const soundFileInputRef = useRef<HTMLInputElement>(null);
  const themeFileInputRef = useRef<HTMLInputElement>(null);
  const configRef = useRef(config);

  // Sync configRef and runtime refs with state
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const totalRaisedRef = useRef(totalRaised);
  useEffect(() => { totalRaisedRef.current = totalRaised; }, [totalRaised]);

  const conversionRateRef = useRef(conversionRate);
  useEffect(() => { conversionRateRef.current = conversionRate; }, [conversionRate]);

  const currentProfileRef = useRef(currentProfile);
  useEffect(() => { currentProfileRef.current = currentProfile; }, [currentProfile]);

  const lastFetchTimeRef = useRef(0);
  const isFetchingRef = useRef(false);

  // Handle OAuth Redirect from Twitch
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1));
        const token = params.get('access_token');
        const state = params.get('state');

        if (token) {
            // Verify if we need to redirect to the specific profile
            const urlParams = new URLSearchParams(window.location.search);
            const urlProfile = urlParams.get('profile');

            // If we have a state (profile ID) and it doesn't match the current URL profile
            if (state && state !== 'default' && state !== urlProfile) {
                 // Redirect to the correct profile URL, preserving the hash
                 window.location.href = `${window.location.origin}/?profile=${encodeURIComponent(state)}${hash}`;
                 return;
            }

            setPendingTwitchToken(`oauth:${token}`);
            // Clear hash
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    }
  }, []);

  // Fetch file lists
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
  
  // === MEMOIZED VALUES & HELPERS ===
  const currencyPrefix = useMemo(() => config.currency === 'USD' ? '$' : 'C$', [config.currency]);
  
  // Translation Helper
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

  // Formatter for when data was last fetched from the server
  const formatLastFetched = useCallback((date: Date | null) => {
    if (!date) return t('never');
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }, [t]);

  // Currency Exchange Rate Fetcher with multi-tiered fallbacks
  const fetchConversionRate = useCallback(async (_forceRefresh = false): Promise<number> => {
      const currentConf = configRef.current;
      if (currentConf.currency !== 'CAD') {
          setConversionRate(1.0);
          return 1.0;
      }

      // 1. User manual override if configured
      const customRate = Number(currentConf.customExchangeRate);
      if (customRate && !isNaN(customRate) && customRate > 0) {
          setConversionRate(customRate);
          return customRate;
      }

      // 2. Primary endpoint: open.er-api.com
      try {
          const res = await fetch('https://open.er-api.com/v6/latest/USD');
          if (res.ok) {
              const data = await res.json();
              const rate = Number(data?.rates?.CAD);
              if (rate && !isNaN(rate) && rate > 0.5) {
                  setConversionRate(rate);
                  return rate;
              }
          }
      } catch (e) {
          console.warn('Primary exchange rate endpoint notice:', e);
      }

      // 3. Fallback: exchangerate-api.com v4
      try {
          const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
          if (res.ok) {
              const data = await res.json();
              const rate = Number(data?.rates?.CAD);
              if (rate && !isNaN(rate) && rate > 0.5) {
                  setConversionRate(rate);
                  return rate;
              }
          }
      } catch (e) {}

      // 4. Sensible CAD fallback rate (~1.36) so conversion ALWAYS works even completely offline
      const fallbackRate = 1.36;
      setConversionRate(prev => (prev && prev > 1 ? prev : fallbackRate));
      return fallbackRate;
  }, []);

  const effectiveRate = useMemo(() => {
      if (config.currency !== 'CAD') return 1.0;
      const custom = Number(config.customExchangeRate);
      if (custom && !isNaN(custom) && custom > 0) return custom;
      return conversionRate > 1 ? conversionRate : 1.36;
  }, [config.currency, config.customExchangeRate, conversionRate]);

  const convertAmount = useCallback((amount: number) => {
    if (config.currency === 'CAD') {
      return amount * effectiveRate;
    }
    return amount;
  }, [config.currency, effectiveRate]);

  // Automatically fetch & broadcast conversion rate when CAD is active
  useEffect(() => {
      if (config.currency === 'CAD') {
          fetchConversionRate().then(rate => {
              const stored = loadStoredData(currentProfileRef.current) || {};
              const updated = { ...stored, conversionRate: rate };
              saveStoredData(currentProfileRef.current, updated);
              try {
                  syncChannelRef.current?.postMessage({
                      type: 'data-updated',
                      payload: updated
                  });
              } catch (e) {}
          });
      } else {
          setConversionRate(1.0);
      }
  }, [config.currency, config.customExchangeRate, fetchConversionRate]);

  const sortedDonations = useMemo(() => {
    return [...donations].sort((a, b) => new Date(b.createdDateUTC).getTime() - new Date(a.createdDateUTC).getTime());
  }, [donations]);

  const progressPercentage = useMemo(() => {
    if (goal <= 0) return 0;
    return Math.min((totalRaised / goal) * 100, 100);
  }, [totalRaised, goal]);

  // QR Code URL resolution based on selected link version ('page' | 'donation' | 'custom')
  const activeParticipantId = useMemo(() => {
    return String(config.participantId || participantIdInput || (currentProfile !== 'default' ? currentProfile : '566273')).trim() || '566273';
  }, [config.participantId, participantIdInput, currentProfile]);

  const effectiveQrUrl = useMemo(() => {
    return getExtraLifeUrl(activeParticipantId, config.qrLinkType || 'donation', config.qrCustomUrl);
  }, [activeParticipantId, config.qrLinkType, config.qrCustomUrl]);

  // === AUDIO LOGIC ===
  useEffect(() => {
    const unlockAudio = () => {
        if (!audioCtxRef.current) {
             audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume().then(() => {
                document.removeEventListener('click', unlockAudio);
                document.removeEventListener('keydown', unlockAudio);
            }).catch(console.warn);
        }
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);
    return () => {
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('keydown', unlockAudio);
    }
  }, []);

  const stopAllSounds = useCallback(() => {
    const sourcesToStop = Array.from(activeSourcesRef.current);
    sourcesToStop.forEach(source => {
        try {
            (source as AudioScheduledSourceNode).stop(0);
        } catch (e) { }
    });
    activeSourcesRef.current.clear();
  }, []);
    
  const playSpecificSound = useCallback(async (soundId: string) => {
    const currentConfig = configRef.current;
    if (!currentConfig.isSoundEnabled) return;

    if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      try { await ctx.resume(); } catch(e) {}
    }

    const startTime = ctx.currentTime + 0.05;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(currentConfig.notificationVolume, startTime);
    masterGain.connect(ctx.destination);

    if (soundId === 'default') {
        const envelopeGain = ctx.createGain();
        envelopeGain.connect(masterGain);
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = 'sine'; osc2.type = 'sine';
        osc1.frequency.setValueAtTime(1046.50, startTime);
        osc2.frequency.setValueAtTime(1244.51, startTime);
        envelopeGain.gain.setValueAtTime(1.0, startTime);
        envelopeGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
        osc1.connect(envelopeGain); osc2.connect(envelopeGain);
        activeSourcesRef.current.add(osc1); activeSourcesRef.current.add(osc2);
        osc1.onended = () => { activeSourcesRef.current.delete(osc1); };
        osc2.onended = () => { activeSourcesRef.current.delete(osc2); };
        osc1.start(startTime); osc2.start(startTime);
        osc1.stop(startTime + 0.5); osc2.stop(startTime + 0.5);
    } else if (soundId === 'default-milestone') {
        const envelopeGain = ctx.createGain();
        envelopeGain.connect(masterGain);
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        const baseFreq = 261.63;
        osc.frequency.setValueAtTime(baseFreq, startTime);
        osc.frequency.setValueAtTime(baseFreq * 5/4, startTime + 0.1);
        osc.frequency.setValueAtTime(baseFreq * 3/2, startTime + 0.2);
        osc.frequency.setValueAtTime(baseFreq * 2, startTime + 0.3);
        envelopeGain.gain.setValueAtTime(1.0, startTime);
        envelopeGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);
        osc.connect(envelopeGain);
        activeSourcesRef.current.add(osc);
        osc.onended = () => { activeSourcesRef.current.delete(osc); };
        osc.start(startTime); osc.stop(startTime + 0.8);
    } else if (soundId === 'default-powerup') {
        const envelopeGain = ctx.createGain();
        envelopeGain.connect(masterGain);
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(330, startTime);
        osc.frequency.exponentialRampToValueAtTime(880, startTime + 0.3);
        envelopeGain.gain.setValueAtTime(0.7, startTime);
        envelopeGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
        osc.connect(envelopeGain);
        activeSourcesRef.current.add(osc);
        osc.onended = () => { activeSourcesRef.current.delete(osc); };
        osc.start(startTime); osc.stop(startTime + 0.35);
    } else if (soundId === 'default-laser') {
        const envelopeGain = ctx.createGain();
        envelopeGain.connect(masterGain);
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, startTime);
        osc.frequency.exponentialRampToValueAtTime(120, startTime + 0.25);
        envelopeGain.gain.setValueAtTime(0.8, startTime);
        envelopeGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);
        osc.connect(envelopeGain);
        activeSourcesRef.current.add(osc);
        osc.onended = () => { activeSourcesRef.current.delete(osc); };
        osc.start(startTime); osc.stop(startTime + 0.25);
    } else {
        const sound = currentConfig.customSounds.find(s => s.id === soundId);
        if (!sound) return;
        try {
            let arrayBuffer: ArrayBuffer;
            if (sound.data.startsWith('data:')) {
                 arrayBuffer = dataUrlToArrayBuffer(sound.data);
            } else {
                 const response = await fetch(sound.data);
                 arrayBuffer = await response.arrayBuffer();
            }
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(masterGain);
            activeSourcesRef.current.add(source);
            source.onended = () => { activeSourcesRef.current.delete(source); };
            source.start(startTime);
        } catch (err) {}
    }
  }, []);

  // === QUEUE PROCESSOR ===
  useEffect(() => {
    if (activeToasts.length < MAX_VISIBLE_TOASTS && toastQueue.length > 0) {
      const nextToast = toastQueue[0];
      setToastQueue(prev => prev.slice(1));
      setActiveToasts(prev => [...prev, nextToast]);
      setTimeout(() => {
        setActiveToasts(current => current.filter(t => t.donationID !== nextToast.donationID));
      }, 8000);
    }
  }, [activeToasts, toastQueue]);

  const updateConfig = (updates: Partial<typeof config>) => {
      setIsSaving(true);
      const newConfig = { ...config, ...updates };
      if (newConfig.refreshInterval !== undefined && newConfig.refreshInterval !== 0) {
          newConfig.refreshInterval = Math.max(MIN_REFRESH_INTERVAL, newConfig.refreshInterval);
      }
      setConfig(newConfig); 
      saveStoredConfig(currentProfile, newConfig);

      // Broadcast to other tabs & OBS overlays
      try {
          syncChannelRef.current?.postMessage({ type: 'config-updated', payload: newConfig });
      } catch (e) {}

      // If connected to local backend server, emit
      if (socketRef.current?.connected) {
          socketRef.current.emit('update-config', { profileId: currentProfile, config: newConfig });
      } else {
          setTimeout(() => setIsSaving(false), 200);
      }
  };

  // === MULTI-TAB & OBS OVERLAY BROADCAST CHANNEL ===
  useEffect(() => {
      if (typeof BroadcastChannel === 'undefined') return;
      const channelName = `extralife_sync_${currentProfile}`;
      const ch = new BroadcastChannel(channelName);
      syncChannelRef.current = ch;

      ch.onmessage = (event) => {
          const { type, payload } = event.data || {};
          if (type === 'config-updated' && payload) {
              setConfig(payload);
              setParticipantIdInput(payload.participantId || '');
              setTeamIdInput(payload.teamId || '');
              setIsSaving(false);
          } else if (type === 'data-updated' && payload) {
              setDonations(payload.donations || []);
              setMilestones(payload.milestones || []);
              setTotalRaised(payload.totalRaised || 0);
              setGoal(payload.goal || 0);
              if (payload.participantName) setParticipantName(payload.participantName);
              setTeamTotalRaised(payload.teamTotalRaised || 0);
              setTeamGoal(payload.teamGoal || 0);
              setTeamName(payload.teamName || '');
              setTeamDonations(payload.teamDonations || []);
              setTeamParticipants(payload.teamParticipants || []);
              if (payload.conversionRate) setConversionRate(payload.conversionRate);
              if (payload.lastFetchedAt) {
                  setLastFetchedAt(new Date(payload.lastFetchedAt));
              } else {
                  setLastFetchedAt(new Date());
              }
          } else if (type === 'event:donation' && payload) {
              const { donation, isMilestone } = payload;
              setToastQueue(prev => [...prev, donation]);
              if (!isMilestone) {
                  playSpecificSound(configRef.current.selectedSound);
              }
          } else if (type === 'event:celebration') {
              setCelebrationKey(Date.now());
              if (payload?.type === 'milestone') {
                  playSpecificSound(configRef.current.selectedMilestoneSound);
              } else {
                  playSpecificSound(configRef.current.selectedSound);
              }
          } else if (type === 'event:clear') {
              setActiveToasts([]);
              setToastQueue([]);
              setCelebrationKey(0);
              stopAllSounds();
          } else if (type === 'trigger-sync') {
              fetchClientSideData();
          }
      };

      return () => {
          ch.close();
      };
  }, [currentProfile, playSpecificSound]);

  // === CLIENT-SIDE EXTRA LIFE DATA FETCHER (FOR STANDALONE & GITHUB PAGES) ===
  const fetchClientSideData = useCallback(async () => {
      const currentConf = configRef.current;
      const pid = currentConf.participantId;
      if (!pid) return;

      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
          // 1. Participant Details (Use dd.extra-life.org for CORS compliance on GitHub Pages)
          const partRes = await fetch(`https://dd.extra-life.org/api/participants/${pid}`);
          if (!partRes.ok) return;
          const partData = await partRes.json();

          let newTeamId = currentConf.teamId;
          if (currentConf.useParticipantTeamId && partData.teamID) {
              newTeamId = String(partData.teamID);
              if (newTeamId !== currentConf.teamId) {
                  updateConfig({ teamId: newTeamId });
              }
          }

          // 2. Donations
          const donRes = await fetch(`https://dd.extra-life.org/api/participants/${pid}/donations?limit=100&orderBy=createdDateUTC&orderDirection=DESC`);
          const donData = donRes.ok ? await donRes.json() : [];

          // 3. Milestones
          const mileRes = await fetch(`https://dd.extra-life.org/api/participants/${pid}/milestones`);
          const rawMileData = mileRes.ok ? await mileRes.json() : [];
          const mileData = Array.isArray(rawMileData)
              ? [...rawMileData].sort((a: any, b: any) => (a.fundraisingGoal || 0) - (b.fundraisingGoal || 0))
              : [];

          // 4. Team Details (optional)
          let tRaised = 0;
          let tGoal = 0;
          let tName = '';
          let tDonations: any[] = [];
          let tParticipants: any[] = [];
          if (newTeamId) {
              try {
                  const [teamRes, teamDonRes, teamPartRes] = await Promise.all([
                      fetch(`https://dd.extra-life.org/api/teams/${newTeamId}`).catch(() => null),
                      fetch(`https://dd.extra-life.org/api/teams/${newTeamId}/donations?limit=100&orderBy=createdDateUTC&orderDirection=DESC`).catch(() => null),
                      fetch(`https://dd.extra-life.org/api/teams/${newTeamId}/participants`).catch(() => null)
                  ]);
                  if (teamRes && teamRes.ok) {
                      const tData = await teamRes.json();
                      tRaised = tData.sumDonations || 0;
                      tGoal = tData.fundraisingGoal || 0;
                      tName = tData.name || '';
                  }
                  if (teamDonRes && teamDonRes.ok) {
                      const tDon = await teamDonRes.json();
                      tDonations = Array.isArray(tDon) ? tDon : [];
                  }
                  if (teamPartRes && teamPartRes.ok) {
                      const tPart = await teamPartRes.json();
                      tParticipants = Array.isArray(tPart) ? tPart : [];
                  }
              } catch (e) {}
          }

          // 5. Currency Rate (optional)
          let cRate = effectiveRate;
          if (currentConf.currency === 'CAD') {
              cRate = await fetchConversionRate();
          }

          // Check for new donations
          const isFirstFetch = seenDonationIdsRef.current.size === 0;
          const newDonations: Donation[] = [];
          donData.forEach((d: Donation) => {
              if (!seenDonationIdsRef.current.has(d.donationID)) {
                  seenDonationIdsRef.current.add(d.donationID);
                  if (!isFirstFetch) {
                      newDonations.push(d);
                  }
              }
          });

          const newRaised = partData.sumDonations || 0;
          const newGoal = partData.fundraisingGoal || 0;
          const pName = partData.displayName || '';
          const previousTotal = totalRaisedRef.current;

          setParticipantName(pName);
          setTotalRaised(newRaised);
          setGoal(newGoal);
          setDonations(donData);
          setMilestones(mileData);
          setTeamTotalRaised(tRaised);
          setTeamGoal(tGoal);
          setTeamName(tName);
          setTeamDonations(tDonations);
          setTeamParticipants(tParticipants);
          setConversionRate(cRate);

          const updatedPayload = {
              donations: donData,
              milestones: mileData,
              totalRaised: newRaised,
              goal: newGoal,
              participantName: pName,
              teamTotalRaised: tRaised,
              teamGoal: tGoal,
              teamName: tName,
              teamDonations: tDonations,
              teamParticipants: tParticipants,
              conversionRate: cRate
          };
          saveStoredData(currentProfileRef.current, updatedPayload);
          try {
              syncChannelRef.current?.postMessage({ type: 'data-updated', payload: updatedPayload });
          } catch (e) {}

          // Alert for new donations
          if (newDonations.length > 0) {
              newDonations.forEach(donation => {
                  setToastQueue(q => [...q, donation]);
                  playSpecificSound(currentConf.selectedSound);
                  try {
                      syncChannelRef.current?.postMessage({
                          type: 'event:donation',
                          payload: { donation, isMilestone: false }
                      });
                  } catch (e) {}

                  // Twitch alert
                  if (currentConf.twitchEnabled && currentConf.twitchEnableAlerts && twitchClientRef.current) {
                      try {
                          const donor = donation.displayName === 'Anonymous' ? 'Anonymous' : donation.displayName;
                          const amt = `${currentConf.currency === 'USD' ? '$' : 'C$'}${(donation.amount * (currentConf.currency === 'CAD' ? cRate : 1)).toFixed(2)}`;
                          const msg = donation.message ? ` "${donation.message}"` : '';
                          twitchClientRef.current.say(currentConf.twitchChannel, `🎉 New Extra Life Donation! ${donor} donated ${amt}!${msg} Thank you!`);
                      } catch (e) {}
                  }
              });

              // Check if milestone or goal was crossed
              if (previousTotal > 0 && newRaised > previousTotal) {
                  const crossedMilestone = mileData.some((m: Milestone) => previousTotal < m.fundraisingGoal && newRaised >= m.fundraisingGoal);
                  if (crossedMilestone || (newGoal > 0 && previousTotal < newGoal && newRaised >= newGoal)) {
                      setCelebrationKey(Date.now());
                      playSpecificSound(currentConf.selectedMilestoneSound);
                      try {
                          syncChannelRef.current?.postMessage({
                              type: 'event:celebration',
                              payload: { type: 'milestone' }
                          });
                      } catch (e) {}
                  }
              }
          }

          const fetchTime = new Date();
          setLastFetchedAt(fetchTime);
          saveStoredData(currentProfileRef.current, {
              donations: donData,
              milestones: mileData,
              totalRaised: newRaised,
              goal: newGoal,
              teamTotalRaised: tRaised,
              teamName: tName,
              conversionRate: effectiveRate,
              lastFetchedAt: fetchTime.getTime()
          });

          try {
              syncChannelRef.current?.postMessage({
                  type: 'data-updated',
                  payload: {
                      donations: donData,
                      milestones: mileData,
                      totalRaised: newRaised,
                      goal: newGoal,
                      teamTotalRaised: tRaised,
                      teamName: tName,
                      conversionRate: effectiveRate,
                      lastFetchedAt: fetchTime.getTime()
                  }
              });
          } catch (e) {}

          lastFetchTimeRef.current = Date.now();
      } catch (err) {
          console.warn('Extra Life client-side fetch notice:', err);
      } finally {
          isFetchingRef.current = false;
      }
  }, [playSpecificSound]);

  // Periodic polling in Standalone Mode or in Overlays
  useEffect(() => {
      if (!isStandaloneMode && overlayType === 'none' && socketRef.current?.connected) return;
      if (!config.participantId) return;

      const refreshSeconds = Math.max(MIN_REFRESH_INTERVAL, Number(config.refreshInterval) || 60);
      const intervalMs = refreshSeconds * 1000;

      // Only perform an immediate fetch if we haven't fetched recently or on first mount
      const elapsed = Date.now() - lastFetchTimeRef.current;
      if (lastFetchTimeRef.current === 0 || elapsed >= intervalMs) {
          fetchClientSideData();
      }

      const timer = setInterval(() => {
          fetchClientSideData();
      }, intervalMs);

      return () => clearInterval(timer);
  }, [isStandaloneMode, overlayType, config.participantId, config.refreshInterval, fetchClientSideData]);

  // Client-side Twitch IRC Client via tmi.js
  useEffect(() => {
      if (!config.twitchEnabled || !config.twitchChannel || !config.twitchToken) {
          if (twitchClientRef.current) {
              try { twitchClientRef.current.disconnect(); } catch (e) {}
              twitchClientRef.current = null;
          }
          return;
      }

      const tmiModule: any = tmi || (window as any).tmi;
      const ClientConstructor = tmiModule?.Client || tmiModule?.client || (window as any).tmi?.Client;
      if (!ClientConstructor) return;

      let client: any = null;
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
              console.log('Twitch IRC client connected to channel:', config.twitchChannel);
              twitchClientRef.current = client;
          }).catch(console.error);

          client.on('message', (channel: string, tags: any, message: string, self: boolean) => {
              if (self || !configRef.current.twitchEnableCommands) return;
              const msg = message.trim().toLowerCase();

              const currentConf = configRef.current;
              const prefix = currentConf.currency === 'USD' ? '$' : 'C$';
              const rate = currentConf.currency === 'CAD' ? effectiveRate : 1;

              if (msg === '!total') {
                  const amt = (totalRaised * rate).toFixed(2);
                  client.say(channel, `🎮 Total raised for Extra Life: ${prefix}${amt}!`);
              } else if (msg === '!goal') {
                  const gAmt = (goal * rate).toFixed(2);
                  client.say(channel, `🎯 Fundraising Goal: ${prefix}${gAmt}!`);
              } else if (msg === '!milestone') {
                  const sorted = [...milestones].sort((a, b) => a.fundraisingGoal - b.fundraisingGoal);
                  const next = sorted.find(m => m.fundraisingGoal > totalRaised);
                  if (next) {
                      const mAmt = (next.fundraisingGoal * rate).toFixed(2);
                      client.say(channel, `🚩 Next Milestone at ${prefix}${mAmt}: ${next.description}`);
                  } else {
                      client.say(channel, `🏆 All current milestones reached! Thank you!`);
                  }
              } else {
                  const custom = currentConf.customCommands.find(c => c.trigger.toLowerCase() === msg);
                  if (custom) {
                      client.say(channel, custom.response);
                  }
              }
          });
      } catch (e) {
          console.error('Twitch client initialization error:', e);
      }

      return () => {
          if (client) {
              try { client.disconnect(); } catch (e) {}
          }
      };
  }, [config.twitchEnabled, config.twitchChannel, config.twitchToken, totalRaised, goal, milestones, conversionRate]);

  // === BACKEND SOCKET CONNECTION & INITIALIZATION ===
  useEffect(() => {
      // Determine Profile from URL
      const params = new URLSearchParams(window.location.search);
      const profile = params.get('profile') || 'default';
      setCurrentProfile(profile);

      // Instant load from localStorage
      const storedConfig = loadStoredConfig(profile);
      if (storedConfig) {
          setConfig(prev => ({ ...prev, ...storedConfig }));
          setParticipantIdInput(storedConfig.participantId || '');
          setTeamIdInput(storedConfig.teamId || '');
      } else if (profile !== 'default') {
          setConfig(prev => ({ ...prev, participantId: profile }));
          setParticipantIdInput(profile);
      }

      const storedData = loadStoredData(profile);
      if (storedData) {
          setDonations(storedData.donations || []);
          setMilestones(storedData.milestones || []);
          setTotalRaised(storedData.totalRaised || 0);
          setGoal(storedData.goal || 0);
          if (storedData.participantName) setParticipantName(storedData.participantName);
          setTeamTotalRaised(storedData.teamTotalRaised || 0);
          setTeamGoal(storedData.teamGoal || 0);
          setTeamName(storedData.teamName || '');
          setTeamDonations(storedData.teamDonations || []);
          setTeamParticipants(storedData.teamParticipants || []);
          if (storedData.conversionRate) setConversionRate(storedData.conversionRate);
          if (storedData.lastFetchedAt) setLastFetchedAt(new Date(storedData.lastFetchedAt));
      }

      // If running on GitHub Pages or static host, activate standalone mode
      if (isGitHubPagesHost) {
          setIsStandaloneMode(true);
          setIsConnected(true);
          return;
      }

      let socket: Socket | null = null;
      let connectTimer: any = null;

      try {
          socket = io(SERVER_URL, { timeout: 2000, reconnectionAttempts: 2 });
          socketRef.current = socket;

          connectTimer = setTimeout(() => {
              if (!socket?.connected) {
                  setIsStandaloneMode(true);
                  setIsConnected(true);
              }
          }, 1500);

          socket.on('connect', () => {
              clearTimeout(connectTimer);
              console.log('Connected to backend, joining profile:', profile);
              setIsConnected(true);
              setIsStandaloneMode(false);
              socket?.emit('join-profile', profile);
          });

          socket.on('disconnect', () => {
              console.log('Disconnected from backend');
              setIsConnected(false);
          });

          socket.on('connect_error', () => {
              clearTimeout(connectTimer);
              setIsStandaloneMode(true);
              setIsConnected(true);
          });

          socket.on('init-state', (state: any) => {
              setConfig(state.config);
              setDonations(state.data.donations || []);
              setMilestones(state.data.milestones || []);
              setTotalRaised(state.data.totalRaised || 0);
              setGoal(state.data.goal || 0);
              if (state.data.participantName) setParticipantName(state.data.participantName);
              setTeamTotalRaised(state.data.teamTotalRaised || 0);
              setTeamGoal(state.data.teamGoal || 0);
              setTeamName(state.data.teamName || '');
              setTeamDonations(state.data.teamDonations || []);
              setTeamParticipants(state.data.teamParticipants || []);
              setConversionRate(state.data.conversionRate || 1);
              if (state.data.lastFetchedAt) {
                  setLastFetchedAt(new Date(state.data.lastFetchedAt));
              } else {
                  setLastFetchedAt(new Date());
              }
              setParticipantIdInput(state.config.participantId || '');
              setTeamIdInput(state.config.teamId || '');
              saveStoredConfig(profile, state.config);
              saveStoredData(profile, state.data);
          });

          socket.on('config-updated', (newConfig: any) => {
              setConfig(newConfig);
              setParticipantIdInput(newConfig.participantId || '');
              setTeamIdInput(newConfig.teamId || '');
              setIsSaving(false);
              saveStoredConfig(profile, newConfig);
          });

          socket.on('data-updated', (data: any) => {
              setDonations(data.donations || []);
              setMilestones(data.milestones || []);
              setTotalRaised(data.totalRaised || 0);
              setGoal(data.goal || 0);
              if (data.participantName) setParticipantName(data.participantName);
              setTeamTotalRaised(data.teamTotalRaised || 0);
              setTeamGoal(data.teamGoal || 0);
              setTeamName(data.teamName || '');
              setTeamDonations(data.teamDonations || []);
              setTeamParticipants(data.teamParticipants || []);
              if (data.conversionRate) setConversionRate(data.conversionRate);
              const fetchTime = data.lastFetchedAt ? new Date(data.lastFetchedAt) : new Date();
              setLastFetchedAt(fetchTime);
              saveStoredData(profile, { ...data, lastFetchedAt: fetchTime.getTime() });
          });

          socket.on('event:donation', (payload: any) => {
              const { donation, isMilestone } = payload;
              setToastQueue(prev => [...prev, donation]);
              if (!isMilestone) {
                  playSpecificSound(configRef.current.selectedSound);
              }
          });

          socket.on('event:celebration', (payload: any) => {
              setCelebrationKey(Date.now());
              if (payload.type === 'milestone') {
                  playSpecificSound(configRef.current.selectedMilestoneSound);
              } else {
                  playSpecificSound(configRef.current.selectedSound);
              }
          });
          
          socket.on('event:clear', () => {
              setActiveToasts([]);
              setToastQueue([]);
              setCelebrationKey(0);
              stopAllSounds();
          });
      } catch (e) {
          setIsStandaloneMode(true);
          setIsConnected(true);
      }

      return () => {
          clearTimeout(connectTimer);
          socket?.disconnect();
      };
  }, [playSpecificSound, stopAllSounds]); 

  useEffect(() => {
    if (isConnected && pendingTwitchToken) {
        updateConfig({ twitchToken: pendingTwitchToken, twitchEnabled: true });
        setPendingTwitchToken(null);
    }
  }, [isConnected, pendingTwitchToken]);


  // === EFFECTS ===
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

  useEffect(() => {
    const currentColors = { 
        backgroundColor: config.backgroundColor, 
        textColor: config.textColor, 
        panelColor: config.panelColor, 
        panelBorderColor: config.panelBorderColor, 
        accentColor1: config.accentColor1, 
        accentColor2: config.accentColor2, 
        successColor: config.successColor, 
        errorColor: config.errorColor, 
        buttonTextColor: config.buttonTextColor 
    };
    const matchingPresetKey = findMatchingPreset(currentColors);
    if (matchingPresetKey) {
        setSelectedPreset(matchingPresetKey);
    } else {
        const matchingSaved = savedThemes.find(th => {
            return Object.keys(currentColors).every(ck => 
                (th.colors as any)[ck] === (currentColors as any)[ck]
            );
        });
        if (matchingSaved) {
            setSelectedPreset(`profile:${matchingSaved.id}`);
        } else {
            setSelectedPreset('custom');
        }
    }
  }, [config.backgroundColor, config.textColor, config.panelColor, config.panelBorderColor, config.accentColor1, config.accentColor2, config.successColor, config.errorColor, config.buttonTextColor, savedThemes]);


  // === HANDLERS ===
  const handleSwitchProfile = (e: React.FormEvent) => {
      e.preventDefault();
      if (!profileInput.trim()) return;
      window.location.href = `${window.location.pathname}?profile=${encodeURIComponent(profileInput.trim())}`;
  };

  const handleChangeId = () => {
    window.location.href = window.location.pathname;
  };

  const handleIdSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    lastFetchTimeRef.current = 0;
    updateConfig({
        participantId: participantIdInput,
        teamId: teamIdInput,
        useParticipantTeamId: config.useParticipantTeamId
    });
    // Trigger instant fetch on submit
    setTimeout(fetchClientSideData, 50);
  };
  
  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetKey = e.target.value;
    setSelectedPreset(presetKey);
    if (presetKey.startsWith('profile:')) {
        const profileId = presetKey.replace('profile:', '');
        const found = savedThemes.find(t => t.id === profileId);
        if (found) {
            updateConfig({
                ...found.colors,
                ...(found.fontFamily ? { fontFamily: found.fontFamily } : {}),
                ...(found.notificationAnimation ? { notificationAnimation: found.notificationAnimation } : {})
            });
        }
    } else if (presetKey !== 'custom') {
        const preset = COLOR_PRESETS[presetKey as keyof typeof COLOR_PRESETS];
        if (preset) {
            updateConfig({
                ...preset.colors,
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
            });
        }
    }
  };

  const handleSaveThemeProfile = () => {
    const trimmed = newThemeNameInput.trim();
    if (!trimmed) {
      setFormError(t('enterThemeName'));
      return;
    }
    setFormError('');
    const newProfile: SavedThemeProfile = {
      id: `theme-${Date.now()}`,
      name: trimmed,
      colors: {
        backgroundColor: config.backgroundColor,
        textColor: config.textColor,
        panelColor: config.panelColor,
        panelBorderColor: config.panelBorderColor,
        accentColor1: config.accentColor1,
        accentColor2: config.accentColor2,
        successColor: config.successColor,
        errorColor: config.errorColor,
        buttonTextColor: config.buttonTextColor,
        headerColor: config.headerColor,
        secondaryTextColor: config.secondaryTextColor,
        primaryButtonBgColor: config.primaryButtonBgColor,
        secondaryButtonBgColor: config.secondaryButtonBgColor,
        dividerColor: config.dividerColor,
        highlightColor: config.highlightColor,
        donorNameColor: config.donorNameColor,
        progressBarColor: config.progressBarColor,
        progressBarBgColor: config.progressBarBgColor,
        progressBarTextColor: config.progressBarTextColor,
        progressBarBorderColor: config.progressBarBorderColor,
        splitMilestoneColors: config.splitMilestoneColors,
        milestoneProgressBarColor: config.milestoneProgressBarColor,
        milestoneProgressBarBgColor: config.milestoneProgressBarBgColor,
        milestoneProgressBarTextColor: config.milestoneProgressBarTextColor,
        milestoneProgressBarBorderColor: config.milestoneProgressBarBorderColor,
        toastBgColor: config.toastBgColor,
        toastBorderColor: config.toastBorderColor,
        toastNameColor: config.toastNameColor,
        toastAmountColor: config.toastAmountColor,
        inputBgColor: config.inputBgColor,
        inputBorderColor: config.inputBorderColor,
      },
      fontFamily: config.fontFamily,
      notificationAnimation: config.notificationAnimation
    };
    const updatedThemes = [...savedThemes, newProfile];
    setSavedThemes(updatedThemes);
    saveStoredThemes(updatedThemes);
    setSelectedPreset(`profile:${newProfile.id}`);
    setNewThemeNameInput('');
    setThemeActionFeedback(t('themeSavedSuccess'));
    setTimeout(() => setThemeActionFeedback(null), 3000);
  };

  const handleUpdateThemeProfile = () => {
    if (!selectedPreset.startsWith('profile:')) return;
    const profileId = selectedPreset.replace('profile:', '');
    const updatedThemes = savedThemes.map(th => {
      if (th.id === profileId) {
        return {
          ...th,
          colors: {
            backgroundColor: config.backgroundColor,
            textColor: config.textColor,
            panelColor: config.panelColor,
            panelBorderColor: config.panelBorderColor,
            accentColor1: config.accentColor1,
            accentColor2: config.accentColor2,
            successColor: config.successColor,
            errorColor: config.errorColor,
            buttonTextColor: config.buttonTextColor,
            headerColor: config.headerColor,
            secondaryTextColor: config.secondaryTextColor,
            primaryButtonBgColor: config.primaryButtonBgColor,
            secondaryButtonBgColor: config.secondaryButtonBgColor,
            dividerColor: config.dividerColor,
            highlightColor: config.highlightColor,
            donorNameColor: config.donorNameColor,
            progressBarColor: config.progressBarColor,
            progressBarBgColor: config.progressBarBgColor,
            progressBarTextColor: config.progressBarTextColor,
            progressBarBorderColor: config.progressBarBorderColor,
            splitMilestoneColors: config.splitMilestoneColors,
            milestoneProgressBarColor: config.milestoneProgressBarColor,
            milestoneProgressBarBgColor: config.milestoneProgressBarBgColor,
            milestoneProgressBarTextColor: config.milestoneProgressBarTextColor,
            milestoneProgressBarBorderColor: config.milestoneProgressBarBorderColor,
            toastBgColor: config.toastBgColor,
            toastBorderColor: config.toastBorderColor,
            toastNameColor: config.toastNameColor,
            toastAmountColor: config.toastAmountColor,
            inputBgColor: config.inputBgColor,
            inputBorderColor: config.inputBorderColor,
          },
          fontFamily: config.fontFamily,
          notificationAnimation: config.notificationAnimation
        };
      }
      return th;
    });
    setSavedThemes(updatedThemes);
    saveStoredThemes(updatedThemes);
    setThemeActionFeedback(t('themeUpdatedSuccess'));
    setTimeout(() => setThemeActionFeedback(null), 3000);
  };

  const handleDeleteThemeProfile = (profileIdToDelete?: string) => {
    const targetId = profileIdToDelete || (selectedPreset.startsWith('profile:') ? selectedPreset.replace('profile:', '') : null);
    if (!targetId) return;
    const updatedThemes = savedThemes.filter(th => th.id !== targetId);
    setSavedThemes(updatedThemes);
    saveStoredThemes(updatedThemes);
    if (selectedPreset === `profile:${targetId}`) {
      setSelectedPreset('custom');
    }
    setThemeActionFeedback(t('themeDeletedSuccess'));
    setTimeout(() => setThemeActionFeedback(null), 3000);
  };

  const handleLoadSavedTheme = (theme: SavedThemeProfile) => {
    if (!theme) return;
    setSelectedPreset(`profile:${theme.id}`);
    updateConfig({
      ...theme.colors,
      ...(theme.fontFamily ? { fontFamily: theme.fontFamily } : {}),
      ...(theme.notificationAnimation ? { notificationAnimation: theme.notificationAnimation } : {})
    });
  };

  const handleExportThemeProfile = (themeToExport?: SavedThemeProfile) => {
    let targetProfile = themeToExport;
    if (!targetProfile) {
      if (selectedPreset.startsWith('profile:')) {
        const profileId = selectedPreset.replace('profile:', '');
        targetProfile = savedThemes.find(th => th.id === profileId);
      }
    }

    if (!targetProfile) {
      const currentName = newThemeNameInput.trim() || 'Custom Theme';
      targetProfile = {
        id: `theme-${Date.now()}`,
        name: currentName,
        colors: {
          backgroundColor: config.backgroundColor,
          textColor: config.textColor,
          panelColor: config.panelColor,
          panelBorderColor: config.panelBorderColor,
          accentColor1: config.accentColor1,
          accentColor2: config.accentColor2,
          successColor: config.successColor,
          errorColor: config.errorColor,
          buttonTextColor: config.buttonTextColor,
          headerColor: config.headerColor,
          secondaryTextColor: config.secondaryTextColor,
          primaryButtonBgColor: config.primaryButtonBgColor,
          secondaryButtonBgColor: config.secondaryButtonBgColor,
          dividerColor: config.dividerColor,
          highlightColor: config.highlightColor,
          donorNameColor: config.donorNameColor,
          progressBarColor: config.progressBarColor,
          progressBarBgColor: config.progressBarBgColor,
          progressBarTextColor: config.progressBarTextColor,
          progressBarBorderColor: config.progressBarBorderColor,
          splitMilestoneColors: config.splitMilestoneColors,
          milestoneProgressBarColor: config.milestoneProgressBarColor,
          milestoneProgressBarBgColor: config.milestoneProgressBarBgColor,
          milestoneProgressBarTextColor: config.milestoneProgressBarTextColor,
          milestoneProgressBarBorderColor: config.milestoneProgressBarBorderColor,
          toastBgColor: config.toastBgColor,
          toastBorderColor: config.toastBorderColor,
          toastNameColor: config.toastNameColor,
          toastAmountColor: config.toastAmountColor,
          inputBgColor: config.inputBgColor,
          inputBorderColor: config.inputBorderColor,
        },
        fontFamily: config.fontFamily,
        notificationAnimation: config.notificationAnimation
      };
    }

    const exportPayload = {
      type: 'extralife-custom-theme',
      version: 1,
      exportedAt: new Date().toISOString(),
      theme: targetProfile
    };

    const sanitizedName = (targetProfile.name || 'custom_theme')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .replace(/_+/g, '_');
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `extralife-theme-${sanitizedName}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setThemeActionFeedback(`${t('themeExportedSuccess')} (${targetProfile.name})`);
    setTimeout(() => setThemeActionFeedback(null), 3000);
  };

  const handleExportAllThemes = () => {
    if (savedThemes.length === 0) {
      setFormError(t('noThemesToExport'));
      return;
    }
    const exportPayload = {
      type: 'extralife-custom-themes-collection',
      version: 1,
      exportedAt: new Date().toISOString(),
      themes: savedThemes
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `extralife-custom-themes-${savedThemes.length}-themes.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setThemeActionFeedback(`${t('themeExportedSuccess')} (${savedThemes.length} ${t('savedThemeProfiles')})`);
    setTimeout(() => setThemeActionFeedback(null), 3000);
  };

  const handleImportThemeProfile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError('');

    const fallbackName = file.name ? file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ') : 'Imported Theme';

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        
        let candidateThemes: any[] = [];
        if (parsed && typeof parsed === 'object') {
          if (parsed.type === 'extralife-custom-theme' && parsed.theme && typeof parsed.theme === 'object') {
            candidateThemes = [parsed.theme];
          } else if (parsed.type === 'extralife-custom-themes-collection' && Array.isArray(parsed.themes)) {
            candidateThemes = parsed.themes;
          } else if (Array.isArray(parsed.themes)) {
            candidateThemes = parsed.themes;
          } else if (Array.isArray(parsed.savedThemeProfiles)) {
            candidateThemes = parsed.savedThemeProfiles;
          } else if (Array.isArray(parsed)) {
            candidateThemes = parsed;
          } else if (parsed.colors && typeof parsed.colors === 'object') {
            candidateThemes = [parsed];
          } else if (parsed.backgroundColor || parsed.panelColor || parsed.textColor) {
            candidateThemes = [{
              name: parsed.name || fallbackName,
              colors: parsed,
              fontFamily: parsed.fontFamily,
              notificationAnimation: parsed.notificationAnimation
            }];
          }
        }

        if (candidateThemes.length === 0) {
          setFormError(t('themeImportError'));
          return;
        }

        const existingIds = new Set(savedThemes.map(s => s.id));
        const newProfiles: SavedThemeProfile[] = [];

        candidateThemes.forEach((item, index) => {
          if (!item || typeof item !== 'object') return;
          const rawColors = (item.colors && typeof item.colors === 'object') ? item.colors : item;
          
          let profileId = item.id;
          if (!profileId || existingIds.has(profileId)) {
            profileId = `theme-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`;
          }
          existingIds.add(profileId);

          const themeName = (item.name && typeof item.name === 'string' && item.name.trim()) 
            ? item.name.trim() 
            : (candidateThemes.length === 1 ? fallbackName : `${fallbackName} ${index + 1}`);

          const cleanedColors: any = {
            backgroundColor: rawColors.backgroundColor || '#0a0a14',
            textColor: rawColors.textColor || '#ffffff',
            panelColor: rawColors.panelColor || '#141424',
            panelBorderColor: rawColors.panelBorderColor || '#00ffff',
            accentColor1: rawColors.accentColor1 || '#00ffff',
            accentColor2: rawColors.accentColor2 || '#ff00ff',
            successColor: rawColors.successColor || '#00ff66',
            errorColor: rawColors.errorColor || '#ff3366',
            buttonTextColor: rawColors.buttonTextColor || '#ffffff',
            headerColor: rawColors.headerColor || '',
            secondaryTextColor: rawColors.secondaryTextColor || '',
            primaryButtonBgColor: rawColors.primaryButtonBgColor || '',
            secondaryButtonBgColor: rawColors.secondaryButtonBgColor || '',
            dividerColor: rawColors.dividerColor || '',
            highlightColor: rawColors.highlightColor || '',
            donorNameColor: rawColors.donorNameColor || '',
            progressBarColor: rawColors.progressBarColor || '',
            progressBarBgColor: rawColors.progressBarBgColor || '',
            progressBarTextColor: rawColors.progressBarTextColor || '',
            progressBarBorderColor: rawColors.progressBarBorderColor || '',
            splitMilestoneColors: !!rawColors.splitMilestoneColors,
            milestoneProgressBarColor: rawColors.milestoneProgressBarColor || '',
            milestoneProgressBarBgColor: rawColors.milestoneProgressBarBgColor || '',
            milestoneProgressBarTextColor: rawColors.milestoneProgressBarTextColor || '',
            milestoneProgressBarBorderColor: rawColors.milestoneProgressBarBorderColor || '',
            toastBgColor: rawColors.toastBgColor || '',
            toastBorderColor: rawColors.toastBorderColor || '',
            toastNameColor: rawColors.toastNameColor || '',
            toastAmountColor: rawColors.toastAmountColor || '',
            inputBgColor: rawColors.inputBgColor || '',
            inputBorderColor: rawColors.inputBorderColor || '',
          };

          newProfiles.push({
            id: profileId,
            name: themeName,
            colors: cleanedColors,
            fontFamily: item.fontFamily || undefined,
            notificationAnimation: item.notificationAnimation || undefined
          });
        });

        if (newProfiles.length === 0) {
          setFormError(t('themeImportError'));
          return;
        }

        const mergedThemes = [...savedThemes, ...newProfiles];
        setSavedThemes(mergedThemes);
        saveStoredThemes(mergedThemes);

        const activeProfile = newProfiles[0];
        setSelectedPreset(`profile:${activeProfile.id}`);
        updateConfig({
          ...activeProfile.colors,
          ...(activeProfile.fontFamily ? { fontFamily: activeProfile.fontFamily } : {}),
          ...(activeProfile.notificationAnimation ? { notificationAnimation: activeProfile.notificationAnimation } : {})
        });

        const successMsg = newProfiles.length === 1
          ? `✓ ${t('themeImportedSuccess')} (${activeProfile.name})`
          : `✓ ${t('themeImportedSuccess')} (${newProfiles.length} ${t('savedThemeProfiles')})`;

        setThemeActionFeedback(successMsg);
        setTimeout(() => setThemeActionFeedback(null), 3500);

      } catch (err) {
        setFormError(t('themeImportError'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetProgressBarColors = () => {
    updateConfig({
      progressBarColor: '',
      progressBarBgColor: '',
      progressBarTextColor: '',
      progressBarBorderColor: '',
      splitMilestoneColors: false,
      milestoneProgressBarColor: '',
      milestoneProgressBarBgColor: '',
      milestoneProgressBarTextColor: '',
      milestoneProgressBarBorderColor: '',
    });
  };

  const handleResetAdvancedColors = () => {
    updateConfig({
      headerColor: '',
      secondaryTextColor: '',
      primaryButtonBgColor: '',
      secondaryButtonBgColor: '',
      dividerColor: '',
      highlightColor: '',
      donorNameColor: '',
      toastBgColor: '',
      toastBorderColor: '',
      toastNameColor: '',
      toastAmountColor: '',
      inputBgColor: '',
      inputBorderColor: '',
    });
  };
  
  const handleGetTwitchToken = () => {
    const redirectUri = `${window.location.origin}${window.location.pathname}`;
    const scopes = 'chat:read+chat:edit';
    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${TWITCH_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${scopes}&state=${encodeURIComponent(currentProfile)}`;
    window.location.href = authUrl;
  };

  const handleCopyUrl = (type: string) => {
    // Append current profile to URL
    const url = `${window.location.origin}${window.location.pathname}?overlay=${type}&profile=${currentProfile}`;
    navigator.clipboard.writeText(url).then(() => {
        setCopyFeedback(type);
        setTimeout(() => setCopyFeedback(null), 2000);
    }).catch(err => {
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
      if (socketRef.current?.connected) {
          socketRef.current.emit('trigger-sync', currentProfile);
      }
      fetchClientSideData();
      try {
          syncChannelRef.current?.postMessage({ type: 'trigger-sync' });
      } catch (e) {}
  };
  
  const handleTestDonation = () => {
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
      } else if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (socketRef.current?.connected) {
          socketRef.current.emit('trigger-test', currentProfile);
      } else {
          // Client-side test donation
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
          setToastQueue(prev => [...prev, fakeDonation]);
          playSpecificSound(configRef.current.selectedSound);

          const isMilestoneHit = milestones.some(m => totalRaised < m.fundraisingGoal && newTotal >= m.fundraisingGoal);
          if (isMilestoneHit || (goal > 0 && totalRaised < goal && newTotal >= goal)) {
              setCelebrationKey(Date.now());
              playSpecificSound(configRef.current.selectedMilestoneSound);
              try {
                  syncChannelRef.current?.postMessage({ type: 'event:celebration', payload: { type: 'milestone' } });
              } catch (e) {}
          }

          try {
              syncChannelRef.current?.postMessage({
                  type: 'event:donation',
                  payload: { donation: fakeDonation, isMilestone: false }
              });
              syncChannelRef.current?.postMessage({
                  type: 'data-updated',
                  payload: {
                      donations: [fakeDonation, ...donations],
                      milestones,
                      totalRaised: newTotal,
                      goal,
                      teamTotalRaised,
                      teamName,
                      conversionRate: effectiveRate
                  }
              });
          } catch (e) {}
      }
  };

  const handleClearOverlays = () => {
      if (socketRef.current?.connected) {
          socketRef.current.emit('trigger-clear', currentProfile);
      }
      setActiveToasts([]);
      setToastQueue([]);
      setCelebrationKey(0);
      stopAllSounds();
      try {
          syncChannelRef.current?.postMessage({ type: 'event:clear' });
      } catch (e) {}
  };

  const handleExportConfig = () => {
      const exportData = {
          ...config,
          savedThemeProfiles: savedThemes
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `extralife-config-${currentProfile}.json`);
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
              if (typeof imported === 'object' && imported !== null) {
                  if (Array.isArray(imported.savedThemeProfiles)) {
                      const existingIds = new Set(savedThemes.map(s => s.id));
                      const merged = [...savedThemes];
                      imported.savedThemeProfiles.forEach((p: SavedThemeProfile) => {
                          if (p && p.id && !existingIds.has(p.id)) {
                              merged.push(p);
                              existingIds.add(p.id);
                          }
                      });
                      setSavedThemes(merged);
                      saveStoredThemes(merged);
                  }
                  updateConfig(imported);
                  setImportSuccessMsg(t('importSuccess'));
                  setTimeout(() => setImportSuccessMsg(null), 3500);
              } else {
                  setFormError(t('importError'));
              }
          } catch (err) {
              setFormError(t('importError'));
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  const handleAddSound = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError('');
    if (file.size > MAX_FILE_SIZE_BYTES) {
        setFormError(t('fileTooLarge'));
        return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
        const newSound: CustomSound = {
            id: `sound-${Date.now()}`,
            name: file.name,
            data: event.target?.result as string,
        };
        updateConfig({ customSounds: [...config.customSounds, newSound] });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };
  
  const handlePreviewLocalSound = async () => {
    if (!selectedSoundFile || !config.isSoundEnabled) return;
    const url = `/sounds/${selectedSoundFile}`;
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') { try { await ctx.resume(); } catch(e) {} }

    const startTime = ctx.currentTime + 0.05;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(config.notificationVolume, startTime);
    masterGain.connect(ctx.destination);
    try {
         const response = await fetch(url);
         const arrayBuffer = await response.arrayBuffer();
         const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
         const source = ctx.createBufferSource();
         source.buffer = audioBuffer;
         source.connect(masterGain);
         activeSourcesRef.current.add(source);
         source.onended = () => { activeSourcesRef.current.delete(source); };
         source.start(startTime);
    } catch (err) {}
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
  const effProgressBarTextColor = config.progressBarTextColor || config.buttonTextColor;
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
            <div style={{...styles.statHero, maxWidth: '600px', width: '100%', padding: '40px'}}>
                <h1 style={{...styles.header, marginBottom: '20px'}}>{t('appTitle')}</h1>
                <p style={{color: config.textColor, marginBottom: '30px', lineHeight: '1.5'}}>{t('welcomeSubtitle')}</p>
                
                <form onSubmit={handleSwitchProfile} style={{display: 'flex', flexDirection: 'column', gap: '20px', width: '100%'}}>
                    <input 
                        type="text" 
                        value={profileInput} 
                        onChange={e => setProfileInput(e.target.value)} 
                        placeholder={t('enterId')}
                        style={{...styles.input, fontSize: '1.2rem', padding: '15px', textAlign: 'center'}}
                        autoFocus
                    />
                    <p style={{fontSize: '0.8rem', color: config.textColor, opacity: 0.6}}>{t('idHint')}</p>
                    <button type="submit" style={{...styles.button, backgroundColor: config.successColor, color: config.buttonTextColor, fontSize: '1.2rem', padding: '15px'}}>
                        {t('startTracking')}
                    </button>
                </form>

                <div style={{marginTop: '30px', fontSize: '0.8rem', color: config.textColor, opacity: 0.7}}>
                    {isStandaloneMode ? `● ${t('standaloneMode')}` : (isConnected ? `● ${t('connectedServer')}` : `○ ${t('connecting')}`)}
                </div>
            </div>
        </div>
        </>
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
            <div style={styles.header}>
                <span>{t('appTitle')}</span>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginTop: '6px', flexWrap: 'wrap'}}>
                    {isStandaloneMode ? (
                        <span style={{fontSize: '0.5em', color: config.successColor, opacity: 0.9}}>
                            ● {t('standaloneMode')}
                        </span>
                    ) : !isConnected ? (
                        <span style={{fontSize: '0.5em', color: config.errorColor}}>{t('disconnected')}</span>
                    ) : (
                        <span style={{fontSize: '0.5em', color: config.successColor, opacity: 0.7}}>● {t('connected')}</span>
                    )}
                    {lastFetchedAt && (
                        <span style={{fontSize: '0.45em', color: config.textColor, opacity: 0.75, fontFamily: 'monospace'}}>
                            ⏱ {t('lastFetched')}: {formatLastFetched(lastFetchedAt)}
                        </span>
                    )}
                </div>
            </div>
            
            {/* CURRENT PROFILE DISPLAY & CHANGE BUTTON */}
            <div style={{...styles.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem'}}>
                <span style={{color: effSecondaryTextColor}}>{t('profile')}: <strong>{currentProfile}</strong></span>
                <button 
                    type="button" 
                    onClick={handleChangeId} 
                    style={{...styles.button, margin: 0, padding: '5px 15px', fontSize: '0.8rem', backgroundColor: config.panelColor, border: `1px solid ${config.errorColor}`, color: config.errorColor}}
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
                    <div style={styles.card}>
                        <h4 style={{ margin: '0 0 10px 0', color: effHighlightColor, fontSize: '0.95rem' }}>{t('buttonsSection')}</h4>
                        <div style={{ display: 'flex', gap: '0.8rem', width: '100%', flexWrap: 'wrap' }}>
                            <button type="button" onClick={handleTestDonation} style={{...styles.button, backgroundColor: effSecondaryButtonBgColor, color: config.buttonTextColor, margin: 0, flex: 1, fontSize: '0.85rem', padding: '10px' }}>{t('testDonation')}</button>
                            <button type="button" onClick={handleManualSync} style={{...styles.button, backgroundColor: config.successColor, color: config.buttonTextColor, flex: 1, margin: 0, fontSize: '0.85rem', padding: '10px' }}>{t('resyncData')}</button>
                            <button type="button" onClick={handleClearOverlays} style={{...styles.button, backgroundColor: config.errorColor, color: config.buttonTextColor, margin: 0, flex: 1, fontSize: '0.85rem', padding: '10px' }}>{t('clearStop')}</button>
                        </div>
                    </div>
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
            <div style={styles.statHero}>
                <h2 style={styles.bigStat}>{currencyPrefix}{convertAmount(totalRaised).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h2>
                <p style={styles.secondaryStat}>{t('goal')}: {currencyPrefix}{convertAmount(goal).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ({progressPercentage.toFixed(1)}%)</p>
                {timeDisplay && <div style={{...styles.timerText, fontSize: '0.9rem', opacity: 0.8}}>{timeDisplay}</div>}
            </div>

            {/* MAIN DASHBOARD GRID */}
            <div style={styles.dashboardGrid}>
                
                {/* COLUMN 1: LIVE FEED */}
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                    <div style={{...styles.card, border: `2px solid ${effHighlightColor}`}}>
                         <h3 style={{margin: '0 0 10px 0', color: effHighlightColor, borderBottom: `1px dashed ${effDividerColor}`, paddingBottom: '10px'}}>{t('recentDonations')}</h3>
                         <div style={styles.feedContainer}>
                            {sortedDonations.length === 0 && <p style={{color: config.textColor, opacity: 0.7}}>{t('noDonations')}</p>}
                            {sortedDonations.map(d => (
                                <div key={d.donationID} style={styles.donationItem}>
                                    <div style={styles.donationHeader}>
                                        <span style={styles.donationName}>{d.displayName === 'Anonymous' ? t('anonymous') : d.displayName}</span>
                                        <span style={styles.donationAmount}>{currencyPrefix}{convertAmount(d.amount).toFixed(2)}</span>
                                    </div>
                                    {d.message && <div style={styles.donationMessage}>{d.message}</div>}
                                    <div style={{fontSize: '0.8rem', opacity: 0.5, marginTop: '5px', fontFamily: 'monospace', color: config.textColor}}>
                                        {new Date(d.createdDateUTC).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* COLUMN 2: CONTROLS & SETTINGS */}
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                     
                     {/* Actions Panel */}
                     <div style={styles.card}>
                        <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                            <button type="button" onClick={handleTestDonation} style={{...styles.button, backgroundColor: effSecondaryButtonBgColor, color: config.buttonTextColor, margin: 0, flex: 1, fontSize: '0.9rem', padding: '10px' }}>{t('testDonation')}</button>
                            <button type="button" onClick={handleManualSync} style={{...styles.button, backgroundColor: config.successColor, color: config.buttonTextColor, flex: 1, margin: 0, fontSize: '0.9rem', padding: '10px' }}>{t('resyncData')}</button>
                        </div>
                        <button type="button" onClick={handleClearOverlays} style={{...styles.button, backgroundColor: config.errorColor, color: config.buttonTextColor, margin: 0, width: '100%', fontSize: '0.9rem', padding: '10px' }}>{t('clearStop')}</button>
                     </div>

                     {/* Secondary Stats */}
                     <div style={styles.card}>
                       <p style={{margin:0, color: effSecondaryTextColor}}>{t('teamRaised')}: {currencyPrefix}{convertAmount(teamTotalRaised).toFixed(2)}</p>
                       <p style={{margin:0, color: effSecondaryTextColor, fontSize: '0.85rem', marginTop: '5px'}}>{t('lastDonator')}: {sortedDonations.length > 0 ? (sortedDonations[0].displayName === 'Anonymous' ? t('anonymous') : sortedDonations[0].displayName) : t('none')}</p>
                    </div>

                    {/* QR Code Quick Scan & Share Card */}
                    {config.qrShowCardInDashboard !== false && (
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
                                onClick={() => handleCopyQrLink()}
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
                    )}

                    {/* Overlay Links (Collapsed) */}
                    <div style={styles.card}>
                        <CollapsibleSection title={t('overlayLinks')} isInitiallyCollapsed={true} styles={styles}>
                            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', width: '100%'}}>
                                {[
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
                                ].map(overlay => (
                                        <div key={overlay.title} style={{...styles.card, padding: '10px', gap: '5px', backgroundColor: hexToRgba(config.panelColor, 0.5)}}>
                                        <h4 style={{margin: '0', color: config.textColor, textAlign: 'left', fontSize: '0.8rem'}}>{overlay.title}</h4>
                                        <div style={{display: 'flex', gap: '5px'}}>
                                            <button type="button" onClick={overlay.fn} style={{...styles.button, backgroundColor: config.panelColor, border: `1px solid ${effSecondaryButtonBgColor}`, color: config.textColor, marginTop: 0, flex: 1, fontSize: '0.7rem', padding: '5px'}}>
                                                {t('openPopup')}
                                            </button>
                                            <button type="button" onClick={() => handleCopyUrl(overlay.type)} style={{...styles.button, backgroundColor: effPrimaryButtonBgColor, color: config.buttonTextColor, marginTop: 0, flex: 1, fontSize: '0.7rem', padding: '5px'}}>
                                                {copyFeedback === overlay.type ? t('copied') : t('copyLink')}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CollapsibleSection>
                    </div>

                    {/* Settings (Collapsed) */}
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
                            
                            <CollapsibleSection title={t('coreSetup')} isInitiallyCollapsed={false} styles={styles}>
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
                                    onChange={e => updateConfig({ useParticipantTeamId: e.target.checked })}
                                />
                                <label style={{...styles.label, opacity: 1, cursor: 'pointer', flexGrow: 1 }}>{t('autoDetect')}</label>
                            </div>

                            <label style={config.useParticipantTeamId ? {...styles.label, opacity: 0.5} : styles.label}>{t('teamId')}</label>
                            <input type="text" value={teamIdInput} onChange={(e) => setTeamIdInput(e.target.value)} style={{...styles.input, ...(config.useParticipantTeamId && {backgroundColor: hexToRgba(config.panelColor, 0.5)})}} disabled={config.useParticipantTeamId} />

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
                                            {Boolean(config.customExchangeRate || websiteTotalInput) && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setWebsiteTotalInput('');
                                                        updateConfig({ customExchangeRate: 0 });
                                                        fetchConversionRate(true);
                                                    }}
                                                    style={{ ...styles.button, margin: 0, padding: '3px 8px', fontSize: '0.75rem', backgroundColor: hexToRgba(config.panelBorderColor, 0.2), border: `1px solid ${config.panelBorderColor}`, color: config.textColor }}
                                                    title={t('clearRateTitle')}
                                                >
                                                    ✕ {t('clearExchangeRate')}
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setWebsiteTotalInput('');
                                                    updateConfig({ customExchangeRate: 0 });
                                                    fetchConversionRate(true);
                                                }}
                                                style={{ ...styles.button, margin: 0, padding: '3px 8px', fontSize: '0.75rem', backgroundColor: config.panelColor, border: `1px solid ${effSecondaryButtonBgColor}`, color: effSecondaryButtonBgColor }}
                                                title={t('refreshRateTitle')}
                                            >
                                                ↻ {t('refreshRate')} ({t('live')})
                                            </button>
                                        </div>
                                    </div>

                                    {/* Box 1: Direct Custom Exchange Rate Multiplier */}
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
                                            setWebsiteTotalInput('');
                                            updateConfig({ customExchangeRate: val === '' ? 0 : parseFloat(val) });
                                        }}
                                        style={{ ...styles.input, marginBottom: '10px', fontSize: '0.85rem', padding: '6px' }}
                                    />

                                    {/* Box 2: Calculate from Current Extra Life Website Total */}
                                    <label style={{ ...styles.label, fontSize: '0.75rem', margin: '4px 0 3px 0' }}>
                                        {t('websiteTotalLabel')}
                                    </label>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.85rem', color: config.textColor, opacity: 0.8, fontWeight: 'bold' }}>C$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={websiteTotalInput}
                                            placeholder={totalRaised > 0 ? (totalRaised * effectiveRate).toFixed(2) : (goal > 0 ? (goal * effectiveRate).toFixed(2) : 'e.g. 138.45')}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setWebsiteTotalInput(val);
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
                                        {Boolean(config.customExchangeRate || websiteTotalInput) && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setWebsiteTotalInput('');
                                                    updateConfig({ customExchangeRate: 0 });
                                                    fetchConversionRate(true);
                                                }}
                                                style={{ ...styles.button, margin: 0, padding: '2px 6px', fontSize: '0.7rem', backgroundColor: 'transparent', border: `1px solid ${config.panelBorderColor}`, color: config.textColor, cursor: 'pointer' }}
                                            >
                                                ✕ {t('clearExchangeRate')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            <label style={{...styles.label, marginTop: '12px'}}>{t('milestoneCalculation')}</label>
                            <select
                                value={config.milestoneProgressMode || 'cumulative'}
                                onChange={(e) => updateConfig({ milestoneProgressMode: e.target.value as 'cumulative' | 'relative' })}
                                style={styles.input}
                            >
                                <option value="cumulative">{t('milestoneCumulative')}</option>
                                <option value="relative">{t('milestoneStep')}</option>
                            </select>
                            </CollapsibleSection>

                            <CollapsibleSection title={t('qrCodeSection')} isInitiallyCollapsed={false} styles={styles}>
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
                                        onClick={() => handleCopyQrLink()}
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

                                    {/* Preview Box */}
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

                                    {/* Action Buttons for QR Code */}
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

                            <CollapsibleSection title={t('twitchIntegration')} isInitiallyCollapsed={true} styles={styles}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: `1px dashed ${effDividerColor}`, paddingBottom: '10px' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={config.twitchEnabled} 
                                        onChange={e => updateConfig({ twitchEnabled: e.target.checked })}
                                    />
                                    <label style={{...styles.label, opacity: 1, cursor: 'pointer', fontWeight: 'bold' }}>{t('twitchEnabled')}</label>
                                </div>
                                
                                <div style={{opacity: config.twitchEnabled ? 1 : 0.5, pointerEvents: config.twitchEnabled ? 'auto' : 'none', transition: 'opacity 0.3s'}}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={config.twitchEnableAlerts} 
                                            onChange={e => updateConfig({ twitchEnableAlerts: e.target.checked })}
                                        />
                                        <label style={{...styles.label, opacity: 1, cursor: 'pointer' }}>{t('twitchEnableAlerts')}</label>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={config.twitchEnableCommands} 
                                            onChange={e => updateConfig({ twitchEnableCommands: e.target.checked })}
                                        />
                                        <label style={{...styles.label, opacity: 1, cursor: 'pointer' }}>{t('twitchEnableCommands')}</label>
                                    </div>
                                    <label style={styles.label}>{t('twitchChannel')}</label>
                                    <input 
                                        type="text" 
                                        value={config.twitchChannel} 
                                        onChange={(e) => updateConfig({ twitchChannel: e.target.value })} 
                                        style={styles.input} 
                                    />
                                    
                                    <label style={styles.label}>{t('twitchToken')}</label>
                                    <div style={{display: 'flex', gap: '10px'}}>
                                        <input 
                                            type="password" 
                                            value={config.twitchToken} 
                                            onChange={(e) => updateConfig({ twitchToken: e.target.value })} 
                                            style={styles.input} 
                                        />
                                        <button 
                                            type="button" 
                                            onClick={handleGetTwitchToken} 
                                            style={{...styles.button, backgroundColor: effPrimaryButtonBgColor, color: config.buttonTextColor, fontSize: '0.9rem', padding: '10px', margin: 0, whiteSpace: 'nowrap'}}
                                        >
                                            {t('getTwitchToken')}
                                        </button>
                                    </div>

                                    <div style={{borderTop: `2px dashed ${effDividerColor}`, margin: '20px 0'}}></div>

                                    <h4 style={{...styles.label, opacity: 1, fontSize: '1.1rem', marginBottom: '10px' }}>{t('chatCommands')}</h4>
                                    
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
                                            <input type="text" value={commandTrigger} onChange={e => setCommandTrigger(e.target.value)} style={{...styles.input, padding: '8px', flex: 1}} placeholder={t('commandTrigger')} />
                                            <input type="text" value={commandResponse} onChange={e => setCommandResponse(e.target.value)} style={{...styles.input, padding: '8px', flex: 2}} placeholder={t('commandResponse')} />
                                        </div>
                                        <button type="button" onClick={handleAddCommand} style={{...styles.button, backgroundColor: effPrimaryButtonBgColor, color: config.buttonTextColor, fontSize: '0.9rem', padding: '8px', margin: '0 0 15px 0', width: '100%' }}>{t('addCommand')}</button>
                                        
                                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            {config.customCommands.length === 0 && <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>{t('noCommands')}</p>}
                                            {config.customCommands.map(cmd => (
                                                <div key={cmd.id} style={{...styles.soundItem, padding: '8px 12px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', overflow: 'hidden', marginRight: '10px' }}>
                                                        <span style={{ color: effHighlightColor, fontWeight: 'bold' }}>{cmd.trigger}</span>
                                                        <span style={{ fontSize: '0.8rem', opacity: 0.8, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100%' }}>{cmd.response}</span>
                                                    </div>
                                                    <button type="button" onClick={() => handleDeleteCommand(cmd.id)} style={{...styles.soundButton, backgroundColor: config.errorColor}}>{t('delete')}</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CollapsibleSection>

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
                            
                            <CollapsibleSection title={t('streamSchedule')} isInitiallyCollapsed={true} styles={styles}>
                            <div style={{ border: `2px dashed ${config.panelBorderColor}`, padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input type="datetime-local" value={schedTime} onChange={e => setSchedTime(e.target.value)} style={{...styles.input, padding: '8px', flex: 1}} />
                                    <input type="text" value={schedDesc} onChange={e => setSchedDesc(e.target.value)} style={{...styles.input, padding: '8px', flex: 2}} placeholder={t('description')} />
                                </div>
                                <button type="button" onClick={handleAddScheduleItem} style={{...styles.button, backgroundColor: effPrimaryButtonBgColor, color: config.buttonTextColor, fontSize: '1rem', padding: '10px', margin: '10px auto 0 auto', width: '50%' }}>{t('addItem')}</button>
                                </div>
                                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {config.scheduleItems.map(item => {
                                    const date = new Date(item.time);
                                    const timeDisplay = isNaN(date.getTime()) 
                                        ? item.time 
                                        : date.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' });

                                    return (
                                    <div key={item.id} style={{...styles.soundItem, padding: '8px 12px' }}>
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
                                        <button type="button" onClick={() => handleToggleItem(item.id)} style={{...styles.soundButton, backgroundColor: config.successColor, color: config.buttonTextColor }}>{item.isDone ? t('undo') : t('done')}</button>
                                        <button type="button" onClick={() => handleDeleteItem(item.id)} style={{...styles.soundButton, backgroundColor: config.errorColor}}>{t('delete')}</button>
                                    </div>
                                    </div>
                                )})}
                                </div>
                            </CollapsibleSection>

                            <CollapsibleSection title={t('theming')} isInitiallyCollapsed={true} styles={styles}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0px', marginBottom: '1rem' }}>
                                <input type="radio" id="tm1" name="themingMode" checked={config.themingMode === 'simple'} onChange={() => updateConfig({ themingMode: 'simple'})} />
                                <label htmlFor="tm1">{t('simple')}</label>
                                <input type="radio" id="tm2" name="themingMode" checked={config.themingMode === 'advanced'} onChange={() => updateConfig({ themingMode: 'advanced'})} />
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

                            <div style={{borderTop: `1px solid ${config.panelBorderColor}`, margin: '20px 0 10px 0'}} />
                            
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
                                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', justifyContent: 'center'}}>
                                    <div style={styles.colorPickerContainer}><label style={styles.label}>{t('background')}</label><input type="color" value={config.backgroundColor} onChange={e => updateConfig({ backgroundColor: e.target.value })} style={styles.colorInput} /></div>
                                    <div style={styles.colorPickerContainer}><label style={styles.label}>{t('panel')}</label><input type="color" value={config.panelColor} onChange={e => updateConfig({ panelColor: e.target.value })} style={styles.colorInput} /></div>
                                    <div style={styles.colorPickerContainer}><label style={styles.label}>{t('text')}</label><input type="color" value={config.textColor} onChange={e => updateConfig({ textColor: e.target.value })} style={styles.colorInput} /></div>
                                </div>

                                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', justifyContent: 'center'}}>
                                    <div style={styles.colorPickerContainer}><label style={styles.label}>{t('accent1')}</label><input type="color" value={config.accentColor1} onChange={e => updateConfig({ accentColor1: e.target.value })} style={styles.colorInput} /></div>
                                    <div style={styles.colorPickerContainer}><label style={styles.label}>{t('accent2')}</label><input type="color" value={config.accentColor2} onChange={e => updateConfig({ accentColor2: e.target.value })} style={styles.colorInput} /></div>
                                    <div style={styles.colorPickerContainer}><label style={styles.label}>{t('border')}</label><input type="color" value={config.panelBorderColor} onChange={e => updateConfig({ panelBorderColor: e.target.value })} style={styles.colorInput} /></div>
                                </div>

                                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', justifyContent: 'center'}}>
                                    <div style={styles.colorPickerContainer}><label style={styles.label}>{t('success')}</label><input type="color" value={config.successColor} onChange={e => updateConfig({ successColor: e.target.value })} style={styles.colorInput} /></div>
                                    <div style={styles.colorPickerContainer}><label style={styles.label}>{t('error')}</label><input type="color" value={config.errorColor} onChange={e => updateConfig({ errorColor: e.target.value })} style={styles.colorInput} /></div>
                                </div>

                                {/* Detailed / Granular Color Controls Toggle in Advanced Mode */}
                                {config.themingMode === 'advanced' && (
                                    <>
                                        <div style={{borderTop: `1px dashed ${config.panelBorderColor}`, margin: '10px 0'}} />
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
                                                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', justifyContent: 'center'}}>
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

                                                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', justifyContent: 'center'}}>
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

                                                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', justifyContent: 'center'}}>
                                                    <div style={styles.colorPickerContainer}>
                                                        <label style={styles.label}>{t('highlightColor')}</label>
                                                        <input type="color" value={config.highlightColor || config.accentColor1} onChange={e => updateConfig({ highlightColor: e.target.value })} style={styles.colorInput} />
                                                    </div>
                                                    <div style={styles.colorPickerContainer}>
                                                        <label style={styles.label}>{t('donorNameColor')}</label>
                                                        <input type="color" value={config.donorNameColor || config.highlightColor || config.accentColor1} onChange={e => updateConfig({ donorNameColor: e.target.value })} style={styles.colorInput} />
                                                    </div>
                                                </div>

                                                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', justifyContent: 'center'}}>
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

                                                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', justifyContent: 'center'}}>
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
                            <div style={{borderTop: `1px solid ${config.panelBorderColor}`, margin: '20px 0 10px 0'}} />
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

                            <CollapsibleSection title={t('soundSettings')} isInitiallyCollapsed={true} styles={styles}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={config.isSoundEnabled} 
                                        onChange={e => updateConfig({ isSoundEnabled: e.target.checked })}
                                    />
                                    <label style={{...styles.label, opacity: 1, cursor: 'pointer' }}>{t('enableSound')}</label>
                                </div>
                                <label style={config.isSoundEnabled ? styles.label : {...styles.label, opacity: 0.5}}>{t('volume')}</label>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="1" 
                                    step="0.01" 
                                    value={config.notificationVolume} 
                                    onChange={e => updateConfig({ notificationVolume: Number(e.target.value) })} 
                                    style={{width: '100%', cursor: config.isSoundEnabled ? 'pointer' : 'default' }}
                                    disabled={!config.isSoundEnabled}
                                />
                                
                                <label style={styles.label}>{t('donationSound')}</label>
                                <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                                    <select 
                                        value={config.selectedSound} 
                                        onChange={e => updateConfig({ selectedSound: e.target.value })} 
                                        style={{...styles.input, flexGrow: 1, width: 'auto', ...( !config.isSoundEnabled && { opacity: 0.5 })}}
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
                                <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                                    <select 
                                        value={config.selectedMilestoneSound} 
                                        onChange={e => updateConfig({ selectedMilestoneSound: e.target.value })} 
                                        style={{...styles.input, flexGrow: 1, width: 'auto', ...( !config.isSoundEnabled && { opacity: 0.5 })}}
                                        disabled={!config.isSoundEnabled}
                                    >
                                        <option value="default-milestone">{t('defaultFanfare')}</option>
                                        {config.customSounds.map(sound => (
                                            <option key={sound.id} value={sound.id}>{sound.name}</option>
                                        ))}
                                    </select>
                                    <button type="button" onClick={() => playSpecificSound(config.selectedMilestoneSound)} disabled={!config.isSoundEnabled} style={styles.previewButton}>{t('preview')}</button>
                                </div>

                                 <div style={{borderTop: `2px dashed ${effDividerColor}`, margin: '20px 0 0 0'}} />

                                <h4 style={{...styles.label, opacity: 1, fontSize: '1.1rem', marginBottom: '0' }}>{t('customSoundLibrary')}</h4>
                                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {config.customSounds.map(sound => (
                                        <div key={sound.id} style={styles.soundItem}>
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '10px' }}>{sound.name}</span>
                                            <div style={{ flexShrink: 0 }}>
                                                <button type="button" onClick={() => playSpecificSound(sound.id)} style={styles.soundButton}>{t('preview')}</button>
                                                <button type="button" onClick={() => handleDeleteSound(sound.id)} style={{...styles.soundButton, backgroundColor: config.errorColor}}>{t('delete')}</button>
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
                                <button type="button" onClick={() => soundFileInputRef.current?.click()} style={{...styles.button, backgroundColor: effPrimaryButtonBgColor, color: config.buttonTextColor, fontSize: '1rem', padding: '10px 20px', margin: 0}}>
                                    {t('uploadNewSound')}
                                </button>
                                
                                <label style={styles.label}>{t('addSoundFromFolder')}</label>
                                <div style={{display: 'flex', gap: '10px'}}>
                                    <select 
                                    value={selectedSoundFile} 
                                    onChange={(e) => setSelectedSoundFile(e.target.value)}
                                    style={{...styles.input, flexGrow: 1}}
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
                                        style={{...styles.button, backgroundColor: effPrimaryButtonBgColor, color: config.buttonTextColor, fontSize: '1rem', padding: '10px 20px', margin: 0}}
                                    >
                                        {t('add')}
                                    </button>
                                </div>
                                <p style={{fontSize: '0.8rem', color: config.textColor, opacity: 0.7, marginTop: '5px', marginBottom: '15px'}}>
                                    {t('soundFolderHint')}
                                </p>
                                {formError && <p style={{...styles.error, marginTop: 0, marginBottom: '0'}} role="alert">{formError}</p>}
                            </CollapsibleSection>

                            <CollapsibleSection title={t('sponsors')} isInitiallyCollapsed={true} styles={styles}>
                            <label style={styles.label}>{t('slideDuration')}</label>
                            <input
                                type="number"
                                value={config.sponsorDisplayDuration}
                                onChange={(e) => updateConfig({ sponsorDisplayDuration: Math.max(1, Number(e.target.value)) })}
                                style={{...styles.input, marginBottom: '1rem'}}
                                min="1"
                            />
                            <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '15px' }}>
                                {config.sponsors.length === 0 && <p style={{color: config.textColor, opacity: 0.6}}>{t('noSponsorsAdded')}</p>}
                                {config.sponsors.map(sponsor => (
                                <div key={sponsor.id} style={{...styles.soundItem, height: 'auto', alignItems: 'center' }}>
                                    <div style={{width: '50px', height: '50px', marginRight: '15px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000'}}>
                                        <img src={sponsor.imageUrl} alt={sponsor.name} style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}} />
                                    </div>
                                    <span style={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sponsor.name}</span>
                                    <button type="button" onClick={() => handleDeleteSponsor(sponsor.id)} style={{...styles.soundButton, backgroundColor: config.errorColor}}>{t('delete')}</button>
                                </div>
                                ))}
                            </div>
                            
                            {/* Upload or Add via URL (Works on GitHub Pages & Standalone) */}
                            <label style={styles.label}>{t('addSponsor')}</label>
                            <div style={{display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap'}}>
                                <input 
                                    type="text" 
                                    placeholder={t('sponsorName')} 
                                    value={sponsorNameInput} 
                                    onChange={e => setSponsorNameInput(e.target.value)} 
                                    style={{...styles.input, flex: '1 1 120px'}}
                                />
                                <input 
                                    type="text" 
                                    placeholder={t('imageUrlPlaceholder')} 
                                    value={sponsorUrlInput} 
                                    onChange={e => setSponsorUrlInput(e.target.value)} 
                                    style={{...styles.input, flex: '2 1 200px'}}
                                />
                                <button 
                                    type="button" 
                                    onClick={handleAddSponsorFromUrl} 
                                    disabled={!sponsorUrlInput.trim()} 
                                    style={{...styles.button, backgroundColor: config.accentColor1, color: config.buttonTextColor, fontSize: '0.9rem', padding: '10px 15px', margin: 0}}
                                >
                                    {t('add')}
                                </button>
                            </div>

                            <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px'}}>
                                <label style={{...styles.label, margin: 0}}>{t('orUploadImage')}:</label>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleUploadSponsorFile} 
                                    style={{fontSize: '0.8rem', color: config.textColor}}
                                />
                            </div>

                            {/* Add from server folder (when running with backend) */}
                            {availableSponsorFiles.length > 0 && (
                                <>
                                    <label style={styles.label}>{t('addSponsorFromFolder')}</label>
                                    <div style={{display: 'flex', gap: '10px'}}>
                                        <select 
                                            value={selectedSponsorFile} 
                                            onChange={(e) => setSelectedSponsorFile(e.target.value)}
                                            style={{...styles.input, flexGrow: 1}}
                                        >
                                            {availableSponsorFiles.map(file => (
                                                <option key={file} value={file}>{file}</option>
                                            ))}
                                        </select>
                                        <button 
                                            type="button" 
                                            onClick={handleAddSponsorFromList} 
                                            disabled={!selectedSponsorFile}
                                            style={{...styles.button, backgroundColor: config.accentColor1, color: config.buttonTextColor, fontSize: '1rem', padding: '10px 20px', margin: 0}}
                                        >
                                            {t('add')}
                                        </button>
                                    </div>
                                    <p style={{fontSize: '0.8rem', color: config.textColor, opacity: 0.7, marginTop: '5px'}}>
                                        {t('sponsorFolderHint')}
                                    </p>
                                </>
                            )}
                            </CollapsibleSection>
                            
                            <CollapsibleSection title={t('textOverlay')} isInitiallyCollapsed={true} styles={styles}>
                                <label style={styles.label}>{t('customTextLabel')}</label>
                                <textarea
                                    value={config.customTextContent || ''}
                                    onChange={(e) => updateConfig({ customTextContent: e.target.value })}
                                    placeholder={t('customTextPlaceholder')}
                                    rows={3}
                                    style={{...styles.input, resize: 'vertical', marginBottom: '0.8rem'}}
                                />

                                <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem'}}>
                                    <label style={{...styles.label, margin: 0}}>{t('uploadTextFile')}:</label>
                                    <input 
                                        type="file" 
                                        accept=".txt,.md" 
                                        onChange={handleUploadTextFile} 
                                        style={{fontSize: '0.8rem', color: config.textColor}}
                                    />
                                </div>

                                {availableTextFiles.length > 0 && (
                                    <>
                                        <label style={styles.label}>{t('selectTextFile')}</label>
                                        <select 
                                            value={config.selectedTextFile || ''} 
                                            onChange={(e) => updateConfig({ selectedTextFile: e.target.value })}
                                            style={{...styles.input, marginBottom: '0.5rem'}}
                                        >
                                            <option value="">-- {t('none')} --</option>
                                            {availableTextFiles.map(file => (
                                                <option key={file} value={file}>{file}</option>
                                            ))}
                                        </select>
                                        <p style={{fontSize: '0.8rem', color: config.textColor, opacity: 0.7, marginTop: '5px'}}>
                                            {t('textFolderHint')}
                                        </p>
                                    </>
                                )}

                                <label style={{...styles.label, marginTop: '1rem'}}>{t('textAlignment')}</label>
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

                                <label style={{...styles.label, marginTop: '1rem'}}>{t('fontSize')}</label>
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

                            {/* Backup & Restore for Standalone / GitHub Pages */}
                            <CollapsibleSection title={t('profileBackup')} isInitiallyCollapsed={true} styles={styles}>
                                <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                                    <button 
                                        type="button" 
                                        onClick={handleExportConfig} 
                                        style={{...styles.button, backgroundColor: effSecondaryButtonBgColor, color: config.buttonTextColor, fontSize: '0.9rem', padding: '10px 15px', margin: 0, flex: 1}}
                                    >
                                        {t('exportConfig')}
                                    </button>
                                    <label style={{...styles.button, backgroundColor: effPrimaryButtonBgColor, color: config.buttonTextColor, fontSize: '0.9rem', padding: '10px 15px', margin: 0, flex: 1, textAlign: 'center', cursor: 'pointer'}}>
                                        {t('importConfig')}
                                        <input 
                                            type="file" 
                                            accept=".json" 
                                            onChange={handleImportConfig} 
                                            style={{display: 'none'}} 
                                        />
                                    </label>
                                </div>
                                {importSuccessMsg && <p style={{color: config.successColor, fontSize: '0.85rem', marginTop: '10px'}}>{importSuccessMsg}</p>}
                            </CollapsibleSection>

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
                <div style={{marginBottom: '2rem'}}>
                    <div style={{...styles.progressBarContainer, marginBottom: 0}}>
                        {timeDisplay && <div style={styles.timerText}>{timeDisplay}</div>}
                        <div style={{...styles.progressBar, width: `${progressPercentage}%`}}>
                            <span style={styles.progressText}>{currencyPrefix}{convertAmount(totalRaised).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        <div style={styles.goalText}>{t('goal')}: {currencyPrefix}{convertAmount(goal).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    </div>
                </div>
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
