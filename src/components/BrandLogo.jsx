import React, { useState } from 'react';
import styles from './BrandLogo.module.css';
import { getBrandInfo } from '../utils/stationBrand';

export const BrandLogo = ({ station, size = 'md' }) => {
  const brand = getBrandInfo(station);
  const [failed, setFailed] = useState(false);
  const canUseImage = brand.logoUrl && !failed;

  return (
    <span
      className={`${styles.logo} ${styles[size]} ${styles[brand.className] || styles.generic} ${canUseImage ? styles.withImage : ''}`}
      aria-label={`Enseigne ${brand.brandLabel}`}
      title={brand.brandLabel}
    >
      {canUseImage ? (
        <img
          className={styles.image}
          src={brand.logoUrl}
          alt=""
          aria-hidden="true"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        brand.short
      )}
    </span>
  );
};

export default BrandLogo;
