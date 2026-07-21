import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Calendar, Trash2, MapPin, Map, Navigation, Route, Zap } from 'lucide-react';

const COLORS = [
  '#00d4aa', '#f5a623', '#e05c97', '#7c6dfa',
  '#4ecdc4', '#ff6b6b', '#a8e063', '#ffd93d'
];

// ─── Haversine distance (km) ────────────────────────────────────────────────
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

// ─── Dijkstra's Algorithm (nearest-neighbour with priority queue) ────────────
const dijkstraRoute = (nodes, startIndex) => {
  if (nodes.length === 0) return [];
  if (nodes.length === 1) return [nodes[0]];

  const dist = nodes.map((a, i) =>
    nodes.map((b, j) =>
      i === j ? 0 : haversine(
        parseFloat(a.latitude), parseFloat(a.longitude),
        parseFloat(b.latitude), parseFloat(b.longitude)
      )
    )
  );

  const visited = new Array(nodes.length).fill(false);
  const path = [startIndex];
  visited[startIndex] = true;

  for (let step = 1; step < nodes.length; step++) {
    const current = path[path.length - 1];
    let minDist = Infinity;
    let nextNode = -1;
    for (let j = 0; j < nodes.length; j++) {
      if (!visited[j] && dist[current][j] < minDist) {
        minDist = dist[current][j];
        nextNode = j;
      }
    }
    if (nextNode !== -1) {
      visited[nextNode] = true;
      path.push(nextNode);
    }
  }

  return path.map(i => nodes[i]);
};

const TripPlanner = () => {
  const [locations, setLocations] = useState([]);
  const [itinerary, setItinerary] = useState([]);
  const [activeTab, setActiveTab] = useState('planner');
  const [routeInfo, setRouteInfo] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState(null);

  // Dijkstra state
  const [startLocationId, setStartLocationId] = useState('');
  const [selectedForDijkstra, setSelectedForDijkstra] = useState([]);
  const [dijkstraResult, setDijkstraResult] = useState(null);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const routeLayersRef = useRef([]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await api.get('/locations');
        setLocations(response.data);
      } catch (error) {
        console.error('Failed to fetch locations', error);
      }
    };
    fetchLocations();
    const saved = localStorage.getItem('smartTravelItinerary');
    if (saved) setItinerary(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (activeTab === 'map') setTimeout(() => initMap(), 150);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'map' && mapInstanceRef.current) updateMap();
  }, [itinerary, activeTab]);

  // ── Map ──────────────────────────────────────────────────────────────────

  const initMap = () => {
    if (!mapRef.current || mapInstanceRef.current || !window.L) return;
    const L = window.L;
    const map = L.map(mapRef.current, { center: [7.8731, 80.7718], zoom: 8 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors', maxZoom: 18,
    }).addTo(map);
    mapInstanceRef.current = map;
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
    if (!mapInstanceRef.current || !window.L) return;
    clearMap();
    const validStops = itinerary.filter(i => i.latitude && i.longitude);
    if (validStops.length === 0) return;

    const L = window.L;
    const map = mapInstanceRef.current;
    const latlngs = [];

    validStops.forEach((item, index) => {
      const color = COLORS[index % COLORS.length];
      const lat = parseFloat(item.latitude);
      const lng = parseFloat(item.longitude);

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:36px;height:36px;border-radius:50%;
          background:${color};color:#000;
          display:flex;align-items:center;justify-content:center;
          font-weight:bold;font-size:15px;
          border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.5);
        ">${index + 1}</div>`,
        iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -22],
      });

      const marker = L.marker([lat, lng], { icon }).addTo(map)
        .bindPopup(`
          <div style="font-family:sans-serif;min-width:160px;">
            <div style="font-weight:bold;font-size:14px;margin-bottom:4px;">
              Stop ${index + 1}: ${item.name}
            </div>
            <div style="color:#666;font-size:12px;">📍 ${item.district}</div>
          </div>
        `);
      markersRef.current.push(marker);
      latlngs.push([lat, lng]);
    });

    if (latlngs.length > 0)
      map.fitBounds(L.latLngBounds(latlngs), { padding: [50, 50] });

    if (validStops.length >= 2) {
      setLoadingRoute(true);
      setRouteError(null);
      try {
        let totalDistance = 0;
        let totalDuration = 0;

        for (let i = 0; i < validStops.length - 1; i++) {
          const from = validStops[i];
          const to = validStops[i + 1];
          const url = `https://router.project-osrm.org/route/v1/driving/` +
            `${parseFloat(from.longitude)},${parseFloat(from.latitude)};` +
            `${parseFloat(to.longitude)},${parseFloat(to.latitude)}` +
            `?overview=full&geometries=geojson`;

          const res = await fetch(url);
          const data = await res.json();

          if (data.code === 'Ok' && data.routes.length > 0) {
            const route = data.routes[0];
            totalDistance += route.distance;
            totalDuration += route.duration;
            const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
            routeLayersRef.current.push(
              L.polyline(coords, { color: '#000', weight: 7, opacity: 0.12 }).addTo(map),
              L.polyline(coords, { color: COLORS[i % COLORS.length], weight: 4, opacity: 0.9 }).addTo(map)
            );
          } else {
            routeLayersRef.current.push(
              L.polyline([
                [parseFloat(from.latitude), parseFloat(from.longitude)],
                [parseFloat(to.latitude), parseFloat(to.longitude)],
              ], { color: COLORS[i % COLORS.length], weight: 3, opacity: 0.6, dashArray: '8,6' }).addTo(map)
            );
          }
        }
        setRouteInfo({ distance: (totalDistance / 1000).toFixed(1), duration: Math.round(totalDuration / 60) });
      } catch (err) {
        setRouteError('Could not load road route. Showing straight lines instead.');
        for (let i = 0; i < validStops.length - 1; i++) {
          routeLayersRef.current.push(
            L.polyline([
              [parseFloat(validStops[i].latitude), parseFloat(validStops[i].longitude)],
              [parseFloat(validStops[i + 1].latitude), parseFloat(validStops[i + 1].longitude)],
            ], { color: COLORS[i % COLORS.length], weight: 3, opacity: 0.6, dashArray: '8,6' }).addTo(map)
          );
        }
      } finally {
        setLoadingRoute(false);
      }
    }
  };

  // ── Itinerary ────────────────────────────────────────────────────────────

  const saveItinerary = (newItinerary) => {
    setItinerary(newItinerary);
    localStorage.setItem('smartTravelItinerary', JSON.stringify(newItinerary));
  };

  const handleRemoveLocation = (id) => {
    saveItinerary(itinerary.filter(l => l.id !== id));
    setRouteInfo(null);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const n = [...itinerary];
    [n[index - 1], n[index]] = [n[index], n[index - 1]];
    saveItinerary(n);
  };

  const handleMoveDown = (index) => {
    if (index === itinerary.length - 1) return;
    const n = [...itinerary];
    [n[index], n[index + 1]] = [n[index + 1], n[index]];
    saveItinerary(n);
  };

  // ── Dijkstra ─────────────────────────────────────────────────────────────

  const toggleDijkstraSelect = (locId) => {
    setSelectedForDijkstra(prev =>
      prev.includes(locId) ? prev.filter(id => id !== locId) : [...prev, locId]
    );
  };

  const runDijkstra = () => {
    if (!startLocationId) { alert('Please select a starting location.'); return; }
    if (selectedForDijkstra.length === 0) { alert('Please select at least one place to visit.'); return; }

    const startLoc = locations.find(l => l.id.toString() === startLocationId);
    if (!startLoc) return;

    const allSelected = locations.filter(l => selectedForDijkstra.includes(l.id));
    const nodes = [startLoc, ...allSelected.filter(l => l.id !== startLoc.id)];

    const missing = nodes.filter(n => !n.latitude || !n.longitude);
    if (missing.length > 0) {
      alert(`Missing coordinates: ${missing.map(m => m.name).join(', ')}`);
      return;
    }

    setDijkstraResult(dijkstraRoute(nodes, 0));
  };

  const applyDijkstraToItinerary = () => {
    if (!dijkstraResult) return;
    saveItinerary(dijkstraResult);
    setDijkstraResult(null);
    setSelectedForDijkstra([]);
    setStartLocationId('');
    setActiveTab('map');
  };

  const formatDuration = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
  };

  return (
    <div className="container animate-fade-in mb-4">
      {/* Header */}
      <div className="text-center mb-2">
        <h2><Calendar className="icon-inline" /> My Trip Planner</h2>
        <p className="text-muted">Use Dijkstra's algorithm to find the shortest route across Sri Lanka.</p>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          className={`btn ${activeTab === 'planner' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('planner')}
        ><Zap size={16} /> Smart Planner</button>
        <button
          className={`btn ${activeTab === 'itinerary' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('itinerary')}
          disabled={itinerary.length === 0}
        ><Route size={16} /> Itinerary ({itinerary.length})</button>
        <button
          className={`btn ${activeTab === 'map' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('map')}
          disabled={itinerary.length === 0}
        ><Map size={16} /> Map & Route</button>
      </div>

      {/* ── Smart Planner Tab ── */}
      {activeTab === 'planner' && (
        <div className="glass p-4" style={{ padding: '2rem', borderRadius: 'var(--radius)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
            <Zap size={20} color="#7c6dfa" /> Smart Route Planner
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '2rem' }}>
            Select your starting point and places to visit — Dijkstra's algorithm will find the shortest path.
          </p>

          {/* Step 1 */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: 'var(--text-light)', fontSize: '15px' }}>
               Step 1 - Select Your Starting Location
            </label>
            <select
              className="form-control"
              value={startLocationId}
              onChange={e => { setStartLocationId(e.target.value); setDijkstraResult(null); }}
            >
              <option value="">-- Select starting point --</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name} ({loc.district})</option>
              ))}
            </select>
          </div>

          {/* Step 2 */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: 'var(--text-light)', fontSize: '15px' }}>
               Step 2 — Select Places to Visit
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
              {locations
                .filter(loc => loc.id.toString() !== startLocationId)
                .map(loc => {
                  const isSelected = selectedForDijkstra.includes(loc.id);
                  const hasCoords = loc.latitude && loc.longitude;
                  return (
                    <div
                      key={loc.id}
                      onClick={() => hasCoords && toggleDijkstraSelect(loc.id)}
                      style={{
                        padding: '10px 14px', borderRadius: '8px',
                        border: `1px solid ${isSelected ? '#7c6dfa' : 'var(--glass-border)'}`,
                        background: isSelected ? 'rgba(124,109,250,0.15)' : 'rgba(255,255,255,0.03)',
                        cursor: hasCoords ? 'pointer' : 'not-allowed',
                        opacity: hasCoords ? 1 : 0.4,
                        transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', gap: '8px'
                      }}
                    >
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '4px',
                        border: `2px solid ${isSelected ? '#7c6dfa' : '#555'}`,
                        background: isSelected ? '#7c6dfa' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        {isSelected && <span style={{ color: '#fff', fontSize: '11px' }}>✓</span>}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-light)' }}>{loc.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {loc.district} {!hasCoords && '⚠️ no coords'}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Calculate Button */}
          <button
            className="btn btn-primary"
            onClick={runDijkstra}
            style={{ background: '#7c6dfa', borderColor: '#7c6dfa' }}
          >
            <Zap size={16} /> Calculate Shortest Route
          </button>

          {/* Result */}
          {dijkstraResult && (
            <div style={{
              marginTop: '1.5rem', padding: '1.5rem',
              background: 'rgba(0,212,170,0.08)',
              border: '1px solid rgba(0,212,170,0.3)',
              borderRadius: '10px'
            }}>
              <h4 style={{ margin: '0 0 1rem', color: '#00d4aa' }}>✅ Optimized Route Found!</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1rem' }}>
                {dijkstraResult.map((loc, index) => {
                  const distFromPrev = index > 0
                    ? haversine(
                        parseFloat(dijkstraResult[index - 1].latitude),
                        parseFloat(dijkstraResult[index - 1].longitude),
                        parseFloat(loc.latitude),
                        parseFloat(loc.longitude)
                      ).toFixed(1)
                    : null;
                  return (
                    <div key={loc.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: COLORS[index % COLORS.length], color: '#000',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 'bold', fontSize: '13px', flexShrink: 0
                      }}>{index + 1}</div>
                      <div>
                        <span style={{ fontWeight: '600', color: 'var(--text-light)' }}>{loc.name}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>{loc.district}</span>
                        {distFromPrev && (
                          <span style={{ fontSize: '11px', color: '#00d4aa', marginLeft: '8px' }}>
                            → {distFromPrev} km from previous
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                   Total estimated distance:{' '}
                <strong style={{ color: '#00d4aa' }}>
                  {dijkstraResult.reduce((total, loc, i) => {
                    if (i === 0) return 0;
                    return total + parseFloat(haversine(
                      parseFloat(dijkstraResult[i - 1].latitude),
                      parseFloat(dijkstraResult[i - 1].longitude),
                      parseFloat(loc.latitude),
                      parseFloat(loc.longitude)
                    ).toFixed(1));
                  }, 0).toFixed(1)} km
                </strong>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary" onClick={applyDijkstraToItinerary}>
                   Apply & View on Map
                </button>
                <button className="btn btn-outline" onClick={() => setDijkstraResult(null)}>
                  Recalculate
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Itinerary Tab ── */}
      {activeTab === 'itinerary' && (
        <div className="glass p-4" style={{ padding: '2rem', borderRadius: 'var(--radius)' }}>
          <h3>Your Planned Route ({itinerary.length} stops)</h3>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0', flexWrap: 'wrap' }}>
            {[
              { icon: '📍', label: 'Stops', value: itinerary.length },
              { icon: '🗺️', label: 'Districts', value: [...new Set(itinerary.map(i => i.district))].length },
              { icon: '📏', label: 'Road Distance', value: routeInfo ? `${routeInfo.distance} km` : '—' },
              { icon: '⏱️', label: 'Drive Time', value: routeInfo ? formatDuration(routeInfo.duration) : '—' },
            ].map((stat) => (
              <div key={stat.label} className="glass" style={{
                flex: 1, minWidth: '100px', padding: '0.75rem',
                borderRadius: 'var(--radius)', textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.2rem' }}>{stat.icon}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stat.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <ul style={{ marginTop: '1rem', listStyle: 'none', padding: 0 }}>
            {itinerary.map((item, index) => (
              <li key={item.id}>
                {index > 0 && (
                  <div style={{
                    marginLeft: '17px', width: '3px', height: '20px',
                    background: 'linear-gradient(to bottom, var(--glass-border), var(--primary))',
                  }} />
                )}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '1rem', background: 'rgba(255,255,255,0.03)',
                  borderRadius: '10px', border: '1px solid var(--glass-border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: COLORS[index % COLORS.length], color: '#000',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 'bold', flexShrink: 0, fontSize: '15px'
                    }}>{index + 1}</div>
                    <div>
                      <h4 style={{ margin: 0, color: 'var(--text-light)' }}>{item.name}</h4>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <MapPin size={12} /> {item.district}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button onClick={() => handleMoveUp(index)} disabled={index === 0}
                      style={{
                        background: 'transparent', border: '1px solid var(--glass-border)',
                        color: index === 0 ? '#444' : 'var(--text-light)',
                        cursor: index === 0 ? 'not-allowed' : 'pointer',
                        borderRadius: '6px', padding: '4px 8px', fontSize: '12px'
                      }}>▲</button>
                    <button onClick={() => handleMoveDown(index)} disabled={index === itinerary.length - 1}
                      style={{
                        background: 'transparent', border: '1px solid var(--glass-border)',
                        color: index === itinerary.length - 1 ? '#444' : 'var(--text-light)',
                        cursor: index === itinerary.length - 1 ? 'not-allowed' : 'pointer',
                        borderRadius: '6px', padding: '4px 8px', fontSize: '12px'
                      }}>▼</button>
                    <button onClick={() => handleRemoveLocation(item.id)}
                      style={{ background: 'transparent', border: 'none', color: '#ff4d4f', cursor: 'pointer' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <button
            className="btn btn-outline"
            onClick={() => { saveItinerary([]); setRouteInfo(null); setActiveTab('planner'); }}
            style={{ marginTop: '1.5rem', color: '#ff4d4f', borderColor: '#ff4d4f' }}
          >
            🗑 Clear All & Start Over
          </button>
        </div>
      )}

      {/* ── Map Tab ── */}
      {activeTab === 'map' && (
        <div className="glass" style={{ borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          {itinerary.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Map size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>Use the Smart Planner to generate a route first.</p>
            </div>
          ) : (
            <>
              <div style={{
                padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border)',
                display: 'flex', gap: '1rem', flexWrap: 'wrap',
                alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    <Navigation size={14} style={{ verticalAlign: 'middle' }} /> Route:
                  </span>
                  {itinerary.map((item, index) => (
                    <span key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-light)' }}>
                      <span style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        background: COLORS[index % COLORS.length], color: '#000',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 'bold', fontSize: '11px', flexShrink: 0
                      }}>{index + 1}</span>
                      {item.name}
                    </span>
                  ))}
                </div>
                {loadingRoute && (
                  <span style={{ fontSize: '12px', color: 'var(--primary)' }}>🛣️ Loading road route...</span>
                )}
              </div>

              <div ref={mapRef} style={{ height: '520px', width: '100%' }} />

              {routeError && (
                <div style={{ padding: '0.75rem 1.5rem', background: 'rgba(245,166,35,0.1)', borderTop: '1px solid rgba(245,166,35,0.3)', fontSize: '13px', color: '#f5a623' }}>
                  ⚠️ {routeError}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TripPlanner;
