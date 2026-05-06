const BRAND_RULES = [
  { match: /total\s*energies|totalenergies|total access|^total\b/i, label: 'TotalEnergies', short: 'TE', className: 'total', domain: 'totalenergies.fr' },
  { match: /esso|exxon/i, label: 'Esso', short: 'E', className: 'esso', domain: 'esso.fr' },
  { match: /shell/i, label: 'Shell', short: 'S', className: 'shell', domain: 'shell.fr' },
  { match: /bp\b/i, label: 'BP', short: 'BP', className: 'bp', domain: 'bp.com' },
  { match: /avia/i, label: 'Avia', short: 'AVIA', className: 'avia', logoVariant: 'avia' },
  { match: /eni|agip/i, label: 'Eni', short: 'Eni', className: 'eni', domain: 'eni.com' },
  { match: /leclerc|e\.?\s*leclerc/i, label: 'E.Leclerc', short: 'EL', className: 'leclerc', domain: 'e.leclerc' },
  { match: /intermarche/i, label: 'Intermarche', short: 'ITM', className: 'intermarche', logoVariant: 'intermarche' },
  { match: /carrefour/i, label: 'Carrefour', short: 'C', className: 'carrefour', domain: 'carrefour.fr' },
  { match: /auchan/i, label: 'Auchan', short: 'A', className: 'auchan', logoVariant: 'auchan' },
  { match: /systeme\s*u|super\s*u|hyper\s*u|u express|\bu\b/i, label: 'U', short: 'U', className: 'u', domain: 'coursesu.com' },
  { match: /casino|geant/i, label: 'Casino', short: 'C', className: 'casino', domain: 'supermarchescasino.fr' },
  { match: /cora/i, label: 'Cora', short: 'C', className: 'cora', domain: 'cora.fr' },
  { match: /dyneff/i, label: 'Dyneff', short: 'D', className: 'dyneff', domain: 'dyneff.fr' },
  { match: /netto/i, label: 'Netto', short: 'N', className: 'netto', domain: 'netto.fr' },
];

const GENERIC_NAMES = new Set([
  '',
  'station',
  'station-service',
  'station service',
  'station carburant',
  'automate',
]);

const normalizeSearchText = (value) =>
  String(value || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const cleanValue = (value) => String(value || '').trim();

const findBrandRule = (...values) => {
  const source = values.map(normalizeSearchText).filter(Boolean).join(' ');
  return BRAND_RULES.find((rule) => rule.match.test(source));
};

export const getBrandInfo = (station = {}) => {
  const rawBrand = cleanValue(station.brand);
  const rawName = cleanValue(station.name);
  const rule = findBrandRule(rawBrand, rawName, station.address);
  const normalizedName = normalizeSearchText(rawName);
  const isGenericName = GENERIC_NAMES.has(normalizedName);

  if (rule) {
    return {
      label: rule.label,
      short: rule.short,
      className: rule.className,
      displayName: isGenericName || !rawName ? rule.label : rawName,
      brandLabel: rule.label,
      logoUrl: rule.domain ? `https://www.google.com/s2/favicons?domain=${rule.domain}&sz=64` : '',
      logoVariant: rule.logoVariant || '',
      hasKnownBrand: true,
    };
  }

  const fallbackLabel = rawBrand || (!isGenericName && rawName) || 'Station-service';
  return {
    label: fallbackLabel,
    short: fallbackLabel.slice(0, 2).toUpperCase(),
    className: 'generic',
    displayName: !isGenericName && rawName ? rawName : fallbackLabel,
    brandLabel: fallbackLabel,
    logoUrl: '',
    logoVariant: '',
    hasKnownBrand: false,
  };
};
