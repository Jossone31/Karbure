import React, { useMemo, memo } from 'react';
import styles from './StatsPage.module.css';
import { calculateStats } from '../services/api';
import { FUEL_LABELS, FUEL_COLORS } from '../constants/fuels';
import { BrandLogo } from '../components/BrandLogo';
import { FuelPills } from '../components/FuelPills';
import { getBrandInfo } from '../utils/stationBrand';

export const StatsPage = ({ stations, selectedFuel, onFuelChange }) => {
  const stats = useMemo(() => calculateStats(stations, selectedFuel), [stations, selectedFuel]);
  const pricedStations = useMemo(
    () => stations
      .filter(station => station.prices?.[selectedFuel] !== null && station.prices?.[selectedFuel] !== undefined)
      .sort((a, b) => a.prices[selectedFuel] - b.prices[selectedFuel]),
    [stations, selectedFuel]
  );

  if (!stats) {
    return (
      <div className={styles.page}>
        <FuelPills selectedFuel={selectedFuel} onFuelChange={onFuelChange} />
        <div className={styles.empty}>
          <p>Aucune donnée disponible pour ce carburant</p>
        </div>
      </div>
    );
  }

  const savings = stats.max - stats.min;
  const savingsPercent = ((savings / stats.max) * 100).toFixed(1);
  const cheapestStation = pricedStations[0];
  const mostExpensiveStation = pricedStations[pricedStations.length - 1];
  const getStationName = (station) => getBrandInfo(station).brandLabel;

  return (
    <div className={styles.page}>
      <FuelPills selectedFuel={selectedFuel} onFuelChange={onFuelChange} />
      <div className={styles.container}>
        <h2 className={styles.title}>
          📊 Statistiques - {FUEL_LABELS[selectedFuel]}
        </h2>

        {/* Main Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard} style={{ borderColor: FUEL_COLORS[selectedFuel] }}>
            <span className={styles.label}>Prix Minimum</span>
            <span 
              className={styles.value}
              style={{ color: FUEL_COLORS[selectedFuel] }}
            >
              {stats.min.toFixed(3)}€
            </span>
            <small className={styles.hint}>Meilleur prix</small>
            <span className={styles.stationName}>{getStationName(cheapestStation)}</span>
          </div>

          <div className={styles.statCard} style={{ borderColor: FUEL_COLORS[selectedFuel] }}>
            <span className={styles.label}>Prix Maximum</span>
            <span 
              className={styles.value}
              style={{ color: FUEL_COLORS[selectedFuel] }}
            >
              {stats.max.toFixed(3)}€
            </span>
            <small className={styles.hint}>Prix le plus haut</small>
            <span className={styles.stationName}>{getStationName(mostExpensiveStation)}</span>
          </div>

          <div className={styles.statCard} style={{ borderColor: FUEL_COLORS[selectedFuel] }}>
            <span className={styles.label}>Prix Moyen</span>
            <span 
              className={styles.value}
              style={{ color: FUEL_COLORS[selectedFuel] }}
            >
              {stats.avg.toFixed(3)}€
            </span>
            <small className={styles.hint}>Moyenne</small>
          </div>

          <div className={styles.statCard} style={{ borderColor: FUEL_COLORS[selectedFuel] }}>
            <span className={styles.label}>Prix Médian</span>
            <span 
              className={styles.value}
              style={{ color: FUEL_COLORS[selectedFuel] }}
            >
              {stats.median.toFixed(3)}€
            </span>
            <small className={styles.hint}>Valeur centrale</small>
          </div>
        </div>

        <div className={styles.stationRankingCard}>
          <h3>Stations par prix</h3>
          <div className={styles.stationRankingList}>
            {pricedStations.slice(0, 8).map((station) => (
              <div className={styles.stationRankingItem} key={station.id}>
                <BrandLogo station={station} size="sm" />
                <div className={styles.rankingStationInfo}>
                  <span className={styles.rankingStationName}>{getStationName(station)}</span>
                  <span className={styles.rankingStationAddress}>{station.address}</span>
                </div>
                <span
                  className={styles.rankingPrice}
                  style={{ color: FUEL_COLORS[selectedFuel] }}
                >
                  {station.prices[selectedFuel].toFixed(3)}€
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Savings Section */}
        <div className={styles.savingsCard}>
          <h3>💰 Économies Possibles</h3>
          <div className={styles.savingsContent}>
            <div className={styles.savingsValue}>
              <span className={styles.amount}>{savings.toFixed(3)}€</span>
              <span className={styles.percent}>({savingsPercent}%)</span>
            </div>
            <p className={styles.savingsText}>
              Vous pouvez économiser jusqu'à <strong>{savings.toFixed(3)}€ par litre</strong> en choisissant le meilleur prix!
            </p>
          </div>
        </div>

        {/* Statistics Summary */}
        <div className={styles.summaryCard}>
          <h3>📈 Résumé</h3>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Stations avec prix</span>
              <span className={styles.summaryValue}>{stats.count}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Écart de prix</span>
              <span className={styles.summaryValue}>{savings.toFixed(3)}€</span>
            </div>
          </div>
        </div>

        {/* Price Range Chart */}
        <div className={styles.chartCard}>
          <h3>📊 Distribution des Prix</h3>
          <div className={styles.chartContainer}>
            <div className={styles.range}>
              <div className={styles.rangeTrack}>
                <div 
                  className={styles.rangeFill}
                  style={{
                    width: '100%',
                    background: `linear-gradient(90deg, ${FUEL_COLORS[selectedFuel]}40 0%, ${FUEL_COLORS[selectedFuel]} 50%, ${FUEL_COLORS[selectedFuel]}40 100%)`
                  }}
                ></div>
              </div>
              <div className={styles.rangeLabels}>
                <span>{stats.min.toFixed(3)}€</span>
                <span>{stats.avg.toFixed(3)}€</span>
                <span>{stats.max.toFixed(3)}€</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(StatsPage);
