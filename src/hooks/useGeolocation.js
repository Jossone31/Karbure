import { useState, useEffect, useCallback } from 'react';

export const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState('unknown');

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Géolocalisation non supportée par ce navigateur');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const successHandler = (position) => {
      const newLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      };

      console.log('📍 Position obtenue:', newLocation);
      setLocation(newLocation);
      setError(null);
      setLoading(false);
    };

    const errorHandler = (err) => {
      console.error('❌ Erreur géolocalisation:', err);
      let errorMessage = '';

      switch (err.code) {
        case err.PERMISSION_DENIED:
          errorMessage = 'Permission de géolocalisation refusée. Veuillez autoriser l\'accès à votre position.';
          break;
        case err.POSITION_UNAVAILABLE:
          errorMessage = 'Position indisponible. Vérifiez votre connexion GPS.';
          break;
        case err.TIMEOUT:
          errorMessage = 'Timeout de géolocalisation. Réessayez.';
          break;
        default:
          errorMessage = `Erreur géolocalisation: ${err.message}`;
      }

      setError(errorMessage);
      setLoading(false);
    };

    // Options optimisées pour la géolocalisation
    const options = {
      enableHighAccuracy: true,
      timeout: 15000, // 15 secondes
      maximumAge: 300000 // 5 minutes de cache
    };

    console.log('🔄 Demande de géolocalisation...');
    navigator.geolocation.getCurrentPosition(successHandler, errorHandler, options);
  }, []);

  useEffect(() => {
    // Vérifier les permissions
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        setPermission(result.state);
        result.addEventListener('change', () => {
          setPermission(result.state);
        });
      });
    }

    // Obtenir la position initiale
    getCurrentPosition();
  }, [getCurrentPosition]);

  const requestLocation = useCallback(() => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Géolocalisation non supportée');
      setLoading(false);
      return;
    }

    const successHandler = (position) => {
      const newLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      };

      console.log('📍 Position manuelle obtenue:', newLocation);
      setLocation(newLocation);
      setError(null);
      setLoading(false);
    };

    const errorHandler = (err) => {
      console.error('❌ Erreur géolocalisation manuelle:', err);
      let errorMessage = '';

      switch (err.code) {
        case err.PERMISSION_DENIED:
          errorMessage = 'Permission refusée. Activez la géolocalisation dans les paramètres.';
          break;
        case err.POSITION_UNAVAILABLE:
          errorMessage = 'Position indisponible. Activez le GPS.';
          break;
        case err.TIMEOUT:
          errorMessage = 'Timeout. Réessayez dans un endroit dégagé.';
          break;
        default:
          errorMessage = `Erreur: ${err.message}`;
      }

      setError(errorMessage);
      setLoading(false);
    };

    navigator.geolocation.getCurrentPosition(
      successHandler,
      errorHandler,
      {
        enableHighAccuracy: true,
        timeout: 20000, // 20 secondes pour la demande manuelle
        maximumAge: 0 // Pas de cache
      }
    );
  }, []);

  return { location, error, loading, permission, requestLocation };
};
