import { COC_COLORS, scaleSize } from './cocPalette';

interface PartProps {
  s: number;
  miniature: boolean;
}

export function StoneSlab({
  x,
  y,
  z,
  w,
  h,
  d,
  color = COC_COLORS.stoneLight,
}: {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  color?: string;
}) {
  return (
    <mesh position={[x, y, z]}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}

export function BrickCourse({
  x,
  z,
  w,
  d,
  h,
  y,
  color = COC_COLORS.brick,
}: {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  y: number;
  color?: string;
}) {
  return (
    <mesh position={[x, y + h / 2, z]}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={color} roughness={0.88} />
    </mesh>
  );
}

export function StonePillar({
  x,
  z,
  h,
  w = 0.35,
  cap = false,
}: {
  x: number;
  z: number;
  h: number;
  w?: number;
  cap?: boolean;
}) {
  return (
    <group>
      <mesh position={[x, h / 2, z]}>
        <boxGeometry args={[w, h, w]} />
        <meshStandardMaterial color={COC_COLORS.stone} roughness={0.85} />
      </mesh>
      {cap && (
        <mesh position={[x, h + 0.12, z]}>
          <boxGeometry args={[w * 1.2, 0.18, w * 1.2]} />
          <meshStandardMaterial color={COC_COLORS.stoneLight} roughness={0.8} />
        </mesh>
      )}
    </group>
  );
}

export function WoodPost({ x, z, h, w = 0.12 }: { x: number; z: number; h: number; w?: number }) {
  return (
    <mesh position={[x, h / 2, z]}>
      <boxGeometry args={[w, h, w]} />
      <meshStandardMaterial color={COC_COLORS.wood} roughness={0.95} />
    </mesh>
  );
}

export function WoodWall({
  x,
  z,
  w,
  d,
  h,
}: {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
}) {
  return (
    <mesh position={[x, h / 2, z]}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={COC_COLORS.woodLight} roughness={0.92} />
    </mesh>
  );
}

export function PlasterWall({
  x,
  z,
  w,
  d,
  h,
}: {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
}) {
  return (
    <mesh position={[x, h / 2, z]}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={COC_COLORS.plaster} roughness={0.9} />
    </mesh>
  );
}

export function Doorway({ x, z, h, w = 0.5, d = 0.08 }: { x: number; z: number; h: number; w?: number; d?: number }) {
  return (
    <mesh position={[x, h * 0.4, z]}>
      <boxGeometry args={[w, h * 0.75, d]} />
      <meshStandardMaterial color={COC_COLORS.woodDark} roughness={1} />
    </mesh>
  );
}

export function FlatRoof({ x, z, w, d, y, color = COC_COLORS.wood }: { x: number; z: number; w: number; d: number; y: number; color?: string }) {
  return (
    <mesh position={[x, y, z]}>
      <boxGeometry args={[w * 1.06, 0.18, d * 1.06]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}

export function PeakRoof({
  x,
  z,
  w,
  d,
  rise,
  baseY,
  color = COC_COLORS.thatch,
}: {
  x: number;
  z: number;
  w: number;
  d: number;
  rise: number;
  baseY: number;
  color?: string;
}) {
  const halfW = w / 2;
  const slopeLen = Math.hypot(halfW, rise);
  const pitch = Math.atan2(rise, halfW);
  const thickness = Math.max(0.1, d * 0.06);

  return (
    <group position={[x, baseY, z]}>
      <mesh position={[-halfW / 2, rise / 2, 0]} rotation={[0, 0, pitch]}>
        <boxGeometry args={[slopeLen, thickness, d * 1.04]} />
        <meshStandardMaterial color={color} roughness={0.92} />
      </mesh>
      <mesh position={[halfW / 2, rise / 2, 0]} rotation={[0, 0, -pitch]}>
        <boxGeometry args={[slopeLen, thickness, d * 1.04]} />
        <meshStandardMaterial color={color} roughness={0.92} />
      </mesh>
    </group>
  );
}

export function GableRoof({
  x,
  z,
  w,
  d,
  rise,
  baseY,
  color = COC_COLORS.thatch,
}: {
  x: number;
  z: number;
  w: number;
  d: number;
  rise: number;
  baseY: number;
  color?: string;
}) {
  return (
    <PeakRoof x={x} z={z} w={w} d={d} rise={rise} baseY={baseY} color={color} />
  );
}

/** Square cap for towers — no diamond cone rotation. */
export function TowerCap({
  x,
  z,
  size,
  baseY,
  color = COC_COLORS.stoneDark,
}: {
  x: number;
  z: number;
  size: number;
  baseY: number;
  color?: string;
}) {
  return (
    <mesh position={[x, baseY + size * 0.2, z]}>
      <boxGeometry args={[size * 1.12, size * 0.38, size * 1.12]} />
      <meshStandardMaterial color={color} roughness={0.88} />
    </mesh>
  );
}

export function Chimney({ x, z, h, y }: { x: number; z: number; h: number; y: number }) {
  return (
    <mesh position={[x, y + h / 2, z]}>
      <boxGeometry args={[0.28, h, 0.28]} />
      <meshStandardMaterial color={COC_COLORS.stone} roughness={0.95} />
    </mesh>
  );
}

export function RoundHut({ s, miniature }: PartProps) {
  const r = scaleSize(s, miniature, 1.1);
  const h = scaleSize(s, miniature, 1.4);
  return (
    <group>
      <mesh position={[0, h * 0.45, 0]}>
        <cylinderGeometry args={[r, r * 1.05, h * 0.9, 10]} />
        <meshStandardMaterial color={COC_COLORS.stoneLight} roughness={0.9} />
      </mesh>
      <mesh position={[0, h * 0.95, 0]}>
        <coneGeometry args={[r * 1.15, h * 0.65, 12]} />
        <meshStandardMaterial color={COC_COLORS.thatch} roughness={0.95} />
      </mesh>
      <Doorway x={0} z={r + 0.04} h={h * 0.45} w={r * 0.35} />
    </group>
  );
}

export function Fountain({ s, miniature }: PartProps) {
  const r = scaleSize(s, miniature, 0.55);
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[r, r * 1.1, 0.2, 12]} />
        <meshStandardMaterial color={COC_COLORS.stone} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[r * 0.7, r * 0.7, 0.06, 12]} />
        <meshStandardMaterial color={COC_COLORS.water} roughness={0.2} metalness={0.1} />
      </mesh>
    </group>
  );
}

export function FenceRing({ s, miniature, radius }: PartProps & { radius: number }) {
  const h = scaleSize(s, miniature, 0.55);
  const posts = 10;
  return (
    <group>
      {Array.from({ length: posts }, (_, i) => {
        const a = (i / posts) * Math.PI * 2;
        const x = Math.cos(a) * radius;
        const z = Math.sin(a) * radius;
        return <WoodPost key={i} x={x} z={z} h={h} w={0.1} />;
      })}
      {Array.from({ length: posts }, (_, i) => {
        const a = (i / posts) * Math.PI * 2;
        const a2 = ((i + 1) / posts) * Math.PI * 2;
        const mx = (Math.cos(a) + Math.cos(a2)) / 2;
        const mz = (Math.sin(a) + Math.sin(a2)) / 2;
        const len = radius * 0.42;
        const rot = Math.atan2(Math.sin(a2) - Math.sin(a), Math.cos(a2) - Math.cos(a));
        return (
          <mesh key={`r${i}`} position={[mx * radius * 2, h * 0.55, mz * radius * 2]} rotation={[0, rot, 0]}>
            <boxGeometry args={[len, 0.06, 0.06]} />
            <meshStandardMaterial color={COC_COLORS.woodLight} />
          </mesh>
        );
      })}
    </group>
  );
}

export function CastleTowers({
  s,
  miniature,
  w,
  d,
  h,
  count = 4,
}: PartProps & { w: number; d: number; h: number; count?: number }) {
  const tw = scaleSize(s, miniature, 0.55);
  const th = h * 1.35;
  const spots: [number, number][] =
    count >= 4
      ? [
          [-w / 2, -d / 2],
          [w / 2, -d / 2],
          [-w / 2, d / 2],
          [w / 2, d / 2],
        ]
      : [
          [-w / 2, 0],
          [w / 2, 0],
        ];
  return (
    <>
      {spots.map(([tx, tz], i) => (
        <group key={i} position={[tx, 0, tz]}>
          <mesh position={[0, th / 2, 0]}>
            <boxGeometry args={[tw, th, tw]} />
            <meshStandardMaterial color={COC_COLORS.stone} roughness={0.85} />
          </mesh>
          <mesh position={[0, th + tw * 0.2, 0]}>
            <boxGeometry args={[tw * 1.1, tw * 0.36, tw * 1.1]} />
            <meshStandardMaterial color={COC_COLORS.stoneDark} roughness={0.88} />
          </mesh>
        </group>
      ))}
    </>
  );
}

export function EnclosureWalls({
  s,
  miniature,
  size,
  courses,
  openFront = false,
  pillars = false,
  cappedPillars = false,
}: PartProps & {
  size: number;
  courses: number;
  openFront?: boolean;
  pillars?: boolean;
  cappedPillars?: boolean;
}) {
  const bh = scaleSize(s, miniature, 0.22);
  const half = size / 2;
  const wallT = scaleSize(s, miniature, 0.28);
  const corners: [number, number][] = [
    [-half, -half],
    [half, -half],
    [-half, half],
    [half, half],
  ];

  const walls: { x: number; z: number; w: number; d: number }[] = [
    { x: 0, z: -half, w: size, d: wallT },
    { x: -half, z: 0, w: wallT, d: size },
    { x: half, z: 0, w: wallT, d: size },
  ];
  if (!openFront) walls.push({ x: 0, z: half, w: size, d: wallT });

  return (
    <group>
      {Array.from({ length: courses }, (_, c) =>
        walls.map((wall, wi) => (
          <BrickCourse
            key={`${c}-${wi}`}
            x={wall.x}
            z={wall.z}
            w={wall.w}
            d={wall.d}
            h={bh}
            y={c * bh}
          />
        )),
      )}
      {pillars &&
        corners.map(([px, pz], i) => (
          <StonePillar
            key={i}
            x={px}
            z={pz}
            h={courses * bh + (cappedPillars ? 0.35 : 0)}
            w={scaleSize(s, miniature, 0.38)}
            cap={cappedPillars}
          />
        ))}
    </group>
  );
}
