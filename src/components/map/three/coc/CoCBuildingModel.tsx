import type { CategoryType } from '@/types';
import { COC_COLORS, scaleSize } from './cocPalette';
import {
  BrickCourse,
  CastleTowers,
  Chimney,
  Doorway,
  EnclosureWalls,
  FenceRing,
  FlatRoof,
  Fountain,
  GableRoof,
  PeakRoof,
  PlasterWall,
  RoundHut,
  StonePillar,
  StoneSlab,
  WoodPost,
  WoodWall,
} from './cocParts';

interface CoCBuildingModelProps {
  stageIndex: number;
  categoryType: CategoryType;
  progress: number;
  plotScale: number;
  accentColor?: string;
}

function miniStage(stageIndex: number): number {
  return Math.min(7, stageIndex);
}

export function CoCBuildingModel({
  stageIndex,
  categoryType,
  progress,
  plotScale,
}: CoCBuildingModelProps) {
  const miniature = categoryType === 'miniature';
  const idx = miniature ? miniStage(stageIndex) : stageIndex;
  const s = plotScale;
  const p = Math.min(1, Math.max(0, progress));

  if (miniature) {
    return <MiniBuilding idx={idx} s={s} p={p} />;
  }
  return <MacroBuilding idx={idx} s={s} p={p} />;
}

function MacroBuilding({ idx, s, p }: { idx: number; s: number; p: number }) {
  const base = scaleSize(s, false, 2.8);

  if (idx === 0) {
    const tiles = 3;
    const tile = base / tiles;
    return (
      <group>
        {Array.from({ length: tiles * tiles }, (_, i) => {
          const tx = (i % tiles) - 1;
          const tz = Math.floor(i / tiles) - 1;
          return (
            <StoneSlab
              key={i}
              x={tx * tile}
              y={0.06}
              z={tz * tile}
              w={tile * 0.92}
              h={0.12}
              d={tile * 0.92}
            />
          );
        })}
      </group>
    );
  }

  if (idx === 1) {
    return <EnclosureWalls s={s} miniature={false} size={base * 1.1} courses={1} openFront pillars />;
  }

  if (idx === 2) {
    return <EnclosureWalls s={s} miniature={false} size={base * 1.15} courses={2} pillars />;
  }

  if (idx === 3) {
    return <EnclosureWalls s={s} miniature={false} size={base * 1.2} courses={3} pillars />;
  }

  if (idx === 4) {
    return (
      <EnclosureWalls
        s={s}
        miniature={false}
        size={base * 1.25}
        courses={4}
        pillars
        cappedPillars
      />
    );
  }

  if (idx === 5) {
    const h = scaleSize(s, false, 0.22) * 4;
    const half = (base * 1.25) / 2;
    return (
      <group>
        <EnclosureWalls s={s} miniature={false} size={base * 1.25} courses={4} pillars cappedPillars />
        <group position={[0, 0, half + 0.02]}>
          <mesh position={[0, h * 0.55, 0]}>
            <boxGeometry args={[scaleSize(s, false, 1.1), h * 1.1, scaleSize(s, false, 0.35)]} />
            <meshStandardMaterial color={COC_COLORS.stone} roughness={0.85} />
          </mesh>
          <Doorway x={0} z={scaleSize(s, false, 0.2)} h={h * 0.7} w={scaleSize(s, false, 0.45)} />
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * scaleSize(s, false, 0.65), h * 0.75, scaleSize(s, false, 0.12)]}>
              <boxGeometry args={[0.08, 0.35, 0.02]} />
              <meshStandardMaterial color={COC_COLORS.banner} />
            </mesh>
          ))}
        </group>
      </group>
    );
  }

  if (idx === 6) {
    const r = base * 0.55;
    return (
      <group>
        <FenceRing s={s} miniature={false} radius={r} />
        <Fountain s={s} miniature={false} />
        <mesh position={[r * 0.55, scaleSize(s, false, 0.35), -r * 0.45]}>
          <coneGeometry args={[scaleSize(s, false, 0.28), scaleSize(s, false, 0.55), 7]} />
          <meshStandardMaterial color={COC_COLORS.foliage} />
        </mesh>
        {[
          [0.35, 0.4],
          [-0.4, 0.2],
          [0.2, -0.35],
        ].map(([fx, fz], i) => (
          <mesh key={i} position={[fx * r, 0.08, fz * r]}>
            <sphereGeometry args={[0.1, 6, 6]} />
            <meshStandardMaterial color={i === 0 ? '#e878a0' : i === 1 ? '#e8c848' : '#a878e8'} />
          </mesh>
        ))}
      </group>
    );
  }

  if (idx === 7) {
    const w = base * 0.9;
    const d = base * 0.7;
    const h = scaleSize(s, false, 1.1);
    return (
      <group>
        <WoodWall x={-w / 2} z={0} w={scaleSize(s, false, 0.12)} d={d} h={h} />
        <WoodWall x={w / 2} z={0} w={scaleSize(s, false, 0.12)} d={d} h={h} />
        <WoodWall x={0} z={-d / 2} w={w} d={scaleSize(s, false, 0.12)} h={h} />
        <mesh position={[0, h + 0.05, 0]} rotation={[0.25, 0, 0]}>
          <boxGeometry args={[w * 1.1, 0.08, d * 1.05]} />
          <meshStandardMaterial color="#7a8a48" roughness={0.95} />
        </mesh>
      </group>
    );
  }

  if (idx === 8) {
    const w = base * 0.95;
    const d = base * 0.8;
    const h = scaleSize(s, false, 1.2);
    return (
      <group>
        <WoodWall x={0} z={0} w={w} d={d} h={h} />
        <FlatRoof x={0} z={0} w={w} d={d} y={h + 0.1} />
        <Doorway x={0} z={d / 2 + 0.04} h={h * 0.55} />
        <mesh position={[w * 0.45, h * 0.35, d / 2 + 0.2]}>
          <cylinderGeometry args={[0.18, 0.2, 0.35, 8]} />
          <meshStandardMaterial color={COC_COLORS.wood} />
        </mesh>
      </group>
    );
  }

  if (idx === 9) {
    return <RoundHut s={s} miniature={false} />;
  }

  if (idx >= 10 && idx <= 13) {
    const tier = idx - 10;
    const w = base * (1.05 + tier * 0.12 + p * 0.08);
    const d = base * (0.85 + tier * 0.08);
    const h = scaleSize(s, false, 1.35 + tier * 0.18);
    const roofColor =
      idx === 12 ? COC_COLORS.roofBlue : idx === 13 ? COC_COLORS.roofTile : idx === 11 ? COC_COLORS.roofYellow : COC_COLORS.thatch;
    return (
      <group>
        <PlasterWall x={0} z={0} w={w} d={d} h={h} />
        {[-1, 1].map((side) => (
          <WoodWall key={side} x={side * w * 0.48} z={0} w={scaleSize(s, false, 0.1)} d={d} h={h} />
        ))}
        <GableRoof x={0} z={0} w={w} d={d} rise={h * 0.55} baseY={h} color={roofColor} />
        <Chimney x={-w * 0.32} z={0} h={h * 0.55} y={h} />
        <Doorway x={0} z={d / 2 + 0.04} h={h * 0.55} w={w * 0.22} />
        {idx >= 12 && (
          <mesh position={[w * 0.25, h * 0.55, d / 2 + 0.05]}>
            <boxGeometry args={[w * 0.18, h * 0.22, 0.06]} />
            <meshStandardMaterial color="#4a3020" />
          </mesh>
        )}
        {idx >= 13 && (
          <FenceRing s={s} miniature={false} radius={w * 0.65} />
        )}
      </group>
    );
  }

  if (idx >= 14 && idx <= 19) {
    const tier = idx - 14;
    const w = base * (1.5 + tier * 0.15);
    const d = base * (1.2 + tier * 0.1);
    const h = scaleSize(s, false, 1.8 + tier * 0.25);
    return (
      <group>
        <PlasterWall x={0} z={0} w={w} d={d} h={h} />
        <GableRoof x={0} z={0} w={w} d={d} rise={h * 0.5} baseY={h} color={COC_COLORS.roofTile} />
        <Chimney x={-w * 0.3} z={-d * 0.15} h={h * 0.6} y={h} />
        <Chimney x={w * 0.25} z={d * 0.1} h={h * 0.5} y={h} />
        <Doorway x={0} z={d / 2 + 0.04} h={h * 0.5} w={w * 0.18} />
        {tier >= 2 && <FenceRing s={s} miniature={false} radius={w * 0.72} />}
      </group>
    );
  }

  if (idx >= 20 && idx <= 26) {
    const tier = idx - 20;
    const w = base * (1.8 + tier * 0.2);
    const d = base * (1.5 + tier * 0.15);
    const h = scaleSize(s, false, 2 + tier * 0.3);
    const towerCount = idx >= 24 ? 4 : idx >= 22 ? 2 : 0;
    return (
      <group>
        <mesh position={[0, h / 2, 0]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={idx >= 23 ? COC_COLORS.stone : COC_COLORS.stoneLight} roughness={0.85} />
        </mesh>
        <FlatRoof x={0} z={0} w={w} d={d} y={h + 0.12} color={COC_COLORS.stoneDark} />
        {towerCount > 0 && <CastleTowers s={s} miniature={false} w={w} d={d} h={h} count={towerCount} />}
        <Doorway x={0} z={d / 2 + 0.05} h={h * 0.45} w={w * 0.2} />
        {idx >= 25 && (
          <group position={[0, 0, d / 2 + 0.02]}>
            <mesh position={[0, h * 0.55, 0]}>
              <boxGeometry args={[w * 0.35, h * 1.1, scaleSize(s, false, 0.5)]} />
              <meshStandardMaterial color={COC_COLORS.stone} />
            </mesh>
            <Doorway x={0} z={scaleSize(s, false, 0.28)} h={h * 0.65} w={w * 0.15} />
          </group>
        )}
        {idx === 26 && (
          <>
            <mesh position={[0, h + scaleSize(s, false, 0.9), 0]}>
              <coneGeometry args={[w * 0.3, scaleSize(s, false, 1.1), 4]} />
              <meshStandardMaterial color={COC_COLORS.stoneDark} />
            </mesh>
            <CastleTowers s={s} miniature={false} w={w * 1.15} d={d * 1.15} h={h * 1.1} count={4} />
          </>
        )}
      </group>
    );
  }

  return null;
}

function MiniBuilding({ idx, s, p }: { idx: number; s: number; p: number }) {
  const base = scaleSize(s, true, 2.2);

  if (idx === 0) {
    return (
      <group>
        {[-0.4, 0, 0.4].map((x, i) => (
          <StoneSlab key={i} x={x * base * 0.3} y={0.04} z={0} w={base * 0.22} h={0.06} d={base * 0.22} />
        ))}
      </group>
    );
  }

  if (idx === 1) {
    return (
      <group>
        <BrickCourse x={0} z={0} w={base * 0.8} d={scaleSize(s, true, 0.2)} h={scaleSize(s, true, 0.18)} y={0} />
        <StonePillar x={-base * 0.35} z={0} h={scaleSize(s, true, 0.22)} w={scaleSize(s, true, 0.18)} />
        <StonePillar x={base * 0.35} z={0} h={scaleSize(s, true, 0.22)} w={scaleSize(s, true, 0.18)} />
      </group>
    );
  }

  if (idx === 2) {
    return <EnclosureWalls s={s} miniature size={base * 0.9} courses={1} openFront />;
  }

  if (idx === 3) {
    const h = scaleSize(s, true, 0.9);
    return (
      <group>
        <WoodPost x={0} z={0} h={h} w={scaleSize(s, true, 0.08)} />
        <mesh position={[0, h + scaleSize(s, true, 0.15), 0]}>
          <boxGeometry args={[scaleSize(s, true, 0.35), scaleSize(s, true, 0.3), scaleSize(s, true, 0.35)]} />
          <meshStandardMaterial color={COC_COLORS.woodLight} />
        </mesh>
        <PeakRoof
          x={0}
          z={0}
          w={scaleSize(s, true, 0.5)}
          d={scaleSize(s, true, 0.5)}
          rise={scaleSize(s, true, 0.28)}
          baseY={h + scaleSize(s, true, 0.15)}
          color={COC_COLORS.roofTile}
        />
      </group>
    );
  }

  if (idx === 4) {
    const w = base * 0.75;
    const d = base * 0.6;
    const h = scaleSize(s, true, 0.75);
    return (
      <group>
        <WoodWall x={0} z={0} w={w} d={d} h={h} />
        <PeakRoof x={0} z={0} w={w} d={d} rise={h * 0.5} baseY={h} />
        <Doorway x={0} z={d / 2 + 0.03} h={h * 0.5} w={w * 0.25} />
      </group>
    );
  }

  if (idx === 5) {
    const w = base * 0.85;
    const d = base * 0.7;
    const h = scaleSize(s, true, 0.85);
    return (
      <group>
        <PlasterWall x={0} z={0} w={w} d={d} h={h} />
        <GableRoof x={0} z={0} w={w} d={d} rise={h * 0.42} baseY={h} color={COC_COLORS.thatch} />
        <Doorway x={0} z={d / 2 + 0.03} h={h * 0.5} w={w * 0.22} />
      </group>
    );
  }

  if (idx === 6) {
    const w = base * 1.05;
    const d = base * 0.85;
    const h = scaleSize(s, true, 1.1);
    return (
      <group>
        <PlasterWall x={0} z={0} w={w} d={d} h={h} />
        <GableRoof x={0} z={0} w={w} d={d} rise={h * 0.48} baseY={h} color={COC_COLORS.roofTile} />
        <Chimney x={-w * 0.28} z={0} h={h * 0.45} y={h} />
        <Doorway x={0} z={d / 2 + 0.03} h={h * 0.5} w={w * 0.2} />
      </group>
    );
  }

  if (idx === 7) {
    const w = base * 1.15;
    const d = base * 0.95;
    const h = scaleSize(s, true, 1.25);
    return (
      <group>
        <mesh position={[0, h / 2, 0]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={COC_COLORS.stoneLight} roughness={0.85} />
        </mesh>
        <CastleTowers s={s} miniature w={w} d={d} h={h} count={2} />
        <Doorway x={0} z={d / 2 + 0.04} h={h * 0.45} w={w * 0.18} />
      </group>
    );
  }

  return null;
}
