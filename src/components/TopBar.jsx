import React, { useState } from 'react';
import styles from './TopBar.module.css';

export const TopBar = ({ title, onRefresh, loading, onSearchAddress }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || !onSearchAddress) return;

    setIsSearching(true);
    try {
      await onSearchAddress(searchQuery.trim());
    } catch (error) {
      console.error('Erreur recherche:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.content}>
        <div className={styles.left}>
          <img className={styles.logo} src="/icon-192x192.png" alt="" aria-hidden="true" />
          <h1 className={styles.title}>{title}</h1>
        </div>

        {onSearchAddress && (
          <form className={styles.searchForm} onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Rechercher une adresse..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              disabled={isSearching}
            />
            <button
              type="submit"
              className={styles.searchBtn}
              disabled={!searchQuery.trim() || isSearching}
            >
              {isSearching ? '⟳' : '🔍'}
            </button>
          </form>
        )}

        <button
          className={`${styles.refreshBtn} ${loading ? styles.loading : ''}`}
          onClick={onRefresh}
          disabled={loading}
          title="Actualiser"
        >
          {loading ? '⟳' : '⟲'}
        </button>
      </div>
    </header>
  );
};

export default TopBar;
