import React, { useState } from 'react';
import styles from './AlertPanel.module.css';
import { FUEL_LABELS, FUEL_COLORS } from '../constants/fuels';

export const AlertPanel = ({ stations, alerts, onAddAlert, onRemoveAlert }) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedStation, setSelectedStation] = useState('');
  const [selectedFuel, setSelectedFuel] = useState('SP95');
  const [priceThreshold, setPriceThreshold] = useState('');

  const handleAddAlert = () => {
    if (selectedStation && selectedFuel && priceThreshold) {
      const station = stations.find(s => s.id === selectedStation);
      if (station) {
        onAddAlert({
          stationId: selectedStation,
          stationName: station.name,
          fuelType: selectedFuel,
          priceThreshold: parseFloat(priceThreshold)
        });
        setSelectedStation('');
        setSelectedFuel('SP95');
        setPriceThreshold('');
        setExpanded(false);
      }
    }
  };

  return (
    <div className={styles.container}>
      <button
        className={styles.header}
        onClick={() => setExpanded(!expanded)}
      >
        <span className={styles.title}>🔔 Alertes Prix ({alerts.length})</span>
        <span className={styles.icon}>{expanded ? '−' : '+'}</span>
      </button>

      {expanded && (
        <div className={styles.content}>
          <div className={styles.alertsList}>
            {alerts.length === 0 ? (
              <p className={styles.empty}>Aucune alerte configurée</p>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className={styles.alertItem}>
                  <div className={styles.alertInfo}>
                    <p className={styles.alertTitle}>
                      {alert.stationName} - {FUEL_LABELS[alert.fuelType]}
                    </p>
                    <p className={styles.alertThreshold}>
                      Alerte à: <span style={{ color: FUEL_COLORS[alert.fuelType] }}>
                        {alert.priceThreshold.toFixed(3)}€
                      </span>
                    </p>
                  </div>
                  <button
                    className={styles.removeBtn}
                    onClick={() => onRemoveAlert(alert.id)}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          <div className={styles.formSection}>
            <h4>Ajouter une alerte</h4>

            <div className={styles.formGroup}>
              <label>Station</label>
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className={styles.select}
              >
                <option value="">Sélectionner une station</option>
                {stations.map(station => (
                  <option key={station.id} value={station.id}>
                    {station.name} ({station.distance.toFixed(1)} km)
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Carburant</label>
              <select
                value={selectedFuel}
                onChange={(e) => setSelectedFuel(e.target.value)}
                className={styles.select}
              >
                {Object.keys(FUEL_LABELS).map(fuel => (
                  <option key={fuel} value={fuel}>
                    {FUEL_LABELS[fuel]}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Prix limite (€)</label>
              <input
                type="number"
                step="0.001"
                value={priceThreshold}
                onChange={(e) => setPriceThreshold(e.target.value)}
                placeholder="Ex: 1.500"
                className={styles.input}
              />
            </div>

            <button
              onClick={handleAddAlert}
              disabled={!selectedStation || !priceThreshold}
              className={styles.addBtn}
            >
              + Ajouter une alerte
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertPanel;
