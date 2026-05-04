import React, { useMemo, useState, memo } from 'react';
import styles from './ListPage.module.css';
import { StationCard } from '../components/StationCard';
import { FuelPills } from '../components/FuelPills';
import { BestDeal } from '../components/BestDeal';
import { AlertPanel } from '../components/AlertPanel';
import { findBestPrice } from '../services/api';

export const ListPage = ({ 
  stations, 
  loading, 
  selectedFuel, 
  onFuelChange, 
  alerts,
  onAddAlert,
  onRemoveAlert,
  onSelectStation,
  geoError,
  onRequestLocation
}) => {
  const [displayMode, setDisplayMode] = useState('all'); // 'best' or 'all'
  const bestDeal = findBestPrice(stations, selectedFuel);
  const sortedStations = useMemo(() => {
    const copy = [...stations];

    if (displayMode === 'best') {
      return copy
        .filter(station => station.prices?.[selectedFuel] !== null && station.prices?.[selectedFuel] !== undefined)
        .sort((a, b) => a.prices[selectedFuel] - b.prices[selectedFuel]);
    }

    return copy.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  }, [displayMode, selectedFuel, stations]);

  return (
    <div className={styles.page}>
      <FuelPills 
        selectedFuel={selectedFuel} 
        onFuelChange={onFuelChange}
      />

      {bestDeal && (
        <BestDeal station={bestDeal} fuelType={selectedFuel} />
      )}

      <AlertPanel 
        stations={stations}
        alerts={alerts}
        onAddAlert={onAddAlert}
        onRemoveAlert={onRemoveAlert}
      />

      <div className={styles.modeToggle}>
        <button
          className={`${styles.modeBtn} ${displayMode === 'best' ? styles.active : ''}`}
          onClick={() => setDisplayMode('best')}
        >
          Meilleurs Prix
        </button>
        <button
          className={`${styles.modeBtn} ${displayMode === 'all' ? styles.active : ''}`}
          onClick={() => setDisplayMode('all')}
        >
          Toutes les Stations
        </button>
      </div>

      <div className={styles.listContainer}>
        {loading ? (
          <div className={styles.loading}>
            <div className="spinner"></div>
            <p>Chargement des stations...</p>
          </div>
        ) : stations.length === 0 ? (
          <div className={styles.empty}>
            {geoError ? (
              <div className={styles.geoError}>
                <p>📍 Géolocalisation indisponible</p>
                <p className={styles.errorMessage}>{geoError}</p>
                <button 
                  className={styles.retryBtn}
                  onClick={onRequestLocation}
                >
                  🔄 Réessayer la géolocalisation
                </button>
                <p className={styles.hint}>
                  Ou utilisez la recherche par adresse dans la barre supérieure
                </p>
              </div>
            ) : (
              <>
                <p>Aucune station trouvée</p>
                <small>Essayez d'augmenter le rayon de recherche</small>
              </>
            )}
          </div>
        ) : (
          <div className={styles.list}>
            {sortedStations.length === 0 ? (
              <div className={styles.empty}>
                <p>Aucun prix disponible pour ce carburant</p>
                <small>Essayez un autre carburant ou l'affichage de toutes les stations.</small>
              </div>
            ) : (
              sortedStations.map(station => (
                <StationCard
                  key={station.id}
                  station={station}
                  selectedFuel={selectedFuel}
                  onSelect={onSelectStation}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(ListPage);
