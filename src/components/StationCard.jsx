import React from 'react';
import styles from './StationCard.module.css';
import { FUEL_LABELS, FUEL_COLORS } from '../constants/fuels';
import { BrandLogo } from './BrandLogo';
import { getBrandInfo } from '../utils/stationBrand';

export const StationCard = ({ station, selectedFuel }) => {
  const price = station.prices[selectedFuel];
  const distance = station.distance;
  const hasPrice = price !== null && price !== undefined;
  const brand = getBrandInfo(station);
  const itineraryUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}&travelmode=driving`;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.logoSlot}>
          <BrandLogo station={station} size="lg" />
        </div>

        <div className={styles.info}>
          <span className={styles.nameLabel}>Enseigne</span>
          <h3 className={styles.name}>{brand.brandLabel}</h3>
          <p className={styles.brand}>{brand.displayName}</p>
        </div>

        {distance != null && (
          <div className={styles.distance}>
            <span className={styles.value}>{distance.toFixed(1)}</span>
            <span className={styles.unit}>km</span>
          </div>
        )}
      </div>

      <p className={styles.address}>{station.address}</p>

      <div className={styles.footer}>
        <div className={styles.priceSection}>
          {hasPrice ? (
            <>
              <span
                className={styles.priceLabel}
                style={{ color: FUEL_COLORS[selectedFuel] }}
              >
                {FUEL_LABELS[selectedFuel]}
              </span>
              <span
                className={styles.price}
                style={{ color: FUEL_COLORS[selectedFuel] }}
              >
                {price.toFixed(3)}€
              </span>
            </>
          ) : (
            <div className={styles.noPriceBlock}>
              <span className={styles.noPrice}>Prix {FUEL_LABELS[selectedFuel]} non renseigné</span>
              <small className={styles.noPriceHint}>Ce carburant n'est pas déclaré pour cette station.</small>
            </div>
          )}
        </div>

        <a
          className={styles.itineraryBtn}
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

export default StationCard;
