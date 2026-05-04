import { useState, useEffect, useCallback } from 'react';

const ALERTS_STORAGE_KEY = 'karbure_alerts';

export const useAlerts = () => {
  const [alerts, setAlerts] = useState([]);

  // Charger les alertes du stockage local
  useEffect(() => {
    const stored = localStorage.getItem(ALERTS_STORAGE_KEY);
    if (stored) {
      try {
        setAlerts(JSON.parse(stored));
      } catch (err) {
        console.error('Error loading alerts:', err);
      }
    }
  }, []);

  // Ajouter une alerte - stabilisé
  const addAlert = useCallback((alert) => {
    const newAlert = {
      id: Date.now().toString(),
      createdAt: Date.now(),
      enabled: true,
      ...alert
    };
    setAlerts(prevAlerts => {
      const updated = [...prevAlerts, newAlert];
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    return newAlert;
  }, []);

  // Supprimer une alerte - stabilisé
  const removeAlert = useCallback((alertId) => {
    setAlerts(prevAlerts => {
      const updated = prevAlerts.filter(alert => alert.id !== alertId);
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Modifier une alerte - stabilisé
  const updateAlert = useCallback((alertId, updates) => {
    setAlerts(prevAlerts => {
      const updated = prevAlerts.map(alert =>
        alert.id === alertId ? { ...alert, ...updates } : alert
      );
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Envoyer une notification - stable
  const sendNotification = useCallback((title, options = {}) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
    }
  }, []);

  // Demander la permission de notification - stable
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  // Vérifier les prix contre les seuils d'alerte - stabilisé
  const checkPrices = useCallback((stations) => {
    setAlerts(currentAlerts => {
      let hasUpdates = false;
      const updatedAlerts = currentAlerts.map(alert => {
        if (!alert.enabled) return alert;

        const station = stations.find(s => s.id === alert.stationId);
        if (!station) return alert;

        const price = station.prices[alert.fuelType];
        if (price === null || price === undefined) return alert;

        // Vérifier si le prix est en dessous du seuil
        if (price < alert.priceThreshold) {
          sendNotification('🔥 Alerte Prix Carburant!', {
            body: `${station.name}: ${price.toFixed(3)}€ - ${alert.fuelType}`,
            tag: `alert-${alert.id}`,
            requireInteraction: true
          });

          hasUpdates = true;
          return { ...alert, lastNotified: Date.now() };
        }

        return alert;
      });

      if (hasUpdates) {
        localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updatedAlerts));
      }

      return hasUpdates ? updatedAlerts : currentAlerts;
    });
  }, [sendNotification]);

  return {
    alerts,
    addAlert,
    removeAlert,
    updateAlert,
    sendNotification,
    requestNotificationPermission,
    checkPrices
  };
};
