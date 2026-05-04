import React from 'react';
import styles from './BestDeal.module.css';
import { FUEL_LABELS, FUEL_COLORS, FUEL_ICONS } from '../constants/fuels';
import { BrandLogo } from './BrandLogo';
import { getBrandInfo } from '../utils/stationBrand';

export const BestDeal = ({ station, fuelType }) => {
  if (!station) return null;

  const price = station.prices[fuelType];
  if (price === null || price === undefined) return null;

  const brand = getBrandInfo(station);
  const itineraryUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}&travelmode=driving`;

  return (
    <div className={styles.container} style={{ borderColor: FUEL_COLORS[fuelType] }}>
      <div className={styles.content}>
        <div className={styles.priceSection}>
          <span className={styles.icon}>{FUEL_ICONS[fuelType]}</span>
          <span className={styles.priceValue} style={{ color: FUEL_COLORS[fuelType] }}>
            {price.toFixed(3)}€
          </span>
          <span className={styles.fuelLabel}>{FUEL_LABELS[fuelType]}</span>
        </div>

        <div className={styles.stationInfo}>
          <div className={styles.brandRow}>
            <BrandLogo station={station} size="md" />
            <div>
              <span className={styles.stationLabel}>Enseigne</span>
              <h3 className={styles.stationName}>{brand.brandLabel}</h3>
            </div>
          </div>
          <p className={styles.stationBrand}>{brand.displayName}</p>
          {station.distance != null && (
            <p className={styles.distance}>
              📍 {station.distance.toFixed(1)} km de vous
            </p>
          )}

          <div className={styles.badge}>🏆 Meilleur Prix</div>
        </div>
      </div>

      <div className={styles.cta}>
        <a
          className={styles.btn}
          href={itineraryUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Itinéraire
        </a>
      </div>
    </div>
  );
};

export default BestDeal;
