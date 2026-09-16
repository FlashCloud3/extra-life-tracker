import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { io, Socket } from 'socket.io-client';
import tmi from 'tmi.js';

// === LOCALIZATION ===
const translations = {
  en: {
    appTitle: "Extra Life Tracker",
    disconnected: "(Disconnected)",
    showSettings: "Show Settings",
    hideSettings: "Hide Settings",
    coreSetup: "Core Setup",
    language: "Language",
    profile: "Extra Life ID",
    switchProfile: "Load ID",
    participantId: "Participant ID",
    enterId: "Enter Extra Life ID",
    autoDetect: "Auto-detect Team ID",
    teamId: "Team ID",
    refreshSeconds: "Refresh (seconds, min 60)",
    currency: "Currency",
    exchangeRate: "Exchange Rate",
    customExchangeRate: "Custom Exchange Rate Multiplier",
    customRateHelp: "Direct multiplier (leave blank for live rate)",
    websiteTotalLabel: "Or Calculate from Extra Life Website Total (CAD)",
    websiteTotalHelp: "Enter current CAD total shown on Extra Life to auto-calculate rate",
    calculatedRateNotice: "Calculated using your API total of ${usd} USD",
    clearExchangeRate: "Clear Custom Rate",
    refreshRate: "Refresh",
    twitchIntegration: "Twitch Integration",
    twitchEnabled: "Enable Twitch Integration",
    twitchChannel: "Channel Name",
    twitchToken: "OAuth Token (oauth:xxxx)",
    getTwitchToken: "Get OAuth Token",
    twitchEnableAlerts: "Enable Chat Alerts",
    twitchEnableCommands: "Enable Chat Commands",
    chatCommands: "Chat Commands",
    builtinCommands: "Built-in Commands",
    customCommands: "Custom Commands",
    commandTrigger: "Trigger (e.g. !discord)",
    commandResponse: "Response",
    addCommand: "Add Command",
    noCommands: "No custom commands added.",
    eventTiming: "Event & Timing",
    eventStartTime: "Event Start Time",
    celebrationDuration: "Celebration Duration (s)",
    streamSchedule: "Stream Schedule",
    description: "Description",
    addItem: "Add Item",
    undo: "Undo",
    done: "Done",
    delete: "Delete",
    theming: "Theming",
    simple: "Simple",
    advanced: "Advanced",
    fontFamily: "Font Family",
    notificationAnimation: "Notification Animation",
    colorPreset: "Color Preset",
    custom: "Custom",
    background: "Background",
    panel: "Panel",
    text: "Text",
    accent1: "Accent 1",
    accent2: "Accent 2",
    border: "Border",
    success: "Success",
    error: "Error",
    soundSettings: "Paramètres Audio",
    enableSound: "Enable Sound",
    volume: "Volume",
    donationSound: "Donation Sound",
    defaultCoin: "Default Coin",
    milestoneSound: "Milestone Sound",
    defaultFanfare: "Default Fanfare",
    preview: "Preview",
    customSoundLibrary: "Custom Sound Library",
    uploadSound: "Upload Sound",
    uploadNewSound: "Upload New Sound",
    addSoundFromFolder: "Add Sound from App Folder",
    noSoundsFound: "No files found in /sounds folder",
    add: "Add",
    soundFolderHint: "Put audio files in the \"sounds\" folder in your app directory.",
    fileTooLarge: "File too large.",
    sponsors: "Sponsors",
    slideDuration: "Slide Duration (Seconds)",
    noSponsorsAdded: "No sponsors added.",
    addSponsorFromFolder: "Add Sponsor from App Folder",
    noSponsorsFound: "No files found in /sponsors folder",
    sponsorFolderHint: "Put images in the \"sponsors\" folder in your app directory.",
    textOverlay: "Text Overlay",
    selectTextFile: "Select Text File",
    noTextFilesFound: "No files found in /text_files folder",
    textFolderHint: "Put .txt files in the \"text_files\" folder in your app directory.",
    saveSettings: "Save Settings",
    saving: "Saving...",
    overlayLinks: "Overlay Links",
    progressBar: "Progress Bar",
    notifications: "Notifications",
    nextMilestone: "Next Milestone",
    teamTracker: "Team Tracker",
    celebration: "Celebration",
    schedule: "Schedule",
    sponsorsOverlay: "Sponsors",
    textOverlayLink: "Text Display",
    openPopup: "Open Popup",
    copyLink: "Copy Link",
    copied: "Copied!",
    resyncData: "Resync Data",
    testDonation: "Test Don (+$15)",
    clearStop: "Clear & Stop All",
    currentStats: "Current Stats",
    totalRaised: "Total Raised",
    teamRaised: "Team Raised",
    lastDonator: "Last Donator",
    lastFetched: "Last fetched from server",
    justNow: "just now",
    secondsAgo: "{s}s ago",
    minutesAgo: "{m}m ago",
    never: "Never",
    none: "None",
    donated: "donated",
    goalReached: "Fundraising Goal Reached!",
    nextGoal: "Next Goal",
    goal: "Goal",
    teamTotal: "Team Total",
    allMilestonesComplete: "All Milestones Complete!",
    startsIn: "Starts in: ",
    timeElapsed: "Time Elapsed: ",
    anonymous: "Anonymous",
    noScheduleSet: "No schedule set!",
    slideIn: "Slide In",
    fadeIn: "Fade In",
    bounceIn: "Bounce In",
    zoomIn: "Zoom In",
    recentDonations: "Recent Donations",
    noDonations: "No donations yet.",
    textAlignment: "Text Alignment",
    topLeft: "Top Left",
    topCenter: "Top Center",
    topRight: "Top Right",
    centerLeft: "Center Left",
    center: "Center",
    centerRight: "Center Right",
    bottomLeft: "Bottom Left",
    bottomCenter: "Bottom Center",
    bottomRight: "Bottom Right",
    fontSize: "Font Size (rem)",
    welcomeTitle: "Welcome to Extra Life Tracker",
    welcomeSubtitle: "Enter your Participant ID to begin setup.",
    startTracking: "Start Tracking",
    changeId: "Change ID",
    idHint: "This ID will be used to save your settings and overlays.",
    githubPagesMode: "GitHub Pages Mode",
    standaloneMode: "Standalone Client (In-Browser)",
    connectedServer: "Connected to Server",
    connecting: "Connecting...",
    defaultPowerup: "Default Power-Up",
    defaultLaser: "Default Laser Blaster",
    exportConfig: "Export Settings (JSON)",
    importConfig: "Import Settings (JSON)",
    importSuccess: "Settings loaded successfully!",
    importError: "Invalid JSON configuration file.",
    uploadSponsorImage: "Upload Sponsor Logo (File)",
    sponsorUrl: "Or paste Sponsor Image URL",
    addSponsorUrl: "Add URL",
    customText: "Custom Text Content",
    customTextHint: "Type your stream message, notes, or rules directly here. Displays live on the Text Overlay!",
    uploadTextFile: "Upload .txt File",
    directUrl: "Or remote Text URL (e.g. raw GitHub URL)",
    loadUrl: "Fetch Text",
    syncNote: "Running directly from GitHub Pages! Overlays, sounds, and settings sync across browser tabs and OBS sources locally."
  },
  fr: {
    appTitle: "Suivi Extra Life",
    disconnected: "(Déconnecté)",
    showSettings: "Afficher les paramètres",
    hideSettings: "Masquer les paramètres",
    coreSetup: "Configuration principale",
    language: "Langue",
    profile: "ID Extra Life",
    switchProfile: "Charger ID",
    participantId: "ID Participant",
    enterId: "Entrer ID Extra Life",
    autoDetect: "Auto-détecter ID Équipe",
    teamId: "ID Équipe",
    refreshSeconds: "Rafraîchissement (secondes, min 60)",
    currency: "Devise",
    exchangeRate: "Taux de change",
    customExchangeRate: "Multiplicateur de taux personnalisé",
    customRateHelp: "Multiplicateur direct (laisser vide pour le taux en direct)",
    websiteTotalLabel: "Ou calculer via le total du site Extra Life (CAD)",
    websiteTotalHelp: "Entrez le montant CAD sur Extra Life pour calculer le taux",
    calculatedRateNotice: "Calculé avec votre total API de {usd} $ USD",
    clearExchangeRate: "Effacer le taux personnalisé",
    refreshRate: "Actualiser",
    twitchIntegration: "Intégration Twitch",
    twitchEnabled: "Activer Intégration Twitch",
    twitchChannel: "Nom de la chaîne",
    twitchToken: "Jeton OAuth (oauth:xxxx)",
    getTwitchToken: "Obtenir Jeton OAuth",
    twitchEnableAlerts: "Activer les alertes chat",
    twitchEnableCommands: "Activer les commandes chat",
    chatCommands: "Commandes Chat",
    builtinCommands: "Commandes Intégrées",
    customCommands: "Commandes Personnalisées",
    commandTrigger: "Déclencheur (ex: !discord)",
    commandResponse: "Réponse",
    addCommand: "Ajouter Commande",
    noCommands: "Aucune commande personnalisée.",
    eventTiming: "Événement & Timing",
    eventStartTime: "Heure de début",
    celebrationDuration: "Durée Célébration (s)",
    streamSchedule: "Programme du Stream",
    description: "Description",
    addItem: "Ajouter",
    undo: "Annuler",
    done: "Fait",
    delete: "Supprimer",
    theming: "Thème",
    simple: "Simple",
    advanced: "Avancé",
    fontFamily: "Police",
    notificationAnimation: "Animation Notification",
    colorPreset: "Préréglage de couleurs",
    custom: "Personnalisé",
    background: "Arrière-plan",
    panel: "Panneau",
    text: "Texte",
    accent1: "Accent 1",
    accent2: "Accent 2",
    border: "Bordure",
    success: "Succès",
    error: "Erreur",
    soundSettings: "Paramètres Audio",
    enableSound: "Activer le son",
    volume: "Volume",
    donationSound: "Son de don",
    defaultCoin: "Pièce par défaut",
    milestoneSound: "Son d'étape",
    defaultFanfare: "Fanfare par défaut",
    preview: "Aperçu",
    customSoundLibrary: "Bibliothèque de sons",
    uploadSound: "Télécharger un son",
    uploadNewSound: "Uploader nouveau son",
    addSoundFromFolder: "Ajouter son du dossier App",
    noSoundsFound: "Aucun fichier dans le dossier /sounds",
    add: "Ajouter",
    soundFolderHint: "Placez les fichiers audio dans le dossier \"sounds\" de votre application.",
    fileTooLarge: "Fichier trop volumineux.",
    sponsors: "Sponsors",
    slideDuration: "Durée diapositive (Secondes)",
    noSponsorsAdded: "Aucun sponsor ajouté.",
    addSponsorFromFolder: "Ajouter sponsor du dossier App",
    noSponsorsFound: "Aucun fichier dans le dossier /sponsors",
    sponsorFolderHint: "Placez les images dans le dossier \"sponsors\" de votre application.",
    textOverlay: "Overlay Texte",
    selectTextFile: "Sélectionner fichier texte",
    noTextFilesFound: "Aucun fichier dans le dossier /text_files",
    textFolderHint: "Placez les fichiers .txt dans le dossier \"text_files\" de votre application.",
    saveSettings: "Enregistrer",
    saving: "Enregistrement...",
    overlayLinks: "Liens Overlay",
    progressBar: "Barre de progression",
    notifications: "Notifications",
    nextMilestone: "Prochaine étape",
    teamTracker: "Suivi d'équipe",
    celebration: "Célébration",
    schedule: "Programme",
    sponsorsOverlay: "Sponsors",
    textOverlayLink: "Affichage Texte",
    openPopup: "Ouvrir Popup",
    copyLink: "Copier Lien",
    copied: "Copié !",
    resyncData: "Resynchroniser",
    testDonation: "Test Don (+$15)",
    clearStop: "Effacer & Arrêter tout",
    currentStats: "Statistiques actuelles",
    totalRaised: "Total récolté",
    teamRaised: "Total équipe",
    lastDonator: "Dernier donateur",
    lastFetched: "Dernière mise à jour du serveur",
    justNow: "à l'instant",
    secondsAgo: "il y a {s}s",
    minutesAgo: "il y a {m}m",
    never: "Jamais",
    none: "Aucun",
    donated: "a donné",
    goalReached: "Objectif de collecte atteint !",
    nextGoal: "Prochain Objectif",
    goal: "Objectif",
    teamTotal: "Total Équipe",
    allMilestonesComplete: "Toutes les étapes terminées !",
    startsIn: "Commence dans : ",
    timeElapsed: "Temps écoulé : ",
    anonymous: "Anonyme",
    noScheduleSet: "Aucun programme défini !",
    slideIn: "Glisser",
    fadeIn: "Fondu",
    bounceIn: "Rebond",
    zoomIn: "Zoom",
    recentDonations: "Dons Récents",
    noDonations: "Pas encore de dons.",
    textAlignment: "Alignement du texte",
    topLeft: "Haut Gauche",
    topCenter: "Haut Centre",
    topRight: "Haut Droite",
    centerLeft: "Centre Gauche",
    center: "Centre",
    centerRight: "Centre Droite",
    bottomLeft: "Bas Gauche",
    bottomCenter: "Bas Centre",
    bottomRight: "Bas Droite",
    fontSize: "Taille de police (rem)",
    welcomeTitle: "Bienvenue sur Extra Life Tracker",
    welcomeSubtitle: "Entrez votre ID Participant pour commencer.",
    startTracking: "Commencer le suivi",
    changeId: "Changer ID",
    idHint: "Cet ID sera utilisé pour sauvegarder vos paramètres et overlays.",
    githubPagesMode: "Mode GitHub Pages",
    standaloneMode: "Client Autonome (Dans le Navigateur)",
    connectedServer: "Connecté au Serveur",
    connecting: "Connexion en cours...",
    defaultPowerup: "Power-Up par défaut",
    defaultLaser: "Laser par défaut",
    exportConfig: "Exporter Paramètres (JSON)",
    importConfig: "Importer Paramètres (JSON)",
    importSuccess: "Paramètres chargés avec succès !",
    importError: "Fichier de configuration JSON invalide.",
    uploadSponsorImage: "Uploader Logo Sponsor (Fichier)",
    sponsorUrl: "Ou coller l'URL d'une image",
    addSponsorUrl: "Ajouter URL",
    customText: "Contenu texte personnalisé",
    customTextHint: "Tapez votre message de stream, notes ou règles directement ici. S'affiche en direct sur l'Overlay Texte !",
    uploadTextFile: "Uploader Fichier .txt",
    directUrl: "Ou URL de fichier texte distant",
    loadUrl: "Charger Texte",
    syncNote: "Exécution directe depuis GitHub Pages ! Overlays, sons et paramètres se synchronisent localement."
  }
};

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

const NextMilestoneOverlay = ({ milestones, totalRaised, currencyPrefix, convertAmount, styles, successColor, t }: any) => {
    const nextMilestone = useMemo(() => milestones.find((m: any) => totalRaised < m.fundraisingGoal), [milestones, totalRaised]);

    if (!nextMilestone) {
        return (
            <div style={{...styles.progressBarContainer, textAlign: 'center'}}>
                <h2 style={{...styles.milestoneDescription, color: successColor}}>{t('allMilestonesComplete')}</h2>
            </div>
        );
    }
    
    const milestoneIndex = milestones.findIndex((m: any) => m.milestoneID === nextMilestone.milestoneID);
    const previousMilestoneGoal = milestoneIndex > 0 ? milestones[milestoneIndex - 1].fundraisingGoal : 0;

    const amountForThisMilestone = Math.max(0, totalRaised - previousMilestoneGoal);
    const goalForThisMilestone = nextMilestone.fundraisingGoal - previousMilestoneGoal;
    const milestoneProgressPercentage = goalForThisMilestone <= 0 ? 100 : Math.min((amountForThisMilestone / goalForThisMilestone) * 100, 100);

    return (
        <div style={styles.progressBarContainer}>
            <h2 style={styles.milestoneDescription}>{t('nextGoal')}: {nextMilestone.description}</h2>
            <div style={{...styles.progressBar, width: `${milestoneProgressPercentage}%`}}>
                <span style={styles.progressText}>
                    {currencyPrefix}{convertAmount(totalRaised).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
            </div>
            <div style={styles.goalText}>
                {t('goal')}: {currencyPrefix}{convertAmount(nextMilestone.fundraisingGoal).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </div>
        </div>
    );
};

const TeamOverlay = ({ styles, currencyPrefix, convertAmount, teamTotalRaised, successColor, backgroundColor, hexToRgba, teamName, t }: any) => {
    return (
      <div style={{...styles.progressBarContainer, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', boxSizing: 'border-box' as const}}>
        <span style={{...styles.label, opacity: 1, fontSize: '0.9rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', padding: '0 5px'}}>
            {teamName || t('teamTotal')}
        </span>
        <span style={{...styles.progressText, fontSize: '1.8rem', color: successColor, textShadow: `2px 2px ${hexToRgba(backgroundColor, 0.7)}`}}>
          {currencyPrefix}{convertAmount(teamTotalRaised).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
        </span>
      </div>
    );
};

const ScheduleOverlay = ({ items, styles, accentColor1, accentColor2, textColor, fontFamily, t }: { items: any[], styles: any, accentColor1: string, accentColor2: string, textColor: string, fontFamily: string, t: any }) => {
    if (!items || items.length === 0) {
        return <div style={{...styles.progressBarContainer, textAlign: 'center', padding: '20px'}}>
            <h2 style={{...styles.milestoneDescription}}>{t('noScheduleSet')}</h2>
        </div>
    }
    return (
        <div style={{...styles.progressBarContainer, padding: '20px'}}>
            <h2 style={{...styles.milestoneDescription, textAlign: 'center', borderBottom: `2px solid ${accentColor2}`, paddingBottom: '10px', marginBottom: '10px' }}>{t('streamSchedule')}</h2>
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
                            borderBottom: `1px dashed ${accentColor2}`,
                            opacity: item.isDone ? 0.6 : 1,
                            textDecoration: item.isDone ? 'line-through' : 'none',
                            transition: 'opacity 0.3s ease, text-decoration 0.3s ease',
                            alignItems: 'baseline',
                            flexWrap: 'wrap'
                        }}>
                            <span style={{ color: accentColor1, flexShrink: 0, minWidth: '160px', whiteSpace: 'nowrap', fontFamily }}>{timeDisplay}</span>
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

    useEffect(() => {
        if (!sponsors || sponsors.length <= 1) return;
        const interval = setInterval(() => {
            setIndex(prev => (prev + 1) % sponsors.length);
        }, animationDuration * 1000);
        return () => clearInterval(interval);
    }, [sponsors, animationDuration]);

    if (!sponsors || sponsors.length === 0) {
        return (
             <div style={{...styles.progressBarContainer, height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
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
            padding: styles.progressBarContainer.padding,
            backgroundColor: styles.progressBarContainer.backgroundColor,
            border: styles.progressBarContainer.border,
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

const TextOverlay = ({ filename, customText, styles, fontFamily, textColor, accentColor1, alignment = 'top-left', fontSize = 1.5 }: any) => {
    const [content, setContent] = useState(customText || '');

    useEffect(() => {
        if (customText) {
            setContent(customText);
            return;
        }
        if (!filename) {
            setContent('No text configured');
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
                    setContent(`Error loading ${filename}`);
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

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            justifyContent: alignStyle.justifyContent,
            alignItems: alignStyle.alignItems,
            backgroundColor: styles.progressBarContainer.backgroundColor,
            color: textColor,
            fontFamily: fontFamily,
            border: styles.progressBarContainer.border,
            boxSizing: 'border-box',
            padding: '40px',
            overflow: 'hidden'
        }}>
            <pre style={{
                whiteSpace: 'pre-wrap',
                textAlign: alignStyle.textAlign as any,
                fontSize: `${fontSize}rem`,
                margin: 0,
                color: accentColor1,
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
  
const CelebrationOverlay = ({ playSound, accentColor1, accentColor2, successColor, celebrationDuration, activeCelebrationKey }: any) => {
    const colors = useMemo(() => [accentColor1, accentColor2, successColor], [accentColor1, accentColor2, successColor]);

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

  const isGitHubPagesHost = typeof window !== 'undefined' && (
      window.location.hostname.endsWith('github.io') || 
      window.location.protocol === 'file:'
  );

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
  const [teamName, setTeamName] = useState<string>('');
  
  // Notification Queue System
  const [activeToasts, setActiveToasts] = useState<Donation[]>([]);
  const [toastQueue, setToastQueue] = useState<Donation[]>([]);
  
  const [goal, setGoal] = useState<number>(0); 
  const [conversionRate, setConversionRate] = useState<number>(1.0); 
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

  // UI/Config State
  const [overlayType, setOverlayType] = useState<'none' | 'progress' | 'notifications' | 'milestone' | 'team' | 'celebration' | 'schedule' | 'sponsors' | 'text'>('none');
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
  });

  // Local input state for form (debounced by user action essentially)
  const [participantIdInput, setParticipantIdInput] = useState('');
  const [teamIdInput, setTeamIdInput] = useState('');
  const [commandTrigger, setCommandTrigger] = useState('');
  const [commandResponse, setCommandResponse] = useState('');
  const [websiteTotalInput, setWebsiteTotalInput] = useState('');

  const [selectedPreset, setSelectedPreset] = useState<string>('custom');
  
  // === REFS ===
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<Set<AudioScheduledSourceNode>>(new Set());
  const soundFileInputRef = useRef<HTMLInputElement>(null);
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
              setTeamTotalRaised(payload.teamTotalRaised || 0);
              setTeamName(payload.teamName || '');
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
          const mileData = mileRes.ok ? await mileRes.json() : [];

          // 4. Team Details (optional)
          let tRaised = 0;
          let tName = '';
          if (newTeamId) {
              try {
                  const teamRes = await fetch(`https://dd.extra-life.org/api/teams/${newTeamId}`);
                  if (teamRes.ok) {
                      const tData = await teamRes.json();
                      tRaised = tData.sumDonations || 0;
                      tName = tData.name || '';
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
          const previousTotal = totalRaisedRef.current;

          setTotalRaised(newRaised);
          setGoal(newGoal);
          setDonations(donData);
          setMilestones(mileData);
          setTeamTotalRaised(tRaised);
          setTeamName(tName);
          setConversionRate(cRate);

          const updatedPayload = {
              donations: donData,
              milestones: mileData,
              totalRaised: newRaised,
              goal: newGoal,
              teamTotalRaised: tRaised,
              teamName: tName,
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
          setTeamTotalRaised(storedData.teamTotalRaised || 0);
          setTeamName(storedData.teamName || '');
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
              setTeamTotalRaised(state.data.teamTotalRaised || 0);
              setTeamName(state.data.teamName || '');
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
              setTeamTotalRaised(data.teamTotalRaised || 0);
              setTeamName(data.teamName || '');
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
    
    if (overlayParam && ['progress', 'notifications', 'milestone', 'team', 'celebration', 'schedule', 'sponsors', 'text'].includes(overlayParam)) {
        setOverlayType(overlayParam as any);
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
    setSelectedPreset(matchingPresetKey || 'custom');
  }, [config]);


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
    if (presetKey !== 'custom') {
        const preset = COLOR_PRESETS[presetKey as keyof typeof COLOR_PRESETS];
        if (preset) {
            updateConfig(preset.colors);
        }
    }
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
        setFormError('Failed to copy URL.');
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
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
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
          name: sponsorNameInput.trim() || 'Sponsor',
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

  const styles = {
    container: { width: '100%', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' as const },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: config.accentColor1, textShadow: `3px 3px ${config.backgroundColor}`, marginBottom: '1rem', fontFamily: config.fontFamily, flexDirection: 'column' as const },
    form: { display: 'flex', flexDirection: 'column' as const, gap: '1rem', backgroundColor: config.panelColor, border: `4px solid ${config.accentColor1}`, padding: '20px', marginBottom: '2rem' },
    input: { backgroundColor: config.panelColor, border: `2px solid ${config.accentColor2}`, color: config.textColor, padding: '10px', fontFamily: config.fontFamily, fontSize: '1rem', outline: 'none', width: '100%', boxSizing: 'border-box' as const },
    button: { border: 'none', padding: '15px', fontFamily: config.fontFamily, fontSize: '1.2rem', cursor: 'pointer', textTransform: 'uppercase' as const, marginTop: '1rem' },
    error: { color: config.errorColor, marginTop: '10px', fontSize: '0.9rem', backgroundColor: config.panelColor, padding: '15px', border: `2px solid ${config.errorColor}`, whiteSpace: 'pre-wrap' as const, fontFamily: config.fontFamily },
    loading: { fontSize: '1.2rem', color: config.accentColor2, margin: '2rem 0', fontFamily: config.fontFamily },
    listContainer: { display: 'flex', flexDirection: 'column' as const, gap: '1rem' },
    donationItem: { backgroundColor: config.panelColor, border: `2px solid ${config.panelBorderColor}`, padding: '15px', textAlign: 'left' as const, animation: 'fadeIn 0.5s ease-in-out' },
    donationHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
    donationName: { fontSize: '1.2rem', color: config.accentColor1, fontFamily: config.fontFamily },
    donationAmount: { fontSize: '1.2rem', color: config.successColor, fontFamily: config.fontFamily },
    donationMessage: { marginTop: '10px', color: config.textColor, fontSize: '0.9rem', fontStyle: 'italic' as const, opacity: 0.8, fontFamily: config.fontFamily },
    label: { fontSize: '1rem', color: config.textColor, textAlign: 'left' as const, opacity: 0.7, fontFamily: config.fontFamily },
    colorPickerContainer: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '5px' },
    colorInput: { WebkitAppearance: 'none' as const, MozAppearance: 'none' as const, appearance: 'none' as const, width: '50px', height: '50px', backgroundColor: 'transparent', border: `2px solid ${config.accentColor2}`, cursor: 'pointer' },
    // Overlay styles
    progressBarContainer: { width: '100%', backgroundColor: config.panelColor, border: `4px solid ${config.panelBorderColor}`, padding: '10px', boxSizing: 'border-box' as const },
    progressBar: { height: '40px', backgroundColor: config.accentColor1, width: `0%`, transition: 'width 0.5s ease-in-out', display: 'flex', alignItems: 'center', justifyContent: 'center' as const, overflow: 'hidden' },
    progressText: { color: config.buttonTextColor, textShadow: `1px 1px ${hexToRgba(config.textColor, 0.5)}`, fontSize: '1.2rem', fontFamily: config.fontFamily },
    goalText: { color: config.accentColor2, marginTop: '10px', fontFamily: config.fontFamily },
    timerText: { color: config.accentColor2, marginBottom: '10px', fontSize: '1.2rem', textShadow: `2px 2px ${config.backgroundColor}`, fontFamily: config.fontFamily },
    toastContainer: { position: 'fixed' as const, top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, display: 'flex', flexDirection: 'column' as const, gap: '10px', alignItems: 'center', width: '90%', maxWidth: '600px' },
    toast: { backgroundColor: hexToRgba(config.panelColor, 0.95), border: `3px solid ${config.accentColor1}`, color: config.textColor, padding: '20px', animation: currentToastAnimation, textAlign: 'center' as const, minWidth: '300px' },
    toastName: { fontSize: '1.2rem', color: config.accentColor1, fontWeight: 'bold' as const, fontFamily: config.fontFamily },
    toastAmount: { fontSize: '1.5rem', color: config.accentColor2, margin: '10px 0', fontFamily: config.fontFamily },
    toastMessage: { fontSize: '0.9rem', color: config.textColor, fontStyle: 'italic' as const, opacity: 0.8, fontFamily: config.fontFamily },
    milestoneDescription: { fontSize: '1.2rem', color: config.textColor, margin: '0 0 10px 0', textShadow: `2px 2px ${config.backgroundColor}`, fontFamily: config.fontFamily },
    soundItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', border: `2px solid ${config.panelBorderColor}`, marginBottom: '10px', color: config.textColor, fontFamily: config.fontFamily },
    soundButton: { backgroundColor: config.accentColor2, border: 'none', color: config.buttonTextColor, padding: '5px 10px', fontFamily: config.fontFamily, fontSize: '0.8rem', cursor: 'pointer', marginLeft: '10px' },
    previewButton: { backgroundColor: config.accentColor2, border: 'none', color: config.buttonTextColor, padding: '12px 15px', fontFamily: config.fontFamily, fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0 },
    // Collapsible Section Styles
    collapsibleContainer: { borderTop: `2px dashed ${config.accentColor2}`, margin: '0', paddingTop: '20px' },
    collapsibleHeader: { backgroundColor: 'transparent', border: 'none', color: config.accentColor1, cursor: 'pointer', fontFamily: config.fontFamily, fontSize: '1.2rem', padding: '0', margin: 0, textAlign: 'left' as const, width: '100%', display: 'flex', alignItems: 'center' },
    collapsibleChevron: { display: 'inline-block', marginRight: '15px', transition: 'transform 0.2s ease-in-out', fontSize: '1.2rem' },
    collapsibleContent: { overflow: 'hidden', transition: 'max-height 0.3s ease-out' },
    // New Card Styles
    card: { backgroundColor: config.panelColor, border: `2px solid ${config.panelBorderColor}`, padding: '15px', display: 'flex', flexDirection: 'column' as const, gap: '10px' },
    // Dashboard Specific Styles
    dashboardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', width: '100%', textAlign: 'left' as const, alignItems: 'start' },
    statHero: { backgroundColor: config.panelColor, border: `4px solid ${config.successColor}`, padding: '20px', textAlign: 'center' as const, marginBottom: '2rem', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: '10px' },
    bigStat: { fontSize: '3rem', color: config.successColor, textShadow: `3px 3px ${config.backgroundColor}`, margin: 0 },
    secondaryStat: { fontSize: '1rem', color: config.accentColor2, margin: 0 },
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
      appearance: none; background-color: transparent; margin: 0; font: inherit; color: ${config.accentColor2};
      width: 1.5em; height: 1.5em; border: 0.15em solid ${config.accentColor2}; border-radius: 0.15em;
      transform: translateY(-0.075em); display: grid; place-content: center; cursor: pointer;
    }
    input[type="checkbox"]::before {
      content: ""; width: 0.8em; height: 0.8em; transform: scale(0); transition: 120ms transform ease-in-out;
      box-shadow: inset 1em 1em ${config.successColor}; transform-origin: bottom left;
      clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
    }
    input[type="checkbox"]:checked::before { transform: scale(1); }
    select {
      background-image: linear-gradient(45deg, transparent 50%, ${config.accentColor2} 50%), linear-gradient(135deg, ${config.accentColor2} 50%, transparent 50%);
      background-position: calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px);
      background-size: 5px 5px, 5px 5px; background-repeat: no-repeat;
      -webkit-appearance: none; -moz-appearance: none; appearance: none;
    }
    input[type="radio"] { display: none; }
    input[type="radio"] + label {
      cursor: pointer; padding: 10px 15px; border: 2px solid ${config.accentColor2}; color: ${config.accentColor2};
    }
    input[type="radio"]:checked + label {
      background-color: ${config.accentColor2}; color: ${config.buttonTextColor};
    }
    /* Custom Scrollbar for Dash */
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: ${config.panelColor}; }
    ::-webkit-scrollbar-thumb { background: ${config.accentColor1}; border-radius: 4px; }
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
                    {isStandaloneMode ? `● ${t('standaloneMode')}` : (isConnected ? `● Connected to Server` : `○ Connecting...`)}
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

      <div style={overlayType === 'sponsors' || overlayType === 'text' ? {width: '100%'} : styles.container}>
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
                        <span style={{fontSize: '0.5em', color: config.successColor, opacity: 0.7}}>● Connected</span>
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
                <span style={{color: config.accentColor2}}>{t('profile')}: <strong>{currentProfile}</strong></span>
                <button 
                    type="button" 
                    onClick={handleChangeId} 
                    style={{...styles.button, margin: 0, padding: '5px 15px', fontSize: '0.8rem', backgroundColor: config.panelColor, border: `1px solid ${config.errorColor}`, color: config.errorColor}}
                >
                    {t('changeId')}
                </button>
            </div>

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
                    <div style={{...styles.card, border: `2px solid ${config.accentColor1}`}}>
                         <h3 style={{margin: '0 0 10px 0', color: config.accentColor1, borderBottom: `1px dashed ${config.accentColor1}`, paddingBottom: '10px'}}>{t('recentDonations')}</h3>
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
                            <button type="button" onClick={handleTestDonation} style={{...styles.button, backgroundColor: config.accentColor2, color: config.buttonTextColor, margin: 0, flex: 1, fontSize: '0.9rem', padding: '10px' }}>{t('testDonation')}</button>
                            <button type="button" onClick={handleManualSync} style={{...styles.button, backgroundColor: config.successColor, color: config.buttonTextColor, flex: 1, margin: 0, fontSize: '0.9rem', padding: '10px' }}>{t('resyncData')}</button>
                        </div>
                        <button type="button" onClick={handleClearOverlays} style={{...styles.button, backgroundColor: config.errorColor, color: config.buttonTextColor, margin: 0, width: '100%', fontSize: '0.9rem', padding: '10px' }}>{t('clearStop')}</button>
                     </div>

                     {/* Secondary Stats */}
                     <div style={styles.card}>
                       <p style={{margin:0, color: config.accentColor2}}>{t('teamRaised')}: {currencyPrefix}{convertAmount(teamTotalRaised).toFixed(2)}</p>
                       <p style={{margin:0, color: config.accentColor2, fontSize: '0.85rem', marginTop: '5px'}}>{t('lastDonator')}: {sortedDonations.length > 0 ? (sortedDonations[0].displayName === 'Anonymous' ? t('anonymous') : sortedDonations[0].displayName) : t('none')}</p>
                    </div>

                    {/* Overlay Links (Collapsed) */}
                    <div style={styles.card}>
                        <CollapsibleSection title={t('overlayLinks')} isInitiallyCollapsed={true} styles={styles}>
                            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', width: '100%'}}>
                                {[
                                    { title: t('progressBar'), fn: () => openOverlay('progress', 'width=800,height=150'), type: 'progress' },
                                    { title: t('notifications'), fn: () => openOverlay('notifications', 'width=800,height=600'), type: 'notifications' },
                                    { title: t('nextMilestone'), fn: () => openOverlay('milestone', 'width=800,height=180'), type: 'milestone' },
                                    { title: t('teamTracker'), fn: () => openOverlay('team', 'width=400,height=100'), type: 'team' },
                                    { title: t('celebration'), fn: () => openOverlay('celebration', 'width=1920,height=1080'), type: 'celebration' },
                                    { title: t('schedule'), fn: () => openOverlay('schedule', 'width=600,height=400'), type: 'schedule' },
                                    { title: t('sponsorsOverlay'), fn: () => openOverlay('sponsors', 'width=300,height=150'), type: 'sponsors' },
                                    { title: t('textOverlayLink'), fn: () => openOverlay('text', 'width=800,height=600'), type: 'text' }
                                ].map(overlay => (
                                        <div key={overlay.title} style={{...styles.card, padding: '10px', gap: '5px', backgroundColor: hexToRgba(config.panelColor, 0.5)}}>
                                        <h4 style={{margin: '0', color: config.textColor, textAlign: 'left', fontSize: '0.8rem'}}>{overlay.title}</h4>
                                        <div style={{display: 'flex', gap: '5px'}}>
                                            <button type="button" onClick={overlay.fn} style={{...styles.button, backgroundColor: config.panelColor, border: `1px solid ${config.accentColor2}`, color: config.textColor, marginTop: 0, flex: 1, fontSize: '0.7rem', padding: '5px'}}>
                                                {t('openPopup')}
                                            </button>
                                            <button type="button" onClick={() => handleCopyUrl(overlay.type)} style={{...styles.button, backgroundColor: config.accentColor1, color: config.buttonTextColor, marginTop: 0, flex: 1, fontSize: '0.7rem', padding: '5px'}}>
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
                            style={{...styles.button, backgroundColor: 'transparent', border: `1px solid ${config.accentColor1}`, color: config.accentColor1, width: '100%', margin: 0, padding: '10px', fontSize: '1rem' }}
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
                                title={currentProfile !== 'default' ? 'Managed by the loaded Profile ID' : ''}
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
                                        <span style={{ fontSize: '0.85rem', color: config.accentColor2 }}>
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
                                                    title="Clear custom rates and return to live rate"
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
                                                style={{ ...styles.button, margin: 0, padding: '3px 8px', fontSize: '0.75rem', backgroundColor: config.panelColor, border: `1px solid ${config.accentColor2}`, color: config.accentColor2 }}
                                                title="Fetch latest live API exchange rate"
                                            >
                                                ↻ {t('refreshRate')} (Live)
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
                                        placeholder={`Live rate (~${conversionRate > 1 ? conversionRate.toFixed(4) : '1.36'})`}
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
                                        <div style={{ fontSize: '0.72rem', color: config.accentColor2, opacity: 0.85 }}>
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
                            </CollapsibleSection>
                            
                            <CollapsibleSection title={t('twitchIntegration')} isInitiallyCollapsed={true} styles={styles}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: `1px dashed ${config.accentColor2}`, paddingBottom: '10px' }}>
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
                                            style={{...styles.button, backgroundColor: config.accentColor1, color: config.buttonTextColor, fontSize: '0.9rem', padding: '10px', margin: 0, whiteSpace: 'nowrap'}}
                                        >
                                            {t('getTwitchToken')}
                                        </button>
                                    </div>

                                    <div style={{borderTop: `2px dashed ${config.accentColor2}`, margin: '20px 0'}}></div>

                                    <h4 style={{...styles.label, opacity: 1, fontSize: '1.1rem', marginBottom: '10px' }}>{t('chatCommands')}</h4>
                                    
                                    <div style={{ marginBottom: '15px' }}>
                                        <h5 style={{ color: config.accentColor1, margin: '0 0 5px 0', fontSize: '0.9rem' }}>{t('builtinCommands')}</h5>
                                        <ul style={{ color: config.textColor, fontSize: '0.85rem', margin: 0, paddingLeft: '20px', opacity: 0.8, textAlign: 'left' }}>
                                            <li><strong>!total</strong> - Current raised amount</li>
                                            <li><strong>!goal</strong> - Current fundraising goal</li>
                                            <li><strong>!milestone</strong> - Next milestone info</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h5 style={{ color: config.accentColor1, margin: '0 0 10px 0', fontSize: '0.9rem' }}>{t('customCommands')}</h5>
                                        
                                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                            <input type="text" value={commandTrigger} onChange={e => setCommandTrigger(e.target.value)} style={{...styles.input, padding: '8px', flex: 1}} placeholder={t('commandTrigger')} />
                                            <input type="text" value={commandResponse} onChange={e => setCommandResponse(e.target.value)} style={{...styles.input, padding: '8px', flex: 2}} placeholder={t('commandResponse')} />
                                        </div>
                                        <button type="button" onClick={handleAddCommand} style={{...styles.button, backgroundColor: config.accentColor1, color: config.buttonTextColor, fontSize: '0.9rem', padding: '8px', margin: '0 0 15px 0', width: '100%' }}>{t('addCommand')}</button>
                                        
                                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            {config.customCommands.length === 0 && <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>{t('noCommands')}</p>}
                                            {config.customCommands.map(cmd => (
                                                <div key={cmd.id} style={{...styles.soundItem, padding: '8px 12px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', overflow: 'hidden', marginRight: '10px' }}>
                                                        <span style={{ color: config.accentColor1, fontWeight: 'bold' }}>{cmd.trigger}</span>
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
                                <button type="button" onClick={handleAddScheduleItem} style={{...styles.button, backgroundColor: config.accentColor1, color: config.buttonTextColor, fontSize: '1rem', padding: '10px', margin: '10px auto 0 auto', width: '50%' }}>{t('addItem')}</button>
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
                            <select value={selectedPreset} onChange={handlePresetChange} style={styles.input}>
                                <option value="custom">{t('custom')}</option>
                                {Object.entries(COLOR_PRESETS).map(([key, { name }]) => (<option key={key} value={key}>{name}</option>))}
                            </select>

                            <div style={{borderTop: `1px solid ${config.panelBorderColor}`, margin: '20px 0 10px 0'}} />
                            
                            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', justifyContent: 'center'}}>
                                <div style={styles.colorPickerContainer}><label style={styles.label}>{t('background')}</label><input type="color" value={config.backgroundColor} onChange={e => updateConfig({ backgroundColor: e.target.value })} style={styles.colorInput} /></div>
                                <div style={styles.colorPickerContainer}><label style={styles.label}>{t('panel')}</label><input type="color" value={config.panelColor} onChange={e => updateConfig({ panelColor: e.target.value })} style={styles.colorInput} /></div>
                                <div style={styles.colorPickerContainer}><label style={styles.label}>{t('text')}</label><input type="color" value={config.textColor} onChange={e => updateConfig({ textColor: e.target.value })} style={styles.colorInput} /></div>
                            </div>

                            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', justifyContent: 'center', marginTop: '1rem'}}>
                                <div style={styles.colorPickerContainer}><label style={styles.label}>{t('accent1')}</label><input type="color" value={config.accentColor1} onChange={e => updateConfig({ accentColor1: e.target.value })} style={styles.colorInput} /></div>
                                <div style={styles.colorPickerContainer}><label style={styles.label}>{t('accent2')}</label><input type="color" value={config.accentColor2} onChange={e => updateConfig({ accentColor2: e.target.value })} style={styles.colorInput} /></div>
                                <div style={styles.colorPickerContainer}><label style={styles.label}>{t('border')}</label><input type="color" value={config.panelBorderColor} onChange={e => updateConfig({ panelBorderColor: e.target.value })} style={styles.colorInput} /></div>
                            </div>

                            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', justifyContent: 'center', marginTop: '1rem'}}>
                                <div style={styles.colorPickerContainer}><label style={styles.label}>{t('success')}</label><input type="color" value={config.successColor} onChange={e => updateConfig({ successColor: e.target.value })} style={styles.colorInput} /></div>
                                <div style={styles.colorPickerContainer}><label style={styles.label}>{t('error')}</label><input type="color" value={config.errorColor} onChange={e => updateConfig({ errorColor: e.target.value })} style={styles.colorInput} /></div>
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

                                <div style={{borderTop: `2px dashed ${config.accentColor2}`, margin: '20px 0 0 0'}} />

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
                                <button type="button" onClick={() => soundFileInputRef.current?.click()} style={{...styles.button, backgroundColor: config.accentColor1, color: config.buttonTextColor, fontSize: '1rem', padding: '10px 20px', margin: 0}}>
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
                                        style={{...styles.button, backgroundColor: config.accentColor1, color: config.buttonTextColor, fontSize: '1rem', padding: '10px 20px', margin: 0}}
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
                                        style={{...styles.button, backgroundColor: config.accentColor2, color: config.buttonTextColor, fontSize: '0.9rem', padding: '10px 15px', margin: 0, flex: 1}}
                                    >
                                        {t('exportConfig')}
                                    </button>
                                    <label style={{...styles.button, backgroundColor: config.accentColor1, color: config.buttonTextColor, fontSize: '0.9rem', padding: '10px 15px', margin: 0, flex: 1, textAlign: 'center', cursor: 'pointer'}}>
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
            
            {overlayType === 'milestone' && <NextMilestoneOverlay milestones={milestones} totalRaised={totalRaised} currencyPrefix={currencyPrefix} convertAmount={convertAmount} styles={styles} successColor={config.successColor} t={t} />}
            {overlayType === 'team' && <TeamOverlay styles={styles} currencyPrefix={currencyPrefix} convertAmount={convertAmount} teamTotalRaised={teamTotalRaised} successColor={config.successColor} backgroundColor={config.backgroundColor} hexToRgba={hexToRgba} teamName={teamName} t={t} />}
            {overlayType === 'celebration' && <CelebrationOverlay playSound={playSpecificSound} accentColor1={config.accentColor1} accentColor2={config.accentColor2} successColor={config.successColor} celebrationDuration={config.celebrationDuration} activeCelebrationKey={celebrationKey} />}
            {overlayType === 'schedule' && <ScheduleOverlay items={config.scheduleItems} styles={styles} accentColor1={config.accentColor1} accentColor2={config.accentColor2} textColor={config.textColor} fontFamily={config.fontFamily} t={t} />}
            {overlayType === 'sponsors' && <SponsorOverlay sponsors={config.sponsors} styles={styles} animationDuration={config.sponsorDisplayDuration} t={t} />}
            {overlayType === 'text' && <TextOverlay filename={config.selectedTextFile} customText={config.customTextContent} styles={styles} fontFamily={config.fontFamily} textColor={config.textColor} accentColor1={config.accentColor1} alignment={config.textOverlayAlignment} fontSize={config.textOverlayFontSize} />}
          </>
        )}
      </div>
    </>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);