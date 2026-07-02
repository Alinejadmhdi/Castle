import { COC_COLORS } from './cocPalette';

interface CoCTreeProps {
  scale?: number;
  variant?: 0 | 1 | 2;
}

/** Simple CoC-style pine — trunk + stacked cones. */
export function CoCTree({ scale = 1, variant = 0 }: CoCTreeProps) {
  const s = scale;
  const foliage =
    variant === 1 ? '#358f38' : variant === 2 ? '#52c04e' : COC_COLORS.foliage;
  const trunkW = variant === 2 ? 0.09 : 0.11;

  return (
    <group>
      <mesh position={[0, 0.22 * s, 0]}>
        <cylinderGeometry args={[trunkW * s, trunkW * 1.35 * s, 0.42 * s, 6]} />
        <meshStandardMaterial color={COC_COLORS.wood} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.55 * s, 0]}>
        <coneGeometry args={[0.38 * s, 0.62 * s, 8]} />
        <meshStandardMaterial color={foliage} roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.82 * s, 0]}>
        <coneGeometry args={[0.26 * s, 0.36 * s, 8]} />
        <meshStandardMaterial color="#4cb848" roughness={0.86} />
      </mesh>
    </group>
  );
}

interface CoCBushProps {
  scale?: number;
}

export function CoCBush({ scale = 1 }: CoCBushProps) {
  const s = scale;
  return (
    <group>
      <mesh position={[0, 0.12 * s, 0]}>
        <sphereGeometry args={[0.18 * s, 8, 6]} />
        <meshStandardMaterial color="#3d9e40" roughness={0.95} />
      </mesh>
      <mesh position={[0.14 * s, 0.1 * s, 0.08 * s]}>
        <sphereGeometry args={[0.12 * s, 8, 6]} />
        <meshStandardMaterial color="#4cb848" roughness={0.95} />
      </mesh>
    </group>
  );
}
