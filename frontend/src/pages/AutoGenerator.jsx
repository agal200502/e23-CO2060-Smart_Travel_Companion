import React, { useState, useEffect, useRef, useContext } from 'react';
import api from '../services/api';
import {
  generateItinerary,
  saveItinerary,
  getSavedItineraries,
  deleteItinerary,
  updateItinerary
} from '../services/itineraryService';
import { AuthContext } from '../context/AuthContext';
import {
  Sparkles, Calendar, Trash2, MapPin, Map, Navigation, Route,
  Clock, DollarSign, Heart, CheckSquare, Square, Hotel, Download,
  Printer, Bookmark, Edit3, ArrowRight, ArrowUp, ArrowDown, Plus, AlertCircle
} from 'lucide-react';

const DAY_COLORS = [
  '#00d4aa', '#f5a623', '#7c6dfa', '#e05c97',
  '#4ecdc4', '#ff6b6b', '#a8e063', '#ffd93d'
];

const INTEREST_OPTIONS = [
  { id: 'NATURE', label: 'Nature', icon: '🌿' },
  { id: 'BEACHES', label: 'Beaches', icon: '🏖️' },
  { id: 'HISTORY', label: 'History', icon: '🏛️' },
  { id: 'CULTURE', label: 'Culture', icon: '🛕' },
  { id: 'WILDLIFE', label: 'Wildlife', icon: '🐘' },
  { id: 'ADVENTURE', label: 'Adventure', icon: '🧗' },
  { id: 'MOUNTAINS', label: 'Mountains', icon: '⛰️' },
  { id: 'FOOD', label: 'Food & Culinary', icon: '🍲' },
  { id: 'PHOTOGRAPHY', label: 'Photography', icon: '📸' },
];

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const AutoGenerator = () => {
  const { user } = useContext(AuthContext);

  const [locations, setLocations] = useState([]);
  const [accommodations, setAccommodations] = useState([]);
  const [activeTab, setActiveTab] = useState('wizard');

  // Wizard state
  const [wizardStep, setWizardStep] = useState(1);
  const [days, setDays] = useState(3);
  const [startLocationId, setStartLocationId] = useState('');
  const [dailyStartTime, setDailyStartTime] = useState('08:30');
  const [pace, setPace] = useState('MODERATE');
  const [budgetTier, setBudgetTier] = useState('MEDIUM');
  const [selectedInterests, setSelectedInterests] = useState(['NATURE', 'HISTORY', 'CULTURE']);
  const [mustVisitIds, setMustVisitIds] = useState([]);

  // Generated / Current Itinerary State
  const [currentItinerary, setCurrentItinerary] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Saved Trips state
  const [savedTrips, setSavedTrips] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // Map state
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const routeLayersRef = useRef([]);

  useEffect(() => {
    fetchLocations();
    fetchAccommodations();
    loadSavedItineraries();

    const localDraft = localStorage.getItem('smartTravelDraftItinerary');
    if (localDraft) {
      try {
        setCurrentItinerary(JSON.parse(localDraft));
      } catch (e) {
        console.error('Failed to parse local draft:', e);
      }
    }
  }, []);

  // Handle map rendering when tab becomes active or itinerary changes
  useEffect(() => {
    if (activeTab === 'map') {
      const timer = setTimeout(() => {
        if (!mapInstanceRef.current) {
          initMap();
        } else {
          mapInstanceRef.current.invalidateSize();
          updateMap();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeTab, currentItinerary]);

  const fetchLocations = async () => {
    try {
      const res = await api.get('/locations');
      setLocations(res.data);
      if (res.data.length > 0 && !startLocationId) {
        setStartLocationId(res.data[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to fetch locations:', err);
    }
  };

  const fetchAccommodations = async () => {
    try {
      const res = await api.get('/accommodations');
      setAccommodations(res.data);
    } catch (err) {
      console.error('Failed to fetch accommodations:', err);
    }
  };

  const loadSavedItineraries = async () => {
    setLoadingSaved(true);
    try {
      const data = await getSavedItineraries();
      if (Array.isArray(data)) {
        setSavedTrips(data);
      }
    } catch (err) {
      console.error('Failed to fetch saved itineraries:', err);
    } finally {
      setLoadingSaved(false);
    }
  };

  // ── Schedule Recalculation Engine ──────────────────────────────────────

  const recalculateSchedule = (itineraryObj) => {
    if (!itineraryObj || !itineraryObj.days) return itineraryObj;

    const paceVal = itineraryObj.pace || 'MODERATE';
    const visitDuration = paceVal === 'RELAXED' ? 90 : paceVal === 'PACKED' ? 45 : 60;
    let grandTotalDist = 0;
    let grandTotalDrive = 0;

    let previousEndLoc = itineraryObj.startLocation;

    const recalculatedDays = itineraryObj.days.map((day, dIdx) => {
      let currentMins = 8 * 60 + 30; // default 08:30
      if (itineraryObj.dailyStartTime) {
        const parts = itineraryObj.dailyStartTime.split(':').map(Number);
        if (!isNaN(parts[0]) && !isNaN(parts[1])) currentMins = parts[0] * 60 + parts[1];
      }

      let dayDist = 0;
      let dayDrive = 0;
      let prevLoc = dIdx === 0 ? itineraryObj.startLocation : previousEndLoc;
      let lunchTaken = false;

      const recalculatedStops = (day.stops || []).map((stop, sIdx) => {
        const currentLoc = stop.location;
        let driveKm = 0;
        let driveMins = 0;

        if (prevLoc && currentLoc && prevLoc.id !== currentLoc.id && prevLoc.latitude && currentLoc.latitude) {
          driveKm = Math.round(haversine(prevLoc.latitude, prevLoc.longitude, currentLoc.latitude, currentLoc.longitude) * 1.2 * 10) / 10;
          driveMins = Math.max(5, Math.round((driveKm / 45) * 60));
        }

        currentMins += driveMins;
        dayDist += driveKm;
        dayDrive += driveMins;

        // Lunch break check between 12:00 (720 min) and 13:30 (810 min)
        if (!lunchTaken && currentMins >= 720 && currentMins <= 810) {
          currentMins += 45; // 45 min lunch break
          lunchTaken = true;
        }

        const arrH = Math.floor(currentMins / 60) % 24;
        const arrM = currentMins % 60;
        const arrivalStr = `${arrH.toString().padStart(2, '0')}:${arrM.toString().padStart(2, '0')}`;

        currentMins += visitDuration;

        const depH = Math.floor(currentMins / 60) % 24;
        const depM = currentMins % 60;
        const departureStr = `${depH.toString().padStart(2, '0')}:${depM.toString().padStart(2, '0')}`;

        prevLoc = currentLoc;

        return {
          ...stop,
          stopOrder: sIdx + 1,
          arrivalTime: arrivalStr,
          departureTime: departureStr,
          visitDuration: visitDuration,
          travelDistance: driveKm,
          travelDuration: driveMins
        };
      });

      if (recalculatedStops.length > 0) {
        previousEndLoc = recalculatedStops[recalculatedStops.length - 1].location;
      }

      grandTotalDist += dayDist;
      grandTotalDrive += dayDrive;

      return {
        ...day,
        totalDistance: Math.round(dayDist * 10) / 10,
        totalDriveMinutes: dayDrive,
        stops: recalculatedStops
      };
    });

    return {
      ...itineraryObj,
      totalDistance: Math.round(grandTotalDist * 10) / 10,
      totalDriveMinutes: grandTotalDrive,
      days: recalculatedDays
    };
  };

  // ── Auto-Generator Wizard Handlers ─────────────────────────────────────

  const toggleInterest = (interestId) => {
    setSelectedInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(i => i !== interestId)
        : [...prev, interestId]
    );
  };

  const toggleMustVisit = (locId) => {
    setMustVisitIds(prev =>
      prev.includes(locId)
        ? prev.filter(id => id !== locId)
        : [...prev, locId]
    );
  };

  const handleGenerate = async () => {
    if (!startLocationId) {
      setErrorMsg('Please select a starting location.');
      return;
    }

    setGenerating(true);
    setErrorMsg(null);
    setSaveSuccessMsg(null);

    const payload = {
      days: parseInt(days, 10),
      startLocationId: parseInt(startLocationId, 10),
      dailyStartTime,
      pace,
      budgetTier,
      interests: selectedInterests,
      mustVisitLocationIds: mustVisitIds,
      title: `${days}-Day Travel Itinerary`
    };

    try {
      const generated = await generateItinerary(payload);
      setCurrentItinerary(generated);
      localStorage.setItem('smartTravelDraftItinerary', JSON.stringify(generated));
      setActiveTab('timeline');
    } catch (err) {
      console.error('Backend generation error, generating client side fallback:', err);
      const fallback = buildClientSideItinerary(payload);
      setCurrentItinerary(fallback);
      localStorage.setItem('smartTravelDraftItinerary', JSON.stringify(fallback));
      setActiveTab('timeline');
    } finally {
      setGenerating(false);
    }
  };

  const buildClientSideItinerary = (payload) => {
    const startLoc = locations.find(l => l.id.toString() === payload.startLocationId.toString()) || locations[0];
    const candidatePool = locations.filter(l => l.id !== startLoc.id);

    const sorted = [...candidatePool].sort((a, b) =>
      haversine(startLoc.latitude, startLoc.longitude, a.latitude, a.longitude) -
      haversine(startLoc.latitude, startLoc.longitude, b.latitude, b.longitude)
    );

    const dayCount = payload.days;
    const daysData = [];
    let idx = 0;

    for (let d = 1; d <= dayCount; d++) {
      const dayStops = [];
      if (d === 1) dayStops.push(startLoc);

      const countForDay = Math.min(3, sorted.length - idx);
      for (let s = 0; s < countForDay; s++) {
        if (sorted[idx]) dayStops.push(sorted[idx++]);
      }

      let timeMins = 8 * 60 + 30; // 08:30
      let totalDist = 0;
      let totalDrive = 0;

      const scheduledStops = dayStops.map((loc, i) => {
        let driveDist = 0;
        let driveTime = 0;
        if (i > 0) {
          const prev = dayStops[i - 1];
          driveDist = Math.round(haversine(prev.latitude, prev.longitude, loc.latitude, loc.longitude) * 1.2 * 10) / 10;
          driveTime = Math.max(10, Math.round((driveDist / 45) * 60));
          timeMins += driveTime;
          totalDist += driveDist;
          totalDrive += driveTime;
        }

        const arr = `${Math.floor(timeMins / 60).toString().padStart(2, '0')}:${(timeMins % 60).toString().padStart(2, '0')}`;
        const visitDur = 60;
        timeMins += visitDur;
        const dep = `${Math.floor(timeMins / 60).toString().padStart(2, '0')}:${(timeMins % 60).toString().padStart(2, '0')}`;

        return {
          id: i + 1,
          location: loc,
          stopOrder: i + 1,
          arrivalTime: arr,
          departureTime: dep,
          visitDuration: visitDur,
          travelDistance: driveDist,
          travelDuration: driveTime
        };
      });

      const endLoc = dayStops[dayStops.length - 1] || startLoc;
      const recStay = accommodations.find(a => a.locationId === endLoc.id) || accommodations[0] || null;

      daysData.push({
        id: d,
        dayNumber: d,
        date: new Date(Date.now() + (d - 1) * 86400000).toISOString().split('T')[0],
        totalDistance: Math.round(totalDist * 10) / 10,
        totalDriveMinutes: totalDrive,
        recommendedStay: recStay,
        stops: scheduledStops
      });
    }

    return {
      title: `${payload.days}-Day Sri Lanka Tour starting from ${startLoc.name}`,
      startLocation: startLoc,
      startDate: new Date().toISOString().split('T')[0],
      numberOfDays: payload.days,
      pace: payload.pace,
      budgetTier: payload.budgetTier,
      dailyStartTime: payload.dailyStartTime,
      totalDistance: Math.round(daysData.reduce((acc, d) => acc + d.totalDistance, 0) * 10) / 10,
      totalDriveMinutes: daysData.reduce((acc, d) => acc + d.totalDriveMinutes, 0),
      days: daysData
    };
  };

  // ── Save & Persistence Handlers ────────────────────────────────────────

  const handleSaveItinerary = async () => {
    if (!currentItinerary) return;
    setSaving(true);
    setErrorMsg(null);
    setSaveSuccessMsg(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMsg('You are not logged in. Please log in to save itineraries to your account.');
      setSaving(false);
      return;
    }

    try {
      let saved;
      if (currentItinerary.id) {
        saved = await updateItinerary(currentItinerary.id, currentItinerary);
      } else {
        saved = await saveItinerary(currentItinerary);
      }
      setCurrentItinerary(saved);
      localStorage.setItem('smartTravelDraftItinerary', JSON.stringify(saved));
      setSaveSuccessMsg('Itinerary saved successfully to your account!');

      // Update savedTrips state immediately in frontend
      try {
        const refreshedList = await getSavedItineraries();
        if (Array.isArray(refreshedList) && refreshedList.length > 0) {
          setSavedTrips(refreshedList);
        } else if (saved) {
          setSavedTrips(prev => [saved, ...prev.filter(t => t.id !== saved.id)]);
        }
      } catch (e) {
        if (saved) setSavedTrips(prev => [saved, ...prev.filter(t => t.id !== saved.id)]);
      }
    } catch (err) {
      console.error('Failed to save itinerary:', err);
      if (err.response?.status === 401) {
        setErrorMsg('Your login session has expired. Please log in again to save your itinerary.');
      } else {
        setErrorMsg(err.response?.data?.message || err.response?.data || 'Failed to save itinerary. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSavedTrip = async (tripId) => {
    if (!window.confirm('Are you sure you want to delete this saved itinerary?')) return;
    try {
      await deleteItinerary(tripId);
      setSavedTrips(prev => prev.filter(t => t.id !== tripId));
      if (currentItinerary?.id === tripId) {
        setCurrentItinerary(null);
        localStorage.removeItem('smartTravelDraftItinerary');
      }
    } catch (err) {
      console.error('Failed to delete itinerary:', err);
      alert('Failed to delete itinerary.');
    }
  };

  const handleLoadSavedTrip = (trip) => {
    setCurrentItinerary(trip);
    localStorage.setItem('smartTravelDraftItinerary', JSON.stringify(trip));
    setActiveTab('timeline');
  };

  // ── Stop Manipulation (Reorder / Remove / Add) with Auto Recalculate ──

  const handleRemoveStop = (dayIndex, stopIndex) => {
    if (!currentItinerary) return;
    const updatedDays = [...currentItinerary.days];
    const day = { ...updatedDays[dayIndex] };
    day.stops = day.stops.filter((_, idx) => idx !== stopIndex);
    updatedDays[dayIndex] = day;

    const updated = recalculateSchedule({ ...currentItinerary, days: updatedDays });
    setCurrentItinerary(updated);
    localStorage.setItem('smartTravelDraftItinerary', JSON.stringify(updated));
  };

  const handleMoveStop = (dayIndex, stopIndex, direction) => {
    if (!currentItinerary) return;
    const updatedDays = [...currentItinerary.days];
    const day = { ...updatedDays[dayIndex] };
    const stops = [...day.stops];

    const targetIndex = stopIndex + direction;
    if (targetIndex < 0 || targetIndex >= stops.length) return;

    [stops[stopIndex], stops[targetIndex]] = [stops[targetIndex], stops[stopIndex]];
    day.stops = stops;
    updatedDays[dayIndex] = day;

    const updated = recalculateSchedule({ ...currentItinerary, days: updatedDays });
    setCurrentItinerary(updated);
    localStorage.setItem('smartTravelDraftItinerary', JSON.stringify(updated));
  };

  const handleAddStopToDay = (dayIndex, locationId) => {
    if (!currentItinerary) return;
    const loc = locations.find(l => l.id.toString() === locationId.toString());
    if (!loc) return;

    const updatedDays = [...currentItinerary.days];
    const day = { ...updatedDays[dayIndex] };
    const newStop = {
      location: loc,
      stopOrder: (day.stops?.length || 0) + 1,
      visitDuration: 60,
      travelDistance: 0,
      travelDuration: 0
    };

    day.stops = [...(day.stops || []), newStop];
    updatedDays[dayIndex] = day;

    const updated = recalculateSchedule({ ...currentItinerary, days: updatedDays });
    setCurrentItinerary(updated);
    localStorage.setItem('smartTravelDraftItinerary', JSON.stringify(updated));
  };

  // ── Leaflet Multi-Day Map Implementation with OSRM Road Routes ──────────

  const initMap = () => {
    if (!mapRef.current || mapInstanceRef.current || !window.L) return;
    const L = window.L;
    const map = L.map(mapRef.current, { center: [7.8731, 80.7718], zoom: 8 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors', maxZoom: 18,
    }).addTo(map);
    mapInstanceRef.current = map;
    map.invalidateSize();
    updateMap();
  };

  const clearMap = () => {
    if (!mapInstanceRef.current) return;
    markersRef.current.forEach(m => mapInstanceRef.current.removeLayer(m));
    markersRef.current = [];
    routeLayersRef.current.forEach(l => mapInstanceRef.current.removeLayer(l));
    routeLayersRef.current = [];
  };

  const updateMap = async () => {
    if (!mapInstanceRef.current || !window.L || !currentItinerary) return;
    clearMap();

    const L = window.L;
    const map = mapInstanceRef.current;
    map.invalidateSize();
    const allLatLngs = [];

    for (let dIdx = 0; dIdx < (currentItinerary.days || []).length; dIdx++) {
      const day = currentItinerary.days[dIdx];
      const dayColor = DAY_COLORS[dIdx % DAY_COLORS.length];
      const validStops = (day.stops || []).filter(s => s.location && s.location.latitude && s.location.longitude);
      const dayLatLngs = [];

      validStops.forEach((stop, sIdx) => {
        const lat = parseFloat(stop.location.latitude);
        const lng = parseFloat(stop.location.longitude);
        dayLatLngs.push([lat, lng]);
        allLatLngs.push([lat, lng]);

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width:34px;height:34px;border-radius:50%;
            background:${dayColor};color:#000;
            display:flex;align-items:center;justify-content:center;
            font-weight:bold;font-size:13px;
            border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.4);
          ">D${day.dayNumber}-${sIdx + 1}</div>`,
          iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -20],
        });

        const marker = L.marker([lat, lng], { icon }).addTo(map)
          .bindPopup(`
            <div style="font-family:sans-serif;min-width:180px;">
              <div style="font-size:11px;color:${dayColor};font-weight:bold;text-transform:uppercase;">
                Day ${day.dayNumber} — Stop ${sIdx + 1}
              </div>
              <div style="font-weight:bold;font-size:15px;margin:3px 0;">${stop.location.name}</div>
              <div style="color:#666;font-size:12px;">📍 ${stop.location.district || ''}</div>
              <hr style="margin:6px 0;border:0;border-top:1px solid #eee;"/>
              <div style="font-size:12px;color:#333;">
                ⏱️ <b>${stop.arrivalTime || '08:30'}</b> - <b>${stop.departureTime || '09:30'}</b> (${stop.visitDuration || 60}m visit)
              </div>
              ${stop.travelDistance ? `<div style="font-size:11px;color:#888;margin-top:2px;">🚗 Drive: ${stop.travelDistance} km (${stop.travelDuration} min)</div>` : ''}
            </div>
          `);
        markersRef.current.push(marker);
      });

      if (day.recommendedStay && day.recommendedStay.location) {
        const stayLoc = day.recommendedStay.location;
        if (stayLoc.latitude && stayLoc.longitude) {
          const stayIcon = L.divIcon({
            className: '',
            html: `<div style="
              width:32px;height:32px;border-radius:50%;
              background:#1a1f38;color:#00d4aa;
              display:flex;align-items:center;justify-content:center;
              font-size:16px;border:2px solid #00d4aa;box-shadow:0 3px 8px rgba(0,0,0,0.5);
            ">🏨</div>`,
            iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -18],
          });

          const stayMarker = L.marker([parseFloat(stayLoc.latitude), parseFloat(stayLoc.longitude)], { icon: stayIcon }).addTo(map)
            .bindPopup(`
              <div style="font-family:sans-serif;">
                <div style="font-size:11px;color:#00d4aa;font-weight:bold;">Recommended Stay — Day ${day.dayNumber}</div>
                <div style="font-weight:bold;font-size:14px;">${day.recommendedStay.name}</div>
                <div style="font-size:12px;color:#666;">⭐ ${day.recommendedStay.rating || 4.5} | $${day.recommendedStay.price || 100}/night</div>
              </div>
            `);
          markersRef.current.push(stayMarker);
        }
      }

      // Fetch OSRM real road routes between consecutive stops of the day
      if (validStops.length >= 2) {
        for (let i = 0; i < validStops.length - 1; i++) {
          const from = validStops[i].location;
          const to = validStops[i + 1].location;
          try {
            const url = `https://router.project-osrm.org/route/v1/driving/` +
              `${parseFloat(from.longitude)},${parseFloat(from.latitude)};` +
              `${parseFloat(to.longitude)},${parseFloat(to.latitude)}` +
              `?overview=full&geometries=geojson`;

            const res = await fetch(url);
            const data = await res.json();

            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
              const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
              routeLayersRef.current.push(
                L.polyline(coords, { color: '#000', weight: 7, opacity: 0.15 }).addTo(map),
                L.polyline(coords, { color: dayColor, weight: 4, opacity: 0.9 }).addTo(map)
              );
            } else {
              routeLayersRef.current.push(
                L.polyline([
                  [parseFloat(from.latitude), parseFloat(from.longitude)],
                  [parseFloat(to.latitude), parseFloat(to.longitude)],
                ], { color: dayColor, weight: 3, opacity: 0.7, dashArray: '6,6' }).addTo(map)
              );
            }
          } catch (err) {
            routeLayersRef.current.push(
              L.polyline([
                [parseFloat(from.latitude), parseFloat(from.longitude)],
                [parseFloat(to.latitude), parseFloat(to.longitude)],
              ], { color: dayColor, weight: 3, opacity: 0.7, dashArray: '6,6' }).addTo(map)
            );
          }
        }
      }
    }

    if (allLatLngs.length > 0) {
      map.fitBounds(L.latLngBounds(allLatLngs), { padding: [50, 50] });
    }
  };

  // ── Export Handlers ───────────────────────────────────────────────────

  const handleExportJSON = () => {
    if (!currentItinerary) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentItinerary, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `itinerary-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '0 min';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  return (
    <div className="container animate-fade-in mb-4">
      {/* Header */}
      <div className="text-center mb-3">
        <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <Sparkles color="#00d4aa" size={28} /> Auto Itinerary Generator Dashboard
        </h2>
        <p className="text-muted">
          Auto-generate realistic multi-day Sri Lanka trip itineraries with interest filtering, geographic clustering, 2-opt route optimization, and stay recommendations.
        </p>
      </div>

      {/* ── Navigation Tabs ── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          className={`btn ${activeTab === 'wizard' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('wizard')}
        >
          <Sparkles size={16} /> ✨ Auto Generator Wizard
        </button>
        <button
          className={`btn ${activeTab === 'timeline' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('timeline')}
          disabled={!currentItinerary}
        >
          <Calendar size={16} /> 📅 Timeline {currentItinerary?.days ? `(${currentItinerary.numberOfDays} Days)` : ''}
        </button>
        <button
          className={`btn ${activeTab === 'map' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('map')}
          disabled={!currentItinerary}
        >
          <Map size={16} /> 🗺️ Multi-Day Map
        </button>
        <button
          className={`btn ${activeTab === 'saved' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => { setActiveTab('saved'); loadSavedItineraries(); }}
        >
          <Bookmark size={16} /> 💾 Saved Trips ({savedTrips.length})
        </button>
      </div>

      {/* Global Alerts */}
      {errorMsg && (
        <div style={{
          padding: '1rem', background: 'rgba(255,77,79,0.12)', border: '1px solid #ff4d4f',
          borderRadius: '8px', color: '#ff4d4f', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}
      {saveSuccessMsg && (
        <div style={{
          padding: '1rem', background: 'rgba(0,212,170,0.12)', border: '1px solid #00d4aa',
          borderRadius: '8px', color: '#00d4aa', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          ✨ {saveSuccessMsg}
        </div>
      )}

      {/* ── 1. Auto Generator Wizard Tab ── */}
      {activeTab === 'wizard' && (
        <div className="glass p-4" style={{ borderRadius: 'var(--radius)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={22} /> Auto-Generate Multi-Day Itinerary
            </h3>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Step {wizardStep} of 4
            </div>
          </div>

          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginBottom: '2rem', overflow: 'hidden' }}>
            <div style={{ width: `${(wizardStep / 4) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #7c6dfa, #00d4aa)', transition: 'width 0.3s ease' }} />
          </div>

          {/* Step 1: Trip Details */}
          {wizardStep === 1 && (
            <div className="animate-fade-in">
              <h4 style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>Step 1 — Trip Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Trip Duration (Days)</label>
                  <select className="form-control" value={days} onChange={e => setDays(e.target.value)}>
                    {[1, 2, 3, 4, 5, 6, 7, 10, 14].map(d => (
                      <option key={d} value={d}>{d} Day{d > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Starting Location</label>
                  <select className="form-control" value={startLocationId} onChange={e => setStartLocationId(e.target.value)}>
                    <option value="">-- Select Start Location --</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name} ({loc.district})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Daily Start Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={dailyStartTime}
                    onChange={e => setDailyStartTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Travel Preferences */}
          {wizardStep === 2 && (
            <div className="animate-fade-in">
              <h4 style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>Step 2 — Travel Preferences</h4>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '10px' }}>Travel Pace</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                  {[
                    { id: 'RELAXED', title: 'Relaxed', desc: 'Fewer attractions, longer visits, zero rush' },
                    { id: 'MODERATE', title: 'Moderate', desc: 'Balanced sightseeing and comfortable driving' },
                    { id: 'PACKED', title: 'Packed', desc: 'Maximum attractions, action-filled days' },
                  ].map(p => (
                    <div
                      key={p.id}
                      onClick={() => setPace(p.id)}
                      style={{
                        padding: '1rem', borderRadius: '10px', cursor: 'pointer',
                        border: `2px solid ${pace === p.id ? '#00d4aa' : 'var(--glass-border)'}`,
                        background: pace === p.id ? 'rgba(0,212,170,0.1)' : 'rgba(255,255,255,0.02)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', color: pace === p.id ? '#00d4aa' : 'var(--text-light)', fontSize: '15px' }}>
                        {p.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{p.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '10px' }}>Budget Tier for Accommodations</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                  {[
                    { id: 'BUDGET', title: 'Budget ($)', desc: 'Affordable guest houses & lodges' },
                    { id: 'MEDIUM', title: 'Moderate ($$)', desc: 'Comfortable 3-4 star hotels' },
                    { id: 'PREMIUM', title: 'Premium ($$$)', desc: 'Luxury resorts & boutique stays' },
                  ].map(b => (
                    <div
                      key={b.id}
                      onClick={() => setBudgetTier(b.id)}
                      style={{
                        padding: '1rem', borderRadius: '10px', cursor: 'pointer',
                        border: `2px solid ${budgetTier === b.id ? '#7c6dfa' : 'var(--glass-border)'}`,
                        background: budgetTier === b.id ? 'rgba(124,109,250,0.1)' : 'rgba(255,255,255,0.02)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', color: budgetTier === b.id ? '#7c6dfa' : 'var(--text-light)', fontSize: '15px' }}>
                        {b.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{b.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Interests */}
          {wizardStep === 3 && (
            <div className="animate-fade-in">
              <h4 style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>Step 3 — Select Your Interests</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                The itinerary generator will prioritize attractions matching your selected themes.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', marginBottom: '2rem' }}>
                {INTEREST_OPTIONS.map(opt => {
                  const isSelected = selectedInterests.includes(opt.id);
                  return (
                    <div
                      key={opt.id}
                      onClick={() => toggleInterest(opt.id)}
                      style={{
                        padding: '12px 14px', borderRadius: '8px', cursor: 'pointer',
                        border: `1px solid ${isSelected ? '#00d4aa' : 'var(--glass-border)'}`,
                        background: isSelected ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.03)',
                        display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>{opt.icon}</span>
                      <span style={{ fontWeight: '600', fontSize: '14px', color: isSelected ? '#00d4aa' : 'var(--text-light)' }}>
                        {opt.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Must-Visit Places */}
          {wizardStep === 4 && (
            <div className="animate-fade-in">
              <h4 style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>Step 4 — Must-Visit Places (Optional)</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Select specific destinations that MUST be included in your multi-day schedule.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px', marginBottom: '2rem' }}>
                {locations.map(loc => {
                  const isMust = mustVisitIds.includes(loc.id);
                  return (
                    <div
                      key={loc.id}
                      onClick={() => toggleMustVisit(loc.id)}
                      style={{
                        padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                        border: `1px solid ${isMust ? '#e05c97' : 'var(--glass-border)'}`,
                        background: isMust ? 'rgba(224,92,151,0.15)' : 'rgba(255,255,255,0.03)',
                        display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s'
                      }}
                    >
                      {isMust ? <CheckSquare size={18} color="#e05c97" /> : <Square size={18} color="#666" />}
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-light)' }}>{loc.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{loc.district}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Wizard Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
            <button
              className="btn btn-outline"
              onClick={() => setWizardStep(prev => Math.max(1, prev - 1))}
              disabled={wizardStep === 1}
            >
              Back
            </button>

            {wizardStep < 4 ? (
              <button
                className="btn btn-primary"
                onClick={() => setWizardStep(prev => Math.min(4, prev + 1))}
              >
                Next Step <ArrowRight size={16} />
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={generating}
                style={{ background: 'linear-gradient(135deg, #7c6dfa, #00d4aa)', borderColor: 'transparent', padding: '0.75rem 1.5rem' }}
              >
                {generating ? '✨ Generating Itinerary...' : '✨ Generate My Itinerary'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── 2. Timeline View Tab ── */}
      {activeTab === 'timeline' && currentItinerary && (
        <div className="glass p-4" style={{ borderRadius: 'var(--radius)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ margin: 0, color: 'var(--primary)' }}>{currentItinerary.title}</h3>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {currentItinerary.numberOfDays} Days • Total Distance: {currentItinerary.totalDistance} km • Total Driving: {formatDuration(currentItinerary.totalDriveMinutes)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className="btn btn-outline" onClick={handleSaveItinerary} disabled={saving}>
                <Bookmark size={15} /> {saving ? 'Saving...' : 'Save to Account'}
              </button>
              <button className="btn btn-outline" onClick={handleExportJSON}>
                <Download size={15} /> Export JSON
              </button>
              <button className="btn btn-outline" onClick={handlePrint}>
                <Printer size={15} /> Print / PDF
              </button>
            </div>
          </div>

          {currentItinerary.days?.map((day, dIdx) => (
            <div
              key={day.id || dIdx}
              style={{
                marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)',
                borderRadius: '12px', border: '1px solid var(--glass-border)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--glass-border)' }}>
                <h4 style={{ margin: 0, color: DAY_COLORS[dIdx % DAY_COLORS.length], display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} /> DAY {day.dayNumber} {day.stops?.[0]?.location?.district ? `— ${day.stops[0].location.district}` : ''}
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
                  <span>📍 {day.stops?.length || 0} Stops</span>
                  <span>🚗 {day.totalDistance} km</span>
                  <span>⏱️ {formatDuration(day.totalDriveMinutes)} drive</span>
                </div>
              </div>

              <div style={{ paddingLeft: '0.5rem' }}>
                {day.stops?.map((stop, sIdx) => (
                  <div key={stop.id || sIdx} style={{ position: 'relative', paddingLeft: '2.5rem', paddingBottom: '1.5rem' }}>
                    {sIdx < day.stops.length - 1 && (
                      <div style={{
                        position: 'absolute', left: '13px', top: '28px', bottom: '0', width: '2px',
                        background: 'var(--glass-border)'
                      }} />
                    )}

                    <div style={{
                      position: 'absolute', left: '0', top: '0', width: '28px', height: '28px',
                      borderRadius: '50%', background: DAY_COLORS[dIdx % DAY_COLORS.length], color: '#000',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px'
                    }}>
                      {sIdx + 1}
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '12px', color: '#00d4aa', fontWeight: 'bold' }}>
                            {stop.arrivalTime || '08:30'} – {stop.departureTime || '09:30'} ({stop.visitDuration || 60} min visit)
                          </div>
                          <h5 style={{ margin: '4px 0', fontSize: '16px', color: 'var(--text-light)' }}>
                            {stop.location?.name}
                          </h5>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            📍 {stop.location?.district} {stop.location?.category ? `• ${stop.location.category}` : ''}
                          </div>
                        </div>

                        {/* Reorder / Actions with Auto Recalculate */}
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            className="btn btn-outline"
                            style={{ padding: '2px 6px', fontSize: '11px' }}
                            onClick={() => handleMoveStop(dIdx, sIdx, -1)}
                            disabled={sIdx === 0}
                            title="Move up (recalculates times)"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            className="btn btn-outline"
                            style={{ padding: '2px 6px', fontSize: '11px' }}
                            onClick={() => handleMoveStop(dIdx, sIdx, 1)}
                            disabled={sIdx === day.stops.length - 1}
                            title="Move down (recalculates times)"
                          >
                            <ArrowDown size={12} />
                          </button>
                          <button
                            className="btn btn-outline"
                            style={{ padding: '2px 6px', fontSize: '11px', color: '#ff4d4f', borderColor: 'rgba(255,77,79,0.3)' }}
                            onClick={() => handleRemoveStop(dIdx, sIdx)}
                            title="Remove stop (recalculates times)"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {sIdx < day.stops.length - 1 && (
                        <div style={{ marginTop: '0.75rem', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          🚗 <span>Drive to next stop: <b>{day.stops[sIdx + 1].travelDistance || 12} km</b> ({day.stops[sIdx + 1].travelDuration || 25} min)</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Location dropdown for Day */}
              <div style={{ marginTop: '0.5rem', paddingLeft: '2.5rem' }}>
                <select
                  className="form-control"
                  style={{ maxWidth: '280px', fontSize: '12px', background: 'rgba(255,255,255,0.05)', borderColor: 'var(--glass-border)' }}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddStopToDay(dIdx, e.target.value);
                      e.target.value = '';
                    }
                  }}
                >
                  <option value="">+ Add location to Day {day.dayNumber}...</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.district})</option>
                  ))}
                </select>
              </div>

              {day.recommendedStay && (
                <div style={{
                  marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,212,170,0.06)',
                  border: '1px solid rgba(0,212,170,0.25)', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Hotel size={24} color="#00d4aa" />
                    <div>
                      <div style={{ fontSize: '11px', color: '#00d4aa', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        Recommended Stay near {day.stops?.[day.stops.length - 1]?.location?.name || 'Destination'}
                      </div>
                      <div style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--text-light)' }}>
                        {day.recommendedStay.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        ⭐ {day.recommendedStay.rating || 4.5} Rating • ${day.recommendedStay.price || 100} / night
                      </div>
                    </div>
                  </div>
                  <a
                    href={`/booking/${day.recommendedStay.id}`}
                    className="btn btn-outline"
                    style={{ fontSize: '12px', padding: '6px 12px', borderColor: '#00d4aa', color: '#00d4aa' }}
                  >
                    Book Stay
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── 3. Multi-Day Map Tab ── */}
      {activeTab === 'map' && (
        <div className="glass" style={{ borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          {!currentItinerary ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Map size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>Generate or select an itinerary to view multi-day interactive route maps.</p>
            </div>
          ) : (
            <>
              <div style={{
                padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border)',
                display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ fontWeight: 'bold', color: 'var(--text-light)' }}>
                  🗺️ {currentItinerary.title} ({currentItinerary.numberOfDays} Days)
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {currentItinerary.days?.map((day, idx) => (
                    <span key={day.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                      <span style={{
                        width: '12px', height: '12px', borderRadius: '50%',
                        background: DAY_COLORS[idx % DAY_COLORS.length]
                      }} />
                      Day {day.dayNumber}
                    </span>
                  ))}
                </div>
              </div>

              <div ref={mapRef} style={{ height: '560px', width: '100%' }} />
            </>
          )}
        </div>
      )}

      {/* ── 4. Saved Trips Tab ── */}
      {activeTab === 'saved' && (
        <div className="glass p-4" style={{ borderRadius: 'var(--radius)' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bookmark size={20} /> My Saved Itineraries
          </h3>

          {loadingSaved ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading saved trips...</div>
          ) : savedTrips.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Bookmark size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>No saved itineraries found in your account.</p>
              <button className="btn btn-primary" onClick={() => setActiveTab('wizard')}>
                Create New Itinerary
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {savedTrips.map(trip => (
                <div
                  key={trip.id}
                  style={{
                    padding: '1.5rem', background: 'rgba(255,255,255,0.03)',
                    borderRadius: '12px', border: '1px solid var(--glass-border)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', color: '#00d4aa', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      {trip.numberOfDays} Days • {trip.pace || 'MODERATE'} Pace
                    </div>
                    <h4 style={{ margin: '6px 0 10px', color: 'var(--text-light)' }}>{trip.title}</h4>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      📍 Starts at: <b>{trip.startLocation?.name || 'Sri Lanka'}</b><br />
                      🚗 Total Distance: <b>{trip.totalDistance || 0} km</b><br />
                      ⏱️ Total Driving: <b>{formatDuration(trip.totalDriveMinutes)}</b>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1, fontSize: '13px' }}
                      onClick={() => handleLoadSavedTrip(trip)}
                    >
                      View & Edit
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ color: '#ff4d4f', borderColor: 'rgba(255,77,79,0.3)', padding: '6px 10px' }}
                      onClick={() => handleDeleteSavedTrip(trip.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AutoGenerator;
