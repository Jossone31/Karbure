import React, { useEffect, useRef, memo } from 'react';
import styles from './MapPage.module.css';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { FUEL_COLORS } from '../constants/fuels';

// Fix leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export const MapPage = ({
  stations,
  userLocation,
  selectedFuel,
  onStationClick
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Centre de la France si pas de localisation
    const defaultLat = 46.227638;
    const defaultLon = 2.213749;
    const startLat = userLocation?.latitude || defaultLat;
    const startLon = userLocation?.longitude || defaultLon;

    console.log('🗺️ Initialisation carte à:', startLat, startLon);

    const map = L.map(mapRef.current, {
      center: [startLat, startLon],
      zoom: userLocation ? 13 : 6, // Zoom plus large si pas de localisation
      zoomControl: true,
      scrollWheelZoom: true
    });

    mapInstanceRef.current = map;

    // Utiliser OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      minZoom: 3
    }).addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update user location marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Remove old user marker
    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    // Add new user location marker
    if (userLocation) {
      console.log('📍 Ajout marqueur utilisateur:', userLocation);

      userMarkerRef.current = L.circleMarker(
        [userLocation.latitude, userLocation.longitude],
        {
          radius: 8,
          fillColor: '#FF6B00',
          color: 'white',
          weight: 3,
          opacity: 1,
          fillOpacity: 0.9,
        }
      ).addTo(map);

      userMarkerRef.current.bindPopup(`
        <div style="text-align: center;">
          <strong>📍 Vous êtes ici</strong><br/>
          <small>Précision: ${Math.round(userLocation.accuracy || 0)}m</small>
        </div>
      `);

      // Center map on user location
      map.setView([userLocation.latitude, userLocation.longitude], 13);
    }
  }, [userLocation]);

  // Update stations markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Remove old markers
    markersRef.current.forEach(marker => {
      map.removeLayer(marker);
    });
    markersRef.current = [];

    // Add new markers
    stations.forEach(station => {
      if (station.latitude && station.longitude) {
        const price = station.prices[selectedFuel];
        const color = FUEL_COLORS[selectedFuel] || '#FF6B00';

        const marker = L.circleMarker([station.latitude, station.longitude], {
          radius: 6,
          fillColor: color,
          color: 'white',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        }).addTo(map);

const itineraryUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}&travelmode=driving`;

const popupContent = `
  <div style="min-width: 200px; font-family: Arial, sans-serif;">
    <h4 style="margin: 0 0 4px 0; color: #080810; font-size: 15px;">
      ${station.name}
    </h4>
    <p style="margin: 0 0 8px 0; font-size: 12px; color: #888;">
      ${station.brand || ''} · ${station.address || ''}
    </p>
    ${price
      ? `<p style="margin: 8px 0; font-size: 20px; font-weight: 900; color: ${color};">
           ${price.toFixed(3)}€
           <span style="font-size:11px;color:#999;font-weight:400"> / L</span>
         </p>`
      : '<p style="color:#ccc;font-size:12px;">Prix non disponible</p>'
    }
    <p style="margin: 4px 0 12px; font-size: 12px; color: #666;">
      🚗 ${station.distance.toFixed(1)} km
      ${station.always_open ? ' · <span style="color:#22C55E">● 24h/24</span>' : ''}
    </p>
    <div style="display:flex; gap:8px;">
      
        href="${itineraryUrl}"
        target="_blank"
        rel="noopener noreferrer"
        style="
          flex:1; display:block; text-align:center;
          background:linear-gradient(135deg,#FF6B00,#FFB300);
          color:white; padding:9px 8px; border-radius:8px;
          text-decoration:none; font-weight:700; font-size:13px;
        "
      >🧭 Itinéraire</a>
      <button
        style="
          flex:1; padding:9px 8px; background:#1A1A2E;
          color:white; border:1px solid rgba(255,255,255,0.1);
          border-radius:8px; cursor:pointer; font-weight:600; font-size:13px;
        "
        onclick="window.dispatchEvent(new CustomEvent('stationClick', { detail: '${station.id}' }))"
      >ℹ️ Détails</button>
    </div>
  </div>
`;

        marker.bindPopup(popupContent);
        markersRef.current.push(marker);
      }
    });

    console.log(`🗺️ ${stations.length} stations affichées sur la carte`);
  }, [stations, selectedFuel]);

  // Listen for station click events from popup
  useEffect(() => {
    const handleStationClick = (event) => {
      const stationId = event.detail;
      const station = stations.find(s => s.id === stationId);
      if (station && onStationClick) {
        onStationClick(station);
      }
    };

    window.addEventListener('stationClick', handleStationClick);
    return () => window.removeEventListener('stationClick', handleStationClick);
  }, [stations, onStationClick]);

  return (
    <div className={styles.page}>
      <div ref={mapRef} className={styles.map}></div>
      <div className={styles.info}>
        <p>{stations.length} station(s) trouvée(s)</p>
        {!userLocation && (
          <p style={{ color: '#FF6B00', fontSize: '12px' }}>
            📍 Localisation en cours...
          </p>
        )}
      </div>
    </div>
  );
};

export default memo(MapPage);
