export const mapStylesConfig = {
  'carto-dark': {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    options: { maxZoom: 20, subdomains: 'abcd' }
  },
  'carto-voyager': {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    options: { maxZoom: 20, subdomains: 'abcd' }
  },
  'carto-dark-no-labels': {
    url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
    options: { maxZoom: 20, subdomains: 'abcd' }
  },
  'stadia-dark': {
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
    options: { maxZoom: 20 }
  },
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: { maxZoom: 19 }
  }
} as const;

export type MapStyleKey = keyof typeof mapStylesConfig;

export const useMapStyle = () => {
  const getMapTileConfig = (styleKey: string) => {
    return mapStylesConfig[styleKey as MapStyleKey] || mapStylesConfig['carto-dark'];
  };

  return { getMapTileConfig, mapStylesConfig };
};
