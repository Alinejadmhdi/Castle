import type { ViewStyle } from 'react-native';
import type { ParticleSpec } from '@/components/celebration/confettiParticles';

export function particleVisualStyle(spec: ParticleSpec): ViewStyle {
  switch (spec.shape) {
    case 'circle':
      return {
        backgroundColor: spec.color,
        borderRadius: spec.width / 2,
      };
    case 'square':
      return {
        backgroundColor: spec.color,
        borderRadius: 2,
      };
    case 'diamond':
      return {
        backgroundColor: spec.color,
        borderRadius: 1,
      };
    case 'ring':
      return {
        backgroundColor: 'transparent',
        borderWidth: Math.max(1.5, spec.width * 0.2),
        borderColor: spec.color,
        borderRadius: spec.width / 2,
      };
    case 'strip':
    default:
      return {
        backgroundColor: spec.color,
        borderRadius: spec.width <= 4 ? spec.width / 2 : 1,
      };
  }
}

export function particleRotationDeg(animatedDeg: number, spec: ParticleSpec): string {
  return `${animatedDeg + spec.shapeRotation}deg`;
}
