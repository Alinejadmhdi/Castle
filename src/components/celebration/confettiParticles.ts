export type ConfettiVariant = 'brick' | 'celebration';
export type ConfettiShape = 'strip' | 'square' | 'circle' | 'diamond' | 'ring';

const SHAPES: ConfettiShape[] = ['strip', 'square', 'circle', 'diamond', 'ring'];

/** Bright, saturated palette for maximum color variety. */
export const VIBRANT_CONFETTI_COLORS = [
  '#ff6b6b',
  '#feca57',
  '#48dbfb',
  '#ff9ff3',
  '#54a0ff',
  '#5f27cd',
  '#00d2d3',
  '#ff9f43',
  '#ee5a24',
  '#10ac84',
  '#c9a227',
  '#e056fd',
  '#f368e0',
  '#22a6b3',
  '#eb4d4b',
  '#6ab04c',
  '#f0932b',
  '#686de0',
  '#badc58',
  '#ff4757',
  '#2ed573',
  '#1e90ff',
  '#ffa502',
  '#ff6348',
  '#7bed9f',
  '#70a1ff',
  '#eccc68',
  '#ff7979',
  '#be2edd',
  '#22d3ee',
] as const;

export interface ParticleSpec {
  originX: number;
  originY: number;
  driftX: number;
  liftY: number;
  fallY: number;
  rotationDeg: number;
  shapeRotation: number;
  width: number;
  height: number;
  color: string;
  shape: ConfettiShape;
  delayMs: number;
  burstMs: number;
  fallMs: number;
}

function seeded(index: number, channel: number): number {
  const x = Math.sin(index * 12.9898 + channel * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * t;
}

function pickShape(index: number): ConfettiShape {
  return SHAPES[Math.floor(seeded(index, 6) * SHAPES.length)];
}

function pickColor(index: number): string {
  return VIBRANT_CONFETTI_COLORS[Math.floor(seeded(index, 7) * VIBRANT_CONFETTI_COLORS.length)];
}

function sizeForShape(
  shape: ConfettiShape,
  variant: ConfettiVariant,
  r2: number,
  r3: number,
): { width: number; height: number; shapeRotation: number } {
  const scale = variant === 'brick' ? 1 : 1.15;

  switch (shape) {
    case 'circle':
      return {
        width: lerp(5, 9, r2) * scale,
        height: lerp(5, 9, r2) * scale,
        shapeRotation: 0,
      };
    case 'square':
      return {
        width: lerp(6, 11, r2) * scale,
        height: lerp(6, 11, r2) * scale,
        shapeRotation: 0,
      };
    case 'diamond':
      return {
        width: lerp(7, 12, r2) * scale,
        height: lerp(7, 12, r2) * scale,
        shapeRotation: 45,
      };
    case 'ring':
      return {
        width: lerp(8, 14, r2) * scale,
        height: lerp(8, 14, r2) * scale,
        shapeRotation: 0,
      };
    case 'strip':
    default:
      return {
        width: lerp(3, 6, r2) * scale,
        height: lerp(8, 16, r3) * scale,
        shapeRotation: 0,
      };
  }
}

export function buildConfettiParticles(
  variant: ConfettiVariant,
  screenWidth: number,
  screenHeight: number,
): ParticleSpec[] {
  const count = variant === 'brick' ? 54 : 98;
  const centerX = screenWidth / 2;
  const centerY = variant === 'brick' ? screenHeight * 0.2 : screenHeight * 0.42;

  return Array.from({ length: count }, (_, index) => {
    const r0 = seeded(index, 0);
    const r1 = seeded(index, 1);
    const r2 = seeded(index, 2);
    const r3 = seeded(index, 3);
    const r4 = seeded(index, 4);
    const r5 = seeded(index, 5);

    const shape = pickShape(index);
    const { width, height, shapeRotation } = sizeForShape(shape, variant, r2, r3);

    const originSpread = variant === 'brick' ? 48 : 80;
    const driftSpread = variant === 'brick' ? screenWidth * 0.42 : screenWidth * 0.58;
    const lift = variant === 'brick' ? lerp(-24, -72, r0) : lerp(-40, -120, r0);
    const fall =
      variant === 'brick'
        ? lerp(screenHeight * 0.35, screenHeight * 0.72, r1)
        : lerp(screenHeight * 0.45, screenHeight * 0.9, r1);

    const burstMs = variant === 'brick' ? 220 : 320;
    const fallMs = variant === 'brick' ? lerp(900, 1200, r4) : lerp(1400, 2000, r4);

    return {
      originX: centerX + lerp(-originSpread, originSpread, r2),
      originY: centerY + lerp(-16, 16, r3),
      driftX: lerp(-driftSpread, driftSpread, r1),
      liftY: lift,
      fallY: fall,
      rotationDeg: lerp(-280, 280, r5),
      shapeRotation,
      width,
      height,
      color: pickColor(index),
      shape,
      delayMs: Math.floor(lerp(0, variant === 'brick' ? 80 : 140, r0)),
      burstMs,
      fallMs,
    };
  });
}

export function confettiDurationMs(variant: ConfettiVariant, particles: ParticleSpec[]): number {
  if (particles.length === 0) {
    return variant === 'brick' ? 1500 : 2400;
  }
  const longest = particles.reduce(
    (max, particle) => Math.max(max, particle.delayMs + particle.burstMs + particle.fallMs),
    0,
  );
  return longest + (variant === 'brick' ? 200 : 400);
}

export function getConfettiVariantDurationMs(
  variant: ConfettiVariant,
  screenWidth: number,
  screenHeight: number,
): number {
  const particles = buildConfettiParticles(variant, screenWidth, screenHeight);
  return confettiDurationMs(variant, particles);
}
