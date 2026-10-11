/**
 * =============================================================================
 * EXTRA LIFE TRACKER - USE EXTRA LIFE DATA HOOK
 * =============================================================================
 * Handles fetching participant details, donations, milestones, team statistics,
 * currency conversions (USD/CAD), and periodic background polling.
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { MIN_REFRESH_INTERVAL } from '../constants.js';
import { loadStoredData, saveStoredData } from '../storage.js';

export function useExtraLifeData({
  config,
  currentProfile,
  isStandaloneMode = false,
  overlayType = 'none',
  socketConnected = false,
  onNewDonation,
  onMilestoneCrossed,
  onDataUpdated,
  onAutoTeamDetected
}) {
  const initialData = useMemo(() => loadStoredData(currentProfile) || {}, [currentProfile]);

  const [donations, setDonations] = useState(initialData.donations || []);
  const [milestones, setMilestones] = useState(initialData.milestones || []);
  const [totalRaised, setTotalRaised] = useState(initialData.totalRaised || 0);
  const [goal, setGoal] = useState(initialData.goal || 0);
  const [participantName, setParticipantName] = useState(initialData.participantName || '');

  const [teamTotalRaised, setTeamTotalRaised] = useState(initialData.teamTotalRaised || 0);
  const [teamGoal, setTeamGoal] = useState(initialData.teamGoal || 0);
  const [teamName, setTeamName] = useState(initialData.teamName || '');
  const [teamDonations, setTeamDonations] = useState(initialData.teamDonations || []);
  const [teamParticipants, setTeamParticipants] = useState(initialData.teamParticipants || []);

  const [conversionRate, setConversionRate] = useState(initialData.conversionRate || 1.0);
  const [lastFetchedAt, setLastFetchedAt] = useState(
    initialData.lastFetchedAt ? new Date(initialData.lastFetchedAt) : null
  );

  const seenDonationIdsRef = useRef(new Set());
  const lastFetchTimeRef = useRef(0);
  const isFetchingRef = useRef(false);

  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const totalRaisedRef = useRef(totalRaised);
  useEffect(() => {
    totalRaisedRef.current = totalRaised;
  }, [totalRaised]);

  const currentProfileRef = useRef(currentProfile);
  useEffect(() => {
    currentProfileRef.current = currentProfile;
  }, [currentProfile]);

  // Currency Prefix
  const currencyPrefix = useMemo(() => (config.currency === 'USD' ? '$' : 'C$'), [config.currency]);

  // Live Exchange Rate Fetcher
  const fetchConversionRate = useCallback(async () => {
    const currentConf = configRef.current;
    if (currentConf.currency !== 'CAD') {
      setConversionRate(1.0);
      return 1.0;
    }

    const customRate = Number(currentConf.customExchangeRate);
    if (customRate && !isNaN(customRate) && customRate > 0) {
      setConversionRate(customRate);
      return customRate;
    }

    // Primary: open.er-api.com
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

    // Fallback: exchangerate-api.com
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

    // Offline / hard fallback rate
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

  const convertAmount = useCallback((amount) => {
    if (config.currency === 'CAD') {
      return (Number(amount) || 0) * effectiveRate;
    }
    return Number(amount) || 0;
  }, [config.currency, effectiveRate]);

  // Sync exchange rate on currency change
  useEffect(() => {
    if (config.currency === 'CAD') {
      fetchConversionRate().then(rate => {
        const stored = loadStoredData(currentProfileRef.current) || {};
        const updated = { ...stored, conversionRate: rate };
        saveStoredData(currentProfileRef.current, updated);
        onDataUpdated?.(updated);
      });
    } else {
      setConversionRate(1.0);
    }
  }, [config.currency, config.customExchangeRate, fetchConversionRate, onDataUpdated]);

  const sortedDonations = useMemo(() => {
    return [...donations].sort((a, b) => new Date(b.createdDateUTC).getTime() - new Date(a.createdDateUTC).getTime());
  }, [donations]);

  const progressPercentage = useMemo(() => {
    if (goal <= 0) return 0;
    return Math.min((totalRaised / goal) * 100, 100);
  }, [totalRaised, goal]);

  // Core Data Fetcher for DonorDrive
  const fetchClientSideData = useCallback(async () => {
    const currentConf = configRef.current;
    const pid = currentConf.participantId;
    const explicitTeamId = currentConf.teamId;
    const useAutoTeam = !!currentConf.useParticipantTeamId;

    if (!pid && !explicitTeamId) return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      let partData = null;
      let donData = [];
      let mileData = [];

      // 1. Participant Details (Use dd.extra-life.org for CORS support)
      if (pid) {
        try {
          const partRes = await fetch(`https://dd.extra-life.org/api/participants/${pid}`);
          if (partRes.ok) {
            partData = await partRes.json();
          }
        } catch (e) {}

        // 2. Donations
        try {
          const donRes = await fetch(
            `https://dd.extra-life.org/api/participants/${pid}/donations?limit=100&orderBy=createdDateUTC&orderDirection=DESC`
          );
          if (donRes.ok) {
            donData = await donRes.json();
          }
        } catch (e) {}

        // 3. Milestones
        try {
          const mileRes = await fetch(`https://dd.extra-life.org/api/participants/${pid}/milestones`);
          if (mileRes.ok) {
            const rawMileData = await mileRes.json();
            if (Array.isArray(rawMileData)) {
              mileData = [...rawMileData].sort((a, b) => (a.fundraisingGoal || 0) - (b.fundraisingGoal || 0));
            }
          }
        } catch (e) {}
      }

      // Auto-detect Team ID
      let targetTeamId = explicitTeamId;
      if (useAutoTeam && partData?.teamID) {
        targetTeamId = String(partData.teamID);
        if (targetTeamId !== currentConf.teamId) {
          onAutoTeamDetected?.(targetTeamId);
        }
      }

      // 4. Team Details (optional)
      let tRaised = 0;
      let tGoal = 0;
      let tName = '';
      let tDonations = [];
      let tParticipants = [];

      if (targetTeamId) {
        try {
          const [teamRes, teamDonRes, teamPartRes] = await Promise.all([
            fetch(`https://dd.extra-life.org/api/teams/${targetTeamId}`).catch(() => null),
            fetch(`https://dd.extra-life.org/api/teams/${targetTeamId}/donations?limit=100&orderBy=createdDateUTC&orderDirection=DESC`).catch(() => null),
            fetch(`https://dd.extra-life.org/api/teams/${targetTeamId}/participants`).catch(() => null)
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

      // 5. Currency Rate
      let cRate = effectiveRate;
      if (currentConf.currency === 'CAD') {
        cRate = await fetchConversionRate();
      }

      // Identify new donations
      const isFirstFetch = seenDonationIdsRef.current.size === 0;
      const newDonations = [];
      donData.forEach((d) => {
        if (!seenDonationIdsRef.current.has(d.donationID)) {
          seenDonationIdsRef.current.add(d.donationID);
          if (!isFirstFetch) {
            newDonations.push(d);
          }
        }
      });

      const newRaised = partData ? (partData.sumDonations || 0) : totalRaisedRef.current;
      const newGoal = partData ? (partData.fundraisingGoal || 0) : 0;
      const pName = partData ? (partData.displayName || '') : '';
      const previousTotal = totalRaisedRef.current;

      if (partData) {
        setParticipantName(pName);
        setTotalRaised(newRaised);
        setGoal(newGoal);
        setDonations(donData);
        setMilestones(mileData);
      }
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
        conversionRate: cRate,
        lastFetchedAt: Date.now()
      };

      saveStoredData(currentProfileRef.current, updatedPayload);
      onDataUpdated?.(updatedPayload);

      // Trigger donation alerts
      if (newDonations.length > 0) {
        newDonations.forEach(donation => {
          onNewDonation?.(donation, cRate);
        });

        // Trigger milestone or goal crossed celebration
        if (previousTotal > 0 && newRaised > previousTotal) {
          const crossedMilestone = mileData.some(
            m => previousTotal < m.fundraisingGoal && newRaised >= m.fundraisingGoal
          );
          if (crossedMilestone || (newGoal > 0 && previousTotal < newGoal && newRaised >= newGoal)) {
            onMilestoneCrossed?.();
          }
        }
      }

      const fetchTime = new Date();
      setLastFetchedAt(fetchTime);
      lastFetchTimeRef.current = Date.now();
    } catch (err) {
      console.warn('Extra Life client-side fetch notice:', err);
    } finally {
      isFetchingRef.current = false;
    }
  }, [effectiveRate, fetchConversionRate, onAutoTeamDetected, onDataUpdated, onMilestoneCrossed, onNewDonation]);

  // Periodic Polling
  useEffect(() => {
    if (!isStandaloneMode && overlayType === 'none' && socketConnected) return;
    if (!config.participantId && !config.teamId) return;

    const refreshSeconds = Math.max(MIN_REFRESH_INTERVAL, Number(config.refreshInterval) || 60);
    const intervalMs = refreshSeconds * 1000;

    const elapsed = Date.now() - lastFetchTimeRef.current;
    if (lastFetchTimeRef.current === 0 || elapsed >= intervalMs) {
      fetchClientSideData();
    }

    const timer = setInterval(() => {
      fetchClientSideData();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [
    isStandaloneMode,
    overlayType,
    socketConnected,
    config.participantId,
    config.teamId,
    config.useParticipantTeamId,
    config.refreshInterval,
    fetchClientSideData
  ]);

  return {
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
  };
}
