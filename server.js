import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fetch from 'node-fetch';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import tmi from 'tmi.js';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

// Setup paths for static serving
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
app.use(cors());
app.use(express.json()); // Enable JSON body parsing for API endpoints

// --- MIDDLEWARE & ASSET SETUP ---

const SPONSORS_DIR = path.join(__dirname, 'sponsors');
const SOUNDS_DIR = path.join(__dirname, 'sounds');
const TEXT_FILES_DIR = path.join(__dirname, 'text_files');

// Ensure directories exist
try {
    await fs.mkdir(SPONSORS_DIR, { recursive: true });
    await fs.mkdir(SOUNDS_DIR, { recursive: true });
    await fs.mkdir(TEXT_FILES_DIR, { recursive: true });
    
    // Create a sample text file if directory is empty
    const textFiles = await fs.readdir(TEXT_FILES_DIR);
    if (textFiles.length === 0) {
        await fs.writeFile(path.join(TEXT_FILES_DIR, 'notes.txt'), 'Welcome to the stream!\n\nThis is a text overlay.\nEdit this file in the text_files folder.');
    }
} catch (e) {
    console.error("Could not create assets directories", e);
}

// --- DATABASE SETUP (LowDB) ---
const dbFile = path.join(__dirname, 'database.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, { profiles: {} });

// Initialize DB
await db.read();
db.data ||= { profiles: {} };
await db.write();


// --- API ENDPOINTS (Must be defined BEFORE express.static) ---

// Endpoint to list sponsor images
app.get('/api/list-sponsors', async (req, res) => {
    try {
        const files = await fs.readdir(SPONSORS_DIR);
        const images = files.filter(f => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f));
        res.set('Cache-Control', 'no-store');
        res.json(images);
    } catch (e) {
        console.error("Error reading sponsors directory:", e);
        res.status(500).json([]);
    }
});

// Endpoint to list sound files
app.get('/api/list-sounds', async (req, res) => {
    try {
        const files = await fs.readdir(SOUNDS_DIR);
        const sounds = files.filter(f => /\.(mp3|wav|ogg)$/i.test(f));
        res.set('Cache-Control', 'no-store');
        res.json(sounds);
    } catch (e) {
        console.error("Error reading sounds directory:", e);
        res.status(500).json([]);
    }
});

// Endpoint to list text files
app.get('/api/list-text-files', async (req, res) => {
    try {
        const files = await fs.readdir(TEXT_FILES_DIR);
        const textFiles = files.filter(f => /\.(txt|md|log)$/i.test(f));
        res.set('Cache-Control', 'no-store');
        res.json(textFiles);
    } catch (e) {
        console.error("Error reading text_files directory:", e);
        res.status(500).json([]);
    }
});

// Endpoint to read a specific text file
app.get('/api/read-text/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        // Basic security to prevent directory traversal
        if (filename.includes('..') || filename.includes('/')) {
            return res.status(400).send('Invalid filename');
        }
        
        const filePath = path.join(TEXT_FILES_DIR, filename);
        const content = await fs.readFile(filePath, 'utf-8');
        res.set('Cache-Control', 'no-store');
        res.send(content);
    } catch (e) {
        console.error(`Error reading file ${req.params.filename}:`, e);
        res.status(404).send('File not found');
    }
});


// --- API FOR EXTERNAL CONTROLS (Stream Deck) ---

const COLOR_PRESETS = {
  'neon-vibe': {
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
    }
  },
  'dwarf-fortress': {
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
    }
  }
};

// Helper to get profile ID from request
const getProfileId = (req) => {
    // Check body or query param
    return req.body.profile || req.query.profile || 'default';
};

// POST /api/theme
// Body: { "name": "neon-vibe", "profile": "user1" }
app.post('/api/theme', async (req, res) => {
    const { name } = req.body;
    const profileId = getProfileId(req);
    
    if (!name || !COLOR_PRESETS[name]) {
        return res.status(400).json({ 
            error: 'Invalid or missing theme name', 
            availableThemes: Object.keys(COLOR_PRESETS) 
        });
    }

    const profile = await getOrCreateProfile(profileId);
    const newColors = COLOR_PRESETS[name].colors;
    
    profile.config = { ...profile.config, ...newColors };
    
    await saveProfileConfig(profileId, profile.config);
    io.to(`profile:${profileId}`).emit('config-updated', profile.config);
    
    console.log(`API [${profileId}]: Theme changed to ${name}`);
    res.json({ success: true, theme: name, profile: profileId });
});

// POST /api/stop-events
// Body: { "profile": "user1" }
app.post('/api/stop-events', (req, res) => {
    const profileId = getProfileId(req);
    io.to(`profile:${profileId}`).emit('event:clear');
    console.log(`API [${profileId}]: All events stopped`);
    res.json({ success: true, message: 'All events cleared and stopped.', profile: profileId });
});

// --- STATIC SERVING (Must be AFTER API routes) ---
app.use(express.static(__dirname));
app.use('/sponsors', express.static(SPONSORS_DIR));
app.use('/sounds', express.static(SOUNDS_DIR));

export const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

const PORT = 3000;

// --- MULTI-USER STATE MANAGEMENT ---

const DEFAULT_CONFIG = {
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
    textOverlayAlignment: 'top-left',
    textOverlayFontSize: 1.5,
};

class Profile {
    constructor(id) {
        this.id = id;
        this.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG)); // Deep copy default
        this.data = {
            donations: [],
            milestones: [],
            totalRaised: 0,
            goal: 0,
            teamTotalRaised: 0,
            teamName: '',
            conversionRate: 1.0
        };
        this.seenDonationIds = new Set();
        this.pollingInterval = null;
        this.initialFetchComplete = false;
        this.twitchClient = null;
    }
}

// Map<string, Profile>
const profiles = new Map();

// Helper to get or initialize a profile
async function getOrCreateProfile(profileId) {
    if (!profiles.has(profileId)) {
        console.log(`Initializing profile: ${profileId}`);
        const newProfile = new Profile(profileId);
        profiles.set(profileId, newProfile);
        
        // Load config from DB
        await loadProfileConfig(profileId, newProfile);
        
        // ENFORCE ID SYNC: If profile is not default, force participantId to match
        if (profileId !== 'default') {
             newProfile.config.participantId = profileId;
             console.log(`[${profileId}] Enforcing Participant ID: ${profileId}`);
        }
        
        // Start polling logic
        startProfilePolling(newProfile);
        
        // Setup Twitch if enabled
        setupProfileTwitchClient(newProfile);
    }
    return profiles.get(profileId);
}

// --- PERSISTENCE (LOWDB) ---

async function loadProfileConfig(profileId, profileObj) {
    await db.read();
    const savedConfig = db.data.profiles[profileId];
    if (savedConfig) {
        profileObj.config = { ...profileObj.config, ...savedConfig };
        console.log(`Config loaded for [${profileId}] from DB`);
    } else {
        console.log(`No config found for [${profileId}] in DB. Using defaults.`);
        // Save defaults
        await saveProfileConfig(profileId, profileObj.config);
    }
}

async function saveProfileConfig(profileId, configData) {
    db.data.profiles[profileId] = configData;
    await db.write();
    console.log(`Config saved for [${profileId}] to DB`);
}

// --- TWITCH INTEGRATION ---

export async function setupProfileTwitchClient(profile) {
    // Cleanup existing
    if (profile.twitchClient) {
        try {
            await profile.twitchClient.disconnect();
        } catch (e) {
            // Ignore disconnect errors
        }
        profile.twitchClient = null;
    }

    if (!profile.config.twitchEnabled) {
        return;
    }

    if (profile.config.twitchToken && profile.config.twitchChannel) {
        console.log(`[${profile.id}] Initializing Twitch connection...`);
        const client = new tmi.Client({
            options: { debug: false },
            identity: {
                username: profile.config.twitchChannel,
                password: profile.config.twitchToken
            },
            channels: [profile.config.twitchChannel]
        });

        client.on('message', (channel, tags, message, self) => {
            if (self) return;
            const msg = message.trim();
            
            if (profile.config.twitchEnableCommands) {
                // Commands
                if (msg === '!total') {
                    const amount = profile.config.currency === 'CAD' ? profile.data.totalRaised * profile.data.conversionRate : profile.data.totalRaised;
                    const prefix = profile.config.currency === 'CAD' ? 'C$' : '$';
                    client.say(channel, `We have raised ${prefix}${amount.toFixed(2)} for Extra Life so far! #ForTheKids`);
                } else if (msg === '!goal') {
                    const amount = profile.config.currency === 'CAD' ? profile.data.goal * profile.data.conversionRate : profile.data.goal;
                    const prefix = profile.config.currency === 'CAD' ? 'C$' : '$';
                    client.say(channel, `Our current fundraising goal is ${prefix}${amount.toFixed(2)}.`);
                } else if (msg === '!milestone') {
                    const nextMilestone = profile.data.milestones.find(m => profile.data.totalRaised < m.fundraisingGoal);
                    if (nextMilestone) {
                        const amount = profile.config.currency === 'CAD' ? nextMilestone.fundraisingGoal * profile.data.conversionRate : nextMilestone.fundraisingGoal;
                        const prefix = profile.config.currency === 'CAD' ? 'C$' : '$';
                        client.say(channel, `Next Milestone: ${nextMilestone.description} at ${prefix}${amount.toFixed(2)}!`);
                    } else {
                        client.say(channel, "All milestones completed! You all are amazing!");
                    }
                } else {
                    // Custom Commands
                    const customCmd = profile.config.customCommands.find(c => c.trigger === msg);
                    if (customCmd) {
                        client.say(channel, customCmd.response);
                    }
                }
            }
        });

        try {
            await client.connect();
            console.log(`[${profile.id}] Connected to Twitch Channel: ${profile.config.twitchChannel}`);
            profile.twitchClient = client;
        } catch (e) {
            console.error(`[${profile.id}] Failed to connect to Twitch:`, e);
        }
    }
}

// --- DATA FETCHING ---

async function fetchProfileConversionRate(profile) {
    if (profile.config.currency === 'CAD') {
         if (profile.config.customExchangeRate && Number(profile.config.customExchangeRate) > 0) {
             profile.data.conversionRate = Number(profile.config.customExchangeRate);
             return;
         }
         try {
             const res = await fetch('https://open.er-api.com/v6/latest/USD');
             if (res.ok) {
                 const d = await res.json();
                 if (d?.rates?.CAD) {
                     profile.data.conversionRate = d.rates.CAD;
                     return;
                 }
             }
         } catch (e) {}

         profile.data.conversionRate = 1.36; 
    } else {
        profile.data.conversionRate = 1.0;
    }
}

// Fetch data logic for a specific profile
export async function fetchProfileData(profile) {
    if (!profile.config.participantId) return;
    
    try {
        // 1. Participant Data
        const userRes = await fetch(`https://dd.extra-life.org/api/participants/${profile.config.participantId}`);
        const userJson = await userRes.json();
        
        if (!userJson || !userJson.sumDonations) {
             return;
        }

        const newTotal = userJson.sumDonations;
        const newGoal = userJson.fundraisingGoal;
        let milestoneCrossed = false;
        
        // Check for Milestones crossing
        if (profile.data.totalRaised > 0 && newTotal > profile.data.totalRaised && profile.initialFetchComplete) {
            const passedMilestones = profile.data.milestones.filter(m => 
                profile.data.totalRaised < m.fundraisingGoal && newTotal >= m.fundraisingGoal
            );
            
            const passedGoal = profile.data.totalRaised < profile.data.goal && newTotal >= profile.data.goal;
            
            if (passedMilestones.length > 0) {
                 io.to(`profile:${profile.id}`).emit('event:celebration', { type: 'milestone', milestone: passedMilestones[0] });
                 if (profile.config.twitchEnableAlerts && profile.twitchClient && profile.twitchClient.readyState() === 'OPEN') {
                     profile.twitchClient.say(profile.config.twitchChannel, `🎉 MILESTONE UNLOCKED: ${passedMilestones[0].description}!`);
                 }
                 milestoneCrossed = true;
            } else if (passedGoal) {
                 io.to(`profile:${profile.id}`).emit('event:celebration', { type: 'milestone', milestone: { description: 'Fundraising Goal Reached!' } });
                 if (profile.config.twitchEnableAlerts && profile.twitchClient && profile.twitchClient.readyState() === 'OPEN') {
                     profile.twitchClient.say(profile.config.twitchChannel, `🎉 GOAL REACHED! We did it!`);
                 }
                 milestoneCrossed = true;
            }
        }

        profile.data.totalRaised = newTotal;
        profile.data.goal = newGoal;

        // 2. Donations
        const donationsRes = await fetch(`https://dd.extra-life.org/api/participants/${profile.config.participantId}/donations?limit=100&orderBy=createdDateUTC&orderDirection=DESC`);
        const donationsJson = await donationsRes.json();
        
        if (!Array.isArray(donationsJson)) {
            console.error(`[${profile.id}] Donations API did not return an array`);
            return;
        }

        // Process Donations
        for (const d of donationsJson) {
            const id = d.donationID;
            if (!profile.seenDonationIds.has(id)) {
                // It's new!
                if (profile.initialFetchComplete) {
                    const donationObj = {
                        donationID: d.donationID,
                        displayName: d.displayName || 'Anonymous',
                        amount: d.amount,
                        message: d.message,
                        createdDateUTC: d.createdDateUTC
                    };
                    io.to(`profile:${profile.id}`).emit('event:donation', { donation: donationObj, isMilestone: milestoneCrossed });
                    io.emit('event:donation', { donation: donationObj, isMilestone: milestoneCrossed });
                    
                    // Twitch Alert
                    if (profile.config.twitchEnableAlerts && profile.twitchClient && profile.twitchClient.readyState() === 'OPEN') {
                        const currencyPrefix = profile.config.currency === 'CAD' ? 'C$' : '$';
                        const amount = profile.config.currency === 'CAD' ? d.amount * profile.data.conversionRate : d.amount;
                        let chatMsg = `🚨 New Donation! ${d.displayName || 'Anonymous'} just donated ${currencyPrefix}${amount.toFixed(2)}!`;
                        if (d.message) chatMsg += ` "${d.message}"`;
                        profile.twitchClient.say(profile.config.twitchChannel, chatMsg);
                    }
                }
                profile.seenDonationIds.add(id);
            }
        }
        
        // Update local data store
        profile.data.donations = donationsJson.map(d => ({
            donationID: d.donationID,
            displayName: d.displayName || 'Anonymous',
            amount: d.amount,
            message: d.message,
            createdDateUTC: d.createdDateUTC
        }));
        
        // 3. Milestones
        const milestonesRes = await fetch(`https://dd.extra-life.org/api/participants/${profile.config.participantId}/milestones`);
        const milestonesJson = await milestonesRes.json();
        if (Array.isArray(milestonesJson)) {
            profile.data.milestones = milestonesJson.sort((a, b) => a.fundraisingGoal - b.fundraisingGoal);
        }

        // 4. Team Data
        let currentTeamId = profile.config.teamId;
        let configUpdated = false;

        if (profile.config.useParticipantTeamId && userJson.teamID) {
            const apiTeamId = String(userJson.teamID);
            if (apiTeamId !== String(profile.config.teamId)) {
                 profile.config.teamId = apiTeamId;
                 currentTeamId = apiTeamId;
                 configUpdated = true;
            }
        }
        
        if (configUpdated) {
            await saveProfileConfig(profile.id, profile.config);
            io.to(`profile:${profile.id}`).emit('config-updated', profile.config);
        }

        if (currentTeamId) {
             const teamRes = await fetch(`https://dd.extra-life.org/api/teams/${currentTeamId}`);
             const teamJson = await teamRes.json();
             if (teamJson) {
                 profile.data.teamTotalRaised = teamJson.sumDonations || 0;
                 profile.data.teamName = teamJson.name || '';
             }
        }

        await fetchProfileConversionRate(profile);

        profile.initialFetchComplete = true;

        // Broadcast Update to specific room
        io.to(`profile:${profile.id}`).emit('data-updated', profile.data);

    } catch (err) {
        console.error(`[${profile.id}] Error fetching data:`, err.message);
    }
}

function startProfilePolling(profile) {
    if (profile.pollingInterval) clearInterval(profile.pollingInterval);
    // Initial fetch
    fetchProfileData(profile);
    const intervalSecs = Math.max(60, Number(profile.config.refreshInterval) || 60);
    profile.pollingInterval = setInterval(() => fetchProfileData(profile), intervalSecs * 1000);
}


// --- SOCKET SERVER SETUP ---

io.on('connection', (socket) => {
    
    // Client MUST join a profile
    socket.on('join-profile', async (profileId = 'default') => {
        // Leave other rooms? Socket.io handles mult-rooms fine, but logic usually implies 1 profile per view
        socket.join(`profile:${profileId}`);
        console.log(`Client joined profile: ${profileId}`);

        const profile = await getOrCreateProfile(profileId);
        
        // Send initial state
        socket.emit('init-state', { config: profile.config, data: profile.data, profileId });
    });

    socket.on('update-config', async ({ profileId, config: newConfig }) => {
        const profile = await getOrCreateProfile(profileId || 'default');
        
        const oldInterval = profile.config.refreshInterval;
        const oldId = profile.config.participantId;
        const oldCurrency = profile.config.currency;
        const oldTwitchChannel = profile.config.twitchChannel;
        const oldTwitchToken = profile.config.twitchToken;
        const oldTwitchEnabled = profile.config.twitchEnabled;
        
        // Merge and Save
        profile.config = { ...profile.config, ...newConfig };
        if (profile.config.refreshInterval !== undefined) {
            profile.config.refreshInterval = Math.max(60, Number(profile.config.refreshInterval) || 60);
        }
        await saveProfileConfig(profile.id, profile.config);
        
        // Force Participant ID Sync again to be safe
        if (profile.id !== 'default') {
             profile.config.participantId = profile.id;
        }
        
        // Twitch Reconnect logic
        if (oldTwitchChannel !== profile.config.twitchChannel || 
            oldTwitchToken !== profile.config.twitchToken || 
            oldTwitchEnabled !== profile.config.twitchEnabled) {
            setupProfileTwitchClient(profile);
        }

        // If ID changed, reset tracking
        if (oldId !== profile.config.participantId) {
            profile.seenDonationIds.clear();
            profile.data.donations = [];
            profile.data.totalRaised = 0;
            profile.initialFetchComplete = false;
        }

        // Currency
        if (oldCurrency !== profile.config.currency) {
            await fetchProfileConversionRate(profile);
        }
        
        // Broadcast config update to everyone on this profile
        io.to(`profile:${profile.id}`).emit('config-updated', profile.config);

        // Polling
        if (oldInterval !== profile.config.refreshInterval || oldId !== profile.config.participantId) {
            startProfilePolling(profile);
        } else {
            io.to(`profile:${profile.id}`).emit('data-updated', profile.data);
        }
    });

    socket.on('trigger-sync', async (profileId = 'default') => {
        const profile = await getOrCreateProfile(profileId);
        fetchProfileData(profile);
    });

    socket.on('trigger-test', async (profileId = 'default') => {
        const profile = await getOrCreateProfile(profileId);
        const testAmount = 15.00;
        const previousTotal = profile.data.totalRaised;
        
        profile.data.totalRaised += testAmount;
        
        const fakeDonation = {
            donationID: `test-${Date.now()}`,
            displayName: "Test Donor",
            amount: testAmount,
            message: "Test donation!",
            createdDateUTC: new Date().toISOString()
        };

        const passedMilestones = profile.data.milestones.filter(m => 
            previousTotal < m.fundraisingGoal && profile.data.totalRaised >= m.fundraisingGoal
        );
        const passedGoal = previousTotal < profile.data.goal && profile.data.totalRaised >= profile.data.goal;

        let isMilestone = false;

        if (passedMilestones.length > 0) {
            isMilestone = true;
            io.to(`profile:${profile.id}`).emit('event:celebration', { type: 'milestone', milestone: passedMilestones[0] });
            if (profile.config.twitchEnableAlerts && profile.twitchClient && profile.twitchClient.readyState() === 'OPEN') {
                profile.twitchClient.say(profile.config.twitchChannel, `🎉 MILESTONE UNLOCKED: ${passedMilestones[0].description}!`);
            }
        } else if (passedGoal) {
            isMilestone = true;
            io.to(`profile:${profile.id}`).emit('event:celebration', { type: 'milestone', milestone: { description: 'Fundraising Goal Reached!' } });
            if (profile.config.twitchEnableAlerts && profile.twitchClient && profile.twitchClient.readyState() === 'OPEN') {
                profile.twitchClient.say(profile.config.twitchChannel, `🎉 GOAL REACHED! We did it!`);
            }
        }

        io.to(`profile:${profile.id}`).emit('event:donation', { donation: fakeDonation, isMilestone: isMilestone });
        
        if (profile.config.twitchEnableAlerts && profile.twitchClient && profile.twitchClient.readyState() === 'OPEN') {
            const currencyPrefix = profile.config.currency === 'CAD' ? 'C$' : '$';
            const amount = profile.config.currency === 'CAD' ? testAmount * profile.data.conversionRate : testAmount;
            profile.twitchClient.say(profile.config.twitchChannel, `[TEST] 🚨 New Donation! Test Donor just donated ${currencyPrefix}${amount.toFixed(2)}!`);
        }

        io.to(`profile:${profile.id}`).emit('data-updated', profile.data);
    });

    socket.on('trigger-clear', (profileId = 'default') => {
        io.to(`profile:${profileId}`).emit('event:clear');
    });
});

// Start only if this is the main module
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    // Pre-load default profile
    getOrCreateProfile('default').then(() => {
        httpServer.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
            console.log("Multi-user support enabled. Use ?profile=username in URL.");
            
            // Log LAN IP
            const interfaces = os.networkInterfaces();
            for (const name of Object.keys(interfaces)) {
                for (const iface of interfaces[name]) {
                    // Skip internal (non-127.0.0.1) and non-IPv4 addresses
                    if (iface.family === 'IPv4' && !iface.internal) {
                        console.log(`Network (LAN): http://${iface.address}:${PORT}`);
                    }
                }
            }
        });
    });
}


// --- TEST EXPORTS & LEGACY ADAPTERS ---

export { getOrCreateProfile, profiles };

export function resetState() {
    profiles.clear();
    // Initialize default profile immediately for tests
    const p = new Profile('default');
    profiles.set('default', p);
}

// Proxy config to default profile
export const config = new Proxy({}, {
    get(target, prop) {
        if (!profiles.has('default')) resetState();
        return profiles.get('default').config[prop];
    },
    set(target, prop, value) {
        if (!profiles.has('default')) resetState();
        profiles.get('default').config[prop] = value;
        return true;
    }
});

// Proxy data to default profile
export const data = new Proxy({}, {
    get(target, prop) {
        if (!profiles.has('default')) resetState();
        return profiles.get('default').data[prop];
    },
    set(target, prop, value) {
        if (!profiles.has('default')) resetState();
        profiles.get('default').data[prop] = value;
        return true;
    }
});

// Proxy seenDonationIds to default profile
export const seenDonationIds = new Proxy({}, {
    get(target, prop) {
        if (!profiles.has('default')) resetState();
        const set = profiles.get('default').seenDonationIds;
        const value = set[prop];
        return typeof value === 'function' ? value.bind(set) : value;
    }
});

export const setupTwitchClient = async () => {
    const p = await getOrCreateProfile('default');
    return setupProfileTwitchClient(p);
};

export const fetchData = (profileId = 'default') => {
    // Adapter for legacy tests that expect fetchData() without args
    // Ensure profile exists
    if (!profiles.has(profileId)) {
        // For tests calling fetchData without going through getOrCreateProfile
         const p = new Profile(profileId);
         profiles.set(profileId, p);
    }
    const profile = profiles.get(profileId);
    return fetchProfileData(profile);
};