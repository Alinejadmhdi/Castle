/** CoC map textures — baseplate is the full painted map like classic CoC. */
export const COC_TEXTURE_ASSETS = {
  mapBaseplate: require('../../assets/map/coc-map-baseplate.png'),
  grass: require('../../assets/map/grass-tile.png'),
  dirt: require('../../assets/map/dirt-tile.png'),
  villagePad: require('../../assets/map/village-pad.png'),
  forest: require('../../assets/map/forest-tile.png'),
  brick: require('../../assets/map/brick-tile.png'),
} as const;

/** Painted map aspect (width / height). */
export const MAP_BASEPLATE_ASPECT = 1.5;
