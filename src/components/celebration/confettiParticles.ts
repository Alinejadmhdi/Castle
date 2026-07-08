import { theme } from '@/constants/theme';

export type ConfettiVariant = 'brick' | 'celebration';

const BRICK_COLORS = ['#f0d78c', '#e8c547', '#c9a227', '#d4a574', '#f5e6b8', '#b8922e'] as const;

export interface ParticleSpec {
  originX: number;
  originY: number;
  driftX: number;
  liftY: number;
  fallY: number;
  rotationDeg: number;
  width: number;
  height: number;
  color: string;
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

export function buildConfettiParticles(
  variant: ConfettiVariant,
  screenWidth: number,
  screenHeight: number,
): ParticleSpec[] {
  const count = variant === 'brick' ? 22 : 42;
  const centerX = screenWidth / 2;
  const centerY = variant === 'brick' ? screenHeight * 0.2 : screenHeight * 0.42;
  const palette =
    variant === 'brick' ? BRICK_COLORS : theme.colors.confetti;

  return Array.from({ length: count }, (_, index) => {
    const r0 = seeded(index, 0);
    const r1 = seeded(index, 1);
    const r2 = seeded(index, 2);
    const r3 = seeded(index, 3);
    const r4 = seeded(index, 4);
    const r5 = seeded(index, 5);

    const originSpread = variant === 'brick' ? 36 : 64;
    const driftSpread = variant === 'brick' ? screenWidth * 0.38 : screenWidth * 0.55;
    const lift = variant === 'brick' ? lerp(-24, -72, r0) : lerp(-40, -120, r0);
    const fall =
      variant === 'brick'
        ? lerp(screenHeight * 0.35, screenHeight * 0.72, r1)
        : lerp(screenHeight * 0.45, screenHeight * 0.9, r1);

    const stripW = variant === 'brick' ? lerp(3, 5, r2) : lerp(4, 7, r2);
    const stripH = variant === 'brick' ? lerp(7, 13, r3) : lerp(10, 18, r3);

    const burstMs = variant === 'brick' ? 220 : 320;
    const fallMs = variant === 'brick' ? lerp(900, 1200, r4) : lerp(1400, 2000, r4);

    return {
      originX: centerX + lerp(-originSpread, originSpread, r2),
      originY: centerY + lerp(-12, 12, r3),
      driftX: lerp(-driftSpread, driftSpread, r1),
      liftY: lift,
      fallY: fall,
      rotationDeg: lerp(-220, 220, r5),
      width: stripW,
      height: stripH,
      color: palette[index % palette.length],
      delayMs: Math.floor(lerp(0, variant === 'brick' ? 60 : 120, r0)),
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
