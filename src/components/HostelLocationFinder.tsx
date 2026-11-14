'use client';

import React, { useEffect, useRef, useState } from 'react';
import FaIcon from '@/components/FaIcon';
import { getCampusGate, isValidLatLng } from '@/lib/campus-gates';

export interface LocatedCandidate {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  area: string;
  address: string;
  landmark: string;
  provider: 'Google Maps' | 'Google Maps Link' | 'OpenStreetMap' | 'Hostel Directory';
  googleMapsUrl: string;
  straightMeters: number;
  routeMeters: number;
  walkMinutes: number;
  routeMode: 'walking_route' | 'straight_line';
  distanceLabel: string;
  gateName: string;
  score: number;
}

interface HostelLocationFinderProps {
  hostelName: string;
  campus: string;
  lat: string;
  lng: string;
  distanceLabel: string;
  autoLookupOnTyping?: boolean;
  onApplyLocation: (payload: {
    lat: number;
    lng: number;
    distanceLabel: string;
    area?: string;
    address?: string;
    landmark?: string;
    detectedName?: string;
  }) => void;
  onDistanceTextChange?: (next: string) => void;
}

export default function HostelLocationFinder({
  hostelName,
  campus,
  lat,
  lng,
  distanceLabel,
  autoLookupOnTyping = false,
  onApplyLocation,
  onDistanceTextChange,
}: HostelLocationFinderProps) {
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<LocatedCandidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showMapsLinkBox, setShowMapsLinkBox] = useState(false);
  const [mapsLinkInput, setMapsLinkInput] = useState('');
  const [hasPinnedCoords, setHasPinnedCoords] = useState(false);

  const lastSearchedKeyRef = useRef('');
  const prevCampusRef = useRef(campus);
  const manualPinLockRef = useRef(false);
  const requestSeqRef = useRef(0);

  const gate = getCampusGate(campus);
  const numericLat = parseFloat(lat);
  const numericLng = parseFloat(lng);
  const coordsReady = isValidLatLng(numericLat, numericLng);

  const applyCandidate = (item: LocatedCandidate, overwriteTextFields = true) => {
    setSelectedCandidateId(item.id);
    setHasPinnedCoords(true);
    setErrorMessage('');
    onApplyLocation({
      lat: item.lat,
      lng: item.lng,
      distanceLabel: item.distanceLabel,
      ...(overwriteTextFields
        ? {
            area: item.area,
            address: item.address,
            landmark: item.landmark,
            detectedName: item.name,
          }
        : {}),
    });
  };

  const runLookup = async (rawQuery: string, isMapsLink = false) => {
    const cleaned = rawQuery.trim();
    if (cleaned.length < 2) {
      setErrorMessage('Enter at least 2 characters of the hostel name first.');
      return;
    }

    const seq = ++requestSeqRef.current;
    setSearching(true);
    setErrorMessage('');
    setStatusMessage(
      isMapsLink
        ? 'Reading coordinates from Google Maps link...'
        : `Searching map locations near ${gate.gateName}...`
    );

    try {
      const res = await fetch('/api/v1/geo/locate-hostel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'lookup',
          query: isMapsLink ? hostelName.trim() : cleaned,
          mapsUrl: isMapsLink ? cleaned : '',
          campus,
        }),
      });
      const data = await res.json();

      if (seq !== requestSeqRef.current) return;

      if (!data.success) {
        setCandidates([]);
        setStatusMessage('');
        setErrorMessage(data.error || 'Could not detect location on maps.');
        return;
      }

      const found: LocatedCandidate[] = Array.isArray(data.candidates)
        ? data.candidates
        : [];
      setCandidates(found);

      if (found.length > 0 && data.bestMatch) {
        if (isMapsLink) manualPinLockRef.current = true;
        applyCandidate(data.bestMatch, !isMapsLink);
        setStatusMessage(
          `Pinned via ${data.bestMatch.provider} • Measured to ${gate.gateName}`
        );
        if (isMapsLink) setShowMapsLinkBox(false);
      } else {
        setStatusMessage('');
        setErrorMessage(
          data.message ||
            `No automatic map pin found for "${cleaned}". Paste a Google Maps link or use current GPS.`
        );
      }
    } catch {
      if (seq !== requestSeqRef.current) return;
      setStatusMessage('');
      setErrorMessage('Network error while contacting map lookup.');
    } finally {
      if (seq === requestSeqRef.current) {
        setSearching(false);
      }
    }
  };

  const recalculateDistanceForCoords = async (targetLat: number, targetLng: number, targetCampus: string) => {
    if (!isValidLatLng(targetLat, targetLng)) return;
    const seq = ++requestSeqRef.current;
    setSearching(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/v1/geo/locate-hostel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'distance',
          lat: targetLat,
          lng: targetLng,
          campus: targetCampus,
        }),
      });
      const data = await res.json();
      if (seq !== requestSeqRef.current) return;

      if (data.success && data.distance) {
        const updatedLabel = data.distance.distanceLabel;
        onApplyLocation({
          lat: targetLat,
          lng: targetLng,
          distanceLabel: updatedLabel,
        });
        setCandidates(prev =>
          prev.map(c =>
            c.id === selectedCandidateId
              ? {
                  ...c,
                  straightMeters: data.distance.straightMeters,
                  routeMeters: data.distance.routeMeters,
                  walkMinutes: data.distance.walkMinutes,
                  routeMode: data.distance.routeMode,
                  distanceLabel: updatedLabel,
                  gateName: data.distance.gateName,
                }
              : c
          )
        );
        setStatusMessage(`Distance updated to ${getCampusGate(targetCampus).gateName}`);
      }
    } catch {
      // Non-fatal fallback
    } finally {
      if (seq === requestSeqRef.current) {
        setSearching(false);
      }
    }
  };

  const handleUseCurrentGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setErrorMessage('Browser GPS is not available on this device.');
      return;
    }

    setSearching(true);
    setErrorMessage('');
    setStatusMessage('Reading device GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      async pos => {
        manualPinLockRef.current = true;
        setHasPinnedCoords(true);
        setSelectedCandidateId(null);
        await recalculateDistanceForCoords(
          pos.coords.latitude,
          pos.coords.longitude,
          campus
        );
        setStatusMessage(`Using live device GPS • Measured to ${gate.gateName}`);
      },
      () => {
        setSearching(false);
        setStatusMessage('');
        setErrorMessage('Location permission denied. Search by hostel name or paste a Google Maps link.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Debounced auto-lookup as broker types hostel name
  useEffect(() => {
    if (!autoLookupOnTyping) return;
    const trimmed = hostelName.trim();
    if (trimmed.length < 4) return;
    if (manualPinLockRef.current) return;

    const searchKey = `${trimmed.toLowerCase()}|${campus}`;
    if (lastSearchedKeyRef.current === searchKey) return;

    const timer = setTimeout(() => {
      lastSearchedKeyRef.current = searchKey;
      runLookup(trimmed, false);
    }, 750);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostelName, campus, autoLookupOnTyping]);

  // Recalculate Main Gate distance automatically whenever University Campus selection changes
  useEffect(() => {
    if (prevCampusRef.current === campus) return;
    prevCampusRef.current = campus;

    if (!coordsReady) return;
    if (hasPinnedCoords || !autoLookupOnTyping) {
      recalculateDistanceForCoords(numericLat, numericLng, campus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campus]);

  const activeCandidate =
    candidates.find(c => c.id === selectedCandidateId) || null;

  const pinGoogleMapsUrl = coordsReady
    ? `https://www.google.com/maps/search/?api=1&query=${numericLat},${numericLng}`
    : '';

  return (
    <div className="rounded-2xl border border-[#0f3a98]/20 bg-[#edf2fc]/60 p-3.5 sm:p-4 space-y-3">
      {/* Header Strip */}
      <div className="flex flex-col items-center text-center gap-2 sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <span className="w-7 h-7 rounded-lg bg-[#0f3a98] text-[#ffbe00] flex items-center justify-center shrink-0">
            <FaIcon icon="fa-solid fa-route" className="text-xs" />
          </span>
          <div>
            <p className="text-xs font-semibold text-[#0f3a98]">
              Smart Map Pin &amp; Main Gate Distance
            </p>
            <p className="text-[11px] text-slate-600">
              Auto-reads coordinates &amp; measures walk distance to {gate.shortGateName}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 shrink-0">
          <button
            type="button"
            disabled={searching}
            onClick={() => {
              manualPinLockRef.current = false;
              runLookup(hostelName, false);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0f3a98] hover:bg-[#0a2666] text-white text-[11px] font-medium transition disabled:opacity-60"
          >
            <FaIcon
              icon={searching ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-magnifying-glass'}
              className="text-[#ffbe00] text-[10px]"
            />
            {searching ? 'Detecting...' : 'Detect on Map'}
          </button>

          <button
            type="button"
            onClick={() => setShowMapsLinkBox(prev => !prev)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-[#0f3a98]/40 text-[#0f3a98] text-[11px] font-medium transition"
          >
            <FaIcon icon="fa-solid fa-link" className="text-[10px]" />
            Google Maps Link
          </button>

          <button
            type="button"
            disabled={searching}
            onClick={handleUseCurrentGps}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-[#0f3a98]/40 text-slate-700 text-[11px] font-medium transition disabled:opacity-60"
          >
            <FaIcon icon="fa-solid fa-crosshairs" className="text-[#0f3a98] text-[10px]" />
            My GPS
          </button>
        </div>
      </div>

      {/* Optional Google Maps Share Link / Coordinate Input */}
      {showMapsLinkBox && (
        <div className="bg-white rounded-xl border border-slate-200 p-2.5 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={mapsLinkInput}
            onChange={e => setMapsLinkInput(e.target.value)}
            placeholder="Paste Google Maps share link or lat, lng (e.g. 0.3359, 32.5604)"
            className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f3a98]"
          />
          <button
            type="button"
            disabled={searching || !mapsLinkInput.trim()}
            onClick={() => runLookup(mapsLinkInput, true)}
            className="px-3 py-1.5 rounded-lg bg-[#0f3a98] text-[#ffbe00] text-xs font-medium shrink-0 disabled:opacity-50"
          >
            Pin &amp; Measure
          </button>
        </div>
      )}

      {/* Multiple Map Candidate Switcher */}
      {candidates.length > 1 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-[#0f3a98] text-center sm:text-left">
            {candidates.length} map matches found — select exact building:
          </p>
          <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
            {candidates.map(item => {
              const active = item.id === selectedCandidateId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    manualPinLockRef.current = false;
                    applyCandidate(item, true);
                    setStatusMessage(`Selected ${item.name} • ${item.distanceLabel}`);
                  }}
                  className={`text-left px-2.5 py-1.5 rounded-xl border text-[11px] transition ${
                    active
                      ? 'bg-[#0f3a98] border-[#0f3a98] text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-[#0f3a98]/40'
                  }`}
                >
                  <span className="font-semibold block">{item.name}</span>
                  <span className={`text-[10px] ${active ? 'text-[#ffbe00]' : 'text-slate-500'}`}>
                    {item.area} •{' '}
                    {item.routeMeters >= 1000
                      ? `${(item.routeMeters / 1000).toFixed(1)} km`
                      : `${item.routeMeters} m`}{' '}
                    to Gate
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Live Measured Distance & Pin Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <FaIcon
              icon="fa-solid fa-location-dot"
              className="text-[#0f3a98] text-sm shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[11px] text-slate-500 font-medium">
                Calculated Distance to <span className="text-[#0f3a98] font-semibold">{gate.gateName}</span>
              </p>
              <p className="text-xs font-semibold text-slate-900 truncate">
                {distanceLabel || 'Waiting for map pin or hostel name...'}
              </p>
            </div>
          </div>

          {coordsReady && (
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[10px]">
                {numericLat.toFixed(5)}, {numericLng.toFixed(5)}
              </span>
              {activeCandidate && (
                <span className="px-2 py-0.5 rounded-md bg-[#0f3a98] text-[#ffbe00] text-[10px] font-medium">
                  {activeCandidate.routeMode === 'walking_route' ? 'Street Route' : 'GPS Distance'}
                </span>
              )}
              <a
                href={pinGoogleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-[#0f3a98]/30 text-[#0f3a98] hover:bg-[#edf2fc] text-[10px] font-medium transition"
              >
                Verify Pin
                <FaIcon icon="fa-solid fa-arrow-up-right-from-square" className="text-[9px]" />
              </a>
            </div>
          )}
        </div>

        {/* Editable Distance Display Text (sent to students on hostel cards) */}
        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            Distance Label Shown to Students (auto-filled, editable)
          </label>
          <input
            type="text"
            value={distanceLabel}
            onChange={e => onDistanceTextChange?.(e.target.value)}
            placeholder={`e.g. 650 m (9 min walk) to ${gate.shortGateName}`}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f3a98]"
          />
        </div>

        {statusMessage && !errorMessage && (
          <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1.5">
            <FaIcon icon="fa-solid fa-circle-check" className="text-xs shrink-0" />
            <span>{statusMessage}</span>
          </p>
        )}

        {errorMessage && (
          <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 font-medium">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}

