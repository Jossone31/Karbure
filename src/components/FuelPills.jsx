import React from 'react';
import styles from './FuelPills.module.css';
import { FUEL_LABELS, FUEL_COLORS, FUEL_ICONS } from '../constants/fuels';

export const FuelPills = ({ selectedFuel, onFuelChange, availableFuels = Object.keys(FUEL_LABELS) }) => {
  return (
    <div className={styles.container}>
      {availableFuels.map((fuel) => (
        <button
          key={fuel}
          className={`${styles.pill} ${selectedFuel === fuel ? styles.active : ''}`}
          onClick={() => onFuelChange(fuel)}
          style={{
            '--fuel-color': FUEL_COLORS[fuel],
            borderColor: selectedFuel === fuel ? FUEL_COLORS[fuel] : 'var(--border)',
            backgroundColor: selectedFuel === fuel ? `${FUEL_COLORS[fuel]}20` : 'transparent',
          }}
        >
          <span className={styles.icon}>{FUEL_ICONS[fuel]}</span>
          <span className={styles.label}>{FUEL_LABELS[fuel]}</span>
        </button>
      ))}
    </div>
  );
};

export default FuelPills;
