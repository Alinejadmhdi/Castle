/** 3D world units — one full brick ≈ 1 hour */
export const BRICK_WIDTH = 1;
export const BRICK_HEIGHT = 0.45;
export const BRICK_DEPTH = 0.5;
export const BRICK_GAP = 0.06;

/** Plot is 2× the original size. */
export const PLOT_SIZE_MULTIPLIER = 2;
export const GRID_COLUMNS = 20;

/** Bricks laid on the inner soil pad (not the map edge). */
export const SOIL_GRID_COLUMNS = 10;
/** Inner soil square = ground width × this fraction (matches CoCMapEnvironment). */
export const SOIL_PAD_FRACTION = 0.62 * 0.88;

/** Square CoC-style village plot (width === depth). */
export const GROUND_WIDTH_FACTOR = 2.85;
export const GROUND_DEPTH_FACTOR = 1;

/** Default settlement canvas height on Life Map / category screens. */
export const MAP_CANVAS_HEIGHT = 500;

/** CoC clay brick — default color for focus bricks (not gray/black). */
export const BRICK_DISPLAY_COLOR = '#c45c3a';

/** Canvas / wilderness fill — matches outer forest ring. */
export const MAP_SKY_COLOR = '#2a871c';
