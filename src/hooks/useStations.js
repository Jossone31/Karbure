import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchStationsNearby, searchStationsByAddress } from '../services/api';

export const useStations = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [radius, setRadius] = useState(5);
  const lastCallRef = useRef(0);
  const timeoutRef = useRef(null);

  const loadStations = useCallback(async (latitude, longitude, searchRadius = radius) => {
    // Éviter les appels trop fréquents (minimum 1 seconde entre les appels)
    const now = Date.now();
    if (now - lastCallRef.current < 1000) {
      console.log('⏳ Appel API ignoré (trop fréquent)');
      return;
    }
    lastCallRef.current = now;

    // Annuler l'appel précédent s'il est en cours
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🔄 Chargement des stations: lat=${latitude.toFixed(4)}, lon=${longitude.toFixed(4)}, radius=${searchRadius}`);
      const data = await fetchStationsNearby(latitude, longitude, searchRadius);
      setStations(data);
      console.log(`✅ ${data.length} stations chargées`);
    } catch (err) {
      console.error('❌ Erreur chargement stations:', err);
      setError(err.message);
      setStations([]);
    } finally {
      setLoading(false);
    }
  }, []); // Retirer la dépendance à radius

  const searchByAddress = useCallback(async (address) => {
    setLoading(true);
    setError(null);
    try {
      console.log(`🔍 Recherche par adresse: ${address}`);
      const data = await searchStationsByAddress(address);
      setStations(data);
      console.log(`✅ ${data.length} stations trouvées`);
    } catch (err) {
      console.error('❌ Erreur recherche par adresse:', err);
      setError(err.message);
      setStations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRadius = useCallback((newRadius) => {
    console.log(`📏 Rayon mis à jour: ${newRadius}km`);
    setRadius(newRadius);
  }, []);

  const sortStations = useCallback((sortBy = 'distance') => {
    console.log(`🔄 Tri des stations par: ${sortBy}`);
    setStations(prevStations => {
      const sorted = [...prevStations];

      switch (sortBy) {
        case 'price':
          // Tri par prix du carburant (défaut SP95)
          sorted.sort((a, b) => (a.prices.SP95 || Infinity) - (b.prices.SP95 || Infinity));
          break;
        case 'distance':
        default:
          sorted.sort((a, b) => a.distance - b.distance);
          break;
        case 'rating':
          sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
      }

      return sorted;
    });
  }, []);

  return {
    stations,
    loading,
    error,
    radius,
    loadStations,
    searchByAddress,
    updateRadius,
    sortStations
  };
};
