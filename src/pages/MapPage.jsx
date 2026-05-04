import React, { useEffect, useRef, useState, memo } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { FUEL_COLORS } from '../constants/fuels';
import { FuelPills } from '../components/FuelPills';
import { getBrandInfo } from '../utils/stationBrand';

// ─── FIX LEAFLET ICONS VITE ───────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

export const MapPage = ({
  stations = [],
  userLocation,
  selectedFuel = 'SP95',
  onFuelChange,
  onStationClick
}) => {
  const mapRef         = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef     = useRef([]);
  const userMarkerRef  = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  // ── INIT CARTE ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const lat = userLocation?.latitude  ?? 43.6047;
      const lon = userLocation?.longitude ?? 1.4442;

      const map = L.map(mapRef.current, {
        center: [lat, lon],
        zoom: userLocation ? 13 : 6,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      mapInstanceRef.current = map;
      setMapReady(true);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // ✅ CRITIQUE : invalide la taille après rendu DOM complet
      setTimeout(() => map.invalidateSize(), 300);
      console.log('🗺️ Carte initialisée');
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  // ── MARQUEUR UTILISATEUR ────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !userLocation) return;
    const map = mapInstanceRef.current;

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    userMarkerRef.current = L.circleMarker(
      [userLocation.latitude, userLocation.longitude],
      { radius: 10, fillColor: '#FF6B00', color: 'white', weight: 3, fillOpacity: 1 }
    ).addTo(map).bindPopup('<strong>📍 Vous êtes ici</strong>');

    map.setView([userLocation.latitude, userLocation.longitude], 13);
    setTimeout(() => map.invalidateSize(), 100);
  }, [mapReady, userLocation]);

  // ── MARQUEURS STATIONS ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    if (!stations.length) return;

    const color = FUEL_COLORS[selectedFuel] || '#FF6B00';

    const sorted = [...stations]
      .filter(s => s.prices?.[selectedFuel] != null)
      .sort((a, b) => a.prices[selectedFuel] - b.prices[selectedFuel]);

    const cheapestId = sorted[0]?.id;

    stations.forEach(station => {
      if (!station.latitude || !station.longitude) return;

      const price  = station.prices?.[selectedFuel];
      const isBest = station.id === cheapestId && price != null;
      const bgColor = isBest ? '#22C55E' : '#1A1A2E';
      const brand = getBrandInfo(station);
      const safeStationName = escapeHtml(brand.brandLabel);
      const safeDisplayName = escapeHtml(brand.displayName);
      const safeAddress = escapeHtml(station.address || '');

      // ─ Icône prix ─
      const icon = L.divIcon({
        html: `<div style="
          background:${bgColor};
          border:2px solid ${isBest ? '#22C55E' : 'rgba(255,255,255,0.15)'};
          color:white; padding:4px 8px; border-radius:8px;
          font-family:'Arial Black',Arial,sans-serif; font-weight:900; font-size:12px;
          white-space:nowrap; box-shadow:0 3px 10px rgba(0,0,0,0.5);
          position:relative;
        ">
          ${isBest ? '🏆 ' : ''}${price != null ? price.toFixed(3) + '€' : '—'}
          <div style="
            position:absolute; bottom:-6px; left:50%; transform:translateX(-50%);
            width:0; height:0;
            border-left:6px solid transparent; border-right:6px solid transparent;
            border-top:6px solid ${bgColor};
          "></div>
        </div>`,
        className: '',
        iconSize: [84, 32],
        iconAnchor: [42, 38],
        popupAnchor: [0, -42],
      });

      const marker = L.marker([station.latitude, station.longitude], { icon }).addTo(map);
      marker.bindTooltip(safeStationName, {
        permanent: true,
        direction: 'bottom',
        offset: [0, 8],
        className: 'station-name-tooltip',
      });

      // ─ Popup ─
      const itinUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}&travelmode=driving`;
      const priceHtml = price != null
        ? `<div style="font-size:22px;font-weight:900;color:${isBest ? '#22C55E' : color};margin-bottom:10px;">
             ${price.toFixed(3)}€
             <span style="font-size:11px;color:#999;font-weight:400">/ L · ${selectedFuel}</span>
           </div>`
        : `<div style="font-size:12px;color:#ccc;margin-bottom:10px;">Prix ${selectedFuel} non disponible</div>`;

      marker.bindPopup(`
        <div style="min-width:210px;font-family:Arial,sans-serif;padding:4px;">
          <div style="font-weight:900;font-size:15px;color:#111;margin-bottom:2px;">
            ${isBest ? '🏆 ' : '⛽ '}${safeStationName}
          </div>
          ${safeDisplayName !== safeStationName ? `<div style="font-size:11px;color:#888;margin-bottom:5px;">${safeDisplayName}</div>` : ''}
          <div style="font-size:11px;color:#666;margin-bottom:8px;">
            📍 ${safeAddress}<br/>
            🚗 ${station.distance != null ? station.distance.toFixed(1) + ' km' : ''}
            ${station.always_open ? ' · <span style="color:#22C55E;font-weight:700">● 24h/24</span>' : ''}
          </div>
          ${priceHtml}
          <div style="display:flex;">
            <a href="${itinUrl}" target="_blank" rel="noopener noreferrer"
              style="flex:1;display:block;text-align:center;
                background:linear-gradient(135deg,#FF6B00,#FFB300);
                color:white;padding:9px 6px;border-radius:8px;
                text-decoration:none;font-weight:700;font-size:13px;">
              🧭 Itinéraire
            </a>
            <!--
              ℹ️ Détails
            -->
          </div>
        </div>
      `, { maxWidth: 270 });

      markersRef.current.push(marker);
    });

    if (sorted.length > 0) {
      map.setView([sorted[0].latitude, sorted[0].longitude], 14);
    }

    console.log(`🗺️ ${stations.length} stations affichées`);
  }, [mapReady, stations, selectedFuel]);

  // ── CLICK DEPUIS POPUP ───────────────────────────────────────────────────────
  useEffect(() => {
    const handler = e => {
      const station = stations.find(s => s.id === e.detail);
      if (station && onStationClick) onStationClick(station);
    };
    window.addEventListener('stationClick', handler);
    return () => window.removeEventListener('stationClick', handler);
  }, [stations, onStationClick]);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'rgba(8,8,16,0.92)',
        backdropFilter: 'blur(10px)',
      }}>
        <FuelPills selectedFuel={selectedFuel} onFuelChange={onFuelChange} />
      </div>
      {/* ✅ Le div carte DOIT avoir une hauteur explicite */}
      <div
        ref={mapRef}
        style={{
          flex: 1,
          width: '100%',
          height: 'calc(100vh - 120px)',   /* ✅ hauteur explicite = carte visible */
          minHeight: 400,
          zIndex: 1,
        }}
      />

      {/* Légende */}
      <div style={{
        position: 'absolute', bottom: 20, left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(8,8,16,0.88)', backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
        padding: '8px 16px', fontSize: 12, color: '#9999BB',
        whiteSpace: 'nowrap', zIndex: 1000,
        display: 'flex', gap: 12, alignItems: 'center',
      }}>
        <span>⛽ {stations.filter(s => s.prices?.[selectedFuel] != null).length} stations · {selectedFuel}</span>
        <span style={{ color: '#22C55E', fontWeight: 700 }}>🏆 Moins cher</span>
        <span style={{ color: '#FF6B00', fontWeight: 700 }}>● Vous</span>
      </div>

      {!userLocation && (
        <div style={{
          position: 'absolute', top: 16, left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255,107,0,0.92)', color: 'white',
          borderRadius: 10, padding: '8px 16px',
          fontSize: 13, fontWeight: 700, zIndex: 1000,
        }}>
          📍 Localisation en cours…
        </div>
      )}
    </div>
  );
};

export default memo(MapPage);
