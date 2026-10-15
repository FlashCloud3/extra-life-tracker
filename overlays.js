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

// ==========================================
// ANNUAL PROGRESS GRAPH COMPONENT
// ==========================================

const AnnualProgressGraph = ({
  styles,
  config,
  donations = [],
  milestones = [],
  goal = 0,
  totalRaised = 0,
  currencyPrefix = '$',
  convertAmount = a => a,
  t,
  entityName = '',
  isTeam = false,
  effHighlightColor = '#00ffff',
  effHeaderColor = '#00ffff',
  effSecondaryTextColor = '#a0a0a0',
  effDividerColor = '#333333',
  effPrimaryButtonBgColor = '#ff00ff',
  effSecondaryButtonBgColor = '#333333',
  hexToRgba = (h, a) => h,
  isInitiallyCollapsed = true,
  isOverlay = false,
  isTransparent = false
}) => {
  const currentYear = new Date().getFullYear();
  const [isCollapsed, setIsCollapsed] = useState(isOverlay ? false : isInitiallyCollapsed);

  // Automatically derive campaign year from donation timestamps or default to current year
  const campaignYear = useMemo(() => {
    if (donations && donations.length > 0) {
      for (const d of donations) {
        if (d?.createdDateUTC) {
          const yr = new Date(d.createdDateUTC).getFullYear();
          if (!isNaN(yr) && yr > 2000 && yr < 2100) return yr;
        }
      }
    }
    return currentYear;
  }, [donations, currentYear]);
  const [viewMode, setViewMode] = useState('cumulative');
  const [showMilestones, setShowMilestones] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Filter & sort donations chronologically (oldest to newest)
  const sortedYearDonations = useMemo(() => {
    return (donations || []).filter(d => Boolean(d?.createdDateUTC)).sort((a, b) => new Date(a.createdDateUTC).getTime() - new Date(b.createdDateUTC).getTime());
  }, [donations]);

  // Year Total
  const yearTotalAmount = useMemo(() => {
    return sortedYearDonations.reduce((acc, d) => acc + convertAmount(d.amount || 0), 0);
  }, [sortedYearDonations, convertAmount]);

  // 12-month breakdown
  const monthlyData = useMemo(() => {
    const months = Array.from({
      length: 12
    }, (_, i) => {
      const d = new Date(campaignYear, i, 1);
      return {
        monthIndex: i,
        name: d.toLocaleString(config.language === 'fr' ? 'fr-FR' : 'en-US', {
          month: 'short'
        }),
        fullName: d.toLocaleString(config.language === 'fr' ? 'fr-FR' : 'en-US', {
          month: 'long'
        }),
        amount: 0,
        count: 0
      };
    });
    sortedYearDonations.forEach(d => {
      const dt = new Date(d.createdDateUTC);
      const m = dt.getMonth();
      if (m >= 0 && m < 12) {
        months[m].amount += convertAmount(d.amount || 0);
        months[m].count += 1;
      }
    });
    return months;
  }, [sortedYearDonations, convertAmount, config.language, campaignYear]);

  // Top month
  const topMonth = useMemo(() => {
    let top = monthlyData[0];
    monthlyData.forEach(m => {
      if (m.amount > top.amount) top = m;
    });
    return top.amount > 0 ? top : null;
  }, [monthlyData]);

  // Milestones list
  const effectiveMilestones = useMemo(() => {
    let list = [];
    if (milestones && milestones.length > 0) {
      list = milestones.map(m => ({
        milestoneID: m.milestoneID,
        fundraisingGoal: m.fundraisingGoal,
        description: m.description || `Milestone ${currencyPrefix}${convertAmount(m.fundraisingGoal).toFixed(0)}`
      }));
    } else if (goal > 0) {
      list = [{
        milestoneID: 'm25',
        fundraisingGoal: Math.round(goal * 0.25),
        description: '25% Goal'
      }, {
        milestoneID: 'm50',
        fundraisingGoal: Math.round(goal * 0.50),
        description: '50% Halfway'
      }, {
        milestoneID: 'm75',
        fundraisingGoal: Math.round(goal * 0.75),
        description: '75% Stretch'
      }, {
        milestoneID: 'm100',
        fundraisingGoal: goal,
        description: t('campaignGoal')
      }];
    }
    if (goal > 0 && !list.some(m => Math.abs(m.fundraisingGoal - goal) < 1)) {
      list.push({
        milestoneID: 'goal',
        fundraisingGoal: goal,
        description: t('campaignGoal')
      });
    }
    return list.sort((a, b) => a.fundraisingGoal - b.fundraisingGoal);
  }, [milestones, goal, currencyPrefix, convertAmount, t]);

  // Timeline points & milestone hit calculation
  const {
    timelinePoints,
    milestoneHits
  } = useMemo(() => {
    let running = 0;
    const pts = [];
    const hits = new Map();
    sortedYearDonations.forEach(d => {
      const prev = running;
      const amt = convertAmount(d.amount || 0);
      running += amt;
      const dDate = new Date(d.createdDateUTC);
      const newlyUnlocked = [];
      effectiveMilestones.forEach(m => {
        const mGoal = convertAmount(m.fundraisingGoal);
        const mKey = m.milestoneID || String(m.fundraisingGoal);
        if (prev < mGoal && running >= mGoal && !hits.has(mKey)) {
          hits.set(mKey, {
            milestone: m,
            hitDate: dDate,
            donation: d,
            cumulativeTotal: running
          });
          newlyUnlocked.push(m);
        }
      });
      pts.push({
        date: dDate,
        timestamp: dDate.getTime(),
        amount: amt,
        cumulativeTotal: running,
        donation: d,
        unlockedMilestones: newlyUnlocked
      });
    });
    return {
      timelinePoints: pts,
      milestoneHits: hits
    };
  }, [sortedYearDonations, convertAmount, effectiveMilestones]);

  // Next milestone
  const currentTotalCalculated = Math.max(yearTotalAmount, totalRaised > 0 ? convertAmount(totalRaised) : 0);
  const nextMilestone = useMemo(() => {
    return effectiveMilestones.find(m => convertAmount(m.fundraisingGoal) > currentTotalCalculated) || null;
  }, [effectiveMilestones, currentTotalCalculated, convertAmount]);

  // SVG Chart Geometry
  const svgW = 840;
  const svgH = 340;
  const padL = 75;
  const padR = 150;
  const padT = 35;
  const padB = 45;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;
  const maxMilestoneVal = effectiveMilestones.length > 0 ? Math.max(...effectiveMilestones.map(m => convertAmount(m.fundraisingGoal))) : 0;
  const goalVal = convertAmount(goal || 0);
  const ceiling = Math.max(currentTotalCalculated, goalVal, maxMilestoneVal, 100);
  const maxY = Math.ceil(ceiling * 1.15 / 50) * 50 || 100;
  const yearStart = new Date(campaignYear, 0, 1).getTime();
  const yearEnd = new Date(campaignYear, 11, 31, 23, 59, 59).getTime();
  const getX = tMs => {
    const frac = Math.max(0, Math.min(1, (tMs - yearStart) / Math.max(1, yearEnd - yearStart)));
    return padL + frac * plotW;
  };
  const getY = val => {
    const frac = Math.max(0, Math.min(1, val / maxY));
    return padT + plotH - frac * plotH;
  };

  // Gridlines
  const gridSteps = 4;
  const gridLines = Array.from({
    length: gridSteps + 1
  }, (_, i) => {
    const val = maxY / gridSteps * i;
    return {
      val,
      y: getY(val)
    };
  });

  // Cumulative Paths
  const {
    linePath,
    areaPath
  } = useMemo(() => {
    if (timelinePoints.length === 0) {
      return {
        linePath: '',
        areaPath: ''
      };
    }
    const startX = padL;
    const startY = padT + plotH;
    let pathD = `M ${startX} ${startY}`;
    let lastX = startX;
    let lastY = startY;
    timelinePoints.forEach(pt => {
      const x = getX(pt.timestamp);
      const y = getY(pt.cumulativeTotal);
      pathD += ` L ${x} ${y}`;
      lastX = x;
      lastY = y;
    });

    // If within current year, extend line horizontally to current date
    const now = Date.now();
    if (now > yearStart && now < yearEnd) {
      const todayX = getX(now);
      if (todayX > lastX) {
        pathD += ` L ${todayX} ${lastY}`;
        lastX = todayX;
      }
    }
    const areaD = `${pathD} L ${lastX} ${padT + plotH} L ${startX} ${padT + plotH} Z`;
    return {
      linePath: pathD,
      areaPath: areaD
    };
  }, [timelinePoints, yearStart, yearEnd, padL, padT, plotH]);

  // Unique Grad ID for Theme
  const gradId = useMemo(() => `annualProgressGrad_${Math.random().toString(36).substr(2, 9)}`, []);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...styles.card,
      backgroundColor: isTransparent ? 'transparent' : styles.card?.backgroundColor || config.panelColor,
      border: isTransparent ? isOverlay ? `1px solid ${hexToRgba(effHighlightColor, 0.4)}` : 'none' : `2px solid ${effHighlightColor}`,
      boxShadow: isOverlay && !isTransparent ? '0 8px 32px rgba(0,0,0,0.5)' : 'none',
      borderRadius: isOverlay ? '8px' : 0,
      padding: isOverlay ? '16px 20px' : styles.card?.padding || '15px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: isCollapsed ? '0' : '14px',
      width: '100%',
      position: 'relative',
      fontFamily: config.fontFamily
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '12px',
      borderBottom: isCollapsed ? 'none' : `1px dashed ${effDividerColor}`,
      paddingBottom: isCollapsed ? '0' : '10px',
      cursor: isOverlay ? 'default' : 'pointer',
      userSelect: 'none',
      width: '100%'
    },
    onClick: () => !isOverlay && setIsCollapsed(prev => !prev)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexWrap: 'wrap'
    }
  }, !isOverlay && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '1rem',
      color: effHighlightColor,
      transition: 'transform 0.2s ease-in-out',
      transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
      display: 'inline-block'
    }
  }, "▸"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '1.2rem'
    }
  }, "📈"), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      color: effHeaderColor,
      fontSize: '1.1rem',
      letterSpacing: '0.5px'
    }
  }, t('annualProgress')), entityName && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.75rem',
      backgroundColor: hexToRgba(effHighlightColor, 0.15),
      color: effHighlightColor,
      padding: '2px 8px',
      border: `1px solid ${hexToRgba(effHighlightColor, 0.3)}`,
      fontWeight: 'bold'
    }
  }, entityName), isCollapsed && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.8rem',
      color: config.successColor,
      fontWeight: 'bold',
      marginLeft: '4px'
    }
  }, "• ", currencyPrefix, yearTotalAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: effSecondaryTextColor,
      fontWeight: 'normal',
      marginLeft: '6px'
    }
  }, "(", milestoneHits.size, "/", effectiveMilestones.length, " ", t('milestonesAchieved'), ")"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexWrap: 'wrap'
    },
    onClick: e => e.stopPropagation()
  }, !isCollapsed && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      backgroundColor: hexToRgba(config.backgroundColor, 0.6),
      borderRadius: '4px',
      padding: '2px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setViewMode('cumulative'),
    style: {
      ...styles.button,
      margin: 0,
      padding: '5px 10px',
      fontSize: '0.72rem',
      backgroundColor: viewMode === 'cumulative' ? effPrimaryButtonBgColor : 'transparent',
      color: viewMode === 'cumulative' ? config.buttonTextColor : config.textColor,
      border: 'none',
      borderRadius: '3px'
    }
  }, "📈 ", t('cumulativeGrowth')), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setViewMode('monthly'),
    style: {
      ...styles.button,
      margin: 0,
      padding: '5px 10px',
      fontSize: '0.72rem',
      backgroundColor: viewMode === 'monthly' ? effPrimaryButtonBgColor : 'transparent',
      color: viewMode === 'monthly' ? config.buttonTextColor : config.textColor,
      border: 'none',
      borderRadius: '3px'
    }
  }, "📊 ", t('monthlyBreakdown'))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setShowMilestones(prev => !prev),
    style: {
      ...styles.button,
      margin: 0,
      padding: '5px 10px',
      fontSize: '0.72rem',
      backgroundColor: showMilestones ? hexToRgba(config.successColor, 0.25) : config.panelColor,
      border: `1px solid ${showMilestones ? config.successColor : effDividerColor}`,
      color: showMilestones ? config.successColor : effSecondaryTextColor,
      borderRadius: '4px'
    }
  }, "🎯 ", t('milestonesToggle'), ": ", showMilestones ? 'ON' : 'OFF')), !isOverlay && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setIsCollapsed(prev => !prev),
    style: {
      ...styles.button,
      margin: 0,
      padding: '5px 12px',
      fontSize: '0.75rem',
      backgroundColor: isCollapsed ? effPrimaryButtonBgColor : config.panelColor,
      color: isCollapsed ? config.buttonTextColor : config.textColor,
      border: `1px solid ${isCollapsed ? effHighlightColor : effDividerColor}`,
      borderRadius: '4px'
    }
  }, isCollapsed ? `▸ ${t('showGraph')}` : `▾ ${t('hideGraph')}`))), !isCollapsed && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: '10px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      backgroundColor: hexToRgba(config.panelColor, 0.6),
      border: `1px solid ${hexToRgba(config.panelBorderColor, 0.3)}`,
      padding: '10px 12px',
      borderRadius: '6px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.75rem',
      color: effSecondaryTextColor,
      display: 'block',
      textTransform: 'uppercase'
    }
  }, "💰 ", t('totalAtTime')), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '1.2rem',
      fontWeight: 'bold',
      color: config.successColor,
      marginTop: '2px',
      display: 'block'
    }
  }, currencyPrefix, yearTotalAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      backgroundColor: hexToRgba(config.panelColor, 0.6),
      border: `1px solid ${hexToRgba(config.panelBorderColor, 0.3)}`,
      padding: '10px 12px',
      borderRadius: '6px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.75rem',
      color: effSecondaryTextColor,
      display: 'block',
      textTransform: 'uppercase'
    }
  }, "🎯 ", t('milestonesAchieved')), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '1.2rem',
      fontWeight: 'bold',
      color: effHighlightColor,
      marginTop: '2px',
      display: 'block'
    }
  }, milestoneHits.size, " / ", effectiveMilestones.length, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.75rem',
      opacity: 0.8,
      marginLeft: '6px',
      color: effSecondaryTextColor
    }
  }, "(", effectiveMilestones.length > 0 ? Math.round(milestoneHits.size / effectiveMilestones.length * 100) : 0, "%)"))), /*#__PURE__*/React.createElement("div", {
    style: {
      backgroundColor: hexToRgba(config.panelColor, 0.6),
      border: `1px solid ${hexToRgba(config.panelBorderColor, 0.3)}`,
      padding: '10px 12px',
      borderRadius: '6px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.75rem',
      color: effSecondaryTextColor,
      display: 'block',
      textTransform: 'uppercase'
    }
  }, "🚀 ", t('nextMilestone')), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.9rem',
      fontWeight: 'bold',
      color: nextMilestone ? config.accentColor1 || '#ff00ff' : config.successColor,
      marginTop: '2px',
      display: 'block',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, nextMilestone ? `${currencyPrefix}${(convertAmount(nextMilestone.fundraisingGoal) - currentTotalCalculated).toFixed(0)} to ${nextMilestone.description.slice(0, 18)}` : t('allMilestonesReached'))), /*#__PURE__*/React.createElement("div", {
    style: {
      backgroundColor: hexToRgba(config.panelColor, 0.6),
      border: `1px solid ${hexToRgba(config.panelBorderColor, 0.3)}`,
      padding: '10px 12px',
      borderRadius: '6px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.75rem',
      color: effSecondaryTextColor,
      display: 'block',
      textTransform: 'uppercase'
    }
  }, "📅 ", t('topMonth')), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '1.05rem',
      fontWeight: 'bold',
      color: config.textColor,
      marginTop: '2px',
      display: 'block'
    }
  }, topMonth ? `${topMonth.name} (${currencyPrefix}${topMonth.amount.toFixed(0)})` : '—'))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: '100%',
      backgroundColor: hexToRgba(config.backgroundColor, 0.65),
      border: `1px solid ${hexToRgba(config.panelBorderColor, 0.4)}`,
      borderRadius: '6px',
      overflow: 'visible',
      padding: '8px 4px',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${svgW} ${svgH}`,
    style: {
      width: '100%',
      height: 'auto',
      display: 'block',
      overflow: 'visible'
    },
    onMouseLeave: () => setHoveredPoint(null)
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: gradId,
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: config.successColor || '#00ff00',
    stopOpacity: "0.45"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "60%",
    stopColor: effHighlightColor || '#00ffff',
    stopOpacity: "0.18"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: effHighlightColor || '#00ffff',
    stopOpacity: "0.0"
  })), /*#__PURE__*/React.createElement("filter", {
    id: "glowFilter",
    x: "-20%",
    y: "-20%",
    width: "140%",
    height: "140%"
  }, /*#__PURE__*/React.createElement("feGaussianBlur", {
    stdDeviation: "3",
    result: "blur"
  }), /*#__PURE__*/React.createElement("feComposite", {
    in: "SourceGraphic",
    in2: "blur",
    operator: "over"
  }))), gridLines.map((gl, i) => /*#__PURE__*/React.createElement("g", {
    key: i
  }, /*#__PURE__*/React.createElement("line", {
    x1: padL,
    y1: gl.y,
    x2: padL + plotW,
    y2: gl.y,
    stroke: hexToRgba(config.textColor, 0.12),
    strokeDasharray: "2,4"
  }), /*#__PURE__*/React.createElement("text", {
    x: padL - 10,
    y: gl.y + 4,
    textAnchor: "end",
    fill: effSecondaryTextColor,
    fontSize: "10",
    fontFamily: "monospace"
  }, currencyPrefix, Math.round(gl.val)))), Array.from({
    length: 12
  }, (_, i) => {
    const frac = (i + 0.5) / 12;
    const x = padL + frac * plotW;
    const lineX = padL + i / 12 * plotW;
    const monthLabel = new Date(2026, i, 1).toLocaleString(config.language === 'fr' ? 'fr-FR' : 'en-US', {
      month: 'narrow'
    });
    return /*#__PURE__*/React.createElement("g", {
      key: i
    }, i > 0 && /*#__PURE__*/React.createElement("line", {
      x1: lineX,
      y1: padT,
      x2: lineX,
      y2: padT + plotH,
      stroke: hexToRgba(config.textColor, 0.06)
    }), /*#__PURE__*/React.createElement("text", {
      x: x,
      y: padT + plotH + 20,
      textAnchor: "middle",
      fill: effSecondaryTextColor,
      fontSize: "11",
      fontWeight: "bold",
      fontFamily: config.fontFamily
    }, monthlyData[i]?.name || monthLabel));
  }), showMilestones && effectiveMilestones.map(m => {
    const mVal = convertAmount(m.fundraisingGoal);
    const mY = getY(mVal);
    if (mY < padT - 15 || mY > padT + plotH + 15) return null;
    const mKey = m.milestoneID || String(m.fundraisingGoal);
    const hitInfo = milestoneHits.get(mKey);
    const isHit = Boolean(hitInfo) || currentTotalCalculated >= mVal;
    const lineColor = isHit ? config.successColor || '#00ff00' : config.accentColor1 || '#ff00ff';
    return /*#__PURE__*/React.createElement("g", {
      key: mKey
    }, /*#__PURE__*/React.createElement("line", {
      x1: padL,
      y1: mY,
      x2: padL + plotW,
      y2: mY,
      stroke: lineColor,
      strokeWidth: isHit ? 2 : 1.5,
      strokeDasharray: isHit ? '5,4' : '4,6',
      opacity: isHit ? 0.9 : 0.65
    }), /*#__PURE__*/React.createElement("g", {
      transform: `translate(${padL + plotW + 6}, ${mY - 11})`,
      style: {
        cursor: 'pointer'
      },
      onMouseEnter: e => {
        const rect = e.target.getBoundingClientRect();
        setHoveredPoint({
          x: padL + plotW,
          y: mY,
          date: hitInfo ? hitInfo.hitDate : new Date(),
          cumulativeTotal: mVal,
          milestone: m,
          isMilestoneHit: isHit
        });
      }
    }, /*#__PURE__*/React.createElement("rect", {
      width: "136",
      height: "22",
      rx: "4",
      fill: hexToRgba(lineColor, 0.2),
      stroke: lineColor,
      strokeWidth: "1"
    }), /*#__PURE__*/React.createElement("text", {
      x: "8",
      y: "15",
      fill: lineColor,
      fontSize: "9.5",
      fontWeight: "bold",
      fontFamily: "monospace"
    }, isHit ? '✓' : '🎯', " ", currencyPrefix, mVal.toFixed(0), " - ", m.description.slice(0, 11))));
  }), viewMode === 'cumulative' && /*#__PURE__*/React.createElement(React.Fragment, null, areaPath && /*#__PURE__*/React.createElement("path", {
    d: areaPath,
    fill: `url(#${gradId})`
  }), linePath && /*#__PURE__*/React.createElement("path", {
    d: linePath,
    fill: "none",
    stroke: config.successColor || '#00ff00',
    strokeWidth: "3.5",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    filter: "url(#glowFilter)"
  }), showMilestones && Array.from(milestoneHits.values()).map((hit, idx) => {
    const hitX = getX(hit.hitDate.getTime());
    const hitY = getY(hit.cumulativeTotal);
    return /*#__PURE__*/React.createElement("g", {
      key: `hit-${idx}`
    }, /*#__PURE__*/React.createElement("line", {
      x1: hitX,
      y1: hitY,
      x2: hitX,
      y2: padT + plotH,
      stroke: config.successColor || '#00ff00',
      strokeWidth: "1.5",
      strokeDasharray: "3,3",
      opacity: "0.7"
    }), /*#__PURE__*/React.createElement("g", {
      transform: `translate(${hitX}, ${hitY})`,
      style: {
        cursor: 'pointer'
      },
      onMouseEnter: () => {
        setHoveredPoint({
          x: hitX,
          y: hitY,
          date: hit.hitDate,
          cumulativeTotal: hit.cumulativeTotal,
          amount: convertAmount(hit.donation.amount || 0),
          donor: hit.donation.displayName || t('anonymous'),
          message: hit.donation.message,
          milestone: hit.milestone,
          isMilestoneHit: true
        });
      }
    }, /*#__PURE__*/React.createElement("circle", {
      r: "9",
      fill: config.successColor || '#00ff00',
      opacity: "0.3"
    }), /*#__PURE__*/React.createElement("circle", {
      r: "5",
      fill: "#ffffff",
      stroke: config.successColor || '#00ff00',
      strokeWidth: "2"
    }), /*#__PURE__*/React.createElement("text", {
      x: "0",
      y: "-12",
      textAnchor: "middle",
      fill: "#ffea00",
      fontSize: "12",
      fontWeight: "bold"
    }, "🏆")));
  }), timelinePoints.map((pt, idx) => {
    const ptX = getX(pt.timestamp);
    const ptY = getY(pt.cumulativeTotal);
    return /*#__PURE__*/React.createElement("circle", {
      key: `pt-${idx}`,
      cx: ptX,
      cy: ptY,
      r: "4",
      fill: pt.unlockedMilestones.length > 0 ? '#ffea00' : effHighlightColor || '#00ffff',
      stroke: config.backgroundColor,
      strokeWidth: "1.5",
      style: {
        cursor: 'pointer'
      },
      onMouseEnter: () => {
        setHoveredPoint({
          x: ptX,
          y: ptY,
          date: pt.date,
          cumulativeTotal: pt.cumulativeTotal,
          amount: pt.amount,
          donor: pt.donation?.displayName || t('anonymous'),
          message: pt.donation?.message,
          milestone: pt.unlockedMilestones[0],
          isMilestoneHit: pt.unlockedMilestones.length > 0
        });
      }
    });
  })), viewMode === 'monthly' && /*#__PURE__*/React.createElement(React.Fragment, null, monthlyData.map((m, idx) => {
    const barSlotW = plotW / 12;
    const barW = Math.max(14, barSlotW * 0.72);
    const barX = padL + idx * barSlotW + (barSlotW - barW) / 2;
    const barH = m.amount / maxY * plotH;
    const barY = padT + plotH - barH;
    return /*#__PURE__*/React.createElement("g", {
      key: `bar-${idx}`
    }, /*#__PURE__*/React.createElement("rect", {
      x: barX,
      y: barY,
      width: barW,
      height: Math.max(2, barH),
      rx: "3",
      fill: m.amount > 0 ? config.successColor || '#00ff00' : hexToRgba(config.textColor, 0.1),
      opacity: m.amount > 0 ? 0.85 : 0.4,
      style: {
        cursor: 'pointer'
      },
      onMouseEnter: () => {
        setHoveredPoint({
          x: barX + barW / 2,
          y: barY,
          date: new Date(campaignYear, idx, 15),
          cumulativeTotal: m.amount,
          monthName: m.fullName,
          monthCount: m.count
        });
      }
    }), m.amount > 0 && /*#__PURE__*/React.createElement("text", {
      x: barX + barW / 2,
      y: barY - 6,
      textAnchor: "middle",
      fill: config.textColor,
      fontSize: "9",
      fontWeight: "bold",
      fontFamily: "monospace"
    }, currencyPrefix, Math.round(m.amount)));
  })), sortedYearDonations.length === 0 && /*#__PURE__*/React.createElement("text", {
    x: padL + plotW / 2,
    y: padT + plotH / 2,
    textAnchor: "middle",
    fill: effSecondaryTextColor,
    fontSize: "12",
    fontFamily: config.fontFamily
  }, t('noDonationsThisYear', {
    year: String(campaignYear)
  }))), hoveredPoint && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: `${Math.min(hoveredPoint.x, svgW - 220)}px`,
      top: `${Math.max(10, hoveredPoint.y - 85)}px`,
      backgroundColor: hexToRgba(config.panelColor || '#1a1a1a', 0.95),
      border: `1px solid ${hoveredPoint.isMilestoneHit ? config.successColor : effHighlightColor}`,
      boxShadow: `0 4px 15px rgba(0,0,0,0.7), 0 0 10px ${hexToRgba(hoveredPoint.isMilestoneHit ? config.successColor : effHighlightColor, 0.4)}`,
      borderRadius: '6px',
      padding: '10px 12px',
      pointerEvents: 'none',
      zIndex: 10,
      maxWidth: '260px',
      fontSize: '0.78rem',
      lineHeight: 1.4,
      color: config.textColor,
      fontFamily: config.fontFamily
    }
  }, hoveredPoint.monthName ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 'bold',
      color: effHighlightColor,
      marginBottom: '2px'
    }
  }, "📅 ", hoveredPoint.monthName), /*#__PURE__*/React.createElement("div", null, t('totalAtTime'), ": ", /*#__PURE__*/React.createElement("strong", null, currencyPrefix, hoveredPoint.cumulativeTotal.toFixed(2))), /*#__PURE__*/React.createElement("div", {
    style: {
      color: effSecondaryTextColor
    }
  }, hoveredPoint.monthCount, " ", t('donations'))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.72rem',
      color: effSecondaryTextColor,
      marginBottom: '4px'
    }
  }, "📅 ", hoveredPoint.date?.toLocaleDateString()), hoveredPoint.donor && /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 'bold',
      color: config.textColor
    }
  }, "👤 ", hoveredPoint.donor, ": ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: config.successColor
    }
  }, currencyPrefix, hoveredPoint.amount?.toFixed(2))), /*#__PURE__*/React.createElement("div", null, t('totalAtTime'), ": ", /*#__PURE__*/React.createElement("strong", null, currencyPrefix, hoveredPoint.cumulativeTotal.toFixed(2))), hoveredPoint.milestone && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '6px',
      paddingTop: '6px',
      borderTop: `1px dashed ${effDividerColor}`,
      color: '#ffea00',
      fontWeight: 'bold'
    }
  }, "🏆 ", t('milestoneUnlocked'), ": ", hoveredPoint.milestone.description, " (", currencyPrefix, convertAmount(hoveredPoint.milestone.fundraisingGoal).toFixed(0), ")"), hoveredPoint.message && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '4px',
      fontStyle: 'italic',
      color: effSecondaryTextColor,
      fontSize: '0.72rem'
    }
  }, "\"", hoveredPoint.message.slice(0, 60), hoveredPoint.message.length > 60 ? '...' : '', "\""))))));
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
  milestones = [],
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
  const [teamGraphScope, setTeamGraphScope] = useState('team');

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
      marginBottom: '1.5rem',
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-start',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '10px',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.8rem',
      color: effSecondaryTextColor,
      fontWeight: 'bold'
    }
  }, t('annualProgress'), ":"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setTeamGraphScope('team'),
    style: {
      ...styles.button,
      margin: 0,
      padding: '6px 14px',
      fontSize: '0.78rem',
      backgroundColor: teamGraphScope === 'team' ? effPrimaryButtonBgColor : config.panelColor,
      color: teamGraphScope === 'team' ? config.buttonTextColor : config.textColor,
      border: `1px solid ${teamGraphScope === 'team' ? effHighlightColor : effDividerColor}`,
      borderRadius: '4px'
    }
  }, "👥 ", t('viewEntireTeam'), " (", teamName || 'Team', ")"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setTeamGraphScope('account'),
    style: {
      ...styles.button,
      margin: 0,
      padding: '6px 14px',
      fontSize: '0.78rem',
      backgroundColor: teamGraphScope === 'account' ? effPrimaryButtonBgColor : config.panelColor,
      color: teamGraphScope === 'account' ? config.buttonTextColor : config.textColor,
      border: `1px solid ${teamGraphScope === 'account' ? effHighlightColor : effDividerColor}`,
      borderRadius: '4px'
    }
  }, "👤 ", t('viewActiveMember'), " (", activeAccountName, ")")), teamGraphScope === 'team' ? /*#__PURE__*/React.createElement(AnnualProgressGraph, {
    styles: styles,
    config: config,
    donations: teamDonations,
    milestones: [],
    goal: teamGoal,
    totalRaised: teamTotalRaised,
    currencyPrefix: currencyPrefix,
    convertAmount: convertAmount,
    t: t,
    entityName: teamName || t('entireTeam'),
    isTeam: true,
    effHighlightColor: effHighlightColor,
    effHeaderColor: effHeaderColor,
    effSecondaryTextColor: effSecondaryTextColor,
    effDividerColor: effDividerColor,
    effPrimaryButtonBgColor: effPrimaryButtonBgColor,
    effSecondaryButtonBgColor: effSecondaryButtonBgColor,
    hexToRgba: hexToRgba
  }) : /*#__PURE__*/React.createElement(AnnualProgressGraph, {
    styles: styles,
    config: config,
    donations: rawAccountDonations,
    milestones: activeAccountId === String(participantId) ? milestones : [],
    goal: activeAccountGoal,
    totalRaised: activeAccountTotal,
    currencyPrefix: currencyPrefix,
    convertAmount: convertAmount,
    t: t,
    entityName: activeAccountName,
    isTeam: false,
    effHighlightColor: effHighlightColor,
    effHeaderColor: effHeaderColor,
    effSecondaryTextColor: effSecondaryTextColor,
    effDividerColor: effDividerColor,
    effPrimaryButtonBgColor: effPrimaryButtonBgColor,
    effSecondaryButtonBgColor: effSecondaryButtonBgColor,
    hexToRgba: hexToRgba
  })), /*#__PURE__*/React.createElement("div", {
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
const GraphOverlay = ({
  styles,
  config,
  donations = [],
  milestones = [],
  goal = 0,
  totalRaised = 0,
  currencyPrefix = '$',
  convertAmount = a => a,
  t,
  entityName = '',
  isTeam = false,
  effHighlightColor = '#00ffff',
  effHeaderColor = '#00ffff',
  effSecondaryTextColor = '#a0a0a0',
  effDividerColor = '#333333',
  effPrimaryButtonBgColor = '#ff00ff',
  effSecondaryButtonBgColor = '#333333',
  hexToRgba = (h, a) => h,
  isTransparent = false
}) => {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100vw',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
      padding: '16px',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      maxWidth: '960px',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement(AnnualProgressGraph, {
    styles: styles,
    config: config,
    donations: donations,
    milestones: milestones,
    goal: goal,
    totalRaised: totalRaised,
    currencyPrefix: currencyPrefix,
    convertAmount: convertAmount,
    t: t,
    entityName: entityName,
    isTeam: isTeam,
    effHighlightColor: effHighlightColor,
    effHeaderColor: effHeaderColor,
    effSecondaryTextColor: effSecondaryTextColor,
    effDividerColor: effDividerColor,
    effPrimaryButtonBgColor: effPrimaryButtonBgColor,
    effSecondaryButtonBgColor: effSecondaryButtonBgColor,
    hexToRgba: hexToRgba,
    isInitiallyCollapsed: false,
    isOverlay: true,
    isTransparent: isTransparent
  })));
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
export { NextMilestoneOverlay, TeamHeaderOverlay, TeamOverlay, TeamDonationsOverlay, TeamDashboardView, ScheduleOverlay, SponsorOverlay, TextOverlay, Confetti, CelebrationOverlay, QRCodeSvg, QRCodeOverlay, CollapsibleSection, AnnualProgressGraph, GraphOverlay };