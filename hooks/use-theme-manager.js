/**
 * =============================================================================
 * EXTRA LIFE TRACKER - USE THEME MANAGER HOOK
 * =============================================================================
 * Handles built-in theme presets, custom theme profile persistence,
 * theme profile creation, updating, deletion, and exports.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { COLOR_PRESETS, findMatchingPreset } from '../constants.js';
import { loadStoredThemes, saveStoredThemes } from '../storage.js';

export function useThemeManager({ config, updateConfig, t, setFormError }) {
  const [savedThemes, setSavedThemes] = useState(loadStoredThemes);
  const [selectedPreset, setSelectedPreset] = useState(config.theme || 'neon-vibe');
  const [newThemeNameInput, setNewThemeNameInput] = useState('');
  const [themeActionFeedback, setThemeActionFeedback] = useState(null);
  const [showAdvancedColors, setShowAdvancedColors] = useState(false);

  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Sync selectedPreset when colors or theme changes
  useEffect(() => {
    if (config.theme && config.theme !== 'custom') {
      setSelectedPreset(config.theme);
      return;
    }
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
          th.colors && th.colors[ck] === currentColors[ck]
        );
      });
      if (matchingSaved) {
        setSelectedPreset(`profile:${matchingSaved.id}`);
      } else {
        setSelectedPreset('custom');
      }
    }
  }, [
    config.theme,
    config.backgroundColor,
    config.textColor,
    config.panelColor,
    config.panelBorderColor,
    config.accentColor1,
    config.accentColor2,
    config.successColor,
    config.errorColor,
    config.buttonTextColor,
    savedThemes
  ]);

  // Handle Preset dropdown change
  const handlePresetChange = useCallback((e) => {
    const presetKey = e.target.value;
    setSelectedPreset(presetKey);

    if (presetKey.startsWith('profile:')) {
      const profileId = presetKey.replace('profile:', '');
      const found = savedThemes.find(t => t.id === profileId);
      if (found) {
        updateConfig({
          theme: presetKey,
          ...found.colors,
          ...(found.fontFamily ? { fontFamily: found.fontFamily } : {}),
          ...(found.notificationAnimation ? { notificationAnimation: found.notificationAnimation } : {})
        });
      }
    } else if (presetKey !== 'custom') {
      const preset = COLOR_PRESETS[presetKey];
      if (preset) {
        updateConfig({
          theme: presetKey,
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
          inputBorderColor: ''
        });
      }
    } else {
      updateConfig({ theme: 'custom' });
    }
  }, [savedThemes, updateConfig]);

  // Save current palette as a new custom theme
  const handleSaveThemeProfile = useCallback(() => {
    const trimmed = newThemeNameInput.trim();
    if (!trimmed) {
      setFormError?.(t('enterThemeName'));
      return;
    }
    setFormError?.('');
    const currentConf = configRef.current;
    const newProfile = {
      id: `theme-${Date.now()}`,
      name: trimmed,
      colors: {
        backgroundColor: currentConf.backgroundColor,
        textColor: currentConf.textColor,
        panelColor: currentConf.panelColor,
        panelBorderColor: currentConf.panelBorderColor,
        accentColor1: currentConf.accentColor1,
        accentColor2: currentConf.accentColor2,
        successColor: currentConf.successColor,
        errorColor: currentConf.errorColor,
        buttonTextColor: currentConf.buttonTextColor,
        headerColor: currentConf.headerColor,
        secondaryTextColor: currentConf.secondaryTextColor,
        primaryButtonBgColor: currentConf.primaryButtonBgColor,
        secondaryButtonBgColor: currentConf.secondaryButtonBgColor,
        dividerColor: currentConf.dividerColor,
        highlightColor: currentConf.highlightColor,
        donorNameColor: currentConf.donorNameColor,
        progressBarColor: currentConf.progressBarColor,
        progressBarBgColor: currentConf.progressBarBgColor,
        progressBarTextColor: currentConf.progressBarTextColor,
        progressBarBorderColor: currentConf.progressBarBorderColor,
        splitMilestoneColors: currentConf.splitMilestoneColors,
        milestoneProgressBarColor: currentConf.milestoneProgressBarColor,
        milestoneProgressBarBgColor: currentConf.milestoneProgressBarBgColor,
        milestoneProgressBarTextColor: currentConf.milestoneProgressBarTextColor,
        milestoneProgressBarBorderColor: currentConf.milestoneProgressBarBorderColor,
        toastBgColor: currentConf.toastBgColor,
        toastBorderColor: currentConf.toastBorderColor,
        toastNameColor: currentConf.toastNameColor,
        toastAmountColor: currentConf.toastAmountColor,
        inputBgColor: currentConf.inputBgColor,
        inputBorderColor: currentConf.inputBorderColor
      },
      fontFamily: currentConf.fontFamily,
      notificationAnimation: currentConf.notificationAnimation
    };

    const updatedThemes = [...savedThemes, newProfile];
    setSavedThemes(updatedThemes);
    saveStoredThemes(updatedThemes);

    const presetKey = `profile:${newProfile.id}`;
    setSelectedPreset(presetKey);
    updateConfig({ theme: presetKey });
    setNewThemeNameInput('');
    setThemeActionFeedback(t('themeSavedSuccess'));
    setTimeout(() => setThemeActionFeedback(null), 3000);
  }, [newThemeNameInput, savedThemes, setFormError, t, updateConfig]);

  // Update existing custom theme profile
  const handleUpdateThemeProfile = useCallback(() => {
    if (!selectedPreset.startsWith('profile:')) return;
    const profileId = selectedPreset.replace('profile:', '');
    const currentConf = configRef.current;
    const updatedThemes = savedThemes.map(th => {
      if (th.id === profileId) {
        return {
          ...th,
          colors: {
            backgroundColor: currentConf.backgroundColor,
            textColor: currentConf.textColor,
            panelColor: currentConf.panelColor,
            panelBorderColor: currentConf.panelBorderColor,
            accentColor1: currentConf.accentColor1,
            accentColor2: currentConf.accentColor2,
            successColor: currentConf.successColor,
            errorColor: currentConf.errorColor,
            buttonTextColor: currentConf.buttonTextColor,
            headerColor: currentConf.headerColor,
            secondaryTextColor: currentConf.secondaryTextColor,
            primaryButtonBgColor: currentConf.primaryButtonBgColor,
            secondaryButtonBgColor: currentConf.secondaryButtonBgColor,
            dividerColor: currentConf.dividerColor,
            highlightColor: currentConf.highlightColor,
            donorNameColor: currentConf.donorNameColor,
            progressBarColor: currentConf.progressBarColor,
            progressBarBgColor: currentConf.progressBarBgColor,
            progressBarTextColor: currentConf.progressBarTextColor,
            progressBarBorderColor: currentConf.progressBarBorderColor,
            splitMilestoneColors: currentConf.splitMilestoneColors,
            milestoneProgressBarColor: currentConf.milestoneProgressBarColor,
            milestoneProgressBarBgColor: currentConf.milestoneProgressBarBgColor,
            milestoneProgressBarTextColor: currentConf.milestoneProgressBarTextColor,
            milestoneProgressBarBorderColor: currentConf.milestoneProgressBarBorderColor,
            toastBgColor: currentConf.toastBgColor,
            toastBorderColor: currentConf.toastBorderColor,
            toastNameColor: currentConf.toastNameColor,
            toastAmountColor: currentConf.toastAmountColor,
            inputBgColor: currentConf.inputBgColor,
            inputBorderColor: currentConf.inputBorderColor
          },
          fontFamily: currentConf.fontFamily,
          notificationAnimation: currentConf.notificationAnimation
        };
      }
      return th;
    });

    setSavedThemes(updatedThemes);
    saveStoredThemes(updatedThemes);
    updateConfig({ theme: selectedPreset });
    setThemeActionFeedback(t('themeUpdatedSuccess'));
    setTimeout(() => setThemeActionFeedback(null), 3000);
  }, [savedThemes, selectedPreset, t, updateConfig]);

  // Delete theme profile
  const handleDeleteThemeProfile = useCallback((profileIdToDelete) => {
    const targetId = profileIdToDelete || (selectedPreset.startsWith('profile:') ? selectedPreset.replace('profile:', '') : null);
    if (!targetId) return;
    const updatedThemes = savedThemes.filter(th => th.id !== targetId);
    setSavedThemes(updatedThemes);
    saveStoredThemes(updatedThemes);
    if (selectedPreset === `profile:${targetId}`) {
      setSelectedPreset('custom');
      updateConfig({ theme: 'custom' });
    }
    setThemeActionFeedback(t('themeDeletedSuccess'));
    setTimeout(() => setThemeActionFeedback(null), 3000);
  }, [savedThemes, selectedPreset, t, updateConfig]);

  // Apply saved theme
  const handleLoadSavedTheme = useCallback((theme) => {
    if (!theme) return;
    const presetKey = `profile:${theme.id}`;
    setSelectedPreset(presetKey);
    updateConfig({
      theme: presetKey,
      ...theme.colors,
      ...(theme.fontFamily ? { fontFamily: theme.fontFamily } : {}),
      ...(theme.notificationAnimation ? { notificationAnimation: theme.notificationAnimation } : {})
    });
  }, [updateConfig]);

  const handleExportThemeProfile = useCallback((themeToExport) => {
    let targetProfile = themeToExport;
    if (!targetProfile) {
      if (selectedPreset.startsWith('profile:')) {
        const profileId = selectedPreset.replace('profile:', '');
        targetProfile = savedThemes.find(th => th.id === profileId);
      }
    }

    if (!targetProfile) {
      const currentConf = configRef.current;
      const currentName = newThemeNameInput.trim() || 'Custom Theme';
      targetProfile = {
        id: `theme-${Date.now()}`,
        name: currentName,
        colors: {
          backgroundColor: currentConf.backgroundColor,
          textColor: currentConf.textColor,
          panelColor: currentConf.panelColor,
          panelBorderColor: currentConf.panelBorderColor,
          accentColor1: currentConf.accentColor1,
          accentColor2: currentConf.accentColor2,
          successColor: currentConf.successColor,
          errorColor: currentConf.errorColor,
          buttonTextColor: currentConf.buttonTextColor,
          headerColor: currentConf.headerColor,
          secondaryTextColor: currentConf.secondaryTextColor,
          primaryButtonBgColor: currentConf.primaryButtonBgColor,
          secondaryButtonBgColor: currentConf.secondaryButtonBgColor,
          dividerColor: currentConf.dividerColor,
          highlightColor: currentConf.highlightColor,
          donorNameColor: currentConf.donorNameColor,
          progressBarColor: currentConf.progressBarColor,
          progressBarBgColor: currentConf.progressBarBgColor,
          progressBarTextColor: currentConf.progressBarTextColor,
          progressBarBorderColor: currentConf.progressBarBorderColor,
          splitMilestoneColors: currentConf.splitMilestoneColors,
          milestoneProgressBarColor: currentConf.milestoneProgressBarColor,
          milestoneProgressBarBgColor: currentConf.milestoneProgressBarBgColor,
          milestoneProgressBarTextColor: currentConf.milestoneProgressBarTextColor,
          milestoneProgressBarBorderColor: currentConf.milestoneProgressBarBorderColor,
          toastBgColor: currentConf.toastBgColor,
          toastBorderColor: currentConf.toastBorderColor,
          toastNameColor: currentConf.toastNameColor,
          toastAmountColor: currentConf.toastAmountColor,
          inputBgColor: currentConf.inputBgColor,
          inputBorderColor: currentConf.inputBorderColor,
        },
        fontFamily: currentConf.fontFamily,
        notificationAnimation: currentConf.notificationAnimation
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
  }, [newThemeNameInput, savedThemes, selectedPreset, t]);

  const handleExportAllThemes = useCallback(() => {
    if (savedThemes.length === 0) {
      setFormError?.(t('noThemesToExport'));
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
  }, [savedThemes, setFormError, t]);

  const handleImportThemeProfile = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError?.('');

    const fallbackName = file.name ? file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ') : 'Imported Theme';

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        const parsed = JSON.parse(content);

        let candidateThemes = [];
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
          setFormError?.(t('themeImportError'));
          return;
        }

        const existingIds = new Set(savedThemes.map(s => s.id));
        const newProfiles = [];

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

          const cleanedColors = {
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
          setFormError?.(t('themeImportError'));
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
        setFormError?.(t('themeImportError'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [savedThemes, setFormError, t, updateConfig]);

  const handleResetProgressBarColors = useCallback(() => {
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
  }, [updateConfig]);

  const handleResetAdvancedColors = useCallback(() => {
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
  }, [updateConfig]);

  return {
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
  };
}
