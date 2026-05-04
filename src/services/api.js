const API_BASE_URL = 'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records';
const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

const normalizeStationName = (name, brand) => {
  const cleanedName = String(name || '').trim();
  const cleanedBrand = String(brand || '').trim();
  const genericNames = ['', 'station', 'station-service', 'station service'];

  if (cleanedBrand && genericNames.includes(cleanedName.toLowerCase())) {
    return cleanedBrand;
  }

  return cleanedName || cleanedBrand || 'Station-service';
};

const findKnownBrand = (...values) => {
  const source = values
    .map(value => String(value || '').trim())
    .filter(Boolean)
    .join(' ');

  const rules = [
    [/total\s*energies|totalenergies|total access|^total\b/i, 'TotalEnergies'],
    [/esso|exxon/i, 'Esso'],
    [/shell/i, 'Shell'],
    [/\bbp\b/i, 'BP'],
    [/avia/i, 'Avia'],
    [/\beni\b|agip/i, 'Eni'],
    [/leclerc|e\.?\s*leclerc/i, 'E.Leclerc'],
    [/intermarche|intermarch[eé]/i, 'Intermarché'],
    [/carrefour/i, 'Carrefour'],
    [/auchan/i, 'Auchan'],
    [/syst[eè]me\s*u|super\s*u|hyper\s*u|u express|\bu\b/i, 'U'],
    [/casino|geant|g[eé]ant/i, 'Casino'],
    [/cora/i, 'Cora'],
    [/dyneff/i, 'Dyneff'],
    [/netto/i, 'Netto'],
  ];

  return rules.find(([pattern]) => pattern.test(source))?.[1] || '';
};

const getOsmStationBrand = (tags = {}) => (
  findKnownBrand(tags.brand, tags.operator, tags.name) ||
  String(tags.brand || tags.operator || tags.name || '').trim()
);

const fetchOsmFuelStations = async (latitude, longitude, radius) => {
  const radiusMeters = Math.max(750, Math.ceil(radius * 1000) + 500);
  const query = `[out:json][timeout:12];(node(around:${radiusMeters},${latitude},${longitude})[amenity=fuel];way(around:${radiusMeters},${latitude},${longitude})[amenity=fuel];relation(around:${radiusMeters},${latitude},${longitude})[amenity=fuel];);out center tags;`;

  const url = `${OVERPASS_API_URL}?data=${encodeURIComponent(query)}`;
  const headers = { Accept: 'application/json,text/plain,*/*' };

  if (typeof window === 'undefined') {
    headers['User-Agent'] = 'Karbure/1.1';
  }

  const response = await fetch(url, {
    headers,
  });

  if (!response.ok) {
    throw new Error(`Overpass Error: ${response.status}`);
  }

  const data = await response.json();
  return (data.elements || [])
    .map(element => {
      const lat = element.lat ?? element.center?.lat;
      const lon = element.lon ?? element.center?.lon;
      const brand = getOsmStationBrand(element.tags);

      if (!lat || !lon || !brand) return null;

      return {
        latitude: lat,
        longitude: lon,
        brand,
        name: element.tags?.name || '',
        operator: element.tags?.operator || '',
      };
    })
    .filter(Boolean);
};

const enrichStationsWithBrands = async (stations, latitude, longitude, radius) => {
  try {
    const osmStations = await fetchOsmFuelStations(latitude, longitude, radius);

    if (!osmStations.length) return stations;

    return stations.map(station => {
      const bestMatch = osmStations
        .map(candidate => ({
          ...candidate,
          distance: calculateDistance(
            station.latitude,
            station.longitude,
            candidate.latitude,
            candidate.longitude
          ),
        }))
        .filter(candidate => candidate.distance <= 0.45)
        .sort((a, b) => a.distance - b.distance)[0];

      if (!bestMatch) return station;

      const brand = findKnownBrand(bestMatch.brand, bestMatch.name, bestMatch.operator) || bestMatch.brand;

      return {
        ...station,
        brand,
        name: normalizeStationName(station.name, brand),
        osmName: bestMatch.name,
        brandMatchDistance: bestMatch.distance,
      };
    });
  } catch (error) {
    console.warn('Enrichissement enseignes indisponible:', error);
    return stations;
  }
};

// Récupère les stations avec les prix dans un rayon
export const fetchStationsNearby = async (latitude, longitude, radius = 5) => {
  try {
    // ✅ Filtre géographique directement dans l'API
    const where = `distance(geom, geom'POINT(${longitude} ${latitude})', ${radius}km)`;
    
    const url = new URL(API_BASE_URL);
    url.searchParams.append('limit', '50');
    url.searchParams.append('where', where);

    console.log('📡 URL API:', url.toString());

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      console.warn('No results found in API response');
      return [];
    }

    const mapped = data.results
      .filter(station => station.geom?.lat && station.geom?.lon)
      .map(station => ({
        id: station.id || `station-${Math.random()}`,
        name: normalizeStationName(station.nom, station.marque),
        brand: station.marque || '',
        address: [station.adresse, station.ville].filter(Boolean).join(', '),
        latitude: station.geom.lat,
        longitude: station.geom.lon,
        distance: calculateDistance(latitude, longitude, station.geom.lat, station.geom.lon),
        prices: {
          SP98:   station.sp98_prix   ? parseFloat(station.sp98_prix)   : null,
          SP95:   station.sp95_prix   ? parseFloat(station.sp95_prix)   : null,
          E10:    station.e10_prix    ? parseFloat(station.e10_prix)    : null,
          E85:    station.e85_prix    ? parseFloat(station.e85_prix)    : null,
          DIESEL: station.gazole_prix ? parseFloat(station.gazole_prix) : null,
          LPGAS:  station.gplc_prix   ? parseFloat(station.gplc_prix)  : null,
        },
        always_open: station.automate_24_24 === '1' || station.automate_24_24 === true,
        lastUpdate: station.gazole_maj
          ? new Date(station.gazole_maj).getTime()
          : Date.now(),
      }))
      .filter(s => Object.values(s.prices).some(p => p !== null))
      .sort((a, b) => a.distance - b.distance);

    const enriched = await enrichStationsWithBrands(mapped, latitude, longitude, radius);

    console.log(`✅ ${enriched.length} stations trouvées dans ${radius}km`);
    return enriched;

  } catch (error) {
    console.error('Error fetching stations:', error);
    throw error;
  }
};

// Cherche une station par adresse
export const searchStationsByAddress = async (address) => {
  try {
    const geocodeResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
    );
    
    if (!geocodeResponse.ok) {
      throw new Error('Geocoding failed');
    }
    
    const geocodeData = await geocodeResponse.json();
    
    if (!geocodeData || geocodeData.length === 0) {
      throw new Error('Address not found');
    }
    
    const { lat, lon } = geocodeData[0];
    return fetchStationsNearby(parseFloat(lat), parseFloat(lon), 10);
  } catch (error) {
    console.error('Error searching by address:', error);
    throw error;
  }
};

// Calcule la distance entre deux points (Formule de Haversine)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
};

const toRad = (deg) => (deg * Math.PI) / 180;

// Trouve le meilleur prix pour un carburant donné
export const findBestPrice = (stations, fuelType) => {
  const withPrice = stations
    .filter(station => station.prices[fuelType] !== null)
    .sort((a, b) => a.prices[fuelType] - b.prices[fuelType]);
  
  return withPrice.length > 0 ? withPrice[0] : null;
};

// Calcule les statistiques
export const calculateStats = (stations, fuelType) => {
  const prices = stations
    .filter(station => station.prices[fuelType] !== null)
    .map(station => station.prices[fuelType]);
  
  if (prices.length === 0) {
    return null;
  }
  
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const median = prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)];
  
  return { min, max, avg, median, count: prices.length };
};
