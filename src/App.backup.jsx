import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './styles/global.css';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { ToastContainer } from './components/Toast';
import { ListPage } from './pages/ListPage';
import { MapPage } from './pages/MapPage';
import { StatsPage } from './pages/StatsPage';
import { useGeolocation } from './hooks/useGeolocation';
import { useStations } from './hooks/useStations';
import { useAlerts } from './hooks/useAlerts';

function App() {
  const [activeTab, setActiveTab] = useState('list');
  const [selectedFuel, setSelectedFuel] = useState('SP95');
  const [radius, setRadius] = useState(5);
  const [toasts, setToasts] = useState([]);

  const { location, error: geoError, loading: geoLoading, requestLocation } = useGeolocation();
  const { stations, loading, error, loadStations, searchByAddress, updateRadius } = useStations();
  const { alerts, addAlert, removeAlert, checkPrices, requestNotificationPermission } = useAlerts();

  // Load stations on location change - stabilisé avec useCallback
  const handleLocationChange = useCallback(() => {
    if (location) {
      console.log('📍 Chargement des stations pour:', location);
      loadStations(location.latitude, location.longitude, radius);
    }
  }, [location, radius, loadStations]);

  useEffect(() => {
    handleLocationChange();
  }, [handleLocationChange]);

  // Afficher un message si pas de localisation
  useEffect(() => {
    if (!location && !loading && !geoError) {
      console.log('⏳ En attente de géolocalisation...');
    }
  }, [location, loading, geoError]);

  // Check prices when stations or alerts change - temporairement désactivé pour stabilité
  // const handlePriceCheck = useCallback(() => {
  //   // Petit délai pour éviter les vérifications trop fréquentes
  //   const timeoutId = setTimeout(() => {
  //     checkPrices(stations);
  //   }, 500);
  //   return () => clearTimeout(timeoutId);
  // }, [stations, checkPrices]);

  // useEffect(() => {
  //   const cleanup = handlePriceCheck();
  //   return cleanup;
  // }, [handlePriceCheck]);

  // Debug: compter les re-renders
  console.log('🔄 App render:', Date.now());

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  const handleRefresh = useCallback(() => {
    if (location) {
      loadStations(location.latitude, location.longitude, radius);
    } else {
      requestLocation();
    }
  }, [location, radius, loadStations, requestLocation]);

  const handleAddToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const handleRemoveToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleSelectStation = useCallback((station) => {
    // Open maps or show details
    handleAddToast(`${station.name} sélectionnée`, 'info');
  }, [handleAddToast]);

  // Stabiliser les props des composants avec useMemo
  const listPageProps = useMemo(() => ({
    stations,
    loading,
    selectedFuel,
    onFuelChange: setSelectedFuel,
    alerts,
    onAddAlert: addAlert,
    onRemoveAlert: removeAlert,
    onSelectStation: handleSelectStation
  }), [stations, loading, selectedFuel, alerts, addAlert, removeAlert, handleSelectStation]);

  const mapPageProps = useMemo(() => ({
    stations,
    userLocation: location,
    selectedFuel,
    onStationClick: handleSelectStation
  }), [stations, location, selectedFuel, handleSelectStation]);

  const statsPageProps = useMemo(() => ({
    stations,
    selectedFuel
  }), [stations, selectedFuel]);

  return (
    <div className="app">
      <TopBar 
        title="Karbure" 
        onRefresh={handleRefresh}
        loading={loading || geoLoading}
      />

      <main style={{ 
        flex: 1, 
        overflow: 'hidden',
        display: 'flex'
      }}>
        {activeTab === 'list' && (
          <ListPage {...listPageProps} />
        )}

        {activeTab === 'map' && (
          <MapPage {...mapPageProps} />
        )}

        {activeTab === 'stats' && (
          <StatsPage {...statsPageProps} />
        )}
      </main>

      <BottomNav 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <ToastContainer 
        toasts={toasts}
        onRemove={handleRemoveToast}
      />

      {error && (
        <div style={{
          position: 'fixed',
          top: 60,
          left: 0,
          right: 0,
          background: 'var(--error)',
          color: 'white',
          padding: '12px 16px',
          textAlign: 'center',
          zIndex: 40
        }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}

export default App;
