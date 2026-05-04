import React from 'react';
import styles from './BottomNav.module.css';

export const BottomNav = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'list', label: 'Liste', icon: '📋' },
    { id: 'map', label: 'Carte', icon: '🗺️' },
    { id: 'stats', label: 'Stats', icon: '📊' }
  ];

  return (
    <nav className={styles.nav}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className={styles.icon}>{tab.icon}</span>
          <span className={styles.label}>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
