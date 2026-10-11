/**
 * =============================================================================
 * EXTRA LIFE TRACKER - OBS BROWSER OVERLAYS & UI COMPONENTS
 * =============================================================================
 * Standalone OBS browser source overlay components and dashboard widgets.
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { hexToRgba } from "./constants.js";
import { createQRMatrix } from "./qr-code.js";
export const ProgressBar = ({
  totalRaised,
  goal,
  timeDisplay,
  progressPercentage,
  currencyPrefix,
  convertAmount,
  styles,
  config,
  t
}) => {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: "2rem"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...styles.progressBarContainer,
      marginBottom: 0
    }
  }, timeDisplay && /*#__PURE__*/React.createElement("div", {
    style: styles.timerText
  }, timeDisplay), /*#__PURE__*/React.createElement("div", {
    style: {
      ...styles.progressBar,
      width: `${progressPercentage}%`
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: styles.progressText
  }, currencyPrefix, convertAmount(totalRaised).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }))), /*#__PURE__*/React.createElement("div", {
    style: styles.goalText
  }, t("goal"), ": ", currencyPrefix, convertAmount(goal).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }))));
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
}) => {
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
    return milestones.map(m => {
      const rawGoal = m?.fundraisingGoal ?? m?.goal;
      const goalNum = typeof rawGoal === 'number' ? rawGoal : parseFloat(String(rawGoal || '0').replace(/[^0-9.-]/g, ''));
      return {
        ...m,
        milestoneID: m?.milestoneID || m?.id || String(goalNum),
        fundraisingGoal: isNaN(goalNum) ? 0 : goalNum,
        description: m?.description || m?.title || m?.name || ''
      };
    }).filter(m => m && m.fundraisingGoal > 0).sort((a, b) => a.fundraisingGoal - b.fundraisingGoal);
  }, [milestones]);

  // Parse current total raised safely
  const numRaised = useMemo(() => {
    if (typeof totalRaised === 'number' && !isNaN(totalRaised)) return totalRaised;
    const parsed = parseFloat(String(totalRaised || '0').replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }, [totalRaised]);

  // 2. Find next uncompleted milestone
  const nextMilestone = useMemo(() => {
    return sortedMilestones.find(m => numRaised < m.fundraisingGoal);
  }, [sortedMilestones, numRaised]);
  const barBg = effProgressBarBgColor || config?.milestoneProgressBarBgColor || config?.progressBarBgColor || '#1a1a1a';
  const barColor = effProgressBarColor || config?.milestoneProgressBarColor || config?.progressBarColor || config?.successColor || '#00ff00';
  const barTextColor = effProgressBarTextColor || config?.milestoneProgressBarTextColor || config?.progressBarTextColor || '#ffffff';
  const borderColor = effProgressBarBorderColor || config?.milestoneProgressBarBorderColor || config?.progressBarBorderColor || config?.panelBorderColor || '#00ffff';
  const secTextColor = effSecondaryTextColor || config?.secondaryTextColor || '#aaaaaa';
  const resolvedHexToRgba = hexToRgba || ((hex, alpha) => hex);

  // 3. If no milestones found at all
  if (sortedMilestones.length === 0) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        ...styles.progressBarContainer,
        backgroundColor: barBg,
        border: `4px solid ${borderColor}`,
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("h2", {
      style: {
        ...styles.milestoneDescription,
        color: secTextColor,
        margin: 0
      }
    }, t('noMilestones') || 'No Milestones Found'));
  }

  // 4. If all milestones have been reached
  if (!nextMilestone) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        ...styles.progressBarContainer,
        backgroundColor: barBg,
        border: `4px solid ${borderColor}`,
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("h2", {
      style: {
        ...styles.milestoneDescription,
        color: successColor || config?.successColor || '#00ff00',
        margin: 0
      }
    }, t('allMilestonesComplete')));
  }

  // 5. Determine previous milestone goal (for step/relative calculations)
  const milestoneIndex = sortedMilestones.findIndex(m => m.milestoneID && nextMilestone.milestoneID && m.milestoneID === nextMilestone.milestoneID || m === nextMilestone);
  const previousMilestoneGoal = milestoneIndex > 0 ? sortedMilestones[milestoneIndex - 1].fundraisingGoal : 0;

  // 6. Calculations
  const targetGoal = nextMilestone.fundraisingGoal;
  const remainingTotal = Math.max(0, targetGoal - numRaised);

  // Cumulative percentage (0 to targetGoal)
  const cumulativePercentage = targetGoal > 0 ? Math.min(100, Math.max(0, numRaised / targetGoal * 100)) : 100;

  // Step/Relative percentage (previousMilestoneGoal to targetGoal)
  const stepGoal = Math.max(0, targetGoal - previousMilestoneGoal);
  const stepRaised = Math.min(stepGoal, Math.max(0, numRaised - previousMilestoneGoal));
  const stepPercentage = stepGoal > 0 ? Math.min(100, Math.max(0, stepRaised / stepGoal * 100)) : 100;

  // Active percentage used for bar fill
  const activePercentage = progressMode === 'relative' ? stepPercentage : cumulativePercentage;

  // Center text inside progress bar track
  const centerText = progressMode === 'relative' ? `${currencyPrefix}${convertAmount(stepRaised).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} / ${currencyPrefix}${convertAmount(stepGoal).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} (${activePercentage.toFixed(1)}%)` : `${currencyPrefix}${convertAmount(numRaised).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} / ${currencyPrefix}${convertAmount(targetGoal).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} (${activePercentage.toFixed(1)}%)`;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...styles.progressBarContainer,
      backgroundColor: barBg,
      border: `4px solid ${borderColor}`
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: styles.milestoneDescription
  }, t('nextGoal'), ": ", nextMilestone.description), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: '100%',
      height: '42px',
      backgroundColor: barBg,
      border: `2px solid ${resolvedHexToRgba(borderColor, 0.4)}`,
      overflow: 'hidden',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      width: `${Math.min(100, Math.max(0, activePercentage))}%`,
      backgroundColor: barColor,
      transition: 'width 0.5s ease-in-out'
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
      color: barTextColor,
      fontFamily: config?.fontFamily || styles.progressBarContainer?.fontFamily,
      fontSize: '1.15rem',
      fontWeight: 'bold',
      textShadow: `1px 1px 2px ${resolvedHexToRgba(config?.backgroundColor || '#000000', 0.85)}`,
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      padding: '0 10px',
      boxSizing: 'border-box'
    }
  }, centerText)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '10px',
      color: secTextColor,
      fontSize: '0.95rem',
      fontFamily: config?.fontFamily || styles.progressBarContainer?.fontFamily,
      flexWrap: 'wrap',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("div", null, t('goal'), ": ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: config?.textColor || '#ffffff',
      fontWeight: 'bold'
    }
  }, currencyPrefix, convertAmount(targetGoal).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })), progressMode === 'relative' && previousMilestoneGoal > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.8rem',
      opacity: 0.75,
      marginLeft: '6px'
    }
  }, "(", t('teamTotal') ? t('teamTotal').split(' ')[0] : 'Total', ": ", currencyPrefix, convertAmount(numRaised).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }), ")")), remainingTotal > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      opacity: 0.85
    }
  }, currencyPrefix, convertAmount(remainingTotal).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }), " ", t('toGo'))));
};
const TeamHeaderOverlay = ({
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
  const pbText = effProgressBarTextColor || config?.progressBarTextColor || config?.textColor || '#ffffff';
  const pbBorder = effProgressBarBorderColor || config?.progressBarBorderColor || config?.panelBorderColor || '#00ffff';
  const teamProgress = teamGoal > 0 ? Math.min(100, Math.max(0, teamTotalRaised / teamGoal * 100)) : 0;
  const remaining = Math.max(0, teamGoal - teamTotalRaised);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...styles.progressBarContainer,
      backgroundColor: config?.panelColor || pbBg,
      border: `4px solid ${pbBorder}`,
      padding: '16px 20px',
      boxSizing: 'border-box',
      fontFamily: config?.fontFamily,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
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
    }
  }, "👥 ", teamName || t('teamTotal')), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.85rem',
      color: effSecondaryTextColor,
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }
  }, typeof teamDonationsCount === 'number' && /*#__PURE__*/React.createElement("span", null, teamDonationsCount, " ", t('donations')), teamGoal > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      backgroundColor: hexToRgba(pbFill, 0.18),
      color: pbFill,
      padding: '2px 8px',
      borderRadius: '4px',
      fontWeight: 'bold',
      fontSize: '0.8rem'
    }
  }, teamProgress.toFixed(1), "%"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '6px',
      margin: '2px 0'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '2.4rem',
      fontWeight: 'bold',
      color: config?.successColor || '#00ff00',
      textShadow: `2px 2px 4px ${hexToRgba(config?.backgroundColor || '#000000', 0.85)}`,
      lineHeight: 1.1
    }
  }, currencyPrefix, convertAmount(teamTotalRaised || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })), teamGoal > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.95rem',
      color: effSecondaryTextColor
    }
  }, t('teamGoal'), ": ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: config?.textColor || '#ffffff'
    }
  }, currencyPrefix, convertAmount(teamGoal || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: '100%',
      height: '42px',
      backgroundColor: pbBg,
      border: `2px solid ${pbBorder}`,
      overflow: 'hidden',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      width: `${teamGoal > 0 ? teamProgress : 100}%`,
      backgroundColor: pbFill,
      transition: 'width 0.5s ease-in-out'
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
      color: pbText,
      fontFamily: config?.fontFamily || styles?.progressBarContainer?.fontFamily,
      fontSize: 'clamp(0.75rem, 2.4vw, 1.05rem)',
      fontWeight: 'bold',
      textShadow: '0 0 4px #000000, 1px 1px 2px #000000, -1px -1px 2px #000000, 1px -1px 2px #000000, -1px 1px 2px #000000',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      padding: '0 10px',
      boxSizing: 'border-box',
      zIndex: 2
    }
  }, teamGoal > 0 ? `${currencyPrefix}${convertAmount(teamTotalRaised || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} / ${currencyPrefix}${convertAmount(teamGoal || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} (${teamProgress.toFixed(1)}%)` : `${currencyPrefix}${convertAmount(teamTotalRaised || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`)), teamGoal > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '0.85rem',
      color: effSecondaryTextColor,
      flexWrap: 'wrap',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("span", null, t('teamGoal'), ": ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: config?.textColor || '#ffffff',
      fontWeight: 'bold'
    }
  }, currencyPrefix, convertAmount(teamGoal || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }))), remaining > 0 ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: pbFill,
      fontWeight: 'bold'
    }
  }, currencyPrefix, convertAmount(remaining || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }), " ", t('toGo')) : /*#__PURE__*/React.createElement("span", {
    style: {
      color: config?.successColor || '#00ff00',
      fontWeight: 'bold'
    }
  }, "🎉 ", t('goalReached') || 'Goal Reached!')));
};
const TeamOverlay = TeamHeaderOverlay;
const TeamDonationsOverlay = ({
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
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      maxWidth: '650px',
      height: '100vh',
      margin: '0 auto',
      padding: '16px',
      boxSizing: 'border-box',
      fontFamily: config?.fontFamily,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      backgroundColor: config?.panelColor,
      border: `3px solid ${effHighlightColor}`,
      padding: '14px 16px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '8px',
      borderBottom: `1px dashed ${effDividerColor}`,
      paddingBottom: '8px'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      color: effHeaderColor || config?.textColor,
      fontSize: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      textShadow: `1px 1px 2px ${config?.backgroundColor || '#000000'}`
    }
  }, "👥 ", teamName ? `${teamName} - ${t('teamDonations')}` : t('teamDonations')), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.8rem',
      backgroundColor: hexToRgba(effHighlightColor, 0.15),
      color: effHighlightColor,
      padding: '3px 10px',
      borderRadius: '12px',
      fontWeight: 'bold'
    }
  }, filteredDonations.length, " ", t('donations'))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '0.85rem',
      color: effSecondaryTextColor
    }
  }, /*#__PURE__*/React.createElement("span", null, t('totalTeamRaised'), ":"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: config?.successColor || '#00ff00',
      fontWeight: 'bold',
      fontSize: '1.05rem'
    }
  }, currencyPrefix, convertAmount(teamTotalRaised).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: searchTerm,
    onChange: e => setSearchTerm(e.target.value),
    placeholder: t('searchDonations'),
    style: {
      ...styles.input,
      fontSize: '0.8rem',
      padding: '6px 10px',
      width: '100%',
      boxSizing: 'border-box'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      paddingRight: '4px',
      textAlign: 'left'
    }
  }, filteredDonations.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '40px 15px',
      textAlign: 'center',
      backgroundColor: hexToRgba(config?.panelColor || '#1a1a1a', 0.7),
      border: `2px dashed ${config?.panelBorderColor || '#555555'}`,
      color: effSecondaryTextColor,
      fontSize: '0.85rem'
    }
  }, t('noTeamDonations')) : filteredDonations.map(d => {
    const isAnonymous = !d.displayName || d.displayName.toLowerCase() === 'anonymous';
    const donorTitle = isAnonymous ? t('anonymous') : d.displayName;
    const formattedDate = d.createdDateUTC ? new Date(d.createdDateUTC).toLocaleString() : '';
    return /*#__PURE__*/React.createElement("div", {
      key: d.donationID || `${d.createdDateUTC}-${d.amount}`,
      style: {
        backgroundColor: hexToRgba(config?.panelColor || '#1a1a1a', 0.85),
        border: `2px solid ${hexToRgba(config?.panelBorderColor || '#444444', 0.4)}`,
        padding: '12px 14px',
        boxSizing: 'border-box',
        transition: 'all 0.2s ease'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '8px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: effDonorNameColor,
        fontWeight: 'bold',
        fontSize: '0.95rem',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap'
      }
    }, donorTitle), /*#__PURE__*/React.createElement("span", {
      style: {
        color: config?.successColor || '#00ff00',
        fontWeight: 'bold',
        fontSize: '1.05rem',
        flexShrink: 0
      }
    }, currencyPrefix, convertAmount(d.amount).toFixed(2))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '4px',
        marginTop: '6px',
        fontSize: '0.78rem',
        color: effSecondaryTextColor
      }
    }, /*#__PURE__*/React.createElement("span", null, "🎯 ", t('forRecipient'), " ", /*#__PURE__*/React.createElement("strong", null, d.recipientName || teamName || 'Team')), formattedDate && /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'monospace',
        opacity: 0.7,
        fontSize: '0.72rem'
      }
    }, formattedDate)), d.message && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: '8px',
        padding: '6px 10px',
        backgroundColor: hexToRgba(config?.backgroundColor || '#000000', 0.5),
        borderRadius: '4px',
        fontStyle: 'italic',
        fontSize: '0.82rem',
        color: config?.textColor,
        lineHeight: 1.4,
        borderLeft: `3px solid ${effHighlightColor}`
      }
    }, "\"", d.message, "\""));
  })));
};
const TeamDashboardView = ({
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
  onManualSync
}) => {
  const pbBg = effProgressBarBgColor || config.progressBarBgColor || '#1a1a1a';
  const pbFill = effProgressBarColor || config.progressBarColor || config.successColor || '#00ff00';
  const pbText = effProgressBarTextColor || config.progressBarTextColor || config.textColor || '#ffffff';
  const pbBorder = effProgressBarBorderColor || config.progressBarBorderColor || config.panelBorderColor || '#00ffff';
  const [teamSearch, setTeamSearch] = useState('');
  const [accountSearch, setAccountSearch] = useState('');
  const [fetchedAccounts, setFetchedAccounts] = useState({});
  const [loadingAccount, setLoadingAccount] = useState(false);

  // Active account ID defaults to the current participantId or first team participant if participant is not in team
  const activeAccountId = selectedAccountId || (participantId && teamParticipants.some(p => String(p.participantID) === String(participantId)) ? String(participantId) : teamParticipants.length > 0 ? String(teamParticipants[0]?.participantID) : String(participantId || ''));

  // Asynchronously fetch extra data for a team member if chosen
  useEffect(() => {
    if (!activeAccountId) return;
    if (activeAccountId === String(participantId) && participantDonations && participantDonations.length > 0) return;
    if (fetchedAccounts[activeAccountId]) return;
    let isMounted = true;
    setLoadingAccount(true);
    Promise.all([fetch(`https://dd.extra-life.org/api/participants/${activeAccountId}`).then(r => r.ok ? r.json() : null).catch(() => null), fetch(`https://dd.extra-life.org/api/participants/${activeAccountId}/donations?limit=100&orderBy=createdDateUTC&orderDirection=DESC`).then(r => r.ok ? r.json() : null).catch(() => null)]).then(([partRes, donRes]) => {
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
    return () => {
      isMounted = false;
    };
  }, [activeAccountId, participantId, participantDonations]);

  // Resolve active account details
  const activeMemberFromTeam = teamParticipants.find(p => String(p.participantID) === activeAccountId);
  const activeFetched = fetchedAccounts[activeAccountId];
  const activeAccountName = activeAccountId === String(participantId) && participantName ? participantName : activeFetched?.name || activeMemberFromTeam?.displayName || (activeAccountId ? `Account ${activeAccountId}` : t('specificAccount'));
  const activeAccountTotal = activeAccountId === String(participantId) && typeof participantTotalRaised === 'number' && participantTotalRaised > 0 ? participantTotalRaised : activeFetched?.total ?? activeMemberFromTeam?.sumDonations ?? 0;
  const activeAccountGoal = activeAccountId === String(participantId) && typeof participantGoal === 'number' && participantGoal > 0 ? participantGoal : activeFetched?.goal ?? activeMemberFromTeam?.fundraisingGoal ?? 0;

  // Resolve donations for active account
  const rawAccountDonations = useMemo(() => {
    if (activeAccountId === String(participantId) && participantDonations && participantDonations.length > 0) {
      return participantDonations;
    }
    if (activeFetched?.donations && activeFetched.donations.length > 0) {
      return activeFetched.donations;
    }
    const matchingTeamDonations = teamDonations.filter(d => activeAccountId && String(d.participantID) === activeAccountId || activeMemberFromTeam && d.recipientName === activeMemberFromTeam.displayName || activeFetched?.name && d.recipientName === activeFetched.name || activeAccountId === String(participantId) && participantName && d.recipientName === participantName);
    if (matchingTeamDonations.length > 0) {
      return matchingTeamDonations;
    }
    if (activeAccountId === String(participantId) && participantDonations) {
      return participantDonations;
    }
    return [];
  }, [activeAccountId, participantId, participantDonations, teamDonations, participantName, activeFetched, activeMemberFromTeam]);

  // Sorted & Filtered team donations (most recent first)
  const sortedTeamDonations = useMemo(() => {
    return [...(teamDonations || [])].sort((a, b) => {
      const timeA = a?.createdDateUTC ? new Date(a.createdDateUTC).getTime() : 0;
      const timeB = b?.createdDateUTC ? new Date(b.createdDateUTC).getTime() : 0;
      return timeB - timeA;
    });
  }, [teamDonations]);
  const filteredTeamDonations = useMemo(() => {
    const q = teamSearch.trim().toLowerCase();
    if (!q) return sortedTeamDonations;
    return sortedTeamDonations.filter(d => {
      const donor = (d.displayName || t('anonymous')).toLowerCase();
      const recipient = (d.recipientName || '').toLowerCase();
      const msg = (d.message || '').toLowerCase();
      const amt = String(d.amount);
      return donor.includes(q) || recipient.includes(q) || msg.includes(q) || amt.includes(q);
    });
  }, [sortedTeamDonations, teamSearch, t]);

  // Sorted & Filtered account donations (most recent first)
  const sortedAccountDonations = useMemo(() => {
    return [...(rawAccountDonations || [])].sort((a, b) => {
      const timeA = a?.createdDateUTC ? new Date(a.createdDateUTC).getTime() : 0;
      const timeB = b?.createdDateUTC ? new Date(b.createdDateUTC).getTime() : 0;
      return timeB - timeA;
    });
  }, [rawAccountDonations]);
  const filteredAccountDonations = useMemo(() => {
    const q = accountSearch.trim().toLowerCase();
    if (!q) return sortedAccountDonations;
    return sortedAccountDonations.filter(d => {
      const donor = (d.displayName || t('anonymous')).toLowerCase();
      const msg = (d.message || '').toLowerCase();
      const amt = String(d.amount);
      return donor.includes(q) || msg.includes(q) || amt.includes(q);
    });
  }, [sortedAccountDonations, accountSearch, t]);

  // Progress calculations
  const teamProgress = teamGoal > 0 ? Math.min(100, teamTotalRaised / teamGoal * 100) : 0;
  const accountProgress = activeAccountGoal > 0 ? Math.min(100, activeAccountTotal / activeAccountGoal * 100) : 0;
  const accountContribution = teamTotalRaised > 0 ? Math.min(100, activeAccountTotal / teamTotalRaised * 100) : 0;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      maxWidth: isOverlay ? '100%' : '1400px',
      margin: '0 auto',
      padding: isOverlay ? '16px' : '0',
      boxSizing: 'border-box',
      fontFamily: config.fontFamily
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: styles.statHero
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.95rem',
      color: effHighlightColor,
      fontWeight: 'bold'
    }
  }, "👥 ", teamName || t('teamDashboard')), lastFetchedAt && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.8rem',
      opacity: 0.7,
      color: effSecondaryTextColor
    }
  }, "• ", t('live'), ": ", lastFetchedAt.toLocaleTimeString())), /*#__PURE__*/React.createElement("h2", {
    style: styles.bigStat
  }, currencyPrefix, convertAmount(teamTotalRaised).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })), /*#__PURE__*/React.createElement("p", {
    style: styles.secondaryStat
  }, teamGoal > 0 ? `${t('teamGoal')}: ${currencyPrefix}${convertAmount(teamGoal).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} (${teamProgress.toFixed(1)}%)` : `${t('totalDonations')}: ${teamDonations.length}`), teamGoal > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      maxWidth: '650px',
      backgroundColor: pbBg,
      border: `2px solid ${pbBorder}`,
      padding: '4px',
      boxSizing: 'border-box',
      marginTop: '8px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: '100%',
      height: '32px',
      backgroundColor: pbBg,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      width: `${teamProgress}%`,
      backgroundColor: pbFill,
      transition: 'width 0.5s ease-in-out'
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
      color: pbText,
      fontSize: 'clamp(0.75rem, 2vw, 0.95rem)',
      fontFamily: config.fontFamily,
      fontWeight: 'bold',
      textShadow: '0 0 4px #000000, 1px 1px 2px #000000, -1px -1px 2px #000000, 1px -1px 2px #000000, -1px 1px 2px #000000',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      padding: '0 8px',
      zIndex: 2
    }
  }, currencyPrefix, convertAmount(teamTotalRaised || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }), " / ", currencyPrefix, convertAmount(teamGoal || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }), " (", teamProgress.toFixed(1), "%)")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '1rem',
      marginBottom: '1.5rem',
      width: '100%',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...styles.card,
      textAlign: 'center',
      padding: '14px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.8rem',
      color: effSecondaryTextColor,
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }
  }, t('totalDonationsCount')), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '1.4rem',
      fontWeight: 'bold',
      color: effHighlightColor,
      marginTop: '4px'
    }
  }, teamDonations.length)), /*#__PURE__*/React.createElement("div", {
    style: {
      ...styles.card,
      textAlign: 'center',
      padding: '14px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.8rem',
      color: effSecondaryTextColor,
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }
  }, t('teamMembersCount')), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '1.4rem',
      fontWeight: 'bold',
      color: effHighlightColor,
      marginTop: '4px'
    }
  }, teamParticipants.length)), /*#__PURE__*/React.createElement("div", {
    style: {
      ...styles.card,
      textAlign: 'center',
      padding: '14px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.8rem',
      color: effSecondaryTextColor,
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }
  }, t('specificAccount')), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '1.1rem',
      fontWeight: 'bold',
      color: config.textColor,
      marginTop: '4px',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap'
    }
  }, activeAccountName)), /*#__PURE__*/React.createElement("div", {
    style: {
      ...styles.card,
      textAlign: 'center',
      padding: '14px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.8rem',
      color: effSecondaryTextColor,
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }
  }, t('accountTotalRaised')), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '1.4rem',
      fontWeight: 'bold',
      color: config.successColor,
      marginTop: '4px'
    }
  }, currencyPrefix, convertAmount(activeAccountTotal).toFixed(2), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.8rem',
      opacity: 0.7,
      marginLeft: '6px',
      color: effSecondaryTextColor
    }
  }, "(", accountContribution.toFixed(1), "%)")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
      gap: '20px',
      width: '100%',
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...styles.card,
      border: `2px solid ${effHighlightColor}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: '16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '8px',
      borderBottom: `1px dashed ${effDividerColor}`,
      paddingBottom: '10px'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      color: effHeaderColor,
      fontSize: '1.1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }
  }, "👥 ", t('teamDonations')), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.8rem',
      backgroundColor: hexToRgba(effHighlightColor, 0.15),
      color: effHighlightColor,
      padding: '3px 10px',
      borderRadius: '12px',
      fontWeight: 'bold'
    }
  }, filteredTeamDonations.length, " ", t('donations'))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("input", {
    type: "text",
    id: "input-team-donations-filter",
    value: teamSearch,
    onChange: e => setTeamSearch(e.target.value),
    placeholder: t('searchDonations'),
    style: {
      ...styles.input,
      fontSize: '0.85rem',
      padding: '8px 12px',
      width: '100%',
      boxSizing: 'border-box'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: isOverlay ? 'calc(100vh - 430px)' : '650px',
      minHeight: '260px',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      paddingRight: '4px'
    }
  }, filteredTeamDonations.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '30px 10px',
      textAlign: 'center',
      opacity: 0.7,
      color: config.textColor
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0
    }
  }, t('noTeamDonations'))) : filteredTeamDonations.map(d => {
    const isAnonymous = !d.displayName || d.displayName.toLowerCase() === 'anonymous';
    const donorTitle = isAnonymous ? t('anonymous') : d.displayName;
    const formattedDate = d.createdDateUTC ? new Date(d.createdDateUTC).toLocaleString() : '';
    return /*#__PURE__*/React.createElement("div", {
      key: d.donationID || `${d.createdDateUTC}-${d.amount}`,
      style: {
        backgroundColor: hexToRgba(config.panelColor, 0.75),
        border: `1px solid ${hexToRgba(config.panelBorderColor, 0.35)}`,
        borderRadius: '8px',
        padding: '12px 14px',
        transition: 'all 0.2s ease'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '8px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: effDonorNameColor,
        fontWeight: 'bold',
        fontSize: '0.95rem',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap'
      }
    }, donorTitle), /*#__PURE__*/React.createElement("span", {
      style: {
        color: config.successColor,
        fontWeight: 'bold',
        fontSize: '1rem',
        flexShrink: 0
      }
    }, currencyPrefix, convertAmount(d.amount).toFixed(2))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '4px',
        marginTop: '6px',
        fontSize: '0.8rem',
        color: effSecondaryTextColor
      }
    }, /*#__PURE__*/React.createElement("span", null, "🎯 ", t('forRecipient'), " ", /*#__PURE__*/React.createElement("strong", null, d.recipientName || teamName || 'Team')), formattedDate && /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'monospace',
        opacity: 0.7,
        fontSize: '0.75rem'
      }
    }, formattedDate)), d.message && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: '8px',
        padding: '6px 10px',
        backgroundColor: hexToRgba(config.backgroundColor, 0.4),
        borderRadius: '6px',
        fontStyle: 'italic',
        fontSize: '0.85rem',
        color: config.textColor,
        lineHeight: 1.4,
        borderLeft: `2px solid ${effHighlightColor}`
      }
    }, "\"", d.message, "\""));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...styles.card,
      border: `2px solid ${effHighlightColor}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: '16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '8px',
      borderBottom: `1px dashed ${effDividerColor}`,
      paddingBottom: '10px'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      color: effHeaderColor,
      fontSize: '1.1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }
  }, "👤 ", t('accountDonations')), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.8rem',
      backgroundColor: hexToRgba(effHighlightColor, 0.15),
      color: effHighlightColor,
      padding: '3px 10px',
      borderRadius: '12px',
      fontWeight: 'bold'
    }
  }, filteredAccountDonations.length, " ", t('donations'))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    }
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "select-account",
    style: {
      fontSize: '0.8rem',
      color: effSecondaryTextColor,
      fontWeight: 'bold'
    }
  }, t('selectAccount'), ":"), /*#__PURE__*/React.createElement("select", {
    id: "select-account",
    value: activeAccountId,
    onChange: e => setSelectedAccountId(e.target.value),
    style: {
      ...styles.input,
      fontSize: '0.85rem',
      padding: '8px 12px',
      width: '100%',
      backgroundColor: config.panelColor,
      color: config.textColor,
      cursor: 'pointer'
    }
  }, participantId && /*#__PURE__*/React.createElement("option", {
    value: String(participantId)
  }, "⭐ ", participantName || 'My Profile', " (ID: ", participantId, ") - ", currencyPrefix, convertAmount(participantTotalRaised).toFixed(2)), teamParticipants.filter(p => String(p.participantID) !== String(participantId)).map(p => /*#__PURE__*/React.createElement("option", {
    key: p.participantID,
    value: String(p.participantID)
  }, p.displayName || `ID ${p.participantID}`, " (ID: ", p.participantID, ") - ", currencyPrefix, convertAmount(p.sumDonations || 0).toFixed(2))))), /*#__PURE__*/React.createElement("div", {
    style: {
      backgroundColor: hexToRgba(effPrimaryButtonBgColor, 0.1),
      border: `1px solid ${hexToRgba(effHighlightColor, 0.3)}`,
      borderRadius: '8px',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '6px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 'bold',
      fontSize: '0.95rem',
      color: config.textColor
    }
  }, activeAccountName, loadingAccount && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.75rem',
      opacity: 0.6,
      marginLeft: '6px'
    }
  }, "(", t('connecting'), ")")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 'bold',
      fontSize: '1.05rem',
      color: config.successColor
    }
  }, currencyPrefix, convertAmount(activeAccountTotal).toFixed(2))), activeAccountGoal > 0 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '0.75rem',
      color: effSecondaryTextColor,
      marginBottom: '4px'
    }
  }, /*#__PURE__*/React.createElement("span", null, t('goal'), ": ", currencyPrefix, convertAmount(activeAccountGoal).toFixed(2)), /*#__PURE__*/React.createElement("span", null, accountProgress.toFixed(1), "%")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: '16px',
      backgroundColor: pbBg,
      border: `1px solid ${pbBorder}`,
      borderRadius: '3px',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${accountProgress}%`,
      height: '100%',
      backgroundColor: pbFill,
      transition: 'width 0.4s ease'
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
      color: pbText,
      fontSize: '0.65rem',
      fontFamily: config.fontFamily,
      fontWeight: 'bold',
      pointerEvents: 'none',
      whiteSpace: 'nowrap'
    }
  }, currencyPrefix, convertAmount(activeAccountTotal).toFixed(2), " / ", currencyPrefix, convertAmount(activeAccountGoal).toFixed(2), " (", accountProgress.toFixed(1), "%)")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("input", {
    type: "text",
    id: "input-account-donations-filter",
    value: accountSearch,
    onChange: e => setAccountSearch(e.target.value),
    placeholder: t('searchDonations'),
    style: {
      ...styles.input,
      fontSize: '0.85rem',
      padding: '8px 12px',
      width: '100%',
      boxSizing: 'border-box'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: isOverlay ? 'calc(100vh - 540px)' : '530px',
      minHeight: '220px',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      paddingRight: '4px'
    }
  }, filteredAccountDonations.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '30px 10px',
      textAlign: 'center',
      opacity: 0.7,
      color: config.textColor
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0
    }
  }, t('noAccountDonations'))) : filteredAccountDonations.map(d => {
    const isAnonymous = !d.displayName || d.displayName.toLowerCase() === 'anonymous';
    const donorTitle = isAnonymous ? t('anonymous') : d.displayName;
    const formattedDate = d.createdDateUTC ? new Date(d.createdDateUTC).toLocaleString() : '';
    return /*#__PURE__*/React.createElement("div", {
      key: d.donationID || `${d.createdDateUTC}-${d.amount}`,
      style: {
        backgroundColor: hexToRgba(config.panelColor, 0.75),
        border: `1px solid ${hexToRgba(config.panelBorderColor, 0.35)}`,
        borderRadius: '8px',
        padding: '12px 14px',
        transition: 'all 0.2s ease'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '8px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: effDonorNameColor,
        fontWeight: 'bold',
        fontSize: '0.95rem',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap'
      }
    }, donorTitle), /*#__PURE__*/React.createElement("span", {
      style: {
        color: config.successColor,
        fontWeight: 'bold',
        fontSize: '1rem',
        flexShrink: 0
      }
    }, currencyPrefix, convertAmount(d.amount).toFixed(2))), formattedDate && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: '6px',
        fontSize: '0.75rem',
        color: effSecondaryTextColor,
        fontFamily: 'monospace',
        opacity: 0.7
      }
    }, formattedDate), d.message && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: '8px',
        padding: '6px 10px',
        backgroundColor: hexToRgba(config.backgroundColor, 0.4),
        borderRadius: '6px',
        fontStyle: 'italic',
        fontSize: '0.85rem',
        color: config.textColor,
        lineHeight: 1.4,
        borderLeft: `2px solid ${effHighlightColor}`
      }
    }, "\"", d.message, "\""));
  })))));
};
const ScheduleOverlay = ({
  items,
  styles,
  accentColor1,
  accentColor2,
  textColor,
  fontFamily,
  t,
  timeColor,
  dividerColor,
  headerColor
}) => {
  const effTimeColor = timeColor || accentColor1 || '#ff00ff';
  const effDivColor = dividerColor || accentColor2 || '#00ffff';
  const effHColor = headerColor || accentColor1 || '#ff00ff';
  const containerStyle = styles.overlayContainer || styles.progressBarContainer;
  if (!items || items.length === 0) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        ...containerStyle,
        textAlign: 'center',
        padding: '20px'
      }
    }, /*#__PURE__*/React.createElement("h2", {
      style: {
        ...styles.milestoneDescription
      }
    }, t('noScheduleSet')));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...containerStyle,
      padding: '20px'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      ...styles.milestoneDescription,
      textAlign: 'center',
      borderBottom: `2px solid ${effDivColor}`,
      paddingBottom: '10px',
      marginBottom: '10px',
      color: effHColor
    }
  }, t('streamSchedule')), /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: 'calc(100vh - 80px)',
      overflowY: 'auto'
    }
  }, items.map(item => {
    const date = new Date(item.time);
    const timeDisplay = isNaN(date.getTime()) ? item.time : date.toLocaleString(undefined, {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit'
    });
    return /*#__PURE__*/React.createElement("div", {
      key: item.id,
      style: {
        display: 'flex',
        gap: '15px',
        padding: '8px 5px',
        borderBottom: `1px dashed ${effDivColor}`,
        opacity: item.isDone ? 0.6 : 1,
        textDecoration: item.isDone ? 'line-through' : 'none',
        transition: 'opacity 0.3s ease, text-decoration 0.3s ease',
        alignItems: 'baseline',
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: effTimeColor,
        flexShrink: 0,
        minWidth: '160px',
        whiteSpace: 'nowrap',
        fontFamily
      }
    }, timeDisplay), /*#__PURE__*/React.createElement("span", {
      style: {
        color: textColor,
        flexGrow: 1,
        fontFamily
      }
    }, item.description));
  })));
};
const SponsorOverlay = ({
  sponsors,
  styles,
  animationDuration = 5,
  t
}) => {
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
    return /*#__PURE__*/React.createElement("div", {
      style: {
        ...containerStyle,
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        ...styles.label,
        opacity: 0.5
      }
    }, t('noSponsorsAdded')));
  }
  const currentSponsor = sponsors[index];
  return /*#__PURE__*/React.createElement("div", {
    style: {
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
    }
  }, /*#__PURE__*/React.createElement("img", {
    key: currentSponsor.id,
    src: currentSponsor.imageUrl,
    alt: currentSponsor.name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      animation: 'fadeIn 1s ease-in-out'
    }
  }));
};
const TextOverlay = ({
  filename,
  customText,
  styles,
  fontFamily,
  textColor,
  accentColor1,
  highlightColor,
  alignment = 'top-left',
  fontSize = 1.5,
  t
}) => {
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
      const url = filename.startsWith('http://') || filename.startsWith('https://') ? filename : `/api/read-text/${filename}`;
      fetch(url).then(res => {
        if (res.ok) return res.text();
        throw new Error('Failed to read file');
      }).then(text => setContent(text)).catch(err => {
        console.error(err);
        setContent(t ? t('errorLoadingFile', {
          filename
        }) : `Error loading ${filename}`);
      });
    };
    fetchText();
    const interval = setInterval(fetchText, 3000);
    return () => clearInterval(interval);
  }, [filename, customText]);
  const getAlignmentStyles = () => {
    const style = {
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
  return /*#__PURE__*/React.createElement("div", {
    style: {
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
    }
  }, /*#__PURE__*/React.createElement("pre", {
    style: {
      whiteSpace: 'pre-wrap',
      textAlign: alignStyle.textAlign,
      fontSize: `${fontSize}rem`,
      margin: 0,
      color: effTextHighlightColor,
      fontFamily: fontFamily,
      // Ensure pre tag uses the theme font
      maxWidth: '100%',
      maxHeight: '100%',
      overflow: 'auto'
    }
  }, content));
};
const Confetti = ({
  colors,
  triggerKey,
  duration,
  debug = false
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const requestRef = useRef(0);
  const startTimeRef = useRef(0);
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
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      const startY = -Math.random() * 150 - 50;
      const totalDistance = height - startY + 50;
      const pDuration = duration * 1000 * (0.5 + Math.random() * 0.5);
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
    const animate = time => {
      const elapsed = time - startTimeRef.current;
      if (elapsed > duration * 1000) {
        ctx.clearRect(0, 0, width, height);
        return;
      }
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        const currentY = p.startY + p.speed * elapsed;
        if (currentY > height + 50) return;
        const currentOsc = p.oscillationPhase + p.oscillationSpeed * elapsed;
        const currentRot = p.rotation + p.rotationSpeed * elapsed;
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
  return /*#__PURE__*/React.createElement("div", {
    ref: containerRef,
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 9998
    }
  }, /*#__PURE__*/React.createElement("canvas", {
    ref: canvasRef
  }));
};
const CelebrationOverlay = ({
  playSound,
  accentColor1,
  accentColor2,
  primaryColor,
  secondaryColor,
  successColor,
  celebrationDuration,
  activeCelebrationKey
}) => {
  const c1 = primaryColor || accentColor1;
  const c2 = secondaryColor || accentColor2;
  const colors = useMemo(() => [c1, c2, successColor], [c1, c2, successColor]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100vw',
      height: '100vh',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(Confetti, {
    colors: colors,
    triggerKey: activeCelebrationKey,
    duration: celebrationDuration
  }));
};

// === QR CODE COMPONENTS ===

const QRCodeSvg = ({
  url,
  size = 200,
  fgColor = '#000000',
  bgColor = '#ffffff',
  margin = 2,
  errorCorrectionLevel = 'M',
  title = ''
}) => {
  const {
    pathD,
    moduleCount
  } = useMemo(() => {
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
      return {
        pathD: d.trim(),
        moduleCount: count
      };
    } catch (e) {
      console.error('Error generating QR matrix:', e);
      return {
        pathD: '',
        moduleCount: 0
      };
    }
  }, [url, size, margin, errorCorrectionLevel]);
  if (!pathD) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bgColor,
        color: fgColor,
        fontSize: '0.8rem',
        padding: '10px',
        textAlign: 'center'
      }
    }, "Invalid URL");
  }
  const isTransparent = !bgColor || bgColor === 'transparent';
  return /*#__PURE__*/React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: `0 0 ${size} ${size}`,
    width: size,
    height: size,
    style: {
      display: 'block',
      maxWidth: '100%',
      height: 'auto'
    },
    shapeRendering: "crispEdges",
    role: "img",
    "aria-label": title || `QR Code for ${url}`
  }, !isTransparent && /*#__PURE__*/React.createElement("rect", {
    width: size,
    height: size,
    fill: bgColor
  }), /*#__PURE__*/React.createElement("path", {
    d: pathD,
    fill: fgColor
  }));
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
}) => {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
      padding: '20px',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      backgroundColor: isTransparent ? 'transparent' : panelColor,
      border: isTransparent ? 'none' : `3px solid ${panelBorderColor || accentColor1}`,
      borderRadius: '12px',
      padding: '24px 28px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '14px',
      boxShadow: isTransparent ? 'none' : '0 10px 30px rgba(0,0,0,0.6)',
      maxWidth: '90%',
      boxSizing: 'border-box'
    }
  }, title && /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      color: accentColor1 || textColor,
      fontFamily: fontFamily,
      fontSize: '1.25rem',
      textAlign: 'center',
      letterSpacing: '1px',
      textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px',
      backgroundColor: isTransparent ? 'transparent' : bgColor || '#ffffff',
      borderRadius: '8px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: isTransparent ? 'none' : '0 4px 12px rgba(0,0,0,0.25)'
    }
  }, /*#__PURE__*/React.createElement(QRCodeSvg, {
    url: url,
    size: size || 220,
    fgColor: fgColor || '#000000',
    bgColor: isTransparent ? 'transparent' : bgColor || '#ffffff',
    title: title || 'Extra Life Donation QR Code'
  })), subtitle && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: textColor,
      fontFamily: fontFamily,
      fontSize: '0.8rem',
      opacity: 0.85,
      textAlign: 'center',
      maxWidth: '260px',
      lineHeight: 1.4
    }
  }, subtitle)));
};
const CollapsibleSection = ({
  title,
  children,
  isInitiallyCollapsed = true,
  styles
}) => {
  const [isCollapsed, setIsCollapsed] = useState(isInitiallyCollapsed);
  const contentRef = useRef(null);
  const uniqueId = `section-content-${title.replace(/\s+/g, '-')}`;
  return /*#__PURE__*/React.createElement("div", {
    style: styles.collapsibleContainer
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      padding: 0
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setIsCollapsed(!isCollapsed),
    style: styles.collapsibleHeader,
    "aria-expanded": !isCollapsed,
    "aria-controls": uniqueId
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...styles.collapsibleChevron,
      transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)'
    }
  }, "▸"), title)), /*#__PURE__*/React.createElement("div", {
    ref: contentRef,
    id: uniqueId,
    style: {
      ...styles.collapsibleContent,
      maxHeight: isCollapsed ? '0' : '1200px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }
  }, children)));
};
export { NextMilestoneOverlay, TeamHeaderOverlay, TeamOverlay, TeamDonationsOverlay, TeamDashboardView, ScheduleOverlay, SponsorOverlay, TextOverlay, Confetti, CelebrationOverlay, QRCodeSvg, QRCodeOverlay, CollapsibleSection };