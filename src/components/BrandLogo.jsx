import React, { useState } from 'react';
import styles from './BrandLogo.module.css';
import { getBrandInfo } from '../utils/stationBrand';

const CustomBrandMark = ({ variant }) => {
  if (variant === 'avia') {
    return <span className={styles.aviaMark}>AVIA</span>;
  }

  if (variant === 'auchan') {
    return (
      <span className={styles.auchanMark}>
        <span className={styles.auchanBird} aria-hidden="true" />
        <span className={styles.auchanText}>Auchan</span>
      </span>
    );
  }

  if (variant === 'intermarche') {
    return (
      <span className={styles.intermarcheMark}>
        <span className={styles.intermarcheIcon}>i</span>
        <span className={styles.intermarcheText}>Inter</span>
      </span>
    );
  }

  return null;
};

export const BrandLogo = ({ station, size = 'md' }) => {
  const brand = getBrandInfo(station);
  const [failed, setFailed] = useState(false);
  const hasCustomLogo = Boolean(brand.logoVariant);
  const canUseImage = brand.logoUrl && !failed && !hasCustomLogo;

  return (
    <span
      className={`${styles.logo} ${styles[size]} ${styles[brand.className] || styles.generic} ${canUseImage ? styles.withImage : ''} ${hasCustomLogo ? styles.customMark : ''}`}
      aria-label={`Enseigne ${brand.brandLabel}`}
      title={brand.brandLabel}
    >
      {hasCustomLogo ? (
        <CustomBrandMark variant={brand.logoVariant} />
      ) : canUseImage ? (
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
