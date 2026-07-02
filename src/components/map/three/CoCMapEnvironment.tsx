import { useMemo } from 'react';
import { getGroundDimensions } from '@/rendering/three/gridToWorld';
import { generateForestTrees, filterTreesForBuildings } from '@/rendering/three/forestLayout';
import { COC_COLORS } from './coc/cocPalette';
import { CoCBush, CoCTree } from './coc/CoCTree';

interface CoCMapEnvironmentProps {
  plotScale?: number;
  /** Monument slots — trees under buildings are cleared. */
  buildingSlots?: { plotX: number; plotY: number }[];
  treeClearRadius?: number;
}

export function CoCMapEnvironment({
  plotScale = 1,
  buildingSlots = [],
  treeClearRadius = 2.75,
}: CoCMapEnvironmentProps) {
  const { width: groundW, depth: groundD } = useMemo(
    () => getGroundDimensions(plotScale),
    [plotScale],
  );
  const half = groundW / 2;
  const borderW = 0.5 * plotScale;
  const padSize = groundW * 0.62;

  const forestTrees = useMemo(() => {
    const all = generateForestTrees(plotScale, half);
    return filterTreesForBuildings(all, buildingSlots, plotScale, treeClearRadius);
  }, [half, plotScale, buildingSlots, treeClearRadius]);

  return (
    <group>
      {forestTrees.map((prop) => (
        <group key={prop.id} position={[prop.x, borderW * 0.5, prop.z]}>
          {prop.kind === 'tree' ? (
            <CoCTree scale={prop.scale} variant={prop.variant} />
          ) : (
            <CoCBush scale={prop.scale} />
          )}
        </group>
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[groundW * 1.06, groundD * 1.06]} />
        <meshStandardMaterial color={COC_COLORS.grassDark} roughness={0.96} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[groundW, groundD]} />
        <meshStandardMaterial color={COC_COLORS.grass} roughness={0.94} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[padSize, padSize]} />
        <meshStandardMaterial color={COC_COLORS.dirt} roughness={1} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}>
        <planeGeometry args={[padSize * 0.88, padSize * 0.88]} />
        <meshStandardMaterial color="#d4b07a" roughness={1} />
      </mesh>
    </group>
  );
}
